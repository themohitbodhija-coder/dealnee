-- Only service-role Edge adapters may call photo orchestration RPCs.
alter table private.uploads add column request_id uuid,
  add column declared_checksum text check (declared_checksum ~ '^[a-f0-9]{64}$'),
  add column validated_mime text, add column validated_size integer,
  add column width integer, add column height integer,
  add column lease uuid, add column lease_until timestamptz;
create unique index uploads_request_key on private.uploads(actor_id,request_id);
alter table private.deletion_jobs add column lease uuid, add column lease_until timestamptz;

create function private.require_photo_permission(p_actor uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  -- Shared account lock makes revocation wait for an in-flight write transaction.
  perform 1 from private.user_access a where a.user_id=p_actor and a.active
    and a.account_state='ready' and (a.role='admin' or (a.role='subadmin' and exists(
      select 1 from private.user_permissions p where p.user_id=a.user_id and p.permission='manage_properties')))
    for share;
  if not found then raise exception 'Property management permission required' using errcode='42501'; end if;
end $$;

create function public.photo_reserve(p_actor uuid,p_request uuid,p_property uuid,p_session uuid,p_mime text,p_size integer,p_checksum text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u private.uploads; n integer;
begin
  perform private.require_photo_permission(p_actor);
  if p_request is null or (p_property is null) = (p_session is null) or p_checksum is null
    or p_checksum !~ '^[a-f0-9]{64}$' or p_mime is null or p_mime not in ('image/png','image/jpeg','image/gif','image/webp','image/avif')
    or p_size is null or p_size not between 1 and 5242880 then raise exception 'Invalid reservation' using errcode='22023'; end if;
  -- Serialize reservation creation per actor; cap abandoned allocations too.
  perform pg_advisory_xact_lock(hashtextextended(p_actor::text,601));
  select * into u from private.uploads where actor_id=p_actor and request_id=p_request for update;
  if found then
    if u.property_id is distinct from p_property or u.create_session_id is distinct from p_session
      or u.declared_mime<>p_mime or u.declared_size<>p_size or u.declared_checksum<>p_checksum then
      raise exception 'Request changed' using errcode='23505'; end if;
    if u.expires_at <= now() or u.state<>'pending' then raise exception 'Reservation unavailable' using errcode='40001'; end if;
    return to_jsonb(u);
  end if;
  if p_property is not null then
    perform 1 from public.properties where id=p_property for update;
    if not found then raise exception 'Property not found' using errcode='P0002'; end if;
  end if;
  select count(*) into n from private.uploads where state in ('pending','validated') and expires_at>now()
    and ((p_property is not null and property_id=p_property) or (p_property is null and actor_id=p_actor and create_session_id=p_session));
  if p_property is not null then n:=n+(select count(*) from public.property_images where property_id=p_property); end if;
  if n>=20 then raise exception 'Maximum 20 images including reserved slots' using errcode='22023'; end if;
  select count(*) into n from private.uploads where actor_id=p_actor and state<>'attached' and expires_at>now();
  if n>=40 then raise exception 'Too many outstanding uploads' using errcode='P0429'; end if;
  if (select count(*) from private.uploads where actor_id=p_actor and created_at>now()-interval '1 hour')>=100 then
    raise exception 'Upload rate exceeded' using errcode='P0429'; end if;
  insert into private.uploads(actor_id,request_id,property_id,create_session_id,pending_key,declared_mime,declared_size,declared_checksum,expires_at)
    values(p_actor,p_request,p_property,p_session,'pending/'||gen_random_uuid(),p_mime,p_size,p_checksum,now()+interval '60 minutes') returning * into u;
  return to_jsonb(u);
end $$;

create function public.photo_claim(p_actor uuid,p_upload uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u private.uploads;
begin
  perform private.require_photo_permission(p_actor);
  select * into u from private.uploads where id=p_upload and actor_id=p_actor for update;
  if not found then raise exception 'Upload not found' using errcode='P0002'; end if;
  if u.state='attached' or (u.state='validated' and u.expires_at>now()) then return to_jsonb(u); end if;
  if u.state<>'pending' or u.expires_at<=now() then raise exception 'Upload expired or rejected' using errcode='40001'; end if;
  if u.lease_until>now() then raise exception 'Validation in progress' using errcode='55P03'; end if;
  if u.final_key is not null then
    insert into private.deletion_jobs(object_key,next_attempt_at) values(u.final_key,now()+interval '15 minutes') on conflict do nothing;
  end if;
  -- Candidate key is durable BEFORE provider write; crash recovery can collect it.
  update private.uploads set lease=gen_random_uuid(),lease_until=now()+interval '5 minutes',
    final_key='properties/'||id||'/'||gen_random_uuid()||case u.declared_mime when 'image/png' then '.png' when 'image/jpeg' then '.jpg' when 'image/gif' then '.gif' when 'image/webp' then '.webp' else '.avif' end where id=u.id returning * into u;
  return to_jsonb(u);
end $$;

create function public.photo_finish(p_actor uuid,p_upload uuid,p_lease uuid,p_checksum text,p_size integer,p_width integer,p_height integer) returns void
language plpgsql security definer set search_path='' as $$
declare u private.uploads;
begin
  perform private.require_photo_permission(p_actor);
  select * into u from private.uploads where id=p_upload and actor_id=p_actor for update;
  if not found or u.state<>'pending' or u.lease is distinct from p_lease or p_lease is null
    or u.lease_until<=now() or u.expires_at<=now() then raise exception 'Validation lease expired' using errcode='40001'; end if;
  if p_checksum is null or p_checksum !~ '^[a-f0-9]{64}$' or p_size is null or p_size not between 1 and 5242880
    or p_width is null or p_height is null or p_width not between 1 and 12000 or p_height not between 1 and 12000
    or p_width::bigint*p_height>40000000 then raise exception 'Invalid image metadata' using errcode='22023'; end if;
  update private.uploads set state='validated',checksum=p_checksum,validated_size=p_size,validated_mime=u.declared_mime,
    width=p_width,height=p_height,lease=null,lease_until=null where id=u.id;
  -- Delayed deletion allows a still-valid 5-minute POST to finish before removal.
  insert into private.deletion_jobs(object_key,next_attempt_at) values(u.pending_key,now()+interval '15 minutes') on conflict do nothing;
end $$;

create function public.photo_reject(p_actor uuid,p_upload uuid,p_lease uuid) returns void
language plpgsql security definer set search_path='' as $$
declare u private.uploads;
begin
  select * into u from private.uploads where id=p_upload and actor_id=p_actor for update;
  if not found or u.state<>'pending' or u.lease is distinct from p_lease or p_lease is null then return; end if;
  update private.uploads set state='rejected',lease=null,lease_until=null where id=u.id;
  insert into private.deletion_jobs(object_key,next_attempt_at) values(u.pending_key,now()+interval '15 minutes'),(u.final_key,now()+interval '15 minutes') on conflict do nothing;
end $$;

create function private.attach_property_images(p_actor uuid,p_property uuid,p_create_session uuid,p_images jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare item jsonb; u private.uploads; image_id uuid; ids uuid[]:='{}'; position integer:=0;
begin
  perform private.require_photo_permission(p_actor);
  perform 1 from public.properties where id=p_property for update;
  if not found then raise exception 'Property not found' using errcode='P0002'; end if;
  if p_images is null or jsonb_typeof(p_images)<>'array' then raise exception 'Images must be an array' using errcode='22023'; end if;
  if jsonb_array_length(p_images)>20 then raise exception 'Maximum 20 images' using errcode='22023'; end if;
  set constraints public.property_images_property_id_sort_order_key deferred;
  -- Lock every referenced reservation in deterministic order across transactions.
  perform 1 from private.uploads where id in (select (e->>'uploadId')::uuid from jsonb_array_elements(p_images) e where e ? 'uploadId') order by id for update;
  for item in select value from jsonb_array_elements(p_images) loop
    if jsonb_typeof(item)<>'object' or (select count(*) from jsonb_object_keys(item))<>1
      or not (item ? 'imageId' or item ? 'uploadId') then raise exception 'Invalid image reference' using errcode='22023'; end if;
    if item ? 'imageId' then
      select id into image_id from public.property_images where id=(item->>'imageId')::uuid and property_id=p_property;
      if not found then raise exception 'Image does not belong to property' using errcode='42501'; end if;
    else
      select * into u from private.uploads where id=(item->>'uploadId')::uuid;
      if not found or u.actor_id<>p_actor then raise exception 'Upload ownership mismatch' using errcode='42501'; end if;
      if u.state='attached' and u.property_id=p_property then
        select id into image_id from public.property_images where property_id=p_property and object_key=u.final_key;
        if not found then raise exception 'Attached image removed' using errcode='40001'; end if;
      else
        if u.state<>'validated' or u.expires_at<=now() then raise exception 'Image is not validated or expired' using errcode='40001'; end if;
        if ((u.property_id=p_property) or (u.property_id is null and p_create_session is not null and u.create_session_id=p_create_session)) is not true then
          raise exception 'Upload scope mismatch' using errcode='42501'; end if;
        insert into public.property_images(property_id,object_key,sort_order,mime_type,byte_size,width,height,checksum)
          values(p_property,u.final_key,position,u.validated_mime,u.validated_size,u.width,u.height,u.checksum) returning id into image_id;
        update private.uploads set state='attached',property_id=p_property where id=u.id;
      end if;
    end if;
    if image_id=any(ids) then raise exception 'Duplicate image' using errcode='22023'; end if;
    ids:=array_append(ids,image_id);
    update public.property_images set sort_order=position where id=image_id;
    position:=position+1;
  end loop;
  delete from public.property_images where property_id=p_property and not(id=any(ids));
  set constraints public.property_images_property_id_sort_order_key immediate;
end $$;

create function public.photo_cleanup_claim(p_limit integer default 10) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  if p_limit is null or p_limit not between 1 and 20 then raise exception 'Invalid batch' using errcode='22023'; end if;
  -- SKIP LOCKED avoids touching an attachment/finalization in progress.
  with expired as (select id from private.uploads where state<>'attached' and expires_at<now()-interval '15 minutes'
    and (lease_until is null or lease_until<now()-interval '15 minutes') order by expires_at limit 40 for update skip locked)
    delete from private.uploads where id in (select id from expired);
  with due as (select id from private.deletion_jobs where (state in ('pending','failed') and next_attempt_at<=now())
    or (state='processing' and lease_until<=now()) order by next_attempt_at limit p_limit for update skip locked),
  claimed as (update private.deletion_jobs j set state='processing',attempts=attempts+1,lease=gen_random_uuid(),lease_until=now()+interval '5 minutes'
    from due where j.id=due.id returning j.id,j.object_key,j.lease)
  select coalesce(jsonb_agg(to_jsonb(claimed)),'[]') into result from claimed;
  -- A final key that is still attached must never be deleted, even if queued twice.
  return (select coalesce(jsonb_agg(e),'[]') from jsonb_array_elements(result) e
    where not exists(select 1 from public.property_images where object_key=e->>'object_key'));
end $$;

create function public.photo_cleanup_finish(p_id uuid,p_lease uuid,p_ok boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
  update private.deletion_jobs set state=case when p_ok then 'done' else 'failed' end,
    next_attempt_at=now()+make_interval(secs=>least(86400,30*power(2,least(attempts,11))::integer)),
    last_error_code=case when p_ok then null else 'object_delete_failed' end,lease=null,lease_until=null
    where id=p_id and state='processing' and lease=p_lease;
  -- Keep a small diagnostic window; object keys cannot be reused.
  delete from private.deletion_jobs where state='done' and created_at<now()-interval '7 days';
  delete from private.uploads where state='attached' and created_at<now()-interval '7 days';
end $$;

grant execute on function public.photo_reserve(uuid,uuid,uuid,uuid,text,integer,text),public.photo_claim(uuid,uuid),
 public.photo_finish(uuid,uuid,uuid,text,integer,integer,integer),public.photo_reject(uuid,uuid,uuid),
 public.photo_cleanup_claim(integer),public.photo_cleanup_finish(uuid,uuid,boolean) to service_role;

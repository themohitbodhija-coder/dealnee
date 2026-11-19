-- Accept up to 20 MiB per property image, including pending and finalized objects.
alter table private.uploads drop constraint uploads_declared_size_check;
alter table private.uploads add constraint uploads_declared_size_check
  check (declared_size between 1 and 20971520);
alter table public.property_images drop constraint property_images_byte_size_check;
alter table public.property_images add constraint property_images_byte_size_check
  check (byte_size between 1 and 20971520);

create or replace function public.photo_reserve(p_actor uuid,p_request uuid,p_property uuid,p_session uuid,p_mime text,p_size integer,p_checksum text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u private.uploads; n integer;
begin
  perform private.require_photo_permission(p_actor);
  if p_request is null or (p_property is null) = (p_session is null) or p_checksum is null
    or p_checksum !~ '^[a-f0-9]{64}$' or p_mime is null or p_mime not in ('image/png','image/jpeg','image/gif','image/webp','image/avif')
    or p_size is null or p_size not between 1 and 20971520 then raise exception 'Invalid reservation' using errcode='22023'; end if;
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

create or replace function public.photo_finish(p_actor uuid,p_upload uuid,p_lease uuid,p_checksum text,p_size integer,p_width integer,p_height integer) returns void
language plpgsql security definer set search_path='' as $$
declare u private.uploads;
begin
  perform private.require_photo_permission(p_actor);
  select * into u from private.uploads where id=p_upload and actor_id=p_actor for update;
  if not found or u.state<>'pending' or u.lease is distinct from p_lease or p_lease is null
    or u.lease_until<=now() or u.expires_at<=now() then raise exception 'Validation lease expired' using errcode='40001'; end if;
  if p_checksum is null or p_checksum !~ '^[a-f0-9]{64}$' or p_size is null or p_size not between 1 and 20971520
    or p_width is null or p_height is null or p_width not between 1 and 12000 or p_height not between 1 and 12000
    or p_width::bigint*p_height>40000000 then raise exception 'Invalid image metadata' using errcode='22023'; end if;
  update private.uploads set state='validated',checksum=p_checksum,validated_size=p_size,validated_mime=u.declared_mime,
    width=p_width,height=p_height,lease=null,lease_until=null where id=u.id;
  -- Delayed deletion allows a still-valid 5-minute POST to finish before removal.
  insert into private.deletion_jobs(object_key,next_attempt_at) values(u.pending_key,now()+interval '15 minutes') on conflict do nothing;
end $$;

-- Public submissions can only reach these service-only RPCs after Edge validation.
create index if not exists inquiry_bucket_expiry_idx on private.rate_limit_buckets(expires_at) where bucket_key like 'inquiry:%';
create index if not exists inquiry_request_expiry_idx on private.idempotency_requests(created_at) where operation='inquiry';
create index if not exists inquiries_created_id_idx on public.inquiries(created_at desc,id desc);
create function private.inquiry_hit(p_key text,p_seconds integer,p_limit integer) returns boolean
language plpgsql security definer set search_path='' as $$
declare n integer; bucket_window timestamptz;
begin
  bucket_window := to_timestamp(floor(extract(epoch from clock_timestamp())/p_seconds)*p_seconds);
  insert into private.rate_limit_buckets(bucket_key,window_start,hits,expires_at)
  values(p_key,bucket_window,1,bucket_window+make_interval(secs=>p_seconds*2))
  on conflict(bucket_key,window_start) do update set hits=least(private.rate_limit_buckets.hits+1,p_limit+1)
  returning hits into n;
  return n<=p_limit;
end $$;
create function public.inquiry_admit(p_ip_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare ip_ok boolean; global_ok boolean;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid request' using errcode='22023'; end if;
  -- Counts persist on rejection; callers must not raise/roll back this result.
  global_ok:=private.inquiry_hit('inquiry:global',60,300);
  ip_ok:=private.inquiry_hit('inquiry:ip:'||p_ip_hash,60,5);
  delete from private.rate_limit_buckets where bucket_key like 'inquiry:%' and expires_at<now();
  delete from private.idempotency_requests where operation='inquiry' and created_at<now()-interval '7 days';
  return jsonb_build_object('allowed',ip_ok and global_ok,'retryAfter',60);
end $$;
create function public.inquiry_replay(p_email_hash text,p_key uuid,p_digest text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r private.idempotency_requests;
begin
  select * into r from private.idempotency_requests where actor_key=p_email_hash and operation='inquiry' and request_key=p_key;
  if not found then return null; end if;
  if r.request_digest<>p_digest then raise exception 'Request key already used' using errcode='23505'; end if;
  return jsonb_build_object('accepted',true,'reference',r.result_id);
end $$;
create function public.submit_verified_inquiry(p_email_hash text,p_key uuid,p_digest text,p_name text,p_email text,p_phone text,p_message text,p_property uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare previous jsonb; result uuid;
begin
  if p_email_hash is null or p_email_hash !~ '^[a-f0-9]{64}$' or p_digest is null or p_digest !~ '^[a-f0-9]{64}$' or p_key is null
    or p_name is null or length(btrim(p_name)) not between 1 and 120
    or p_email is null or length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_phone is null or (p_phone<>'' and p_phone !~ '^\+?[0-9]{7,15}$')
    or p_message is null or length(btrim(p_message)) not between 1 and 5000 then
    raise exception 'Invalid inquiry' using errcode='22023';
  end if;
  -- Serialize retries before reading, limiting or inserting. Hash collisions only
  -- cause extra serialization, never alias stored request identities.
  perform pg_advisory_xact_lock(hashtextextended('inquiry:'||p_email_hash||':'||p_key,0));
  previous:=public.inquiry_replay(p_email_hash,p_key,p_digest);
  if previous is not null then return previous; end if;
  -- Lock a listing across snapshot creation and insert against concurrent deletion.
  if p_property is not null then
    perform 1 from public.properties where id=p_property for key share;
    if not found then raise exception 'Listing unavailable' using errcode='P0002'; end if;
  end if;
  if not private.inquiry_hit('inquiry:email:'||p_email_hash,86400,20) then
    return jsonb_build_object('limited',true,'retryAfter',86400);
  end if;
  insert into public.inquiries(name,email,phone,message,property_id)
  values(btrim(p_name),lower(btrim(p_email)),p_phone,btrim(p_message),p_property) returning id into result;
  insert into private.idempotency_requests(actor_key,operation,request_key,request_digest,result_id)
  values(p_email_hash,'inquiry',p_key,p_digest,result);
  return jsonb_build_object('accepted',true,'reference',result);
end $$;
revoke all on function private.inquiry_hit(text,integer,integer), public.inquiry_admit(text),public.inquiry_replay(text,uuid,text),public.submit_verified_inquiry(text,uuid,text,text,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.inquiry_admit(text),public.inquiry_replay(text,uuid,text),public.submit_verified_inquiry(text,uuid,text,text,text,text,text,uuid) to service_role;

create function public.list_inquiries(p_page integer default 1,p_limit integer default 10,p_status text default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare rows jsonb; total bigint;
begin
  if not private.has_permission('view_inquiries') then raise exception 'Inquiry permission required' using errcode='42501'; end if;
  if p_page is null or p_page not between 1 and 1000000 or p_limit is null or p_limit not between 1 and 100 or (p_status is not null and p_status not in ('new','read','replied')) then
    raise exception 'Invalid inquiry filters' using errcode='22023';
  end if;
  select count(*) into total from public.inquiries where p_status is null or status=p_status;
  select coalesce(jsonb_agg(to_jsonb(i) order by i.created_at desc,i.id desc),'[]') into rows from (
    select id,name,email,phone,message,property_id,property_display_id,property_title,status,created_at,updated_at from public.inquiries
    where p_status is null or status=p_status order by created_at desc,id desc limit p_limit offset (p_page-1)*p_limit
  ) i;
  return jsonb_build_object('inquiries',rows,'total',total,'page',p_page,'totalPages',ceil(total::numeric/p_limit));
end $$;
-- Opening a replied lead must not demote its status.
create or replace function public.read_inquiry(p_id uuid) returns public.inquiries
language plpgsql security invoker set search_path='' as $$
declare result public.inquiries;
begin
  if not private.has_permission('view_inquiries') then raise exception 'Inquiry permission required' using errcode='42501'; end if;
  update public.inquiries set status=case when status='new' then 'read' else status end where id=p_id returning * into result;
  if not found then raise exception 'Inquiry not found' using errcode='P0002'; end if;
  return result;
end $$;
create function public.set_inquiry_status(p_id uuid,p_status text) returns public.inquiries
language plpgsql security invoker set search_path='' as $$
declare result public.inquiries;
begin
  if not private.has_permission('view_inquiries') then raise exception 'Inquiry permission required' using errcode='42501'; end if;
  if p_status is null or p_status not in ('new','read','replied') then raise exception 'Invalid status' using errcode='22023'; end if;
  update public.inquiries set status=p_status where id=p_id returning * into result;
  if not found then raise exception 'Inquiry not found' using errcode='P0002'; end if;
  return result;
end $$;
create function public.delete_inquiry(p_id uuid) returns void
language plpgsql security invoker set search_path='' as $$
begin
  if not private.has_permission('view_inquiries') then raise exception 'Inquiry permission required' using errcode='42501'; end if;
  delete from public.inquiries where id=p_id;
  if not found then raise exception 'Inquiry not found' using errcode='P0002'; end if;
end $$;
revoke all on function public.list_inquiries(integer,integer,text),public.set_inquiry_status(uuid,text),public.delete_inquiry(uuid) from public,anon;
grant execute on function public.list_inquiries(integer,integer,text),public.set_inquiry_status(uuid,text),public.delete_inquiry(uuid) to authenticated;

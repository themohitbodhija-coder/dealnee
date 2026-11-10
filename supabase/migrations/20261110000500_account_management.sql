-- All identity administration is constrained here, including calls made directly
-- to the Data API. Edge credentials never replace these live authorization checks.
alter table private.user_access
  add column account_state text not null default 'ready' check (account_state in ('ready','invited','deleting')),
  add column access_version bigint not null default 1 check (access_version > 0);

create table private.reauth_proofs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  action text not null check (action in ('invite','access','delete','retry')),
  target_id uuid,
  payload jsonb not null,
  expires_at timestamptz not null default now() + interval '5 minutes'
);
create table private.admin_operations (
  id uuid primary key,
  actor_id uuid not null,
  kind text not null check (kind in ('invite','delete')),
  target_id uuid,
  email text,
  payload jsonb not null,
  state text not null default 'pending' check (state in ('pending','retry','completed')),
  created_user_id uuid,
  lease_id uuid,
  lease_until timestamptz,
  reauthenticated_until timestamptz,
  error_code text check (error_code in ('auth_provider_error','completion_failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index admin_pending_email_key on private.admin_operations(lower(email)) where kind='invite' and state in ('pending','retry');
create index admin_operations_actor_idx on private.admin_operations(actor_id,created_at desc);
alter table private.reauth_proofs enable row level security;
alter table private.admin_operations enable row level security;
revoke all on private.reauth_proofs, private.admin_operations from public,anon,authenticated;
grant all on private.reauth_proofs, private.admin_operations to service_role;

create or replace function private.is_active() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.user_access where user_id=auth.uid() and active and account_state='ready');
$$;
create or replace function private.has_permission(required_permission text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.user_access a where a.user_id=auth.uid() and a.active and a.account_state='ready'
   and (a.role='admin' or (a.role='subadmin' and exists(select 1 from private.user_permissions p
     where p.user_id=a.user_id and p.permission=required_permission))));
$$;
-- Protect direct service-role/Auth API deletions too, not just the UI/RPC path.
create function private.guard_admin_access() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(741106001);
 if old.role='admin' and old.active and old.account_state='ready' then
   if (tg_op='DELETE' or new.role<>'admin' or not new.active or new.account_state<>'ready')
     and (select count(*) from private.user_access where role='admin' and active and account_state='ready')<=1 then
     raise exception 'The last active admin cannot be removed' using errcode='22023';
   end if;
 end if;
 if tg_op='DELETE' then return old; end if;
 new.access_version:=old.access_version+1;
 return new;
end;
$$;
create trigger protect_admin_access before update or delete on private.user_access
 for each row execute function private.guard_admin_access();

create function private.assert_user_manager(p_actor uuid,p_staff boolean default false) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from private.user_access a where a.user_id=p_actor and a.active and a.account_state='ready'
   and (a.role='admin' or (not p_staff and a.role='subadmin' and exists(
     select 1 from private.user_permissions p where p.user_id=a.user_id and p.permission='manage_users')))) then
   raise exception 'User management access denied' using errcode='42501';
 end if;
end;
$$;
create function private.checked_permissions(p_role text,p_permissions text[]) returns text[]
language plpgsql immutable set search_path='' as $$
begin
 if p_role is null or p_role not in ('user','subadmin','admin') or p_permissions is null
   or array_position(p_permissions,null) is not null or cardinality(p_permissions)>4
   or not (p_permissions <@ array['manage_properties','manage_categories','manage_users','view_inquiries']::text[])
   or (p_role<>'subadmin' and cardinality(p_permissions)>0)
   or cardinality(p_permissions)<>(select count(distinct x) from unnest(p_permissions) x) then
   raise exception 'Invalid role or permissions' using errcode='22023';
 end if;
 return array(select x from unnest(p_permissions) x order by x);
end;
$$;
create function private.consume_reauth(p_actor uuid,p_action text,p_target uuid,p_payload jsonb,p_proof uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 delete from private.reauth_proofs where id=p_proof and actor_id=p_actor and action=p_action
   and target_id is not distinct from p_target and payload=p_payload and expires_at>clock_timestamp();
 if not found then raise exception 'Fresh password confirmation required' using errcode='42501'; end if;
end;
$$;
-- Only the verified Edge reauthentication flow can issue a one-use proof.
create function public.admin_issue_reauth(p_actor uuid,p_action text,p_target uuid,p_payload jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 perform private.assert_user_manager(p_actor,true);
 delete from private.reauth_proofs where expires_at<now();
 insert into private.reauth_proofs(actor_id,action,target_id,payload) values(p_actor,p_action,p_target,p_payload) returning id into result;
 return result;
end;
$$;
create function public.admin_rate_limit(p_actor uuid) returns void
language plpgsql security definer set search_path='' as $$
declare hits integer;
begin
 perform private.assert_user_manager(p_actor);
 delete from private.rate_limit_buckets where expires_at<now();
 insert into private.rate_limit_buckets(bucket_key,window_start,hits,expires_at)
 values('admin:'||p_actor,date_trunc('minute',now()),1,date_trunc('minute',now())+interval '2 minutes')
 on conflict(bucket_key,window_start) do update set hits=private.rate_limit_buckets.hits+1
 returning private.rate_limit_buckets.hits into hits;
 if hits>30 then raise exception 'Too many administrative requests' using errcode='P0429'; end if;
end;
$$;

create function private.admin_user_dto(p_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('_id',a.user_id,'id',a.user_id,'name',p.name,'phone',p.phone,'email',u.email,
   'role',a.role,'active',a.active,'accountState',a.account_state,'version',a.access_version,
   'permissions',coalesce((select jsonb_agg(permission order by permission) from private.user_permissions where user_id=a.user_id),'[]'::jsonb),
   'createdAt',p.created_at)
 from private.user_access a join public.profiles p on p.id=a.user_id join auth.users u on u.id=a.user_id where a.user_id=p_id;
$$;
create function public.admin_list_users(p_page integer default 1,p_limit integer default 10) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb; all_staff boolean;
begin
 perform private.assert_user_manager(auth.uid());
 if p_page is null or p_page not between 1 and 1000000 or p_limit is null or p_limit not between 1 and 100 then
   raise exception 'Invalid pagination' using errcode='22023'; end if;
 select role='admin' into all_staff from private.user_access where user_id=auth.uid();
 with allowed as materialized(select a.user_id,a.created_at from private.user_access a where all_staff or a.role='user'),
 page_rows as(select * from allowed order by created_at desc,user_id desc offset (p_page::bigint-1)*p_limit limit p_limit)
 select jsonb_build_object('users',coalesce((select jsonb_agg(private.admin_user_dto(user_id) order by created_at desc,user_id desc) from page_rows),'[]'::jsonb),
   'total',(select count(*) from allowed),'page',p_page,'pages',ceil((select count(*) from allowed)::numeric/p_limit)) into result;
 return result;
end;
$$;
create function public.admin_get_user(p_target uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare target_role text;
begin
 perform private.assert_user_manager(auth.uid());
 select role into target_role from private.user_access where user_id=p_target;
 if target_role is null then raise exception 'User not found' using errcode='P0002'; end if;
 if target_role<>'user' then perform private.assert_user_manager(auth.uid(),true); end if;
 return private.admin_user_dto(p_target);
end;
$$;
create function public.admin_update_access(p_target uuid,p_role text,p_permissions text[],p_active boolean,p_version bigint,p_proof uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare desired jsonb; perms text[]; target private.user_access;
begin
 perform pg_advisory_xact_lock(741106001);
 perform private.assert_user_manager(auth.uid(),true);
 perms:=private.checked_permissions(p_role,p_permissions);
 if p_active is null or p_version is null then raise exception 'Invalid access update' using errcode='22023'; end if;
 if p_target=auth.uid() then raise exception 'Use another admin to change your own access' using errcode='22023'; end if;
 select * into target from private.user_access where user_id=p_target for update;
 if not found then raise exception 'User not found' using errcode='P0002'; end if;
 if target.account_state<>'ready' then raise exception 'Resolve the pending account operation first' using errcode='22023'; end if;
 if target.access_version<>p_version then raise exception 'Account changed; reload before editing' using errcode='40001'; end if;
 desired:=jsonb_build_object('role',p_role,'permissions',perms,'active',p_active,'version',p_version);
 perform private.consume_reauth(auth.uid(),'access',p_target,desired,p_proof);
 update private.user_access set role=p_role,active=p_active where user_id=p_target;
 delete from private.user_permissions where user_id=p_target;
 insert into private.user_permissions(user_id,permission) select p_target,unnest(perms);
 insert into private.audit_events(actor_id,operation,target_id,summary) values(auth.uid(),'access_changed',p_target,
   jsonb_build_object('fromRole',target.role,'toRole',p_role,'active',p_active,'permissions',perms));
 return private.admin_user_dto(p_target);
end;
$$;

create function public.admin_prepare_invite(p_id uuid,p_email text,p_name text,p_role text,p_permissions text[],p_proof uuid default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare desired jsonb; perms text[]; existing private.admin_operations;
begin
 perform pg_advisory_xact_lock(741106001);
 perform private.assert_user_manager(auth.uid(),p_role<>'user');
 perms:=private.checked_permissions(p_role,p_permissions);
 if p_id is null or p_email is null or p_email<>lower(btrim(p_email)) or length(p_email)>254
   or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
   or p_name is null or length(btrim(p_name)) not between 1 and 120 then
   raise exception 'Invalid invitation' using errcode='22023'; end if;
 desired:=jsonb_build_object('email',p_email,'name',btrim(p_name),'role',p_role,'permissions',perms);
 if p_role<>'user' then perform private.consume_reauth(auth.uid(),'invite',null,desired,p_proof); end if;
 select * into existing from private.admin_operations where id=p_id;
 if found then
   if existing.actor_id<>auth.uid() or existing.kind<>'invite' or existing.payload<>desired then
     raise exception 'Request identifier already used' using errcode='23505'; end if;
   if existing.state<>'completed' and p_role<>'user' then
     update private.admin_operations set reauthenticated_until=now()+interval '5 minutes' where id=p_id;
   end if;
   return existing.id;
 end if;
 if exists(select 1 from auth.users where lower(email)=p_email) then raise exception 'Account already exists; edit its access instead' using errcode='23505'; end if;
 if (select count(*) from private.admin_operations where actor_id=auth.uid() and created_at>now()-interval '1 day')>=100 then
   raise exception 'Daily administrative operation limit reached' using errcode='P0429'; end if;
 insert into private.admin_operations(id,actor_id,kind,email,payload,reauthenticated_until)
 values(p_id,auth.uid(),'invite',p_email,desired,case when p_role<>'user' then now()+interval '5 minutes' end);
 return p_id;
end;
$$;
create function public.admin_prepare_delete(p_id uuid,p_target uuid,p_proof uuid default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare target private.user_access; existing private.admin_operations;
begin
 perform pg_advisory_xact_lock(741106001);
 perform private.assert_user_manager(auth.uid());
 if p_id is null or p_target is null then raise exception 'Invalid deletion' using errcode='22023'; end if;
 if p_target=auth.uid() then raise exception 'You cannot delete your own account here' using errcode='22023'; end if;
 select * into existing from private.admin_operations where id=p_id;
 if found then
   if existing.actor_id<>auth.uid() or existing.kind<>'delete' or existing.target_id<>p_target then
     raise exception 'Request identifier already used' using errcode='23505'; end if;
   if existing.payload->>'role'<>'user' then
     perform private.assert_user_manager(auth.uid(),true);
     if existing.state<>'completed' then
       perform private.consume_reauth(auth.uid(),'delete',p_target,'{}',p_proof);
       update private.admin_operations set reauthenticated_until=now()+interval '5 minutes' where id=p_id;
     end if;
   end if;
   return existing.id;
 end if;
 select * into target from private.user_access where user_id=p_target for update;
 if not found then raise exception 'User not found' using errcode='P0002'; end if;
 if target.role<>'user' then
   perform private.assert_user_manager(auth.uid(),true);
   perform private.consume_reauth(auth.uid(),'delete',p_target,'{}',p_proof);
 end if;
 if target.account_state='deleting' then raise exception 'Deletion already pending; retry that operation' using errcode='23505'; end if;
 update private.user_access set active=false,account_state='deleting' where user_id=p_target;
 delete from private.user_permissions where user_id=p_target;
 insert into private.admin_operations(id,actor_id,kind,target_id,payload,reauthenticated_until)
 values(p_id,auth.uid(),'delete',p_target,jsonb_build_object('role',target.role),case when target.role<>'user' then now()+interval '5 minutes' end);
 insert into private.audit_events(actor_id,operation,target_id,summary) values(auth.uid(),'deletion_prepared',p_target,jsonb_build_object('role',target.role));
 return p_id;
end;
$$;

-- Claim/finish endpoints are service-only. Leases prevent simultaneous Auth API
-- calls; the Auth insert trigger records a created UUID even if the response is lost.
create function public.admin_claim_operation(p_id uuid,p_actor uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare op private.admin_operations; lease uuid;
begin
 perform pg_advisory_xact_lock(741106001);
 select * into op from private.admin_operations where id=p_id for update;
 if not found then raise exception 'Operation not found' using errcode='P0002'; end if;
 perform private.assert_user_manager(p_actor,op.payload->>'role'<>'user');
 if op.actor_id<>p_actor then raise exception 'Operation belongs to another manager' using errcode='42501'; end if;
 if op.state='completed' then return jsonb_build_object('completed',true,'id',op.id); end if;
 if op.payload->>'role'<>'user' and coalesce(op.reauthenticated_until<clock_timestamp(),true) then
   raise exception 'Fresh password confirmation required' using errcode='42501'; end if;
 if op.lease_until>clock_timestamp() then raise exception 'Operation is already running' using errcode='55P03'; end if;
 lease:=gen_random_uuid();
 update private.admin_operations set lease_id=lease,lease_until=now()+interval '2 minutes',updated_at=now() where id=p_id;
 return jsonb_build_object('id',op.id,'kind',op.kind,'targetId',op.target_id,'email',op.email,
   'payload',op.payload,'createdUserId',op.created_user_id,'lease',lease);
end;
$$;
create function public.admin_finish_operation(p_id uuid,p_lease uuid,p_user uuid default null) returns void
language plpgsql security definer set search_path='' as $$
declare op private.admin_operations; perms text[]; current_state text;
begin
 perform pg_advisory_xact_lock(741106001);
 select * into op from private.admin_operations where id=p_id for update;
 if not found or p_lease is null or op.lease_id is null or op.lease_until is null
   or op.lease_id is distinct from p_lease or op.lease_until<clock_timestamp() then
   raise exception 'Operation lease expired' using errcode='40001'; end if;
 if op.kind='invite' then
   perform private.assert_user_manager(op.actor_id,op.payload->>'role'<>'user');
   if op.payload->>'role'<>'user' and coalesce(op.reauthenticated_until<clock_timestamp(),true) then
     raise exception 'Fresh password confirmation required' using errcode='42501'; end if;
   if op.created_user_id is null or op.created_user_id is distinct from p_user or not exists(
     select 1 from auth.users where id=p_user and lower(email)=op.email and invited_at is not null) then
     raise exception 'Invited account could not be reconciled' using errcode='40001'; end if;
   select account_state into current_state from private.user_access where user_id=p_user for update;
   if current_state is distinct from 'invited' then raise exception 'Invited account changed' using errcode='40001'; end if;
   perms:=private.checked_permissions(op.payload->>'role',array(select jsonb_array_elements_text(op.payload->'permissions')));
   update private.user_access set role=op.payload->>'role',active=false where user_id=p_user;
   delete from private.user_permissions where user_id=p_user;
   insert into private.user_permissions(user_id,permission) select p_user,unnest(perms);
 else
   if exists(select 1 from auth.users where id=op.target_id) then raise exception 'Auth deletion is not complete' using errcode='40001'; end if;
 end if;
 update private.admin_operations set state='completed',lease_id=null,lease_until=null,error_code=null,updated_at=now() where id=p_id;
 insert into private.audit_events(actor_id,operation,target_id,summary) values(op.actor_id,op.kind||'_completed',coalesce(p_user,op.target_id),jsonb_build_object('operationId',op.id));
end;
$$;
create function public.admin_fail_operation(p_id uuid,p_lease uuid,p_code text) returns void
language plpgsql security definer set search_path='' as $$
begin
 update private.admin_operations set state='retry',lease_id=null,lease_until=null,error_code=p_code,updated_at=now()
 where id=p_id and lease_id=p_lease;
end;
$$;
create function public.admin_retry_operation(p_id uuid,p_proof uuid default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare op private.admin_operations; need_proof boolean;
begin
 perform pg_advisory_xact_lock(741106001);
 perform private.assert_user_manager(auth.uid());
 select * into op from private.admin_operations where id=p_id for update;
 if not found then raise exception 'Operation not found' using errcode='P0002'; end if;
 need_proof:=op.actor_id<>auth.uid() or op.payload->>'role'<>'user';
 if need_proof then
   perform private.assert_user_manager(auth.uid(),true);
   perform private.consume_reauth(auth.uid(),'retry',p_id,'{}',p_proof);
 end if;
 if op.lease_until>clock_timestamp() then raise exception 'Operation is already running' using errcode='55P03'; end if;
 if op.state='completed' then return p_id; end if;
 update private.admin_operations set actor_id=auth.uid(),state='retry',reauthenticated_until=case when need_proof then now()+interval '5 minutes' end where id=p_id;
 insert into private.audit_events(actor_id,operation,target_id,summary) values(auth.uid(),'operation_retried',op.target_id,jsonb_build_object('operationId',p_id,'originalActor',op.actor_id));
 return p_id;
end;
$$;
create function public.admin_list_operations() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare all_staff boolean;
begin
 perform private.assert_user_manager(auth.uid());
 select role='admin' into all_staff from private.user_access where user_id=auth.uid();
 return coalesce((select jsonb_agg(x.result order by x.created_at desc) from (
   select created_at,jsonb_build_object('id',id,'kind',kind,'email',email,'targetId',target_id,'state',state,
     'role',payload->>'role','errorCode',error_code,'createdAt',created_at,'needsPassword',actor_id<>auth.uid() or payload->>'role'<>'user') result
   from private.admin_operations where state<>'completed' and (all_staff or (actor_id=auth.uid() and payload->>'role'='user'))
   order by created_at desc limit 100) x),'[]'::jsonb);
end;
$$;

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path='' as $$
declare op_id uuid;
begin
 insert into public.profiles(id,name,phone) values(new.id,left(coalesce(nullif(btrim(new.raw_user_meta_data->>'name'),''),'New user'),120),left(coalesce(new.raw_user_meta_data->>'phone',''),32));
 if coalesce(new.encrypted_password,'')='' then
   select id into op_id from private.admin_operations where kind='invite' and email=lower(new.email)
     and state in ('pending','retry') and lease_until>clock_timestamp() and created_user_id is null for update;
 end if;
 insert into private.user_access(user_id,active,account_state) values(new.id,op_id is null,case when op_id is null then 'ready' else 'invited' end);
 if op_id is not null then update private.admin_operations set created_user_id=new.id where id=op_id; end if;
 return new;
end;
$$;
create function public.accept_invitation() returns void
language plpgsql security definer set search_path='' as $$
declare account private.user_access;
begin
 perform pg_advisory_xact_lock(741106001);
 select * into account from private.user_access where user_id=auth.uid() for update;
 if not found then raise exception 'Account unavailable' using errcode='42501'; end if;
 if account.account_state='ready' and account.active then return; end if;
 if account.account_state<>'invited' or not exists(select 1 from private.admin_operations
   where kind='invite' and created_user_id=auth.uid() and state='completed') or not exists(
     select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null and coalesce(encrypted_password,'')<>'') then
   raise exception 'Confirm your invitation and choose a password before continuing' using errcode='42501'; end if;
 update private.user_access set active=true,account_state='ready' where user_id=auth.uid();
 insert into private.audit_events(actor_id,operation,target_id) values(auth.uid(),'invitation_accepted',auth.uid());
end;
$$;
-- Make invited/deleting users unavailable to the existing frontend authority RPC.
create or replace function public.current_account() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',a.user_id,'name',p.name,'phone',p.phone,'role',a.role,
   'permissions',case when a.role='subadmin' then coalesce((select jsonb_agg(permission order by permission)
     from private.user_permissions where user_id=a.user_id),'[]'::jsonb) else '[]'::jsonb end)
 from private.user_access a join public.profiles p on p.id=a.user_id
 where a.user_id=auth.uid() and a.active and a.account_state='ready';
$$;

revoke execute on all functions in schema private from public,anon,authenticated;
grant execute on function private.is_active(),private.has_permission(text) to authenticated;
grant execute on all functions in schema private to service_role;
grant execute on function public.admin_list_users(integer,integer),public.admin_get_user(uuid),
 public.admin_update_access(uuid,text,text[],boolean,bigint,uuid),public.admin_prepare_invite(uuid,text,text,text,text[],uuid),
 public.admin_prepare_delete(uuid,uuid,uuid),public.admin_retry_operation(uuid,uuid),public.admin_list_operations(),public.accept_invitation() to authenticated;
grant execute on function public.admin_issue_reauth(uuid,text,uuid,jsonb),public.admin_rate_limit(uuid),
 public.admin_claim_operation(uuid,uuid),public.admin_finish_operation(uuid,uuid,uuid),public.admin_fail_operation(uuid,uuid,text) to service_role;

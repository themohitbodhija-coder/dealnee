\set ON_ERROR_STOP on
begin;
select pg_advisory_xact_lock(741106001);
create temporary table bootstrap_target as
 select id from auth.users where id=:'admin_user_id'::uuid and lower(email)=lower(:'admin_email')
   and email_confirmed_at is not null and coalesce(encrypted_password,'')<>'';
do $$
begin
 if (select count(*) from bootstrap_target)<>1 then raise exception 'Expected one confirmed password account matching UUID and email'; end if;
 if exists(select 1 from private.user_access where role='admin') then raise exception 'Bootstrap is closed: an admin already exists'; end if;
 update private.user_access set role='admin',active=true,account_state='ready'
   where user_id=(select id from bootstrap_target);
 if not found then raise exception 'Account profile/access record is missing'; end if;
 insert into private.audit_events(actor_id,operation,target_id)
 select id,'admin_bootstrapped',id from bootstrap_target;
end;
$$;
commit;
select 'First admin configured. Bootstrap cannot run again.' as result;

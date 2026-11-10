\set ON_ERROR_STOP on
begin;

create function pg_temp.assert_true(condition boolean, label text) returns void
language plpgsql as $$
begin
  if condition is distinct from true then raise exception 'FAIL: %', label; end if;
end;
$$;
create function pg_temp.expect_error(statement text, expected_state text, label text) returns void
language plpgsql as $$
declare actual_state text;
begin
  begin
    execute statement;
  exception when others then
    get stacked diagnostics actual_state = returned_sqlstate;
  end;
  if actual_state is distinct from expected_state then
    raise exception 'FAIL: %, expected SQLSTATE %, got %', label, expected_state, coalesce(actual_state, 'success');
  end if;
end;
$$;
grant execute on function pg_temp.assert_true(boolean,text), pg_temp.expect_error(text,text,text) to public;

select pg_temp.assert_true((select count(*) = 10 from public.categories), '10 reference categories');
select pg_temp.assert_true((select count(*) = 19 from public.property_subtypes), '19 active subtypes');
select pg_temp.assert_true((select count(*) = 3 from public.categories c join public.categories p on p.id = c.parent_id where p.code = 'NEW_PROJECT'), 'project navigation hierarchy');
select pg_temp.assert_true(not exists(
  select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public','private') and c.relkind = 'r' and not c.relrowsecurity
), 'all application tables have RLS');
select pg_temp.assert_true(not has_schema_privilege('anon','private','USAGE'), 'anonymous private schema closed');
select pg_temp.assert_true(not has_function_privilege('anon','public.current_account()','EXECUTE'), 'RPC not executable via PUBLIC default');
select pg_temp.assert_true(not has_function_privilege('authenticated','private.allocate_property_id(text)','EXECUTE'), 'allocator private');

insert into auth.users(id, email, raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000001','user-a@example.test','{"name":"User A","role":"admin","permissions":["manage_users"]}'),
 ('10000000-0000-4000-8000-000000000002','user-b@example.test','{}'),
 ('10000000-0000-4000-8000-000000000003','subadmin@example.test','{"name":"Subadmin"}'),
 ('10000000-0000-4000-8000-000000000004','admin@example.test','{"name":"Admin"}');
select pg_temp.assert_true((select role = 'user' from private.user_access where user_id = '10000000-0000-4000-8000-000000000001'), 'signup metadata cannot escalate');
select pg_temp.assert_true((select name = 'New user' from public.profiles where id = '10000000-0000-4000-8000-000000000002'), 'missing name has safe default');
select pg_temp.assert_true((select count(*) = 0 from private.user_permissions), 'metadata permissions ignored');
update private.user_access set role = 'subadmin' where user_id = '10000000-0000-4000-8000-000000000003';
update private.user_access set role = 'admin' where user_id = '10000000-0000-4000-8000-000000000004';

insert into public.properties(id, property_id, property_type, category_id, subtype_code, title,
 description, price, area, area_unit, address, city, state, listing_phone, latitude, longitude, posted_by)
select '20000000-0000-4000-8000-000000000001', private.allocate_property_id('NP'), 'BUY', id,
 'NEW_PROJECT_PLOT', 'Test plot', 'Test description', 123456.78, 100.125, 'sq_yards', 'Test address',
 'Bhubaneswar', 'Odisha', '919999999999', 0, 0, '10000000-0000-4000-8000-000000000004'
from public.categories where code = 'NEW_PROJECT';
insert into public.property_details(property_id) values('20000000-0000-4000-8000-000000000001');
insert into public.inquiries(id,name,email,message,property_id) values
 ('30000000-0000-4000-8000-000000000001','Synthetic lead','lead@example.test','Test inquiry','20000000-0000-4000-8000-000000000001');
insert into public.wishlists(user_id,property_id) values
 ('10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001');
select pg_temp.assert_true((select price = 123456.78 and area = 100.125 and latitude = 0 from public.properties), 'money, fractional area, square yards and zero coordinate retained');
select pg_temp.expect_error($s$update public.properties set price = 'NaN'$s$, '23514', 'NaN money rejected');
select pg_temp.expect_error($s$update public.properties set area = -1$s$, '23514', 'negative area rejected');
select pg_temp.expect_error($s$update public.properties set latitude = null$s$, '23514', 'coordinate pair enforced');
select pg_temp.expect_error($s$update public.properties set subtype_code = 'COMMERCIAL_OFFICE_SALE'$s$, '23503', 'cross-type subtype rejected');
select pg_temp.expect_error($s$update public.property_details set rental_info = '[]'$s$, '23514', 'details must be objects');
select pg_temp.expect_error($s$update public.properties set facilities = array['bank']$s$, '23514', 'removed bank facility rejected');
select pg_temp.expect_error($s$update public.properties set bathrooms = -1$s$, '23514', 'negative room count rejected');
select pg_temp.expect_error($s$insert into public.property_units values('20000000-0000-4000-8000-000000000001','bhk2',100,101,null,1000)$s$, '23514', 'invalid unit area relation rejected');

set local role anon;
select pg_temp.assert_true((select count(*) = 1 from public.properties), 'public property reads');
select pg_temp.assert_true((select count(*) = 1 from public.property_details), 'public detail reads');
select pg_temp.expect_error('select * from public.profiles','42501','anonymous profiles denied');
select pg_temp.expect_error('select * from public.inquiries','42501','anonymous inquiries denied');
select pg_temp.expect_error('select * from auth.users','42501','Auth directory never public');
select pg_temp.expect_error($s$insert into public.inquiries(name,email,message) values('Spam','spam@example.test','bypass')$s$,'42501','direct public form bypass denied');
select pg_temp.expect_error('select public.current_account()','42501','anonymous account RPC denied');
select pg_temp.expect_error($s$select private.allocate_property_id('NP')$s$,'42501','public ID allocation denied');
select pg_temp.expect_error($s$update public.properties set price = 1$s$,'42501','public property modification denied');
reset role;

select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","user_metadata":{"role":"admin"}}',true);
set local role authenticated;
select pg_temp.assert_true((select count(*) = 1 from public.profiles), 'self-only profile read');
select pg_temp.assert_true(public.current_account()->>'role' = 'user', 'forged metadata not used by RPC');
select pg_temp.assert_true(not private.has_permission('manage_users'), 'ordinary user cannot manage users');
update public.profiles set phone = '9999999999' where id = '10000000-0000-4000-8000-000000000001';
select pg_temp.assert_true((select phone = '9999999999' from public.profiles), 'safe profile edit allowed');
select pg_temp.expect_error($s$update public.profiles set id = '10000000-0000-4000-8000-000000000002'$s$, '42501', 'profile ID immutable to caller');
select pg_temp.expect_error($s$update public.profiles set profile_image_url = 'https://attacker.example/image.png'$s$, '42501', 'unapproved profile URL denied');
select pg_temp.expect_error('select * from private.user_access','42501','roles table not readable by user');
select pg_temp.expect_error($s$insert into private.user_permissions values('10000000-0000-4000-8000-000000000001','manage_users')$s$, '42501', 'direct grant escalation denied');
select pg_temp.assert_true((select count(*) = 0 from public.inquiries), 'ordinary user sees no inquiries');
select pg_temp.assert_true((select count(*) = 0 from public.wishlists), 'other user wishlist hidden');
select pg_temp.expect_error($s$insert into public.wishlists(user_id,property_id) values('10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001')$s$,'42501','cannot write another wishlist');
select pg_temp.expect_error($s$select public.save_category('Unauthorized')$s$,'42501','ordinary category write denied');
reset role;

insert into private.user_permissions values ('10000000-0000-4000-8000-000000000003','manage_categories');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000003"}',true);
set local role authenticated;
select pg_temp.assert_true(private.has_permission('manage_categories') and not private.has_permission('manage_properties'), 'individual subadmin capability enforced');
select public.save_category('Custom category','','',null,'CUSTOM');
select pg_temp.assert_true((select count(*) = 1 from public.categories where code = 'CUSTOM'), 'permitted category creation');
select pg_temp.expect_error($s$select public.delete_category((select id from public.categories where code='NEW_PROJECT'))$s$, '22023', 'system taxonomy deletion denied');
select pg_temp.expect_error($s$select public.save_category('Changed','','',(select id from public.categories where code='CUSTOM'),'REPLACEMENT')$s$, '22023', 'stable code cannot be patched');
select pg_temp.assert_true((select count(*) = 0 from public.inquiries), 'category manager cannot read leads');
select pg_temp.expect_error($s$select public.read_inquiry('30000000-0000-4000-8000-000000000001')$s$,'42501','category grant does not grant inquiries');
reset role;

delete from private.user_permissions where user_id = '10000000-0000-4000-8000-000000000003';
insert into private.user_permissions values ('10000000-0000-4000-8000-000000000003','view_inquiries');
set local role authenticated;
select pg_temp.assert_true(not private.has_permission('manage_categories'), 'revocation effective without token refresh');
select pg_temp.assert_true((select count(*) = 1 from public.inquiries), 'inquiry permission read allowed');
select pg_temp.assert_true((public.read_inquiry('30000000-0000-4000-8000-000000000001')).status = 'read', 'read marks inquiry');
update public.inquiries set status = 'replied';
select pg_temp.expect_error($s$update public.inquiries set email = 'changed@example.test'$s$,'42501','inquiry PII update denied');
select pg_temp.expect_error($s$update public.inquiries set status = 'invalid'$s$,'23514','invalid inquiry status denied');
reset role;
update private.user_access set active = false where user_id = '10000000-0000-4000-8000-000000000003';
set local role authenticated;
select pg_temp.assert_true(public.current_account() is null, 'disabled account projection absent');
select pg_temp.assert_true(not private.has_permission('view_inquiries'), 'disabled account loses grant immediately');
select pg_temp.assert_true((select count(*) = 0 from public.inquiries), 'disabled account leads hidden');
reset role;

select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000004"}',true);
set local role authenticated;
select pg_temp.assert_true(private.has_permission('manage_properties') and private.has_permission('view_inquiries'), 'admin bypass uses live role');
select pg_temp.assert_true((select count(*) = 1 from public.profiles), 'admin does not get broad self-profile endpoint');
select pg_temp.expect_error($s$update public.properties set featured = true$s$,'42501','admin browser cannot bypass transactional save');
reset role;

-- Counter is not based on row count, grows beyond 999 without truncation.
select pg_temp.assert_true(private.allocate_property_id('NP') = 'DEL-NP-002', 'counter increments');
update private.property_counters set last_value = 999 where namespace = 'NP';
select pg_temp.assert_true(private.allocate_property_id('NP') = 'DEL-NP-1000', 'counter grows above 999');
select pg_temp.expect_error($s$select private.allocate_property_id('INVALID')$s$,'23514','unknown namespace rejected');

insert into public.property_images(property_id,object_key,sort_order,mime_type,byte_size,width,height,checksum)
values('20000000-0000-4000-8000-000000000001','properties/test/image.jpg',0,'image/jpeg',123,10,10,repeat('a',64));
delete from public.properties where id = '20000000-0000-4000-8000-000000000001';
select pg_temp.assert_true((select count(*) = 1 from private.deletion_jobs where object_key = 'properties/test/image.jpg'), 'cascade deletion durably queues image cleanup');
select pg_temp.assert_true((select property_id is null and property_display_id = 'DEL-NP-001' and property_title = 'Test plot' from public.inquiries), 'inquiry snapshot survives property removal');
select pg_temp.assert_true((select count(*) = 0 from public.wishlists), 'property deletion removes wishlist refs');
select pg_temp.assert_true(private.allocate_property_id('NP') = 'DEL-NP-1001', 'deletion never recycles ID');

-- Even a regular role with a stray grant cannot gain delegated power.
insert into private.user_permissions values('10000000-0000-4000-8000-000000000001','manage_users');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001"}',true);
set local role authenticated;
select pg_temp.assert_true(not private.has_permission('manage_users'), 'grants require subadmin role');
reset role;
insert into private.uploads(actor_id,create_session_id,pending_key,final_key,state,declared_mime,declared_size,expires_at)
values('10000000-0000-4000-8000-000000000001',gen_random_uuid(),'pending/abandoned.jpg',
  'properties/abandoned.jpg','validated','image/jpeg',123,now()+interval '1 hour');
delete from auth.users where id = '10000000-0000-4000-8000-000000000001';
select pg_temp.assert_true((select count(*) = 2 from private.deletion_jobs where object_key in ('pending/abandoned.jpg','properties/abandoned.jpg')), 'account removal queues abandoned upload objects');
set local role authenticated;
select pg_temp.assert_true(public.current_account() is null and not private.is_active(), 'deleted account JWT no longer grants access');
reset role;

select 'PASS: taxonomy, constraints, profile trigger, RLS, grants, role revocation, counters and deletion lifecycle' as result;
rollback;

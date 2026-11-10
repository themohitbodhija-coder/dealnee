\set ON_ERROR_STOP on
begin;
\ir ../assertions.sql
insert into auth.users(id,email) values
 ('80000000-0000-4000-8000-000000000001','inquiry-admin@example.test'),
 ('80000000-0000-4000-8000-000000000002','inquiry-staff@example.test'),
 ('80000000-0000-4000-8000-000000000003','inquiry-other@example.test'),
 ('80000000-0000-4000-8000-000000000004','inquiry-user@example.test');
update private.user_access set role='admin' where user_id='80000000-0000-4000-8000-000000000001';
update private.user_access set role='subadmin' where user_id in ('80000000-0000-4000-8000-000000000002','80000000-0000-4000-8000-000000000003');
insert into private.user_permissions values ('80000000-0000-4000-8000-000000000002','view_inquiries'),('80000000-0000-4000-8000-000000000003','manage_users');
insert into public.properties(id,property_id,property_type,category_id,subtype_code,title,description,price,area,address,city,state,listing_phone)
select '81000000-0000-4000-8000-000000000001','DEL-RS-999','BUY',id,'RESALE_FLAT','Original title','Description',100,100,'Address','City','State','919999999999' from public.categories where code='RESALE';
select pg_temp.assert_true(not has_table_privilege('anon','public.inquiries','INSERT') and not has_table_privilege('authenticated','public.inquiries','INSERT'),'browser cannot insert');
select pg_temp.assert_true(not has_function_privilege('anon','public.submit_verified_inquiry(text,uuid,text,text,text,text,text,uuid)','EXECUTE') and not has_function_privilege('authenticated','public.inquiry_admit(text)','EXECUTE'),'no submission RPC bypass');
set local role service_role;
select pg_temp.assert_true(public.submit_verified_inquiry(repeat('a',64),'82000000-0000-4000-8000-000000000001',repeat('b',64),'Visitor','lead@example.test','+919999999999','<script>plain text</script>','81000000-0000-4000-8000-000000000001')->>'accepted'='true','service submission acknowledged');
select pg_temp.assert_true((public.submit_verified_inquiry(repeat('a',64),'82000000-0000-4000-8000-000000000001',repeat('b',64),'Visitor','lead@example.test','+919999999999','<script>plain text</script>','81000000-0000-4000-8000-000000000001')- 'reference')='{"accepted":true}'::jsonb,'replay returns no contact data');
select pg_temp.expect_error($s$select public.submit_verified_inquiry(repeat('a',64),'82000000-0000-4000-8000-000000000001',repeat('c',64),'Visitor','lead@example.test','','Changed',null)$s$,'23505','changed digest cannot reuse key');
select pg_temp.expect_error($s$select public.submit_verified_inquiry(repeat('a',64),'82000000-0000-4000-8000-000000000002',repeat('b',64),'Visitor','bad','','Message',null)$s$,'22023','database validates independently');
select pg_temp.expect_error($s$select public.submit_verified_inquiry(repeat('a',64),'82000000-0000-4000-8000-000000000002',repeat('b',64),'Visitor','ok@example.test','','Message','81000000-0000-4000-8000-000000000099')$s$,'P0002','missing property rejected');
reset role;
select pg_temp.assert_true((select count(*)=1 from public.inquiries),'replay creates one row');
select pg_temp.assert_true((select property_title='Original title' and property_display_id='DEL-RS-999' from public.inquiries),'server snapshot generated');
update public.properties set title='Updated title' where id='81000000-0000-4000-8000-000000000001';
delete from public.properties where id='81000000-0000-4000-8000-000000000001';
select pg_temp.assert_true((select property_id is null and property_title='Original title' from public.inquiries),'property deletion preserves lead and snapshot');
set local role anon;
select pg_temp.expect_error('select * from public.inquiries','42501','anonymous PII denied');
select pg_temp.expect_error('select public.list_inquiries()','42501','anonymous admin RPC denied');
reset role;
select set_config('request.jwt.claims','{"sub":"80000000-0000-4000-8000-000000000004"}',true);
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from public.inquiries),'ordinary user sees no leads');
select pg_temp.expect_error('select public.list_inquiries()','42501','ordinary user list denied');
select pg_temp.expect_error($s$select public.delete_inquiry('82000000-0000-4000-8000-000000000001')$s$,'42501','ordinary user delete denied');
reset role;
select set_config('request.jwt.claims','{"sub":"80000000-0000-4000-8000-000000000003"}',true);
set local role authenticated;
select pg_temp.expect_error('select public.list_inquiries()','42501','unrelated staff grant denied');
reset role;
insert into public.inquiries(name,email,message) select 'Lead '||n,'lead'||n||'@example.test','Text' from generate_series(1,105) n;
select set_config('request.jwt.claims','{"sub":"80000000-0000-4000-8000-000000000002"}',true);
set local role authenticated;
select pg_temp.assert_true((public.list_inquiries()->>'total')::int=106 and jsonb_array_length(public.list_inquiries()->'inquiries')=10,'staff default pagination');
select pg_temp.assert_true(jsonb_array_length(public.list_inquiries(2,100)->'inquiries')=6,'staff pages beyond 100');
select pg_temp.assert_true(not exists(select 1 from jsonb_array_elements(public.list_inquiries(1,100)->'inquiries') a join jsonb_array_elements(public.list_inquiries(2,100)->'inquiries') b on a->>'id'=b->>'id'),'stable pagination without overlap');
select pg_temp.expect_error('select public.list_inquiries(0)','22023','page bounded');
select pg_temp.expect_error('select public.list_inquiries(1,101)','22023','limit bounded');
select pg_temp.expect_error($s$select public.list_inquiries(1,10,'spam')$s$,'22023','status filter validated');
select pg_temp.assert_true((public.read_inquiry((select id from public.inquiries limit 1))).status='read','opening marks read');
select pg_temp.assert_true((public.set_inquiry_status((select id from public.inquiries limit 1),'replied')).status='replied','staff status change');
select pg_temp.assert_true((public.read_inquiry((select id from public.inquiries where status='replied' limit 1))).status='replied','opening preserves replied');
select pg_temp.expect_error($s$select public.set_inquiry_status((select id from public.inquiries limit 1),'spam')$s$,'22023','invalid status rejected');
select pg_temp.expect_error($s$update public.inquiries set email='stolen@example.test'$s$,'42501','staff cannot rewrite lead identity');
select public.delete_inquiry((select id from public.inquiries where status='replied' limit 1));
select pg_temp.assert_true((public.list_inquiries()->>'total')::int=105,'staff deletion works');
reset role;
update private.user_access set active=false where user_id='80000000-0000-4000-8000-000000000002';
set local role authenticated;
select pg_temp.expect_error('select public.list_inquiries()','42501','disabled staff denied with same JWT');
reset role;
update private.user_access set active=true where user_id='80000000-0000-4000-8000-000000000002';
delete from private.user_permissions where user_id='80000000-0000-4000-8000-000000000002';
set local role authenticated;
select pg_temp.expect_error('select public.list_inquiries()','42501','revoked grant denied with same JWT');
reset role;
set local role service_role;
select public.inquiry_admit(repeat('d',64)) from generate_series(1,5);
select pg_temp.assert_true(public.inquiry_admit(repeat('d',64))->>'allowed'='false','IP rate limit enforced');
select public.submit_verified_inquiry(repeat('e',64),gen_random_uuid(),repeat('f',64),'Lead','limit@example.test','','Message') from generate_series(1,20);
select pg_temp.assert_true(public.submit_verified_inquiry(repeat('e',64),gen_random_uuid(),repeat('f',64),'Lead','limit@example.test','','Message')->>'limited'='true','daily email limit enforced');
delete from private.rate_limit_buckets where bucket_key='inquiry:global';
select public.inquiry_admit(md5(n::text)||md5(n::text)) from generate_series(1,300) n;
select pg_temp.assert_true(public.inquiry_admit(repeat('9',64))->>'allowed'='false','global limit rejects rotated identities');
reset role;
select pg_temp.assert_true((select count(*)=20 from public.inquiries where email='limit@example.test'),'rate rejection never inserts');
select 'PASS: inquiry grants, validation, snapshot, replay, pagination, live permissions and transactional limits';
rollback;

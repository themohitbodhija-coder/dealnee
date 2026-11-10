\set ON_ERROR_STOP on
begin;
\ir ../assertions.sql
insert into auth.users(id,email) values
 ('71000000-0000-4000-8000-000000000001','property-admin@example.test'),
 ('71000000-0000-4000-8000-000000000002','property-staff@example.test'),
 ('71000000-0000-4000-8000-000000000003','other-staff@example.test'),
 ('71000000-0000-4000-8000-000000000004','ordinary@example.test');
update private.user_access set role='admin' where user_id='71000000-0000-4000-8000-000000000001';
update private.user_access set role='subadmin' where user_id in ('71000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-000000000003');
insert into private.user_permissions values('71000000-0000-4000-8000-000000000002','manage_properties'),('71000000-0000-4000-8000-000000000003','manage_users');
create function pg_temp.property_fixture(subtype text default 'RESALE_FLAT') returns jsonb language sql as $$
 select jsonb_build_object('title','Test property','description','A description','propertyType',s.property_type,'category',c.code,'subcategory',s.code,
 'price','1234567.89','area','1200.1234','areaUnit','sq_yards','bedrooms',0,'bathrooms',0,
 'location',jsonb_build_object('address','Example street','city','Bhubaneswar','state','Odisha','latitude','0','longitude','0'),
 'contact',jsonb_build_object('phone','9776631999'),'featured',false,
 'newProjectInfo',case when s.code like 'NEW_PROJECT_%' then '{"plotLength":"10","plotWidth":"20","projectName":"Test project","builderName":"Test builder","projectStatus":"NEW_LAUNCH"}'::jsonb else '{}'::jsonb end,
 'projectPricing',case when s.code in ('NEW_PROJECT_APARTMENT','NEW_PROJECT_VILLA') then '{"unitConfigurations":{"bhk2":{"superBuildUpArea":"1200","carpetArea":"900","price":"8000000"}}}'::jsonb else '{}'::jsonb end)
 from public.property_subtypes s join public.categories c on c.id=s.category_id where s.code=subtype;
$$;
grant execute on function pg_temp.property_fixture(text) to public;
set local role anon;
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),'{}','[]')$s$,'42501','anonymous writes denied');
reset role;
select set_config('request.jwt.claims','{"sub":"71000000-0000-4000-8000-000000000004"}',true);
set local role authenticated;
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),'{}','[]')$s$,'42501','ordinary writes denied');
select pg_temp.expect_error($s$update public.properties set title='Forged'$s$,'42501','direct table writes denied');
reset role;
select set_config('request.jwt.claims','{"sub":"71000000-0000-4000-8000-000000000003"}',true);
set local role authenticated;
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),'{}','[]')$s$,'42501','unrelated capability denied');
reset role;
select set_config('request.jwt.claims','{"sub":"71000000-0000-4000-8000-000000000002"}',true);
set local role authenticated;
do $$
declare s text; r jsonb; replay jsonb; request_id uuid; session_id uuid; initial_count integer;
begin
 for s in select code from public.property_subtypes loop
  request_id:=gen_random_uuid(); session_id:=gen_random_uuid();
  r:=public.save_property(request_id,pg_temp.property_fixture(s),'[]',null,null,session_id);
  replay:=public.save_property(request_id,pg_temp.property_fixture(s),'[]',null,null,session_id);
  perform pg_temp.assert_true(r=replay,'exact retry returns original DTO');
  perform pg_temp.assert_true((public.save_property(gen_random_uuid(),pg_temp.property_fixture(s)||'{"title":"Edited subtype"}','[]',(r#>>'{property,id}')::uuid,1)#>>'{property,version}')='2','every subtype update round trip');
  perform pg_temp.assert_true(r#>>'{property,propertyId}' ~ '^DEL-(NP|RS|REN|CB|CL)-[0-9]{3,}$','allocated ID');
  perform pg_temp.assert_true(r#>>'{property,location,latitude}'='0' and r#>>'{property,area}'='1200.1234','coordinates and decimals survive');
 end loop;
end $$;
select pg_temp.assert_true((select count(*)=19 from public.properties where posted_by='71000000-0000-4000-8000-000000000002'),'all 19 subtype saves');
select set_config('test.result',public.save_property('72000000-0000-4000-8000-000000000001',pg_temp.property_fixture()||'{"resaleInfo":{"floorNumber":0,"totalFloors":2,"readyToMove":false},"furnishingItems":["ac"]}','[]',null,null,'73000000-0000-4000-8000-000000000001')::text,true);
select set_config('test.id',current_setting('test.result')::jsonb#>>'{property,id}',true);
select pg_temp.expect_error($s$select public.save_property('72000000-0000-4000-8000-000000000001',pg_temp.property_fixture()||'{"title":"Changed"}','[]',null,null,'73000000-0000-4000-8000-000000000001')$s$,'40001','idempotency payload mismatch rejected');
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),pg_temp.property_fixture(),'[]',null,null,'73000000-0000-4000-8000-000000000001')$s$,'40001','same create session cannot duplicate listing');
select set_config('test.updated',public.save_property(gen_random_uuid(),pg_temp.property_fixture()||'{"title":"Updated title","status":"sold"}','[]',current_setting('test.id')::uuid,1)::text,true);
select pg_temp.assert_true(current_setting('test.updated')::jsonb#>>'{property,version}'='2','version increments');
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),pg_temp.property_fixture(),'[]',current_setting('test.id')::uuid,1)$s$,'40001','stale update rejected');
select pg_temp.expect_error($s$select public.delete_property(gen_random_uuid(),current_setting('test.id')::uuid,1)$s$,'40001','stale delete rejected');
-- Validation is exercised through the actual writer, not only private helpers.
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),pg_temp.property_fixture()||'{"admin":true}','[]',null,null,gen_random_uuid())$s$,'22023','unknown root key');
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),pg_temp.property_fixture()||'{"resaleInfo":{"mystery":"value"}}','[]',null,null,gen_random_uuid())$s$,'22023','unknown nested key');
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),pg_temp.property_fixture()||'{"price":"1.001"}','[]',null,null,gen_random_uuid())$s$,'22023','money scale');
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),pg_temp.property_fixture()||'{"area":"NaN"}','[]',null,null,gen_random_uuid())$s$,'22023','NaN rejected');
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),pg_temp.property_fixture()||'{"bedrooms":1.5}','[]',null,null,gen_random_uuid())$s$,'22023','fractional room counts rejected');
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),pg_temp.property_fixture()||'{"resaleInfo":{"readyToMove":"false"}}','[]',null,null,gen_random_uuid())$s$,'22023','strict boolean');
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),pg_temp.property_fixture()||'{"resaleInfo":{"availableFrom":"2026-02-30"}}','[]',null,null,gen_random_uuid())$s$,'22023','calendar date');
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),pg_temp.property_fixture()||'{"facilities":["bank"]}','[]',null,null,gen_random_uuid())$s$,'22023','array allowlist');
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),pg_temp.property_fixture()||'{"amenities":["gym","gym"]}','[]',null,null,gen_random_uuid())$s$,'22023','duplicate arrays');
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),pg_temp.property_fixture()||'{"category":"RENT"}','[]',null,null,gen_random_uuid())$s$,'22023','category mismatch');
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),pg_temp.property_fixture('RENTAL_FLAT')||'{"rentalInfo":{"monthlyRent":"999"}}','[]',null,null,gen_random_uuid())$s$,'22023','conflicting duplicate rent');
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),pg_temp.property_fixture()||'{"rentalInfo":{"securityDeposit":10}}','[]',null,null,gen_random_uuid())$s$,'22023','wrong subtype details');
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),pg_temp.property_fixture('NEW_PROJECT_APARTMENT')||'{"projectPricing":{"unitConfigurations":{"bhk2":{"superBuildUpArea":"100","carpetArea":"110","price":"100"}}}}','[]',null,null,gen_random_uuid())$s$,'22023','invalid unit rolls back');
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),pg_temp.property_fixture(),'[{"imageId":"74000000-0000-4000-8000-000000000001"}]',null,null,gen_random_uuid())$s$,'42501','invalid image reference rolls back');
select pg_temp.assert_true((select count(*)=20 from public.properties where posted_by='71000000-0000-4000-8000-000000000002'),'failed writes left no partial properties');
reset role;
-- Synthetic validated metadata tests the real attachment transaction, not S3 decoding.
insert into private.uploads(id,actor_id,property_id,pending_key,final_key,state,declared_mime,declared_size,checksum,expires_at,validated_mime,validated_size,width,height)
 values('74000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-000000000002',current_setting('test.id')::uuid,
 'pending/property-write-test','properties/74000000-0000-4000-8000-000000000002/74000000-0000-4000-8000-000000000003.jpg','validated','image/jpeg',100,repeat('a',64),now()+interval '1 hour','image/jpeg',100,20,20);
set local role authenticated;
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),pg_temp.property_fixture()||'{"title":"Updated title","status":"sold"}','[{"uploadId":"74000000-0000-4000-8000-000000000002"},{"imageId":"74000000-0000-4000-8000-000000000001"}]',current_setting('test.id')::uuid,2)$s$,'42501','later image failure rolls back earlier attachment');
reset role;
select pg_temp.assert_true((select state='validated' from private.uploads where id='74000000-0000-4000-8000-000000000002') and not exists(select 1 from public.property_images where property_id=current_setting('test.id')::uuid) and (select version=2 from public.properties where id=current_setting('test.id')::uuid),'failed attachment retains reservation and property version');
set local role authenticated;
select public.save_property('72000000-0000-4000-8000-000000000003',pg_temp.property_fixture()||'{"title":"Updated title","status":"sold"}','[{"uploadId":"74000000-0000-4000-8000-000000000002"}]',current_setting('test.id')::uuid,2);
select public.save_property('72000000-0000-4000-8000-000000000003',pg_temp.property_fixture()||'{"title":"Updated title","status":"sold"}','[{"uploadId":"74000000-0000-4000-8000-000000000002"}]',current_setting('test.id')::uuid,2);
select pg_temp.assert_true((select count(*)=1 from public.property_images where property_id=current_setting('test.id')::uuid),'successful retry does not duplicate attached image');
reset role;
insert into public.inquiries(name,email,message,property_id) values('Test lead','lead@example.test','Question',current_setting('test.id')::uuid);
set local role authenticated;
select public.delete_property('72000000-0000-4000-8000-000000000002',current_setting('test.id')::uuid,3);
select public.delete_property('72000000-0000-4000-8000-000000000002',current_setting('test.id')::uuid,3);
reset role;
select pg_temp.assert_true(exists(select 1 from private.deletion_jobs where object_key='properties/74000000-0000-4000-8000-000000000002/74000000-0000-4000-8000-000000000003.jpg'),'property delete queues final image cleanup');
select pg_temp.assert_true((select property_id is null and property_title='Updated title' from public.inquiries where email='lead@example.test'),'delete preserves inquiry and snapshots');
update private.user_access set active=false where user_id='71000000-0000-4000-8000-000000000002';
set local role authenticated;
select pg_temp.expect_error($s$select public.save_property(gen_random_uuid(),pg_temp.property_fixture(),'[]',null,null,gen_random_uuid())$s$,'42501','inactive existing JWT denied');
reset role;
select 'PASS: protected writes, all 19 subtypes, strict JSON/arrays, retries, versions, rollback and inquiry retention';
rollback;

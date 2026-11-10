begin;
\ir ../assertions.sql
insert into auth.users(id,email) values
 ('61000000-0000-4000-8000-000000000001','photo-admin@example.test'),
 ('61000000-0000-4000-8000-000000000002','photo-user@example.test'),
 ('61000000-0000-4000-8000-000000000003','photo-other@example.test');
update private.user_access set role='admin' where user_id in ('61000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000003');
select pg_temp.assert_true(not has_function_privilege('authenticated','public.photo_reserve(uuid,uuid,uuid,uuid,text,integer,text)','execute'),'browser cannot reserve with forged actor');
select pg_temp.assert_true(not has_function_privilege('authenticated','public.photo_finish(uuid,uuid,uuid,text,integer,integer,integer)','execute'),'browser cannot assert validated image');
select pg_temp.assert_true(not has_function_privilege('service_role','private.attach_property_images(uuid,uuid,uuid,jsonb)','execute'),'attachment private transaction helper');
select pg_temp.expect_error($s$select public.photo_reserve('61000000-0000-4000-8000-000000000002',gen_random_uuid(),null,gen_random_uuid(),'image/png',50,repeat('a',64))$s$,'42501','regular user reservation denied');
select set_config('test.photo_upload',(public.photo_reserve('61000000-0000-4000-8000-000000000001','62000000-0000-4000-8000-000000000001',null,'63000000-0000-4000-8000-000000000001','image/png',50,repeat('a',64))->>'id'),true);
select pg_temp.assert_true(public.photo_reserve('61000000-0000-4000-8000-000000000001','62000000-0000-4000-8000-000000000001',null,'63000000-0000-4000-8000-000000000001','image/png',50,repeat('a',64))->>'id'=current_setting('test.photo_upload'),'reservation replay stable');
select pg_temp.expect_error($s$select public.photo_reserve('61000000-0000-4000-8000-000000000001','62000000-0000-4000-8000-000000000001',null,'63000000-0000-4000-8000-000000000001','image/png',51,repeat('a',64))$s$,'23505','reservation replay change rejected');
select pg_temp.expect_error($s$select public.photo_claim('61000000-0000-4000-8000-000000000003',current_setting('test.photo_upload')::uuid)$s$,'P0002','foreign finalize denied');
select set_config('test.photo_lease',public.photo_claim('61000000-0000-4000-8000-000000000001',current_setting('test.photo_upload')::uuid)->>'lease',true);
select pg_temp.expect_error($s$select public.photo_claim('61000000-0000-4000-8000-000000000001',current_setting('test.photo_upload')::uuid)$s$,'55P03','parallel finalization denied by lease');
select pg_temp.expect_error($s$select public.photo_finish('61000000-0000-4000-8000-000000000001',current_setting('test.photo_upload')::uuid,gen_random_uuid(),repeat('b',64),100,10,10)$s$,'40001','stale finalizer cannot publish');
select public.photo_finish('61000000-0000-4000-8000-000000000001',current_setting('test.photo_upload')::uuid,current_setting('test.photo_lease')::uuid,repeat('b',64),100,10,10);
select pg_temp.assert_true(public.photo_claim('61000000-0000-4000-8000-000000000001',current_setting('test.photo_upload')::uuid)->>'state'='validated','finalize replay succeeds');
insert into public.properties(id,property_id,property_type,category_id,subtype_code,title,description,price,area,address,city,state,listing_phone)
 select '64000000-0000-4000-8000-000000000001','DEL-RS-890','BUY',category_id,code,'Photo test','Image transaction test',100,100,'Address','City','State','9876543210'
 from public.property_subtypes where property_type='BUY' limit 1;
select pg_temp.expect_error($s$select private.attach_property_images('61000000-0000-4000-8000-000000000001','64000000-0000-4000-8000-000000000001',null,jsonb_build_array(jsonb_build_object('uploadId',current_setting('test.photo_upload'))))$s$,'42501','session uploads cannot attach to arbitrary edit');
select pg_temp.expect_error($s$select private.attach_property_images('61000000-0000-4000-8000-000000000001','64000000-0000-4000-8000-000000000001','63000000-0000-4000-8000-000000000002',jsonb_build_array(jsonb_build_object('uploadId',current_setting('test.photo_upload'))))$s$,'42501','wrong create session denied');
select private.attach_property_images('61000000-0000-4000-8000-000000000001','64000000-0000-4000-8000-000000000001','63000000-0000-4000-8000-000000000001',jsonb_build_array(jsonb_build_object('uploadId',current_setting('test.photo_upload'))));
select set_config('test.photo_image',(select id::text from public.property_images where property_id='64000000-0000-4000-8000-000000000001'),true);
select private.attach_property_images('61000000-0000-4000-8000-000000000001','64000000-0000-4000-8000-000000000001',null,jsonb_build_array(jsonb_build_object('uploadId',current_setting('test.photo_upload'))));
select pg_temp.assert_true((select count(*)=1 from public.property_images where property_id='64000000-0000-4000-8000-000000000001'),'attached reservation retry does not duplicate image');
select pg_temp.expect_error($s$select private.attach_property_images('61000000-0000-4000-8000-000000000001','64000000-0000-4000-8000-000000000001',null,jsonb_build_array(jsonb_build_object('imageId',current_setting('test.photo_image')),jsonb_build_object('uploadId',current_setting('test.photo_upload'))))$s$,'22023','duplicate retained and upload reference rejected atomically');
select pg_temp.assert_true((select sort_order=0 from public.property_images where id=current_setting('test.photo_image')::uuid),'failed replacement rolls back order');
update private.user_access set active=false where user_id='61000000-0000-4000-8000-000000000001';
select pg_temp.expect_error($s$select private.attach_property_images('61000000-0000-4000-8000-000000000001','64000000-0000-4000-8000-000000000001',null,'[]')$s$,'42501','live revocation blocks attachment');
update private.user_access set active=true where user_id='61000000-0000-4000-8000-000000000001';
select private.attach_property_images('61000000-0000-4000-8000-000000000001','64000000-0000-4000-8000-000000000001',null,'[]');
select pg_temp.assert_true(exists(select 1 from private.deletion_jobs where object_key=(select final_key from private.uploads where id=current_setting('test.photo_upload')::uuid)),'removal queues durable cleanup');
select pg_temp.expect_error($s$select private.attach_property_images('61000000-0000-4000-8000-000000000001','64000000-0000-4000-8000-000000000001',null,jsonb_build_array(jsonb_build_object('uploadId',current_setting('test.photo_upload'))))$s$,'40001','removed upload cannot resurrect image');
select set_config('test.cleanup_job',public.photo_cleanup_claim(1)->0->>'id',true);
select set_config('test.cleanup_lease',(select lease::text from private.deletion_jobs where id=current_setting('test.cleanup_job')::uuid),true);
select public.photo_cleanup_finish(current_setting('test.cleanup_job')::uuid,gen_random_uuid(),true);
select pg_temp.assert_true((select state='processing' from private.deletion_jobs where id=current_setting('test.cleanup_job')::uuid),'stale cleanup worker cannot acknowledge lease');
select public.photo_cleanup_finish(current_setting('test.cleanup_job')::uuid,current_setting('test.cleanup_lease')::uuid,false);
select pg_temp.assert_true((select state='failed' and attempts=1 and next_attempt_at>now() from private.deletion_jobs where id=current_setting('test.cleanup_job')::uuid),'delete failure schedules bounded retry');
-- Cap counts reservations, not just attached images.
select public.photo_reserve('61000000-0000-4000-8000-000000000001',gen_random_uuid(),null,'63000000-0000-4000-8000-000000000003','image/png',50,repeat('a',64)) from generate_series(1,20);
select pg_temp.expect_error($s$select public.photo_reserve('61000000-0000-4000-8000-000000000001',gen_random_uuid(),null,'63000000-0000-4000-8000-000000000003','image/png',50,repeat('a',64))$s$,'22023','20-image reserved quota enforced');
update private.uploads set expires_at=now()-interval '20 minutes' where create_session_id='63000000-0000-4000-8000-000000000003';
select public.photo_cleanup_claim(1);
select pg_temp.assert_true(not exists(select 1 from private.uploads where create_session_id='63000000-0000-4000-8000-000000000003'),'expired abandoned uploads collected');
select 'PASS: photo reservation ownership, leases, attachment, cleanup and quotas';
rollback;

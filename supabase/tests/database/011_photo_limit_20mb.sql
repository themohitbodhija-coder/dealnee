begin;
\ir ../assertions.sql
insert into auth.users(id,email) values ('61000000-0000-4000-8000-000000000004','photo-size-admin@example.test');
update private.user_access set role='admin' where user_id='61000000-0000-4000-8000-000000000004';
select set_config('test.large_photo', public.photo_reserve('61000000-0000-4000-8000-000000000004',gen_random_uuid(),null,gen_random_uuid(),'image/jpeg',20971520,repeat('a',64))->>'id', true);
select set_config('test.large_lease', public.photo_claim('61000000-0000-4000-8000-000000000004',current_setting('test.large_photo')::uuid)->>'lease', true);
select pg_temp.expect_error($s$select public.photo_reserve('61000000-0000-4000-8000-000000000004',gen_random_uuid(),null,gen_random_uuid(),'image/jpeg',20971521,repeat('a',64))$s$,'22023','source above 20 MB denied');
select pg_temp.expect_error($s$select public.photo_finish('61000000-0000-4000-8000-000000000004',current_setting('test.large_photo')::uuid,current_setting('test.large_lease')::uuid,repeat('b',64),20971521,2560,1707)$s$,'22023','encoded image above 20 MB denied');
select public.photo_finish('61000000-0000-4000-8000-000000000004',current_setting('test.large_photo')::uuid,current_setting('test.large_lease')::uuid,repeat('b',64),20971520,2560,1707);
insert into public.properties(id,property_id,property_type,category_id,subtype_code,title,description,price,area,address,city,state,listing_phone)
 select '64000000-0000-4000-8000-000000000004','DEL-RS-891','BUY',category_id,code,'Large photo test','Image size boundary test',100,100,'Address','City','State','9876543210'
 from public.property_subtypes where property_type='BUY' limit 1;
select private.attach_property_images('61000000-0000-4000-8000-000000000004','64000000-0000-4000-8000-000000000004',(select create_session_id from private.uploads where id=current_setting('test.large_photo')::uuid),jsonb_build_array(jsonb_build_object('uploadId',current_setting('test.large_photo'))));
select pg_temp.assert_true((select byte_size=20971520 from public.property_images where property_id='64000000-0000-4000-8000-000000000004'),'20 MB image attaches');
select pg_temp.expect_error($s$update public.property_images set byte_size=20971521 where property_id='64000000-0000-4000-8000-000000000004'$s$,'23514','table rejects images above 20 MB');
select pg_temp.expect_error($s$update private.uploads set declared_size=20971521 where id=current_setting('test.large_photo')::uuid$s$,'23514','table rejects oversized declarations');
select 'PASS: 20 MB photos reserve, finalize and attach; larger objects are rejected at RPC and table boundaries';
rollback;

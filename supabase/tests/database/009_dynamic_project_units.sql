\set ON_ERROR_STOP on
begin;
\ir ../assertions.sql
insert into auth.users(id,email) values ('79000000-0000-4000-8000-000000000001','project-unit-admin@example.test');
update private.user_access set role='admin' where user_id='79000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claims','{"sub":"79000000-0000-4000-8000-000000000001"}',true);
set local role authenticated;
do $$
declare payload jsonb; result jsonb; saved jsonb;
begin
 payload := '{"title":"Dynamic project","description":"Test project configurations","propertyType":"BUY","category":"NEW_PROJECT","subcategory":"NEW_PROJECT_VILLA","price":"8000000","area":"1200","areaUnit":"sq_ft","bedrooms":0,"bathrooms":0,"location":{"address":"Example street","city":"Bhubaneswar","state":"Odisha"},"contact":{"phone":"9776631999"},"newProjectInfo":{"projectName":"Test project","builderName":"Test builder","totalUnits":"2400","totalProjectArea":"90000.5","totalProjectAreaUnit":"sq_yards"},"projectPricing":{"unitConfigurations":{"bhk1_first":{"superBuildUpArea":"1200","carpetArea":"900","landArea":"1500","price":"8000000","bedrooms":"1","bathrooms":"2"},"bhk5_first":{"superBuildUpArea":"2200","carpetArea":"1900","price":"18000000","bedrooms":"5","bathrooms":"4"},"bhk5_second":{"superBuildUpArea":"2400","carpetArea":"2000","price":"19000000","bedrooms":"5","bathrooms":"5"},"bhk2":{"superBuildUpArea":"1200","carpetArea":"900","price":"8000000"}}}}';
 result := public.save_property(gen_random_uuid(),payload,'[]',null,null,gen_random_uuid());
 saved := result->'property';
 if saved#>>'{newProjectInfo,totalUnits}' <> '2400' or saved#>>'{newProjectInfo,totalProjectArea}' <> '90000.5' then raise exception 'Project totals lost'; end if;
 if saved#>>'{projectPricing,unitConfigurations,bhk1_first,bedrooms}' <> '1' or saved#>>'{projectPricing,unitConfigurations,bhk5_second,bathrooms}' <> '5' then raise exception 'Unit room fields lost'; end if;
 if saved#>>'{projectPricing,unitConfigurations,bhk2,bedrooms}' <> '2' then raise exception 'Legacy BHK fallback lost'; end if;
 if (select count(*) from jsonb_object_keys(saved#>'{projectPricing,unitConfigurations}')) <> 4 then raise exception 'Repeated BHK units lost'; end if;
 -- An edit can remove one duplicate and keep the other and all legacy fields.
 payload := payload #- '{projectPricing,unitConfigurations,bhk5_first}';
 result := public.save_property(gen_random_uuid(),payload,'[]',(saved->>'id')::uuid,(saved->>'version')::bigint,null);
 if result#>'{property,projectPricing,unitConfigurations,bhk5_first}' is not null or result#>'{property,projectPricing,unitConfigurations,bhk5_second}' is null then raise exception 'Unit removal did not persist'; end if;
end;
$$;
reset role;
select pg_temp.expect_error($s$select private.validate_property_object('{"totalUnits":"1.5"}','{"totalUnits":"count"}','project')$s$,'22023','fractional total rejected');
select pg_temp.expect_error($s$select private.validate_property_object('{"unitConfigurations":{"bhk6":{"superBuildUpArea":"100","carpetArea":"90","price":"100"}}}','{"unitConfigurations":"units"}','project')$s$,'22023','BHK outside 1–5 rejected');
select 'PASS: dynamic 1–5 BHK, repeated units, room fields, totals, legacy hydration and unit removal persist';
rollback;

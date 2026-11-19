\set ON_ERROR_STOP on
begin;
\ir ../assertions.sql
insert into auth.users(id,email) values ('79000000-0000-4000-8000-000000000002','apartment-admin@example.test');
update private.user_access set role='admin' where user_id='79000000-0000-4000-8000-000000000002';
select set_config('request.jwt.claims','{"sub":"79000000-0000-4000-8000-000000000002"}',true);
set local role authenticated;
do $$
declare payload jsonb; result jsonb; saved jsonb; code text; bedroom integer;
begin
 payload := '{"title":"Apartment project","description":"Half BHK configurations and project acreage","propertyType":"BUY","category":"NEW_PROJECT","subcategory":"NEW_PROJECT_APARTMENT","price":"6000000","area":"1000","areaUnit":"sq_ft","bedrooms":1,"bathrooms":2,"location":{"address":"Example street","city":"Bhubaneswar","state":"Odisha"},"contact":{"phone":"9776631999"},"newProjectInfo":{"projectName":"Test project","builderName":"Test builder","totalProjectArea":"5.5","totalProjectAreaUnit":"acres"},"projectPricing":{"unitConfigurations":{}}}';
 foreach bedroom in array array[1,2,3,4] loop
  code := 'bhk'||bedroom||'p5_first';
  payload := jsonb_set(payload,array['projectPricing','unitConfigurations',code],jsonb_build_object(
   'superBuildUpArea','1000','carpetArea','800','price','6000000','bedrooms',bedroom,'bathrooms',2));
 end loop;
 result := public.save_property(gen_random_uuid(),payload,'[]',null,null,gen_random_uuid());
 saved := result->'property';
 if saved#>>'{newProjectInfo,totalProjectAreaUnit}' <> 'acres' or saved#>>'{newProjectInfo,totalProjectArea}' <> '5.5' then raise exception 'Project acreage lost'; end if;
 foreach bedroom in array array[1,2,3,4] loop
  code := 'bhk'||bedroom||'p5_first';
  if saved#>>array['projectPricing','unitConfigurations',code,'bedrooms'] is distinct from bedroom::text then raise exception 'Half BHK bedroom count lost'; end if;
  if saved#>>array['projectPricing','unitConfigurations',code,'landArea'] is not null then raise exception 'Unexpected apartment land area'; end if;
 end loop;
 payload := payload #- '{projectPricing,unitConfigurations,bhk1p5_first}';
 result := public.save_property(gen_random_uuid(),payload,'[]',(saved->>'id')::uuid,(saved->>'version')::bigint,null);
 if result#>'{property,projectPricing,unitConfigurations,bhk1p5_first}' is not null or result#>'{property,projectPricing,unitConfigurations,bhk4p5_first}' is null then raise exception 'Half BHK edit lost units'; end if;
end;
$$;
reset role;
select pg_temp.expect_error($s$select private.validate_property_object('{"unitConfigurations":{"bhk5p5_bad":{"superBuildUpArea":"1000","carpetArea":"800","price":"6000000"}}}','{"unitConfigurations":"units"}','project')$s$,'22023','5.5 BHK rejected');
select pg_temp.expect_error($s$select private.validate_property_object('{"unitConfigurations":{"bhk2p5_bad":{"superBuildUpArea":"1000","carpetArea":"800","price":"6000000","bedrooms":"2.5"}}}','{"unitConfigurations":"units"}','project')$s$,'22023','fractional bedrooms rejected');
select 'PASS: half BHK configurations and project acreage survive save, read and edit; bedroom counts remain integers';
rollback;

\set ON_ERROR_STOP on
begin;
\ir ../assertions.sql

insert into auth.users(id,email,raw_user_meta_data) values
 ('40000000-0000-4000-8000-000000000001','catalog-admin@example.test','{"name":"Private staff name","phone":"1234567890"}'),
 ('40000000-0000-4000-8000-000000000002','catalog-user@example.test','{}');
update private.user_access set role='admin' where user_id='40000000-0000-4000-8000-000000000001';
insert into public.properties(property_id,property_type,category_id,subtype_code,title,description,price,area,address,city,state,listing_phone,featured,furnishing_status,property_age,posted_by)
select 'DEL-RS-'||lpad(n::text,3,'0'),'BUY',c.id,'RESALE_FLAT','Catalog '||n,'Example description',100+n+0.25,500+n+0.125,
 'Example address','Bhubaneswar','Odisha','919999999999',true,'SEMI_FURNISHED',5,'40000000-0000-4000-8000-000000000001'
from generate_series(1,120) n cross join public.categories c where c.code='RESALE';
insert into public.properties(property_id,property_type,category_id,subtype_code,title,description,price,area,address,city,state,listing_phone,status,furnishing_status,property_age)
select 'DEL-NP-'||lpad(row_number() over(order by s.code)::text,3,'0'),s.property_type,s.category_id,s.code,
 s.label,'Subtype fixture',999.99,100.125,'Other address','Cuttack','Odisha','919999999999','available','UNFURNISHED',0
from public.property_subtypes s;
update public.properties set title='Literal %_[] query' where property_id='DEL-RS-001';
update public.properties set status='sold' where property_id='DEL-RS-120';

set local role anon;
select pg_temp.assert_true((public.list_properties()->>'total')::int=138,'available catalog count');
select pg_temp.assert_true(jsonb_array_length(public.list_properties()->'properties')=12,'default page size');
select pg_temp.assert_true(jsonb_array_length(public.featured_properties()->'properties')=6,'six featured available');
select pg_temp.assert_true(jsonb_array_length(public.search_properties('Catalog')->'properties')=20,'search cap');
select pg_temp.assert_true((public.search_properties('%_[]')->>'total')::int=1,'search wildcards and regex are literal');
select pg_temp.assert_true((public.list_properties('{"page":2,"limit":100}')->>'total')::int=138 and jsonb_array_length(public.list_properties('{"page":2,"limit":100}')->'properties')=38,'pagination beyond 100');
select pg_temp.assert_true(not exists(
 select 1 from jsonb_array_elements(public.list_properties('{"page":1,"limit":100}')->'properties') a
 join jsonb_array_elements(public.list_properties('{"page":2,"limit":100}')->'properties') b on a->>'_id'=b->>'_id'
),'pages do not overlap on identical timestamps');
select pg_temp.assert_true(public.list_properties('{"page":2,"limit":100}')=public.list_properties('{"page":2,"limit":100}'),'stable page order');
select pg_temp.assert_true((public.list_properties('{"category":"missing"}')->>'total')::int=0,'unknown category cannot broaden results');
select pg_temp.assert_true((public.list_properties('{"type":"commercial","category":"buy"}')->>'total')::int=7,'commercial buy mapping');
select pg_temp.assert_true((public.list_properties('{"type":"buy","subtype":"newprojects","category":"plot"}')->>'total')::int=1,'new project plot mapping');
select pg_temp.assert_true((public.list_properties('{"type":"rent","category":"residential"}')->>'total')::int=3,'rental alias');
select pg_temp.assert_true((public.list_properties('{"furnished":"semi-furnished","propertyAge":"recent"}')->>'total')::int=119,'canonical furnishing and age boundary');
select pg_temp.assert_true((public.list_properties('{"minPrice":"101.24","maxPrice":"101.26"}')->>'total')::int=1,'decimal price comparison');
select pg_temp.assert_true((public.list_properties('{"minArea":"501.12","maxArea":"501.13"}')->>'total')::int=1,'fractional area comparison');
select pg_temp.assert_true((public.list_properties('{"q":"Subtype","location":"cutt","furnished":"unfurnished","propertyAge":"new"}')->>'total')::int=19,'combined filters across all subtypes');
select pg_temp.assert_true(not (public.list_properties()->'properties'->0 ? 'postedBy') and strpos(public.list_properties()::text,'Private staff name')=0 and strpos(public.list_properties()::text,'catalog-admin@example.test')=0,'public DTO excludes staff identity');
select pg_temp.assert_true(jsonb_typeof(public.list_properties()->'properties'->0->'price')='string','decimal API values are strings');
select pg_temp.expect_error($s$select public.list_properties('{"limit":101}')$s$,'22023','bounded page size');
select pg_temp.expect_error($s$select public.list_properties('{"page":0}')$s$,'22023','page lower bound');
select pg_temp.expect_error($s$select public.list_properties('{"minPrice":"NaN"}')$s$,'22023','nonfinite filter rejected');
select pg_temp.expect_error($s$select public.list_properties('{"minArea":"20","maxArea":"10"}')$s$,'22023','reversed range rejected');
select pg_temp.expect_error($s$select public.list_properties('{"type":"bad"}')$s$,'22023','unknown type rejected');
select pg_temp.expect_error($s$select public.list_properties('{"sql":"anything"}')$s$,'22023','unknown filter rejected');
select pg_temp.expect_error($s$select public.list_properties('{"status":"sold"}')$s$,'42501','public status filter denied');
select pg_temp.expect_error($s$select public.list_properties('{}',true)$s$,'42501','API key cannot grant staff catalog');
select pg_temp.expect_error($s$select public.search_properties(' ')$s$,'22023','empty search rejected');
select pg_temp.expect_error($s$select public.search_properties(repeat('x',201))$s$,'22023','search length bounded');
reset role;

select set_config('request.jwt.claims','{"sub":"40000000-0000-4000-8000-000000000001"}',true);
set local role authenticated;
select pg_temp.assert_true((public.list_properties('{}',true)->>'total')::int=139,'admin catalog includes sold listing');
select pg_temp.assert_true((public.list_properties('{"status":"sold"}',true)->>'total')::int=1,'staff status filtering');
select pg_temp.assert_true((select public.get_property(id)->'property'->>'status'='sold' from public.properties where status='sold'),'sold detail remains public');
reset role;
select set_config('request.jwt.claims','{"sub":"40000000-0000-4000-8000-000000000002"}',true);
set local role authenticated;
select pg_temp.expect_error($s$select public.list_properties('{}',true)$s$,'42501','ordinary account cannot use staff mode');
reset role;
select 'PASS: catalog privacy, literal search, all subtype mappings, decimal filters and paginated public/staff reads' as result;
rollback;

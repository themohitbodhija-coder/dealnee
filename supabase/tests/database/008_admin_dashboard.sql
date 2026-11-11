\set ON_ERROR_STOP on
begin;
\ir ../assertions.sql
insert into auth.users(id,email) values
 ('72000000-0000-4000-8000-000000000001','dashboard-admin@example.test'),
 ('72000000-0000-4000-8000-000000000002','dashboard-manager@example.test'),
 ('72000000-0000-4000-8000-000000000003','dashboard-user@example.test');
update private.user_access set role=case when user_id='72000000-0000-4000-8000-000000000001' then 'admin' else 'subadmin' end
 where user_id in ('72000000-0000-4000-8000-000000000001','72000000-0000-4000-8000-000000000002');
insert into public.properties(property_id,property_type,category_id,subtype_code,title,description,price,area,address,city,state,listing_phone,status,created_at)
select 'DEL-RS-'||lpad(n::text,3,'0'),'BUY',id,'RESALE_FLAT','Dashboard property '||n,'Description',1234.56,100,'Address','City','State','9999999999',
 case when n=7 then 'sold' else 'available' end,'2026-11-11T00:00:00Z'
from generate_series(1,7) n cross join public.categories where code='RESALE';
insert into public.properties(property_id,property_type,category_id,subtype_code,title,description,price,area,address,city,state,listing_phone)
select 'DEL-RS-008','BUY',id,'RESALE_FLAT','Deleted listing snapshot','Description',10,100,'Address','City','State','9999999999'
from public.categories where code='RESALE';
insert into public.inquiries(name,email,message,status,property_id,created_at)
select 'Private lead '||n,'private'||n||'@example.test','Sensitive message',case when n<3 then 'new' else 'read' end,
 (select id from public.properties where property_id='DEL-RS-008'),'2026-11-11T00:00:00Z' from generate_series(1,7) n;
delete from public.properties where property_id='DEL-RS-008';
set local role anon;
select pg_temp.expect_error('select public.get_dashboard_stats()','42501','anonymous dashboard denied');
reset role;
select set_config('request.jwt.claims','{"sub":"72000000-0000-4000-8000-000000000003"}',true);
set local role authenticated;
select pg_temp.expect_error('select public.get_dashboard_stats()','42501','ordinary account denied');
reset role;
select set_config('request.jwt.claims','{"sub":"72000000-0000-4000-8000-000000000001"}',true);
set local role authenticated;
select pg_temp.assert_true(public.get_dashboard_stats()->'stats' = '{"totalProperties":7,"totalUsers":3,"totalInquiries":7,"newInquiries":2,"totalCategories":10}'::jsonb,'admin sees all counts including sold');
select pg_temp.assert_true(jsonb_array_length(public.get_dashboard_stats()->'recentProperties')=5 and jsonb_array_length(public.get_dashboard_stats()->'recentInquiries')=5,'recent lists bounded');
select pg_temp.assert_true(public.get_dashboard_stats()->'recentInquiries'->0->'property'->>'title'='Deleted listing snapshot','deleted listing snapshot retained');
select pg_temp.assert_true(jsonb_typeof(public.get_dashboard_stats()->'recentProperties'->0->'price')='string','decimal price remains string');
select pg_temp.assert_true(not (public.get_dashboard_stats()->'recentInquiries'->0 ? 'message') and not (public.get_dashboard_stats()->'recentProperties'->0 ? 'posted_by'),'minimal recent row projections');
select pg_temp.assert_true(public.get_dashboard_stats()=public.get_dashboard_stats(),'stable ordering at tied timestamps');
select pg_temp.assert_true((public.get_dashboard_stats()->'recentProperties'->0->>'_id')=(select id::text from public.properties order by created_at desc,id desc limit 1),'deterministic recent property ordering');
reset role;
select set_config('request.jwt.claims','{"sub":"72000000-0000-4000-8000-000000000002"}',true);
set local role authenticated;
select pg_temp.assert_true(public.get_dashboard_stats()->'stats'='{}'::jsonb and not (public.get_dashboard_stats() ? 'recentInquiries'),'unprivileged staff gets no counts or leads');
reset role;
-- Each individual grant exposes only its own section, including when called directly.
do $$
declare permission text; response jsonb;
begin
  foreach permission in array array['manage_properties','manage_users','view_inquiries','manage_categories'] loop
    delete from private.user_permissions where user_id='72000000-0000-4000-8000-000000000002';
    insert into private.user_permissions values('72000000-0000-4000-8000-000000000002',permission);
    response := public.get_dashboard_stats();
    perform pg_temp.assert_true((response->'stats' ? 'totalProperties')=(permission='manage_properties'),'properties restricted');
    perform pg_temp.assert_true((response->'stats' ? 'totalUsers')=(permission='manage_users'),'users restricted');
    perform pg_temp.assert_true((response->'stats' ? 'totalInquiries')=(permission='view_inquiries'),'inquiries restricted');
    perform pg_temp.assert_true((response->'stats' ? 'newInquiries')=(permission='view_inquiries'),'new lead count restricted');
    perform pg_temp.assert_true((response->'stats' ? 'totalCategories')=(permission='manage_categories'),'categories restricted');
    perform pg_temp.assert_true((response ? 'recentProperties')=(permission='manage_properties'),'recent properties restricted');
    perform pg_temp.assert_true((response ? 'recentInquiries')=(permission='view_inquiries'),'recent inquiry PII restricted');
    if permission='manage_users' then
      perform pg_temp.assert_true(response->'stats'->>'totalUsers'='1' and response->>'userScope'='regular','user manager cannot count staff');
    else
      perform pg_temp.assert_true(strpos(response::text,'private1@example.test')=0 or permission='view_inquiries','no lead leak');
    end if;
  end loop;
end;
$$;
insert into private.user_permissions values ('72000000-0000-4000-8000-000000000002','manage_properties');
set local role authenticated;
select pg_temp.assert_true(public.get_dashboard_stats()->'stats' ?& array['totalProperties','totalCategories'] and not (public.get_dashboard_stats()->'stats' ? 'totalUsers'),'combined grant union');
reset role;
delete from private.user_permissions where user_id='72000000-0000-4000-8000-000000000002';
set local role authenticated;
select pg_temp.assert_true(public.get_dashboard_stats()->'stats'='{}'::jsonb,'revoked grants immediately redact');
reset role;
update private.user_access set active=false where user_id='72000000-0000-4000-8000-000000000002';
set local role authenticated;
select pg_temp.expect_error('select public.get_dashboard_stats()','42501','inactive staff denied');
reset role;
update private.user_access set active=true,account_state='invited' where user_id='72000000-0000-4000-8000-000000000002';
set local role authenticated;
select pg_temp.expect_error('select public.get_dashboard_stats()','42501','pending invitation denied');
reset role;
delete from auth.users where id='72000000-0000-4000-8000-000000000002';
set local role authenticated;
select pg_temp.expect_error('select public.get_dashboard_stats()','42501','deleted staff denied with stale claims');
reset role;
-- Empty collections must be actual zeroes/empty arrays for an authorized admin.
select set_config('request.jwt.claims','{"sub":"72000000-0000-4000-8000-000000000001"}',true);
delete from public.inquiries;
delete from public.properties;
select pg_temp.assert_true(public.get_dashboard_stats()->'stats'->>'totalProperties'='0' and public.get_dashboard_stats()->'recentInquiries'='[]'::jsonb,'authorized empty dataset');
select 'PASS: dashboard permission matrix, minimal DTOs, scoped user counts, live revocation and stable recent lists';
rollback;

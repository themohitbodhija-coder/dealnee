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


insert into auth.users(id,email) values
 ('71000000-0000-4000-8000-000000000001','category-manager@example.test'),
 ('71000000-0000-4000-8000-000000000002','category-user@example.test');
update private.user_access set role='subadmin' where user_id='71000000-0000-4000-8000-000000000001';
insert into private.user_permissions values ('71000000-0000-4000-8000-000000000001','manage_categories');
set local role anon;
select pg_temp.expect_error($s$select public.save_category('Denied')$s$,'42501','anonymous denied');
reset role;
select set_config('request.jwt.claims','{"sub":"71000000-0000-4000-8000-000000000002"}',true);
set local role authenticated;
select pg_temp.expect_error($s$select public.save_category('Denied')$s$,'42501','ordinary user denied');
select pg_temp.expect_error($s$select public.delete_category((select id from public.categories limit 1))$s$,'42501','ordinary delete denied');
reset role;
select set_config('request.jwt.claims','{"sub":"71000000-0000-4000-8000-000000000001"}',true);
set local role authenticated;
select public.save_category(' Custom parent ','Description','',null,'CUSTOM_PARENT');
select public.save_category('Custom child','','',null,'CUSTOM_CHILD',(select id from public.categories where code='CUSTOM_PARENT'),true);
select public.save_category('Custom grandchild','','',null,'CUSTOM_GRANDCHILD',(select id from public.categories where code='CUSTOM_CHILD'),true);
select pg_temp.assert_true((select name='Custom parent' from public.categories where code='CUSTOM_PARENT'),'trimmed name');
select pg_temp.expect_error($s$select public.save_category('CUSTOM PARENT')$s$,'23505','case insensitive duplicates');
select pg_temp.expect_error($s$select public.save_category(' ')$s$,'22023','blank name');
select pg_temp.expect_error($s$select public.save_category(repeat('x',121))$s$,'22023','name bound');
select pg_temp.expect_error($s$select public.save_category('Name',repeat('x',2001))$s$,'22023','description bound');
select pg_temp.expect_error($s$select public.save_category('Name','','',null,null,'ffffffff-ffff-4fff-8fff-ffffffffffff',true)$s$,'22023','unknown parent');
select pg_temp.expect_error($s$select public.save_category('Custom parent','','',(select id from public.categories where code='CUSTOM_PARENT'),null,(select id from public.categories where code='CUSTOM_GRANDCHILD'),true)$s$,'22023','descendant cycle');
select pg_temp.expect_error($s$select public.save_category('Custom parent','','',(select id from public.categories where code='CUSTOM_PARENT'),null,(select id from public.categories where code='CUSTOM_PARENT'),true)$s$,'22023','self cycle');
select pg_temp.expect_error($s$select public.save_category('Moved project','','',(select id from public.categories where code='NEW_PROJECT'),null,null,true)$s$,'22023','system hierarchy protected');
select public.save_category('New homes','Updated description','',(select id from public.categories where code='NEW_PROJECT'));
select pg_temp.assert_true((select parent_id=(select id from public.categories where code='BUY_PROPERTY') from public.categories where code='NEW_PROJECT'),'metadata preserves system structure');
select pg_temp.expect_error($s$select public.delete_category((select id from public.categories where code='BUY_PROPERTY'))$s$,'22023','system delete protected');
select pg_temp.expect_error($s$select public.delete_category((select id from public.categories where code='CUSTOM_PARENT'))$s$,'23503','child delete conflict');
select pg_temp.expect_error($s$update public.categories set is_system=false$s$,'42501','direct writes denied');
select pg_temp.expect_error($s$select public.save_category('Missing','','','ffffffff-ffff-4fff-8fff-ffffffffffff')$s$,'P0002','missing update');
select pg_temp.expect_error($s$select public.delete_category('ffffffff-ffff-4fff-8fff-ffffffffffff')$s$,'P0002','missing delete');
select public.save_category('Custom child renamed','','',(select id from public.categories where code='CUSTOM_CHILD'),null,null,true);
select pg_temp.assert_true((select parent_id is null from public.categories where code='CUSTOM_CHILD'),'move to root');
select public.delete_category((select id from public.categories where code='CUSTOM_PARENT'));
select public.save_category('Generated code');
select pg_temp.assert_true((select code like 'CUSTOM_%' and not is_system from public.categories where name='Generated code'),'server generated custom code');
reset role;
-- A mapped custom category cannot be removed even without property rows.
insert into public.property_subtypes(code,property_type,category_id,label)
select 'CUSTOM_TEST','BUY',id,'Custom test' from public.categories where code='CUSTOM_CHILD';
set local role authenticated;
select pg_temp.expect_error($s$select public.delete_category((select id from public.categories where code='CUSTOM_CHILD'))$s$,'23503','mapped category delete conflict');
reset role;
delete from private.user_permissions where user_id='71000000-0000-4000-8000-000000000001';
set local role authenticated;
select pg_temp.expect_error($s$select public.save_category('Revoked')$s$,'42501','live permission revocation');
reset role;
update private.user_access set active=false where user_id='71000000-0000-4000-8000-000000000001';
insert into private.user_permissions values ('71000000-0000-4000-8000-000000000001','manage_categories');
set local role authenticated;
select pg_temp.expect_error($s$select public.save_category('Inactive')$s$,'42501','inactive manager denied');
reset role;
select 'PASS: category CRUD, hierarchy, protected taxonomy, validation, conflicts and live authorization';
rollback;

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


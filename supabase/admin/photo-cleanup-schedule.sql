-- Operator-only setup, AFTER deploying photo-cleanup and configuring its secret.
-- Create Vault secrets through a secure operator flow, never paste them here:
-- dealinee_photo_cleanup_url: https://PROJECT_REF.supabase.co/functions/v1/photo-cleanup
-- dealinee_photo_scheduler_secret: same random value as PHOTO_SCHEDULER_SECRET
begin;
do $$
begin
  if not exists(select 1 from pg_extension where extname='pg_cron') or not exists(select 1 from pg_extension where extname='pg_net') then
    raise exception 'Enable pg_cron and pg_net in this Supabase project first';
  end if;
  if (select count(*) from vault.decrypted_secrets where name='dealinee_photo_cleanup_url' and decrypted_secret ~ '^https://[a-z0-9]+\.supabase\.co/functions/v1/photo-cleanup$')<>1
    or (select count(*) from vault.decrypted_secrets where name='dealinee_photo_scheduler_secret' and length(decrypted_secret)>=32)<>1 then
    raise exception 'Configure one valid cleanup URL and dedicated scheduler secret in Vault first';
  end if;
end $$;
select cron.unschedule(jobid) from cron.job where jobname='dealinee-photo-cleanup-v1';
select cron.schedule('dealinee-photo-cleanup-v1','*/5 * * * *',$job$
  select net.http_post(
    url:=(select decrypted_secret from vault.decrypted_secrets where name='dealinee_photo_cleanup_url'),
    headers:=jsonb_build_object('Content-Type','application/json','X-Photo-Scheduler-Secret',
      (select decrypted_secret from vault.decrypted_secrets where name='dealinee_photo_scheduler_secret')),
    body:='{}'::jsonb,timeout_milliseconds:=120000
  );
$job$);
commit;

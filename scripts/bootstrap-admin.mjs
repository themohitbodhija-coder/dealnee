import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const id = process.env.DEALINEE_BOOTSTRAP_USER_ID;
const email = process.env.DEALINEE_BOOTSTRAP_EMAIL;
const connection = process.env.DEALINEE_BOOTSTRAP_DATABASE_URL;
try {
  if (!id || !/^[0-9a-f-]{36}$/i.test(id) || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !connection) throw new Error('configuration');
  const url = new URL(connection);
  if (!['postgres:','postgresql:'].includes(url.protocol)) throw new Error('configuration');
  const local = ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  const sslmode = url.searchParams.get('sslmode') || (local ? 'disable' : 'verify-full');
  if (!local && sslmode !== 'verify-full') throw new Error('configuration');
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith('PG') || key.startsWith('DEALINEE_BOOTSTRAP_')) delete env[key];
  Object.assign(env,{ PGHOST:url.hostname,PGPORT:url.port || '5432',PGDATABASE:decodeURIComponent(url.pathname.slice(1)) || 'postgres',
    PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password),PGSSLMODE:sslmode,PGCONNECT_TIMEOUT:'10' });
  const result = spawnSync('psql',['-X','-q','-v','ON_ERROR_STOP=1','-v',`admin_user_id=${id}`,'-v',`admin_email=${email}`,'-f',fileURLToPath(new URL('../supabase/admin/bootstrap.sql',import.meta.url))],{ env,encoding:'utf8' });
  if (result.status !== 0) throw new Error('database');
  console.log('First admin configured. Bootstrap is now closed.');
} catch (_) {
  // Never echo a connection string, environment value or provider error.
  console.error('Bootstrap did not complete. Supply the documented company-owned account and secure database configuration; an existing admin closes this operation.');
  process.exitCode = 1;
}

import { execFile, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Never accepts a remote database URL. The native harness owns its temporary
// cluster; --supabase uses only the documented localhost development database.
const root = fileURLToPath(new URL('../', import.meta.url));
const useSupabase = process.argv.includes('--supabase');
const execFileAsync = promisify(execFile);
let temp;
let running = false;
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', ...options });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} failed: ${result.error?.message || result.stderr || result.stdout}`);
  }
  return result.stdout;
}
try {
  let connection;
  let env = { ...process.env };
  // Do not inherit connection/service settings that could redirect a local test.
  for (const key of Object.keys(env)) if (key.startsWith('PG')) delete env[key];
  if (useSupabase) {
    connection = ['--host=127.0.0.1', '--port=54322', '--username=postgres', '--dbname=postgres'];
    env.PGPASSWORD = 'postgres'; // Supabase local development default only.
  } else {
    temp = mkdtempSync('/tmp/dealinee-pg-');
    mkdirSync(path.join(temp, 'socket'));
    run('initdb', ['-D', path.join(temp, 'data'), '-U', 'postgres', '--auth-local=trust', '--auth-host=reject', '--no-locale', '--encoding=UTF8'], { env });
    run('pg_ctl', ['-D', path.join(temp, 'data'), '-l', path.join(temp, 'server.log'), '-o', `-k ${temp}/socket -c listen_addresses=''`, '-w', 'start'], { env });
    running = true;
    connection = [`--host=${temp}/socket`, '--username=postgres', '--dbname=postgres'];
    const bootstrap = readFileSync(path.join(root, 'supabase/tests/native-bootstrap.sql'), 'utf8');
    run('psql', ['-X', ...connection, '-v', 'ON_ERROR_STOP=1'], { input: bootstrap, env });
    const migrations = readdirSync(path.join(root, 'supabase/migrations')).filter(f => f.endsWith('.sql')).sort();
    for (const migration of migrations) {
      run('psql', ['-X', ...connection, '-v', 'ON_ERROR_STOP=1', '--single-transaction', '-f', `supabase/migrations/${migration}`], { env });
      console.log(`Applied ${migration}`);
    }
    run('psql', ['-X', ...connection, '-v', 'ON_ERROR_STOP=1', '-f', 'supabase/seed.sql'], { env });
  }
  for (const test of readdirSync(path.join(root, 'supabase/tests/database')).filter(f => f.endsWith('.sql')).sort()) {
    const output = run('psql', ['-X', '-A', '-t', '-q', ...connection, '-v', 'ON_ERROR_STOP=1', '-f', `supabase/tests/database/${test}`], { env });
    console.log(`${test}: ${output.split('\n').filter(line => line.startsWith('PASS:')).join('; ') || 'passed'}`);
  }
  if (!useSupabase) {
    // Each request owns a separate connection/transaction: sequential tests do
    // not exercise the race that broke the former count+1 allocator.
    const allocations = await Promise.allSettled(Array.from({ length: 24 }, () =>
      execFileAsync('psql', ['-X', '-A', '-t', '-q', ...connection, '-v', 'ON_ERROR_STOP=1', '-c', "select private.allocate_property_id('CL')"], { env })
    ));
    const failures = allocations.filter(result => result.status === 'rejected');
    if (failures.length) throw new Error(`Concurrent allocation failed: ${failures[0].reason.message}`);
    const ids = allocations.map(result => result.value.stdout.trim());
    if (new Set(ids).size !== 24 || ids.some(id => !/^DEL-CL-\d{3}$/.test(id))) {
      throw new Error('Concurrent property IDs collided or had an invalid format');
    }
    console.log('Concurrent allocation: 24 separate transactions produced 24 unique IDs.');
  }
  console.log('Database assertions passed. Test transactions were rolled back.');
  if (!useSupabase) console.log('Native tests use minimal Auth/role fixtures; full Supabase Auth/API integration remains a separate gate.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (running) {
    const stopped = spawnSync('pg_ctl', ['-D', path.join(temp, 'data'), '-m', 'immediate', '-w', 'stop'], { encoding: 'utf8' });
    if (stopped.status !== 0) {
      console.error('Could not stop temporary database; retained directory:', temp);
      temp = undefined;
      process.exitCode = 1;
    }
  }
  if (temp) rmSync(temp, { recursive: true, force: true });
}

// Isolated native PostgreSQL permission tests and real concurrent transactions.
// Never accepts any remote database/service URL.
import {spawnSync,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtempSync,mkdirSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const exec=promisify(execFile),env={...process.env};
for (const key of Object.keys(env)) if (key.startsWith('PG')) delete env[key];
const temp=mkdtempSync('/tmp/dealinee-inquiry-');mkdirSync(`${temp}/socket`);
let started=false;
const run=(command,args,options={})=>{
 const r=spawnSync(command,args,{cwd:root,env,encoding:'utf8',...options});
 if(r.error || r.status!==0) throw new Error(r.error?.message || r.stderr || r.stdout);
 return r.stdout;
};
const connection=['-X','-A','-t','-q',`--host=${temp}/socket`,'--username=postgres','--dbname=postgres','-v','ON_ERROR_STOP=1'];
const sql=query=>run('psql',[...connection,'-c',query]).trim();
const parallel=async query=>{
 const results=await Promise.all(Array.from({length:24},()=>exec('psql',[...connection,'-c',query],{cwd:root,env})));
 return results.map(r=>JSON.parse(r.stdout.trim()));
};
try {
 run('initdb',['-D',`${temp}/data`,'-U','postgres','--auth-local=trust','--auth-host=reject','--no-locale','--encoding=UTF8']);
 run('pg_ctl',['-D',`${temp}/data`,'-l',`${temp}/server.log`,'-o',`-k ${temp}/socket -c listen_addresses=''`,'-w','start']);started=true;
 run('psql',connection,{input:readFileSync(`${root}/supabase/tests/native-bootstrap.sql`,'utf8')});
 for(const file of readdirSync(`${root}/supabase/migrations`).filter(f=>f.endsWith('.sql')).sort()) run('psql',[...connection,'--single-transaction','-f',`${root}/supabase/migrations/${file}`]);
 run('psql',[...connection,'-f',`${root}/supabase/seed.sql`]);
 const assertions=run('psql',[...connection,'-f',`${root}/supabase/tests/database/006_inquiries.sql`]);
 console.log(assertions.split('\n').filter(line=>line.startsWith('PASS:')).join('\n'));
 const submissions=await parallel("set role service_role; select public.submit_verified_inquiry(repeat('a',64),gen_random_uuid(),repeat('b',64),'Lead','parallel@example.test','','Message')");
 if(submissions.filter(r=>r.accepted).length!==20 || submissions.filter(r=>r.limited).length!==4 || sql("select count(*) from public.inquiries where email='parallel@example.test'")!=='20') throw new Error('Concurrent email limit failed');
 const retries=await parallel("set role service_role; select public.submit_verified_inquiry(repeat('c',64),'83000000-0000-4000-8000-000000000001',repeat('d',64),'Lead','retry@example.test','','Message')");
 if(new Set(retries.map(r=>r.reference)).size!==1 || sql("select count(*) from public.inquiries where email='retry@example.test'")!=='1') throw new Error('Concurrent idempotency failed');
 // Stay clear of the fixed minute boundary for this burst assertion.
 if(Date.now()%60000>55000) await new Promise(resolve=>setTimeout(resolve,6000));
 const admissions=await parallel("set role service_role; select public.inquiry_admit(repeat('e',64))");
 if(admissions.filter(r=>r.allowed).length!==5) throw new Error('Concurrent IP limit failed');
 console.log('PASS: 24 concurrent email submissions accept exactly 20; 24 retries insert once; 24 IP attempts admit exactly 5.');
 console.log('Native Auth/role fixtures only; hosted gateway/browser integration remains unverified.');
} catch(error) {console.error(error.message);process.exitCode=1;}
finally {
 if(started) {try {run('pg_ctl',['-D',`${temp}/data`,'-m','immediate','-w','stop']);started=false;} catch(error){console.error(error.message);console.error('Retained test cluster directory:',temp);process.exitCode=1;}}
 if(!started) rmSync(temp,{recursive:true,force:true});
}

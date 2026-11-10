import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
// Called only by the harness with its disposable native cluster connection.
export async function testPropertyConcurrency(connection,env) {
  const actor='75000000-0000-4000-8000-000000000001';
  const run=sql=>exec('psql',['-X','-A','-t','-q',...connection,'-v','ON_ERROR_STOP=1','-c',sql],{env});
  const payload=JSON.stringify({title:'Concurrent property',description:'Concurrent save fixture',propertyType:'BUY',category:'RESALE',subcategory:'RESALE_FLAT',price:'8000000.12',area:'1200',location:{address:'Test street',city:'Test city',state:'Odisha'},contact:{phone:'9776631999'}});
  const literal=`'${payload}'::jsonb`;
  const session=`set request.jwt.claims='{"sub":"${actor}"}'; set role authenticated;`;
  await run(`insert into auth.users(id,email) values('${actor}','concurrent-property@example.test'); update private.user_access set role='subadmin' where user_id='${actor}'; insert into private.user_permissions values('${actor}','manage_properties')`);
  try {
    const create=`${session} select public.save_property('76000000-0000-4000-8000-000000000001',${literal},'[]',null,null,'77000000-0000-4000-8000-000000000001')->'property'->>'id'`;
    const results=await Promise.all([run(create),run(create)]);
    const ids=results.map(result=>result.stdout.trim().split('\n').at(-1));
    if(ids[0]!==ids[1]) throw new Error('Concurrent exact retry duplicated the listing');
    const id=ids[0];
    const update=`${session} select public.save_property(gen_random_uuid(),${literal},'[]','${id}',1)`;
    const edits=await Promise.allSettled([run(update),run(update)]);
    if(edits.filter(result=>result.status==='fulfilled').length!==1 || !edits.some(result=>result.status==='rejected' && result.reason.stderr.includes('Property changed'))) throw new Error('Concurrent stale editors did not produce one winner and one conflict');
    const changedSession=await Promise.allSettled(Array.from({length:2},()=>run(`${session} select public.save_property(gen_random_uuid(),${literal},'[]',null,null,'77000000-0000-4000-8000-000000000002')`)));
    if(changedSession.filter(result=>result.status==='fulfilled').length!==1) throw new Error('One create session produced more than one listing');
    const count=(await run(`select count(*) from public.properties where posted_by='${actor}'`)).stdout.trim();
    if(count!=='2') throw new Error('Concurrent property count is wrong');
    console.log('Concurrent property writes: exact retries create once, changed request sessions create once, and competing editors return one conflict.');
  } finally {
    await run(`delete from public.properties where posted_by='${actor}'; delete from auth.users where id='${actor}'`);
  }
}

// One request ID per exact request survives reloads and uncertain network outcomes.
// The DB additionally binds a create session to one listing, preventing duplicates
// if the browser changes fields after a timed-out create.
const pending = new Map();
function retryId(scope, body) {
  const key=`dealinee_property_write:${scope}`;
  const fingerprint=JSON.stringify(body);
  let saved=pending.get(key);
  try { saved=JSON.parse(sessionStorage.getItem(key))||saved; } catch (_) { /* memory fallback */ }
  if(saved?.fingerprint!==fingerprint) saved={fingerprint,requestId:crypto.randomUUID()};
  pending.set(key,saved);
  try { sessionStorage.setItem(key,JSON.stringify(saved)); } catch (_) { /* memory fallback */ }
  return saved.requestId;
}
export function createPropertyMutations(getClient, apiError) {
  const invoke=async (name,body)=>{
    const {data,error}=await getClient().functions.invoke(name,{body});
    if(error) {
      let detail;
      try { detail=await error.context?.json(); } catch (_) { /* provider response absent */ }
      throw apiError({status:error.context?.status||503,message:detail?.error||'Property service is unavailable. Retry the same save.'});
    }
    return {data};
  };
  const save=(id,body)=>{
    const input={...body,id:id||null};
    input.requestId=body.requestId||retryId(id||body.createSessionId,input);
    return invoke('property-save',input);
  };
  return {
    create:body=>save(null,body),
    update:(id,body)=>save(id,body),
    delete:(id,options={})=>{
      const body={id,version:options.version};
      body.requestId=options.requestId||retryId(`delete:${id}`,body);
      return invoke('property-delete',body);
    },
  };
}

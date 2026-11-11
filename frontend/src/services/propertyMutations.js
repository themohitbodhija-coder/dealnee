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
      const status = error.context?.status || 503;
      const localPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      const fallback = !error.context?.status && localPreview
        ? 'Could not reach the property service from this local preview. Try saving on the live site.'
        : 'Could not reach the property service. Check your connection and try again.';
      const message = detail?.error || detail?.message || fallback;
      throw apiError({ status, message, fieldErrors: detail?.fieldErrors || detail?.errors });
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

import {createPropertyMutations} from './propertyMutations';
const requestId='78000000-0000-4000-8000-000000000001';
beforeEach(()=>{sessionStorage.clear(); Object.defineProperty(global,'crypto',{configurable:true,value:{randomUUID:jest.fn(()=>requestId)}});});
test('save uses JSON Edge contract and preserves request ID across timeout/retry and adapter recreation',async()=>{
  const context={status:503,json:async()=>({error:'Try again'})};
  const invoke=jest.fn().mockResolvedValueOnce({error:{context}}).mockResolvedValue({data:{success:true}});
  const getClient=()=>({functions:{invoke}}); const errorFactory=error=>Object.assign(new Error(error.message),error);
  const body={property:{title:'Listing'},images:[],createSessionId:'77000000-0000-4000-8000-000000000001',version:null};
  await expect(createPropertyMutations(getClient,errorFactory).create(body)).rejects.toThrow();
  await createPropertyMutations(getClient,errorFactory).create(body);
  expect(invoke.mock.calls[0][1].body.requestId).toBe(invoke.mock.calls[1][1].body.requestId);
  expect(invoke.mock.calls[1][0]).toBe('property-save'); expect(invoke.mock.calls[1][1].body.id).toBeNull();
});
test('delete passes version and surfaces conflict',async()=>{
  const context={status:409,json:async()=>({error:'Property changed'})};
  const invoke=jest.fn().mockResolvedValue({error:{context}});
  const api=createPropertyMutations(()=>({functions:{invoke}}),error=>Object.assign(new Error(error.message),error));
  await expect(api.delete('property-id',{version:2})).rejects.toMatchObject({status:409,message:'Property changed'});
  expect(invoke.mock.calls[0][1].body.version).toBe(2);
});

test('preserves the save response message and every field error in the frontend error envelope', async () => {
  const fieldErrors = { 'location.address': 'This field is required.', 'contact.phone': 'Enter a contact number.' };
  const invoke = jest.fn().mockResolvedValue({ error: { context: { status: 400, json: async () => ({ error: 'Review the details below.', fieldErrors }) } } });
  const errorFactory = error => Object.assign(new Error(error.message), error);
  const api = createPropertyMutations(() => ({ functions: { invoke } }), errorFactory);
  await expect(api.create({ requestId })).rejects.toMatchObject({ status: 400, message: 'Review the details below.', fieldErrors });
});

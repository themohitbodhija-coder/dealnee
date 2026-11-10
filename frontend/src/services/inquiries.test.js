import { createInquiryService } from './inquiries';
const row={id:'lead-id',name:'Visitor',email:'lead@example.test',status:'new',property_id:null,property_title:'Deleted listing',property_display_id:'DEL-RS-001',created_at:'2026-11-10T00:00:00Z'};
function fixture() {
  const client={rpc:jest.fn().mockResolvedValue({data:row}),functions:{invoke:jest.fn().mockResolvedValue({data:{accepted:true,reference:'ref',email:'must-not-leak'}})}};
  const api=createInquiryService(()=>client,error=>Object.assign(new Error(error.message),error));
  return {client,api};
}
test('acknowledgment strips provider fields and invokes public Edge endpoint',async()=>{
  const {client,api}=fixture();expect(await api.create({name:'Visitor'})).toEqual({data:{accepted:true,reference:'ref'}});expect(client.functions.invoke).toHaveBeenCalledWith('submit-inquiry',{body:{name:'Visitor'}});
});
test('admin pagination, status filter and deleted-property snapshot map to existing UI',async()=>{
  const {client,api}=fixture();client.rpc.mockResolvedValue({data:{inquiries:[row],total:101,totalPages:11,page:2}});
  const result=await api.getAll({page:2,status:'new'});expect(client.rpc).toHaveBeenCalledWith('list_inquiries',{p_page:2,p_limit:10,p_status:'new'});
  expect(result.data.inquiries[0]).toMatchObject({_id:'lead-id',property:{_id:null,title:'Deleted listing',propertyId:'DEL-RS-001'},createdAt:row.created_at});
});
test('admin detail uses atomic read-mark RPC and mutations stay caller-scoped',async()=>{
  const {client,api}=fixture();await api.getById('lead-id');expect(client.rpc).toHaveBeenLastCalledWith('read_inquiry',{p_id:'lead-id'});
  await api.updateStatus('lead-id',{status:'replied'});expect(client.rpc).toHaveBeenLastCalledWith('set_inquiry_status',{p_id:'lead-id',p_status:'replied'});
  await api.delete('lead-id');expect(client.rpc).toHaveBeenLastCalledWith('delete_inquiry',{p_id:'lead-id'});
});
test('rate and permission errors remain actionable; malformed success cannot clear a form',async()=>{
  const {client,api}=fixture();client.functions.invoke.mockResolvedValue({error:{context:{status:429,json:async()=>({error:'Please wait.'})}}});
  await expect(api.create({})).rejects.toMatchObject({status:429,message:'Please wait.'});
  client.rpc.mockResolvedValue({error:{code:'42501',message:'Inquiry permission required'}});await expect(api.getAll()).rejects.toMatchObject({code:'42501'});
  client.functions.invoke.mockResolvedValue({data:{}});await expect(api.create({})).rejects.toMatchObject({status:503});
});

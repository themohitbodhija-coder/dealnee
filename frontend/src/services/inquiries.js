const dto = row => ({ ...row,_id:row.id,createdAt:row.created_at,updatedAt:row.updated_at,
  property:row.property_title ? { _id:row.property_id,title:row.property_title,propertyId:row.property_display_id } : null });
export function createInquiryService(getClient, apiError) {
  const rpc=async (name,args) => {
    const {data,error}=await getClient().rpc(name,args);
    if (error) throw apiError(error);
    return data;
  };
  return {
    async create(body) {
      const {data,error}=await getClient().functions.invoke('submit-inquiry',{body});
      if (error) {
        let detail; try { detail=await error.context?.json(); } catch (_) { /* Network/provider error. */ }
        throw apiError({status:error.context?.status || 503,message:detail?.error || 'Unable to send your inquiry. Please try again.'});
      }
      if (!data?.accepted || !data.reference) throw apiError({status:503,message:'Unable to confirm your inquiry. Please try again.'});
      return {data:{accepted:true,reference:data.reference}};
    },
    async getAll({page=1,limit=10,status}={}) {
      const result=await rpc('list_inquiries',{p_page:page,p_limit:limit,p_status:status || null});
      return {data:{...result,inquiries:result.inquiries.map(dto)}};
    },
    async getById(id) { return {data:{inquiry:dto(await rpc('read_inquiry',{p_id:id}))}}; },
    async updateStatus(id,{status}) { return {data:{inquiry:dto(await rpc('set_inquiry_status',{p_id:id,p_status:status}))}}; },
    async delete(id) { await rpc('delete_inquiry',{p_id:id}); return {data:{}}; },
  };
}

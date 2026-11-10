import React, { useCallback, useEffect, useRef, useState } from 'react';
import { inquiryService } from '../../services/api';
const message=error=>error.response?.data?.message || error.message || 'Unable to load inquiries. Please try again.';
export default function ManageInquiriesPage() {
  const [inquiries,setInquiries]=useState([]),[selected,setSelected]=useState(null);
  const [page,setPage]=useState(1),[status,setStatus]=useState(''),[totalPages,setTotalPages]=useState(0);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const sequence=useRef(0);
  const load=useCallback(async()=>{
    const seq=++sequence.current;setLoading(true);setError('');setInquiries([]);
    try {
      const {data}=await inquiryService.getAll({page,limit:10,status});
      if (sequence.current!==seq) return;
      if (page>Math.max(1,data.totalPages)) {setPage(Math.max(1,data.totalPages));return;}
      setInquiries(data.inquiries);setTotalPages(data.totalPages);
    } catch (failure) {if (sequence.current===seq) setError(message(failure));}
    finally {if (sequence.current===seq) setLoading(false);}
  },[page,status]);
  const invalidate=useCallback(()=>{sequence.current++;},[]);
  useEffect(()=>{load();return invalidate;},[load,invalidate]);
  const act=async operation=>{if (busy) return;setBusy(true);setError('');try {await operation();} catch (failure) {setError(message(failure));} finally {setBusy(false);}};
  const open=id=>act(async()=>{
    const {data}=await inquiryService.getById(id);setSelected(data.inquiry);
    setInquiries(rows=>rows.map(row=>row._id===id?data.inquiry:row));
    // Reading changes the filtered total as well as the row itself.
    if (status==='new') await load();
  });
  const change=(id,value)=>act(async()=>{await inquiryService.updateStatus(id,{status:value});await load();});
  const remove=id=>{
    if (!window.confirm('Delete this inquiry permanently?')) return;
    act(async()=>{await inquiryService.delete(id);if (selected?._id===id) setSelected(null);await load();});
  };
  return <div className="p-6">
    <h1 className="text-3xl font-bold mb-6">Manage Inquiries</h1>
    <label className="block mb-4">Status <select aria-label="Filter inquiry status" value={status} disabled={busy} onChange={e=>{setStatus(e.target.value);setPage(1);setSelected(null);}} className="border rounded p-2">
      <option value="">All</option><option value="new">New</option><option value="read">Read</option><option value="replied">Replied</option>
    </select></label>
    {error && <div role="alert" className="p-4 bg-red-100 text-red-800 mb-4">{error} <button onClick={load} disabled={busy}>Retry</button></div>}
    {loading ? <p role="status">Loading inquiries...</p> : <div className="overflow-x-auto bg-white rounded shadow"><table className="w-full text-sm">
      <thead className="bg-gray-100"><tr>{['Name','Email','Property','Status','Date','Actions'].map(label=><th key={label} className="text-left p-3">{label}</th>)}</tr></thead>
      <tbody>{inquiries.map(row=><tr key={row._id} className="border-b">
        <td className="p-3">{row.name}</td><td className="p-3">{row.email}</td><td className="p-3">{row.property?.title || 'General'}{row.property?.propertyId && <span className="block">{row.property.propertyId}</span>}</td>
        <td className="p-3"><select aria-label={`Status for ${row.name}`} value={row.status} disabled={busy} onChange={e=>change(row._id,e.target.value)}><option value="new">New</option><option value="read">Read</option><option value="replied">Replied</option></select></td>
        <td className="p-3">{new Date(row.createdAt).toLocaleDateString()}</td><td className="p-3"><button disabled={busy} onClick={()=>open(row._id)} className="text-red-700 mr-4">View</button><button disabled={busy} onClick={()=>remove(row._id)} className="text-red-700">Delete</button></td>
      </tr>)}</tbody>
    </table>{!inquiries.length && !error && <p className="p-6">No inquiries found.</p>}</div>}
    <nav aria-label="Inquiry pagination" className="flex justify-center gap-4 mt-6">
      <button disabled={loading || busy || page<=1} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page} of {Math.max(1,totalPages)}</span><button disabled={loading || busy || page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button>
    </nav>
    {selected && <div role="dialog" aria-modal="true" aria-label="Inquiry details" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded p-6 max-w-lg w-full max-h-screen overflow-auto">
      <h2 className="text-2xl font-bold mb-4">Inquiry Details</h2><dl className="space-y-3">{[['Name',selected.name],['Email',selected.email],['Phone',selected.phone || '-'],['Property',selected.property?.title || 'General'],['Message',selected.message]].map(([label,value])=><div key={label}><dt className="text-gray-600">{label}</dt><dd className="whitespace-pre-wrap break-words">{value}</dd></div>)}</dl>
      <button autoFocus className="mt-6 bg-red-600 text-white px-4 py-2 rounded" onClick={()=>setSelected(null)}>Close</button>
    </div></div>}
  </div>;
}

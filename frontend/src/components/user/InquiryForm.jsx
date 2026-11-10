import React, { useRef, useState } from 'react';
import { inquiryService } from '../../services/api';
import { usesSupabase } from '../../lib/backend';
const empty={name:'',email:'',phone:'',message:'',website:''};
export default function InquiryForm({propertyId,submitLabel='Send Message'}) {
  const [fields,setFields]=useState(empty);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
  const started=useRef(Date.now()),request=useRef(null),submitting=useRef(false);
  const change=e=>{setFields({...fields,[e.target.name]:e.target.value});request.current=null;setSuccess('');};
  const submit=async e=>{
    e.preventDefault(); if (submitting.current) return;
    submitting.current=true;setBusy(true);setError('');setSuccess('');
    try {
      const {website,...data}=fields;
      if (usesSupabase && !request.current) request.current=window.crypto.randomUUID();
      await inquiryService.create({...data,...(propertyId && {property:propertyId}),...(usesSupabase && {
        website,startedAt:started.current,idempotencyKey:request.current,
      })});
      setSuccess('Thank you. Your inquiry has been received.');setFields(empty);request.current=null;started.current=Date.now();
    } catch (failure) { setError(failure.response?.data?.message || failure.message || 'Unable to send your inquiry. Please try again.'); }
    finally {setBusy(false);submitting.current=false;}
  };
  const cls='w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500';
  return <form onSubmit={submit} className="space-y-4" aria-label="Inquiry form">
    {success && <p role="status" className="p-4 bg-green-100 text-green-800 rounded">{success}</p>}
    {error && <p role="alert" className="p-4 bg-red-100 text-red-800 rounded">{error}</p>}
    <fieldset disabled={busy} className="space-y-4">
      <label className="block">Name<input className={cls} name="name" autoComplete="name" value={fields.name} onChange={change} maxLength={120} required /></label>
      <label className="block">Email<input className={cls} name="email" type="email" autoComplete="email" value={fields.email} onChange={change} maxLength={254} required /></label>
      <label className="block">Phone (optional)<input className={cls} name="phone" type="tel" autoComplete="tel" value={fields.phone} onChange={change} maxLength={32} /></label>
      <label className="block">Message<textarea className={cls} name="message" rows={5} value={fields.message} onChange={change} maxLength={5000} required /></label>
      {usesSupabase && <div aria-hidden="true" style={{position:'absolute',left:'-10000px'}}><label>Website<input name="website" value={fields.website} onChange={change} autoComplete="off" tabIndex={-1} maxLength={200} /></label></div>}
      <button type="submit" disabled={busy} className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400">{busy?'Sending...':submitLabel}</button>
    </fieldset>
  </form>;
}

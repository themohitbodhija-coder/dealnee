import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/api';

const GRANTS = [
  ['manage_properties','Manage properties'],['manage_categories','Manage categories'],
  ['manage_users','Manage regular users'],['view_inquiries','Read, update and delete inquiries'],
];
const emptyForm = () => ({ name:'',email:'',role:'user',permissions:[],active:true,password:'' });
export default function SupabaseManageUsersPage() {
  const { user:actor } = useAuth();
  const isAdmin = actor?.role === 'admin';
  const [users,setUsers] = useState([]);
  const [operations,setOperations] = useState([]);
  const [page,setPage] = useState(1);
  const [pages,setPages] = useState(1);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  const [dialog,setDialog] = useState(null);
  const [form,setForm] = useState(emptyForm);
  const request = useRef(null);
  const sequence = useRef(0);
  const load = useCallback(async () => {
    const current = ++sequence.current;
    setLoading(true);
    try {
      const [accounts,pending] = await Promise.all([adminService.getAllUsers({ page,limit:10 }),adminService.getOperations()]);
      if (current !== sequence.current) return;
      setUsers(accounts.data.users); setPages(Math.max(1,accounts.data.pages)); setOperations(pending.data.operations);
    } catch (failure) { if (current === sequence.current) setError(failure.message || 'Unable to load accounts.'); }
    finally { if (current === sequence.current) setLoading(false); }
  },[page]);
  useEffect(() => { load(); },[load]);
  const close = () => { setDialog(null); setForm(emptyForm()); request.current=null; };
  const open = (kind,target) => {
    setError(''); setMessage(''); request.current=crypto.randomUUID();
    setForm(kind === 'access' ? { ...emptyForm(),...target,password:'' } : emptyForm());
    setDialog({ kind,target });
  };
  const needPassword = dialog && (dialog.kind === 'access' || (dialog.kind === 'invite' && form.role !== 'user') ||
    (dialog.kind === 'delete' && dialog.target.role !== 'user') || (dialog.kind === 'retry' && dialog.target.needsPassword));
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (dialog.kind === 'invite') {
        await adminService.createUser({ name:form.name,email:form.email,role:form.role,permissions:form.permissions,requestId:request.current,...(needPassword && { password:form.password }) });
        setMessage('Invitation sent. Access activates after the recipient confirms and chooses a password.');
      } else if (dialog.kind === 'access') {
        await adminService.updateUserAccess(dialog.target.id,{ role:form.role,permissions:form.permissions,active:form.active,version:dialog.target.version,password:form.password });
        setMessage('Account access updated.');
      } else if (dialog.kind === 'delete') {
        await adminService.deleteUser(dialog.target.id,{ requestId:request.current,...(needPassword && { password:form.password }) });
        setMessage('Account deleted.');
      } else {
        await adminService.retryOperation(dialog.target.id,form.password);
        setMessage('Pending action completed.');
      }
      close(); await load();
    } catch (failure) {
      setError(failure.message || 'Unable to complete the change.');
      setForm(previous => ({ ...previous,password:'' }));
      await load();
    } finally { setBusy(false); }
  };
  const toggle = permission => setForm(previous => ({ ...previous,permissions:previous.permissions.includes(permission) ? previous.permissions.filter(p => p !== permission) : [...previous.permissions,permission] }));
  return <div className="p-8">
    <div className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">Manage Users</h1>
      <button onClick={() => open('invite')} className="bg-red-600 text-white rounded px-4 py-2 inline-flex gap-2 items-center"><FaPlus /> Invite user</button></div>
    {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}
    {message && <p role="status" className="text-green-700 mb-4">{message}</p>}
    {loading ? <p role="status">Loading accounts…</p> : <div className="bg-white rounded shadow overflow-x-auto"><table className="w-full text-sm">
      <thead className="bg-gray-100"><tr>{['Name','Email','Phone','Role','Permissions','Status','Actions'].map(label => <th key={label} className="text-left p-4">{label}</th>)}</tr></thead>
      <tbody>{users.map(account => <tr key={account.id} className="border-t">
        <td className="p-4">{account.name}</td><td className="p-4">{account.email}</td><td className="p-4">{account.phone || '—'}</td>
        <td className="p-4">{account.role}</td><td className="p-4">{account.permissions.join(', ') || '—'}</td>
        <td className="p-4">{account.accountState !== 'ready' ? account.accountState : account.active ? 'Active' : 'Disabled'}</td>
        <td className="p-4"><div className="flex gap-4">{isAdmin && account.id !== actor.id && account.accountState === 'ready' &&
          <button aria-label={`Edit access for ${account.name}`} onClick={() => open('access',account)} className="text-red-600"><FaEdit /></button>}
          {account.id !== actor.id && account.accountState !== 'deleting' &&
          <button aria-label={`Delete ${account.name}`} onClick={() => open('delete',account)} className="text-red-600"><FaTrash /></button>}</div></td>
      </tr>)}</tbody></table>{!users.length && <p className="p-4">No accounts found.</p>}</div>}
    {pages>1 && <nav aria-label="User pages" className="flex items-center gap-4 mt-6">
      <button disabled={loading || page===1} onClick={() => setPage(p => p-1)} className="border rounded px-4 py-2">Previous</button>
      <span>Page {page} of {pages}</span><button disabled={loading || page>=pages} onClick={() => setPage(p => p+1)} className="border rounded px-4 py-2">Next</button></nav>}
    {operations.length>0 && <section className="mt-8"><h2 className="text-xl font-bold mb-4">Pending actions</h2>
      <ul className="space-y-3">{operations.map(operation => <li key={operation.id} className="border rounded p-4 flex justify-between gap-4">
        <span>{operation.kind === 'invite' ? 'Invitation' : 'Deletion'}: {operation.email || operation.targetId}</span>
        <button disabled={busy} onClick={() => open('retry',operation)} className="text-red-600">Retry</button></li>)}</ul></section>}
    {dialog && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><div role="dialog" aria-modal="true" aria-labelledby="account-dialog-title" className="bg-white rounded-lg p-6 max-w-xl w-full">
      <h2 id="account-dialog-title" className="text-xl font-bold mb-4">{({ invite:'Invite user',access:'Edit account access',delete:'Delete account',retry:'Retry pending action' })[dialog.kind]}</h2>
      {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        {dialog.kind === 'invite' && <><label className="block">Full name<input required maxLength={120} value={form.name} onChange={e => setForm(p => ({ ...p,name:e.target.value }))} className="border p-3 rounded w-full" /></label>
          <label className="block">Email<input type="email" required maxLength={254} value={form.email} onChange={e => setForm(p => ({ ...p,email:e.target.value }))} className="border p-3 rounded w-full" /></label></>}
        {['invite','access'].includes(dialog.kind) && <>
          <label className="block">Role<select aria-label="Role" disabled={!isAdmin} value={form.role} onChange={e => setForm(p => ({ ...p,role:e.target.value,permissions:[] }))} className="border p-3 rounded w-full">
            <option value="user">User</option>{isAdmin && <><option value="subadmin">Sub-admin</option><option value="admin">Admin</option></>}
          </select></label>
          {form.role === 'subadmin' && <fieldset><legend className="font-semibold">Permissions</legend>{GRANTS.map(([key,label]) => <label key={key} className="flex gap-2 mt-2">
            <input type="checkbox" checked={form.permissions.includes(key)} onChange={() => toggle(key)} />{label}</label>)}</fieldset>}
          {dialog.kind === 'access' && <label className="flex gap-2"><input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p,active:e.target.checked }))} />Account active</label>}
        </>}
        {dialog.kind === 'delete' && <p>Delete {dialog.target.name}? Their access will be revoked. Existing listings and inquiries will be retained.</p>}
        {needPassword && <label className="block">Confirm your admin password<input type="password" required autoComplete="current-password" maxLength={1024} value={form.password} onChange={e => setForm(p => ({ ...p,password:e.target.value }))} className="border p-3 rounded w-full" /></label>}
        <div className="flex justify-end gap-4"><button type="button" disabled={busy} onClick={close}>Cancel</button>
          <button disabled={busy} className="bg-red-600 text-white rounded px-4 py-2">{busy ? 'Working…' : dialog.kind === 'invite' ? 'Send invitation' : dialog.kind === 'delete' ? 'Delete account' : 'Confirm'}</button></div>
      </form>
    </div></div>}
  </div>;
}

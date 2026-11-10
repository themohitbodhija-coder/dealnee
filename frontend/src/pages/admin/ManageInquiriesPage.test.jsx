import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import ManageInquiriesPage from './ManageInquiriesPage';
import {inquiryService} from '../../services/api';
jest.mock('../../services/api',()=>({inquiryService:{getAll:jest.fn(),getById:jest.fn(),updateStatus:jest.fn(),delete:jest.fn()}}));
const lead={_id:'lead',name:'Visitor',email:'lead@example.test',message:'<img src=x onerror=bad()>',status:'new',createdAt:'2026-11-10T00:00:00Z',property:{title:'Deleted listing',propertyId:'DEL-RS-001'}};
let container,root;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);jest.clearAllMocks();inquiryService.getAll.mockResolvedValue({data:{inquiries:[lead],totalPages:12}});inquiryService.getById.mockResolvedValue({data:{inquiry:{...lead,status:'read'}}});inquiryService.delete.mockResolvedValue({data:{}});inquiryService.updateStatus.mockResolvedValue({data:{}});});
afterEach(()=>{act(()=>root.unmount());container.remove();});
const render=()=>act(async()=>root.render(<ManageInquiriesPage/>));
const button=text=>Array.from(container.querySelectorAll('button')).find(b=>b.textContent===text);
const click=text=>act(async()=>button(text).dispatchEvent(new MouseEvent('click',{bubbles:true})));
test('admin pagination fetches next page without rendering every page button',async()=>{
  await render();await click('Next');expect(inquiryService.getAll).toHaveBeenLastCalledWith({page:2,limit:10,status:''});expect(container.textContent).toContain('Page 2 of 12');
});
test('view fetches read-marked detail, preserves snapshot and renders message as text',async()=>{
  await render();await click('View');expect(inquiryService.getById).toHaveBeenCalledWith('lead');expect(container.querySelector('[role="dialog"]').textContent).toContain('<img src=x');expect(container.querySelector('[role="dialog"] img')).toBeNull();expect(container.textContent).toContain('Deleted listing');expect(container.querySelector('tbody select').value).toBe('read');await click('Close');expect(container.querySelector('[role="dialog"]')).toBeNull();
});
test('filter resets pagination and status changes refetch the filtered server list',async()=>{
  await render();await click('Next');await act(async()=>{const select=container.querySelector('[aria-label="Filter inquiry status"]');select.value='new';select.dispatchEvent(new Event('change',{bubbles:true}));});expect(inquiryService.getAll).toHaveBeenLastCalledWith({page:1,limit:10,status:'new'});
  await act(async()=>{const select=container.querySelector('tbody select');select.value='replied';select.dispatchEvent(new Event('change',{bubbles:true}));});expect(inquiryService.updateStatus).toHaveBeenCalledWith('lead',{status:'replied'});expect(inquiryService.getAll).toHaveBeenLastCalledWith({page:1,limit:10,status:'new'});
});
test('delete refetches server count; failures display actionable errors',async()=>{
  window.confirm=jest.fn(()=>true);await render();await click('Delete');expect(inquiryService.delete).toHaveBeenCalledWith('lead');expect(inquiryService.getAll).toHaveBeenCalledTimes(2);
  inquiryService.getAll.mockRejectedValue(new Error('Inquiry permission required'));await click('Next');expect(container.querySelector('[role="alert"]').textContent).toContain('Inquiry permission required');expect(container.querySelector('tbody tr')).toBeNull();
});

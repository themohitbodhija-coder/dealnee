import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import InquiryForm from './InquiryForm';
import { inquiryService } from '../../services/api';
jest.mock('../../services/api',()=>({inquiryService:{create:jest.fn()}}));
jest.mock('../../lib/backend',()=>({usesSupabase:true}));
let container,root;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);jest.clearAllMocks();Object.defineProperty(window,'crypto',{configurable:true,value:{randomUUID:()=> '10000000-0000-4000-8000-000000000001'}});});
afterEach(()=>{act(()=>root.unmount());container.remove();});
async function render() {await act(async()=>root.render(<InquiryForm propertyId="property-id" />));}
async function fill(name,value) {await act(async()=>{const input=container.querySelector(`[name="${name}"]`);const setter=Object.getOwnPropertyDescriptor(input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set;setter.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));});}
async function submit() {await act(async()=>container.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));}
test('pending submission disables controls and prevents duplicate requests; acknowledgment clears fields',async()=>{
  let resolve;inquiryService.create.mockImplementation(()=>new Promise(done=>{resolve=done;}));await render();await fill('name','Visitor');await fill('email','visitor@example.test');await fill('message','Hello');await submit();await submit();
  expect(container.querySelector('fieldset').disabled).toBe(true);expect(inquiryService.create).toHaveBeenCalledTimes(1);expect(inquiryService.create.mock.calls[0][0]).toMatchObject({property:'property-id',website:'',idempotencyKey:expect.any(String),startedAt:expect.any(Number)});
  await act(async()=>resolve({data:{accepted:true,reference:'ref'}}));expect(container.querySelector('[role="status"]').textContent).toContain('received');expect(container.querySelector('[name="name"]').value).toBe('');
});
test('failure preserves fields and idempotency key for retry, renders safe text inline',async()=>{
  inquiryService.create.mockRejectedValue(new Error('<script>Service unavailable</script>'));await render();await fill('name','Visitor');await fill('message','Hello');await submit();const first=inquiryService.create.mock.calls[0][0];
  expect(container.querySelector('[name="name"]').value).toBe('Visitor');expect(container.querySelector('[role="alert"]').textContent).toContain('<script>');expect(container.querySelector('script')).toBeNull();await submit();expect(inquiryService.create.mock.calls[1][0].idempotencyKey).toBe(first.idempotencyKey);
});

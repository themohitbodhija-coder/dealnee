import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ManageCategoriesPage from './ManageCategoriesPage';
import { categoryService } from '../../services/api';
jest.mock('../../lib/backend', () => ({ usesSupabase: true }));
jest.mock('../../services/api', () => ({ categoryService: { getAll: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() } }));
const categories = [
  { _id: 'root', name: 'Buy', parentCategory: 'none', is_system: true },
  { _id: 'project', name: 'Projects', parentCategory: 'root', is_system: true },
  { _id: 'leaf', name: 'Custom child', parentCategory: 'project' },
];
let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  jest.clearAllMocks(); window.alert = jest.fn(); window.confirm = jest.fn(() => true);
  categoryService.getAll.mockResolvedValue({ data: { categories } });
  categoryService.create.mockResolvedValue({}); categoryService.update.mockResolvedValue({}); categoryService.delete.mockResolvedValue({});
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = () => act(async () => root.render(<ManageCategoriesPage />));
const click = button => act(async () => button.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const button = text => [...container.querySelectorAll('button')].find(b => b.textContent.includes(text));
const change = (selector, value) => act(async () => {
  const input = container.querySelector(selector);
  Object.getOwnPropertyDescriptor(input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value').set.call(input, value);
  input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
});
const submit = () => act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
test('renders nested hierarchy by IDs and protects built-in deletion', async () => {
  await render();
  // Expand the second level to reveal a grandchild.
  const row = [...container.querySelectorAll('p')].find(p => p.textContent === 'Projects').closest('.flex.items-center.space-x-3');
  await click(row.querySelector('button'));
  expect(container.textContent).toContain('Custom child');
  expect(container.querySelector('[title="Built-in categories cannot be deleted"]').disabled).toBe(true);
  expect(button('Delete All')).toBeUndefined();
});
test('creates using a nested parent ID and refreshes the tree', async () => {
  await render(); await click(button('Add Category'));
  await change('#category-name', 'New child'); await change('#category-parent', 'project'); await submit();
  expect(categoryService.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'New child', parentCategory: 'project' }));
  expect(categoryService.getAll).toHaveBeenCalledTimes(2);
});
test('system edit fixes parent selection and keeps server errors visible with the form', async () => {
  await render(); await click(container.querySelector('[title="Edit"]'));
  expect(container.querySelector('#category-parent').disabled).toBe(true);
  categoryService.update.mockRejectedValue(new Error('Category management permission required'));
  await submit();
  expect(container.querySelector('[role="alert"]').textContent).toContain('Category management permission required');
  expect(container.querySelector('form')).not.toBeNull();
});
test('failed initial fetch displays an error instead of silently appearing empty', async () => {
  categoryService.getAll.mockRejectedValue(new Error('Offline')); await render();
  expect(container.querySelector('[role="alert"]').textContent).toBe('Offline');
});

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import FilterBar from './FilterBar';

test('hides the advanced filters until opened and starts each group collapsed', () => {
  const previousActEnvironment = global.IS_REACT_ACT_ENVIRONMENT;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  try {
    act(() => root.render(<FilterBar onFilterChange={jest.fn()} />));
    const toggle = container.querySelector('button[aria-controls]');
    const panel = document.getElementById(toggle.getAttribute('aria-controls'));
    const groups = Array.from(panel.querySelectorAll('button[aria-expanded]'));

    expect(toggle.textContent).toBe('Advanced Filters');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(panel.hidden).toBe(true);

    act(() => toggle.click());
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);
    expect(groups.map(group => group.textContent)).toEqual([
      '💰 Price & Location', '🏠 Property Details', '📐 Super Built-up Area',
    ]);
    expect(groups.every(group => group.getAttribute('aria-expanded') === 'false')).toBe(true);
    expect(panel.querySelector('input, select')).toBeNull();

    act(() => groups[0].click());
    expect(groups[0].getAttribute('aria-expanded')).toBe('true');
    expect(panel.querySelector('input[name="minPrice"]')).not.toBeNull();

    act(() => toggle.click());
    expect(panel.hidden).toBe(true);
    act(() => toggle.click());
    expect(panel.hidden).toBe(false);
    expect(groups.every(group => group.getAttribute('aria-expanded') === 'false')).toBe(true);
  } finally {
    act(() => root.unmount());
    container.remove();
    global.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  }
});

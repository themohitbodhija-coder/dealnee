import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import RouteScroll from './RouteScroll';

test('resets scroll for pages and listing views while respecting section links', () => {
  const previousActEnvironment = global.IS_REACT_ACT_ENVIRONMENT;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const previousScrollIntoView = HTMLElement.prototype.scrollIntoView;
  const scrollIntoView = jest.fn(function () {
    expect(this.id).toBe('information');
  });
  HTMLElement.prototype.scrollIntoView = scrollIntoView;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const follow = path => act(() => container.querySelector(`a[href="${path}"]`).click());

  try {
    act(() => root.render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RouteScroll />
        <Link to="/properties?type=buy">Buy</Link>
        <Link to="/properties?type=rent">Rent</Link>
        <Link to="/privacy-policy#information">Privacy</Link>
        <Routes>
          <Route path="/" element={<h1>Home</h1>} />
          <Route path="/properties" element={<h1>Listings</h1>} />
          <Route path="/privacy-policy" element={<section id="information">Information</section>} />
        </Routes>
      </MemoryRouter>
    ));
    scrollTo.mockClear();

    follow('/properties?type=buy');
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);

    follow('/properties?type=rent');
    expect(scrollTo).toHaveBeenCalledTimes(2);

    follow('/privacy-policy#information');
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledTimes(2);
  } finally {
    act(() => root.unmount());
    container.remove();
    scrollTo.mockRestore();
    HTMLElement.prototype.scrollIntoView = previousScrollIntoView;
    global.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  }
});

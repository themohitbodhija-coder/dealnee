import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteScroll() {
  const { pathname, search, hash } = useLocation();

  useLayoutEffect(() => {
    const section = hash && document.getElementById(hash.slice(1));
    if (section) section.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, search, hash]);

  return null;
}

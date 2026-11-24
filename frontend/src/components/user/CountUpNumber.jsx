import React, { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '../../hooks/useMediaPreferences';

export default function CountUpNumber({ value }) {
  const element = useRef(null);
  const [count, setCount] = useState(0);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const canAnimate = typeof IntersectionObserver !== 'undefined';
  const finalLabel = `${value.toLocaleString('en-IN')}+`;

  useEffect(() => {
    if (reducedMotion || !canAnimate) return undefined;
    let frame;
    let startedAt;
    const animate = timestamp => {
      if (startedAt === undefined) startedAt = timestamp;
      const progress = Math.min((timestamp - startedAt) / 1800, 1);
      const eased = 1 - (1 - progress) ** 3;
      setCount(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      frame = requestAnimationFrame(animate);
    }, { threshold: 0.5 });
    observer.observe(element.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, reducedMotion, canAnimate]);

  return <strong ref={element} aria-label={finalLabel}>
    <span aria-hidden="true">{reducedMotion || !canAnimate ? finalLabel : `${count.toLocaleString('en-IN')}+`}</span>
  </strong>;
}

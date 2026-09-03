import { useEffect, useRef, useState } from 'react';

function formatNum(n) {
  n = Math.round(n * 10) / 10;
  if (n % 1 !== 0) return n.toFixed(1);
  return Math.round(n).toLocaleString();
}

/* Mirrors initCounters()/animateCounter() in js/main.js as a component:
   <Counter target={12000} suffix="+" /> */
export default function Counter({ target, suffix = '' }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState('0');
  const animatedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || animatedRef.current) return;
          animatedRef.current = true;
          const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (prefersReduced) {
            setDisplay(formatNum(target) + suffix);
            observer.unobserve(el);
            return;
          }
          const duration = 1400;
          let start = null;
          const step = (ts) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(formatNum(target * eased) + suffix);
            if (progress < 1) requestAnimationFrame(step);
            else setDisplay(formatNum(target) + suffix);
          };
          requestAnimationFrame(step);
          observer.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, suffix]);

  return <span ref={ref}>{display}</span>;
}

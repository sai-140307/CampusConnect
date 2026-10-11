import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
  as?: 'div' | 'section';
  className?: string;
  children: React.ReactNode;
}

/**
 * Fades content in once, the first time it scrolls into view. Content is
 * visible by default, so it still shows without JavaScript, without
 * IntersectionObserver, and for people who prefer reduced motion.
 */
export const Reveal: React.FC<RevealProps> = ({ as = 'div', className = '', children }) => {
  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<'idle' | 'hidden' | 'shown'>('idle');

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    // Already on screen at load: leave it alone.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    setState('hidden');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState('shown');
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as as any;
  return (
    <Tag ref={ref} className={`cc-reveal ${state === 'hidden' ? 'is-hidden' : ''} ${state === 'shown' ? 'is-shown' : ''} ${className}`}>
      {children}
    </Tag>
  );
};

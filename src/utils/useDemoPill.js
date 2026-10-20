import { useState, useEffect } from 'react';

/**
 * Hook to manage demo pill visibility across all screens.
 * Hidden by default for clean screenshots and compact headers.
 * Revealed only when:
 * 1. URL contains ?demo=1
 * 2. User presses Ctrl+Shift+D (or Cmd+Shift+D on Mac)
 * Persisted in sessionStorage across page navigations.
 */
export function useDemoPill() {
  const [showDemoPill, setShowDemoPill] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('demo') === '1') {
          sessionStorage.setItem('bitebox_show_demo_pill', 'true');
          return true;
        }
        return sessionStorage.getItem('bitebox_show_demo_pill') === 'true';
      }
    } catch {}
    return false;
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+D or Cmd+Shift+D
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setShowDemoPill(prev => {
          const next = !prev;
          try {
            sessionStorage.setItem('bitebox_show_demo_pill', next ? 'true' : 'false');
          } catch {}
          window.dispatchEvent(new CustomEvent('bitebox:demo-pill-toggle', { detail: next }));
          return next;
        });
      }
    };

    const handleCustomToggle = (e) => {
      if (typeof e.detail === 'boolean') {
        setShowDemoPill(e.detail);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('bitebox:demo-pill-toggle', handleCustomToggle);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('bitebox:demo-pill-toggle', handleCustomToggle);
    };
  }, []);

  return showDemoPill;
}

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
          return true;
        }
        if (params.get('demo') === '0') {
          sessionStorage.removeItem('bitebox_demo_pill_hotkey');
          sessionStorage.removeItem('bitebox_show_demo_pill');
          return false;
        }
        // Only show if user explicitly toggled it via Ctrl+Shift+D in this session
        return sessionStorage.getItem('bitebox_demo_pill_hotkey') === 'true';
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
            sessionStorage.setItem('bitebox_demo_pill_hotkey', next ? 'true' : 'false');
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

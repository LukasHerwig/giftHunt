import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { canPeek, loadState, mischiefRoute, peekLeft, recordPeek, saveState } from '@/lib/mischief';
import { useCanPlay } from '@/lib/playful';
import { RosettenPeek } from './Rosetten';

/**
 * Wraps a card. Now and then Rosetten peeks over its top edge, behind the card, never taking a click.
 * Mouse: when the pointer enters the card. Touch: when the card scrolls into view.
 */
export const Peek = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const allowed = useCanPlay() && mischiefRoute(pathname);
  const wrapper = useRef<HTMLDivElement>(null);
  const [showing, setShowing] = useState<{ left: number; look: number } | null>(null);
  const timer = useRef<number>();

  const tryPeek = useCallback(() => {
    if (!allowed || showing) return;
    const now = Date.now();
    const state = loadState(sessionStorage);
    if (!canPeek(state, now, Math.random)) return;
    saveState(sessionStorage, recordPeek(state, now));
    setShowing({ left: peekLeft(Math.random()), look: Math.random() * 2 - 1 });
    timer.current = window.setTimeout(() => setShowing(null), 1400);
  }, [allowed, showing]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    const el = wrapper.current;
    if (!allowed || !el || !window.matchMedia('(hover: none)').matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) tryPeek();
      },
      { threshold: 0.9 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [allowed, tryPeek]);

  return (
    <div ref={wrapper} className="relative" onPointerEnter={(event) => event.pointerType === 'mouse' && tryPeek()}>
      {showing && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full z-0 overflow-hidden"
          style={{ left: `min(${showing.left}%, calc(100% - 132px))`, width: 120, height: 50, marginBottom: -1 }}>
          <div className="rs-peek">
            <RosettenPeek look={showing.look} />
          </div>
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

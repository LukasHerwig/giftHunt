import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { canRun, loadState, mischiefRoute, recordRun, saveState } from '@/lib/mischief';
import { useCanPlay } from '@/lib/playful';
import { RosettenRun } from './Rosetten';

const RUN_MS = 6000;
const CHECK_MS = 15_000;

/** One instance in the app shell: now and then a small Rosetten runs along the bottom on the calm screens. */
export const RosettenRunner = () => {
  const { pathname } = useLocation();
  const canPlay = useCanPlay();
  const [run, setRun] = useState<{ id: number; flip: boolean } | null>(null);
  const arrivedAt = useRef(Date.now());

  useEffect(() => {
    arrivedAt.current = Date.now();
    setRun(null);
  }, [pathname]);

  useEffect(() => {
    if (!canPlay || !mischiefRoute(pathname) || window.matchMedia('(hover: none)').matches) return;
    let clear: number | undefined;
    const check = window.setInterval(() => {
      const now = Date.now();
      const state = loadState(sessionStorage);
      if (!canRun(state, now, now - arrivedAt.current) || Math.random() > 0.5) return;
      saveState(sessionStorage, recordRun(state, now));
      setRun({ id: now, flip: Math.random() < 0.5 });
      clear = window.setTimeout(() => setRun(null), RUN_MS);
    }, CHECK_MS);
    return () => {
      window.clearInterval(check);
      window.clearTimeout(clear);
    };
  }, [canPlay, pathname]);

  if (!run) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 z-40 overflow-hidden"
      style={{ bottom: 'calc(6px + env(safe-area-inset-bottom))', height: 96, transform: run.flip ? 'scaleX(-1)' : undefined }}>
      <div key={run.id} className="rs-runner absolute bottom-0 left-0">
        <RosettenRun />
      </div>
    </div>
  );
};

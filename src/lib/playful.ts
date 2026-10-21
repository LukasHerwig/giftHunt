import { useEffect, useState, useSyncExternalStore } from 'react';

const KEY = 'gifthunt-playful';
const listeners = new Set<() => void>();

export const getPlayful = (): boolean => {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
};

const setPlayful = (on: boolean) => {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* blocked storage: the switch then only lasts for this page */
  }
  listeners.forEach((notify) => notify());
};

const subscribe = (notify: () => void) => {
  listeners.add(notify);
  return () => void listeners.delete(notify);
};

/** The "Lekfull maskot" preference, on by default. */
export const usePlayful = (): [boolean, (on: boolean) => void] => [
  useSyncExternalStore(subscribe, getPlayful, () => true),
  setPlayful,
];

const useMedia = (query: string): boolean => {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
};

const useTabVisible = (): boolean => {
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible');
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return visible;
};

/** Anything that moves for fun asks this first. */
export const useCanPlay = (): boolean => {
  const [playful] = usePlayful();
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const visible = useTabVisible();
  return playful && !reduced && visible;
};

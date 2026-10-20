/** What this device remembers about the giver: their name and what they took. */
export interface MemoryStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const NAME_KEY = 'gifthunt.giver.name';
const claimsKey = (token: string) => `gifthunt.giver.claims.${token}`;

const defaultStore = (): MemoryStore | null => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // storage blocked: the page works without it
  }
};

export const loadGiverName = (store: MemoryStore | null = defaultStore()): string => {
  try {
    return store?.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
};

export const saveGiverName = (name: string, store: MemoryStore | null = defaultStore()): void => {
  try {
    store?.setItem(NAME_KEY, name);
  } catch {
    // storage full or blocked: nothing to do
  }
};

export const loadClaimedItemIds = (
  token: string,
  store: MemoryStore | null = defaultStore(),
): string[] => {
  try {
    const raw = store?.getItem(claimsKey(token));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
};

export const rememberClaimedItem = (
  token: string,
  itemId: string,
  store: MemoryStore | null = defaultStore(),
): void => {
  try {
    const ids = loadClaimedItemIds(token, store);
    if (!ids.includes(itemId)) {
      store?.setItem(claimsKey(token), JSON.stringify([...ids, itemId]));
    }
  } catch {
    // storage full or blocked: nothing to do
  }
};

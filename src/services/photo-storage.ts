import { clear, createStore, del, get, keys, set, type UseStore } from 'idb-keyval';
import type { PhotoSlotKey } from '@/domain/types';

/**
 * As fotos ficam no IndexedDB (Blob): localStorage tem ~5 MB e não comporta imagens.
 * O Zustand guarda só os metadados; aqui fica o binário.
 * Sem IndexedDB (navegação privada em alguns navegadores), cai para memória.
 */

interface PhotoBackend {
  readonly persistent: boolean;
  get: (key: string) => Promise<Blob | undefined>;
  set: (key: string, blob: Blob) => Promise<void>;
  del: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  keys: () => Promise<string[]>;
}

function createIndexedDbBackend(store: UseStore): PhotoBackend {
  return {
    persistent: true,
    get: (key) => get<Blob>(key, store),
    set: (key, blob) => set(key, blob, store),
    del: (key) => del(key, store),
    clear: () => clear(store),
    keys: async () => (await keys(store)).map(String),
  };
}

function createMemoryBackend(): PhotoBackend {
  const map = new Map<string, Blob>();
  return {
    persistent: false,
    get: (key) => Promise.resolve(map.get(key)),
    set: (key, blob) => {
      map.set(key, blob);
      return Promise.resolve();
    },
    del: (key) => {
      map.delete(key);
      return Promise.resolve();
    },
    clear: () => {
      map.clear();
      return Promise.resolve();
    },
    keys: () => Promise.resolve([...map.keys()]),
  };
}

let backendPromise: Promise<PhotoBackend> | null = null;

function resolveBackend(): Promise<PhotoBackend> {
  backendPromise ??= (async () => {
    if (typeof indexedDB === 'undefined') return createMemoryBackend();
    try {
      const backend = createIndexedDbBackend(createStore('fox-oem-plus-studio', 'photos'));
      await backend.keys();
      return backend;
    } catch (error) {
      console.warn('[fox-oem-studio] IndexedDB indisponível; fotos ficarão só nesta sessão.', error);
      return createMemoryBackend();
    }
  })();
  return backendPromise;
}

export const photoStorage = {
  async save(key: PhotoSlotKey, blob: Blob): Promise<void> {
    const backend = await resolveBackend();
    await backend.set(key, blob);
  },

  async load(key: PhotoSlotKey): Promise<Blob | null> {
    const backend = await resolveBackend();
    return (await backend.get(key)) ?? null;
  },

  async remove(key: PhotoSlotKey): Promise<void> {
    const backend = await resolveBackend();
    await backend.del(key);
  },

  async clearAll(): Promise<void> {
    const backend = await resolveBackend();
    await backend.clear();
  },

  async listKeys(): Promise<string[]> {
    const backend = await resolveBackend();
    return backend.keys();
  },

  async isPersistent(): Promise<boolean> {
    const backend = await resolveBackend();
    return backend.persistent;
  },
};

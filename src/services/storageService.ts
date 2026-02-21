import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface MuqriDB extends DBSchema {
  surahCache: {
    key: number;
    value: {
      surahNumber: number;
      data: unknown;
      cachedAt: number;
    };
  };
  userPrefs: {
    key: string;
    value: unknown;
  };
}

let dbPromise: Promise<IDBPDatabase<MuqriDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MuqriDB>('muqri-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('surahCache')) {
          db.createObjectStore('surahCache', { keyPath: 'surahNumber' });
        }
        if (!db.objectStoreNames.contains('userPrefs')) {
          db.createObjectStore('userPrefs');
        }
      },
    });
  }
  return dbPromise;
}

export async function cacheSurah(surahNumber: number, data: unknown): Promise<void> {
  const db = await getDB();
  await db.put('surahCache', { surahNumber, data, cachedAt: Date.now() });
}

export async function getCachedSurah(surahNumber: number): Promise<unknown | null> {
  const db = await getDB();
  const entry = await db.get('surahCache', surahNumber);
  return entry?.data ?? null;
}

export async function setPref(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('userPrefs', value, key);
}

export async function getPref<T = unknown>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return (await db.get('userPrefs', key)) as T | undefined;
}

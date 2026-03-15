import { openDB } from 'idb';

const DB_NAME = 'worldcolide';
const STORE_NAME = 'saves';
const DB_VERSION = 1;

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function saveToIndexedDB(key: string, state: object): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, state, key);
}

export async function loadFromIndexedDB(key: string): Promise<object | null> {
  const db = await getDb();
  return ((await db.get(STORE_NAME, key)) as object) ?? null;
}

/**
 * Multi-slot IndexedDB storage layer.
 * 3 save slots + 1 shadow backup per slot.
 * Replaces old single-key indexeddb-adapter.ts.
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { SaveEnvelope, SaveSlotMetadata } from './save-types';

const DB_NAME = 'worldcolide';
const DB_VERSION = 2;
const SLOTS_STORE = 'save_slots';
const BACKUPS_STORE = 'backups';

let dbPromise: Promise<IDBPDatabase> | null = null;

/** Open (or create) the IndexedDB with v2 schema migration */
function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, tx) {
        // v1 -> v2: create new stores, migrate old data
        if (oldVersion < 2) {
          // Create new object stores
          if (!db.objectStoreNames.contains(SLOTS_STORE)) {
            db.createObjectStore(SLOTS_STORE, { keyPath: 'metadata.slotId' });
          }
          if (!db.objectStoreNames.contains(BACKUPS_STORE)) {
            db.createObjectStore(BACKUPS_STORE, { keyPath: 'metadata.slotId' });
          }

          // Migrate old single-slot data to slot 1, then delete old store
          if (db.objectStoreNames.contains('saves')) {
            const oldStore = tx.objectStore('saves');
            oldStore.get('primary').then((oldData) => {
              if (oldData) {
                const slotsStore = tx.objectStore(SLOTS_STORE);
                // Wrap raw state in SaveEnvelope if needed
                const envelope: SaveEnvelope = oldData.version
                  ? oldData
                  : {
                      version: 1,
                      savedAt: Date.now(),
                      metadata: {
                        slotId: 1,
                        guildName: (oldData as Record<string, unknown>).guildName || 'Unnamed',
                        guildLevel: (oldData as Record<string, unknown>).guildLevel || 1,
                        playTimeMs: 0,
                        founderName: ((oldData as Record<string, unknown>).founder as Record<string, unknown>)?.name || 'Unknown',
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                      },
                      gameState: oldData,
                    };
                envelope.metadata.slotId = 1;
                slotsStore.put(envelope);
              }
              // Delete old store after migration completes
              db.deleteObjectStore('saves');
            });
          }
        }
      },
    });
  }
  return dbPromise;
}

/** Save envelope to slot with atomic backup */
export async function saveSlot(slotId: number, envelope: SaveEnvelope): Promise<void> {
  const db = await getDb();
  const tx = db.transaction([SLOTS_STORE, BACKUPS_STORE], 'readwrite');
  const saved = { ...envelope, metadata: { ...envelope.metadata, slotId } };
  tx.objectStore(SLOTS_STORE).put(saved);
  tx.objectStore(BACKUPS_STORE).put(structuredClone(saved));
  await tx.done;
}

/** Load envelope from a slot */
export async function loadSlot(slotId: number): Promise<SaveEnvelope | null> {
  try {
    const db = await getDb();
    const result = await db.get(SLOTS_STORE, slotId);
    return (result as SaveEnvelope) ?? null;
  } catch {
    return null;
  }
}

/** Delete a slot and its backup */
export async function deleteSlot(slotId: number): Promise<void> {
  const db = await getDb();
  const tx = db.transaction([SLOTS_STORE, BACKUPS_STORE], 'readwrite');
  tx.objectStore(SLOTS_STORE).delete(slotId);
  tx.objectStore(BACKUPS_STORE).delete(slotId);
  await tx.done;
}

/** List metadata for all 3 slots (null = empty) */
export async function listSlots(): Promise<(SaveSlotMetadata | null)[]> {
  try {
    const db = await getDb();
    const results: (SaveSlotMetadata | null)[] = [null, null, null];
    const all = await db.getAll(SLOTS_STORE);
    for (const envelope of all as SaveEnvelope[]) {
      const idx = envelope.metadata.slotId - 1;
      if (idx >= 0 && idx < 3) {
        results[idx] = envelope.metadata;
      }
    }
    return results;
  } catch {
    return [null, null, null];
  }
}

/** Load backup envelope for a slot */
export async function loadBackup(slotId: number): Promise<SaveEnvelope | null> {
  try {
    const db = await getDb();
    const result = await db.get(BACKUPS_STORE, slotId);
    return (result as SaveEnvelope) ?? null;
  } catch {
    return null;
  }
}

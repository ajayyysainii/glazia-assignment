import type { CanvasShape } from "@/components/canvas";
import type { CanvasViewport } from "./types";

/**
 * Local persistence for people who aren't signed in.
 *
 * IndexedDB rather than localStorage, for two reasons specific to a canvas:
 * a board is unbounded (pen strokes keep every sampled point, so a long
 * session runs to megabytes) and localStorage's ~5MB cap throws
 * QuotaExceededError mid-draw; and localStorage writes are synchronous, so
 * every autosave would block the main thread while serializing. IndexedDB is
 * async and stores structured objects with no JSON round-trip.
 */

const DB_NAME = "glazia";
const DB_VERSION = 1;
const STORE = "drafts";
const DRAFT_KEY = "guest";

export type GuestDraft = {
  shapes: CanvasShape[];
  viewport: CanvasViewport;
  updatedAt: number;
};

let dbPromise: Promise<IDBDatabase | null> | null = null;

/** Resolves null instead of throwing: storage can be disabled or blocked. */
function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);

      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) {
          request.result.createObjectStore(STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null);
        try {
          const tx = db.transaction(STORE, mode);
          const request = run(tx.objectStore(STORE));
          request.onsuccess = () => resolve(request.result ?? null);
          request.onerror = () => resolve(null);
          tx.onabort = () => resolve(null);
        } catch {
          resolve(null);
        }
      }),
  );
}

/** Returns false when the draft could not be stored, so callers can warn. */
export async function saveGuestDraft(draft: GuestDraft): Promise<boolean> {
  const result = await runTransaction("readwrite", (store) =>
    // structuredClone handles the shape objects directly — no JSON step.
    store.put(draft, DRAFT_KEY) as IDBRequest<IDBValidKey>,
  );
  return result !== null;
}

export async function loadGuestDraft(): Promise<GuestDraft | null> {
  return runTransaction<GuestDraft>("readonly", (store) =>
    store.get(DRAFT_KEY),
  );
}

export async function clearGuestDraft(): Promise<void> {
  await runTransaction("readwrite", (store) => store.delete(DRAFT_KEY));
}

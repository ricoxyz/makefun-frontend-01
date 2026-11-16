// make.fun API client with caching, deduplication, and IndexedDB persistence

const API = 'https://make.fun/api';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const DB_NAME = 'makefun-cache';
const DB_VERSION = 1;
const STORE_NAME = 'responses';

let dbPromise = null;
const inFlight = new Map();

function getDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function getCached(key) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => {
      const entry = req.result;
      if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
        resolve(entry.data);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => resolve(null);
  });
}

async function setCached(key, data) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ data, timestamp: Date.now() }, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function fetchWithCache(path, options = {}) {
  const key = path;
  const cached = await getCached(key);
  if (cached && !options.forceFresh) {
    return cached;
  }

  // Deduplicate in-flight requests
  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  const promise = (async () => {
    try {
      const res = await fetch(API + path, {
        headers: { 'Accept': 'application/json' },
        ...options
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      await setCached(key, data);
      return data;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

export const getBounties = (forceFresh = false) =>
  fetchWithCache('/competitions?status=open&activity=times', { forceFresh });

export const getBounty = (slug, forceFresh = false) =>
  fetchWithCache(`/competitions/${encodeURIComponent(slug)}`, { forceFresh });

export const getLeaderboard = (slug, forceFresh = false) =>
  fetchWithCache(`/competitions/${encodeURIComponent(slug)}/leaderboard`, { forceFresh });

export const getProfile = (handle, forceFresh = false) =>
  fetchWithCache(`/profiles/${encodeURIComponent(handle)}`, { forceFresh });

// Clear all cached data
export async function clearCache() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Get cache size estimate
export async function getCacheInfo() {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.count();
    req.onsuccess = () => resolve({ entries: req.result });
  });
}
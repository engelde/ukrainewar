import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Persistent cache layer with tiered TTLs.
 *
 * Production (Cloudflare): Uses KV via the CACHE binding.
 * Development (Node.js):   Uses file-based JSON cache in .cache/ directory.
 *
 * Each cache entry stores { data, timestamp, ttl } so consumers can
 * decide whether to serve stale data while refreshing in the background.
 */

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

// ---------------------------------------------------------------------------
// File-based cache (development)
// ---------------------------------------------------------------------------

const CACHE_DIR = join(process.cwd(), ".cache");

function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function filePath(key: string): string {
  // Sanitise key for filesystem
  return join(CACHE_DIR, `${key.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`);
}

function fileGet<T>(key: string): CacheEntry<T> | null {
  try {
    const fp = filePath(key);
    if (!existsSync(fp)) return null;
    const raw = readFileSync(fp, "utf-8");
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

function fileSet<T>(key: string, entry: CacheEntry<T>): void {
  try {
    ensureCacheDir();
    writeFileSync(filePath(key), JSON.stringify(entry));
  } catch (err) {
    console.error(`[cache] File write failed for ${key}:`, err);
  }
}

// ---------------------------------------------------------------------------
// Cloudflare KV cache (production)
// ---------------------------------------------------------------------------

// KVNamespace-like interface (avoids @cloudflare/workers-types dependency in main app)
interface KVLike {
  get(key: string, type: "text"): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

function getKV(): KVLike | null {
  try {
    // In OpenNext/Cloudflare, env bindings are available via globalThis
    // biome-ignore lint/suspicious/noExplicitAny: runtime-injected binding
    const kv = (globalThis as any).__env__?.CACHE || (globalThis as any).CACHE;
    return kv || null;
  } catch {
    return null;
  }
}

async function kvGet<T>(key: string): Promise<CacheEntry<T> | null> {
  const kv = getKV();
  if (!kv) return null;
  try {
    const raw = await kv.get(key, "text");
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

async function kvSet<T>(key: string, entry: CacheEntry<T>): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  try {
    await kv.put(key, JSON.stringify(entry), {
      expirationTtl: entry.ttl * 3,
    });
  } catch (err) {
    console.error(`[cache] KV write failed for ${key}:`, err);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read from persistent cache. Returns the entry with metadata (timestamp, ttl)
 * so callers can decide whether to serve stale data.
 */
export async function cacheGet<T>(key: string): Promise<CacheEntry<T> | null> {
  // Try KV first (production), fall back to file (dev)
  const kvEntry = await kvGet<T>(key);
  if (kvEntry) return kvEntry;
  return fileGet<T>(key);
}

/**
 * Write to persistent cache with the given TTL (in seconds).
 */
export async function cacheSet<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl: ttlSeconds,
  };

  // Write to both layers — file always works, KV only in production
  fileSet(key, entry);
  await kvSet(key, entry);
}

/**
 * Check if a cache entry is still fresh (within its TTL).
 */
export function isFresh(entry: CacheEntry | null): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < entry.ttl * 1000;
}

/**
 * Check if a cache entry is stale but still usable (within 3x its TTL).
 * Stale data can be served while a background refresh happens.
 */
export function isUsableStale(entry: CacheEntry | null): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < entry.ttl * 3 * 1000;
}

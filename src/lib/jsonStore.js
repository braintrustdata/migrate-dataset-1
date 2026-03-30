import fs from 'fs/promises';
import { join } from 'path';

// Atomic write: serialize → write .tmp → rename (POSIX atomic)
export async function writeJSON(filePath, data) {
  const tmp = filePath + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, filePath);
}

export async function readJSON(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Per-key serialization lock to prevent lost updates on concurrent writes
const locks = new Map();

export async function withLock(key, fn) {
  const prev = locks.get(key) || Promise.resolve();
  let resolve;
  const next = new Promise(r => { resolve = r; });
  locks.set(key, next);
  try {
    await prev;
    return await fn();
  } finally {
    resolve();
    // Clean up lock entry if it's still ours
    if (locks.get(key) === next) locks.delete(key);
  }
}

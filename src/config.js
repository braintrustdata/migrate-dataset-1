import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

export const PORT = parseInt(process.env.PORT || '3000');

// Allow DATA_DIR override for test isolation
export const DATA_DIR = process.env.DATA_DIR
  ? resolve(process.env.DATA_DIR)
  : join(ROOT, 'data');

export const PUBLIC_DIR = join(ROOT, 'public');
export const PAGE_SIZE = 12;
export const CHUNK_SIZE = 1024 * 1024; // 1MB
export const MAX_UPLOAD_SIZE = 4 * 1024 * 1024 * 1024; // 4GB
export const VIDEOS_DIR = join(DATA_DIR, 'videos');
export const COMMENTS_DIR = join(DATA_DIR, 'comments');
export const CHANNELS_DIR = join(DATA_DIR, 'channels');
export const INDEX_FILE = join(DATA_DIR, 'index.json');

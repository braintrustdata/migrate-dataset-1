import { execSync } from 'child_process';
import fs from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

function colorFromId(id) {
  const hash = crypto.createHash('sha256').update(id).digest('hex');
  return '#' + hash.slice(0, 6);
}

function svgPlaceholder(title, videoId) {
  const color = colorFromId(videoId);
  const letter = (title || 'V').trim().charAt(0).toUpperCase();
  // Determine text color based on background brightness
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const textColor = brightness > 128 ? '#111111' : '#ffffff';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
  <rect width="320" height="180" fill="${color}"/>
  <circle cx="160" cy="90" r="36" fill="rgba(0,0,0,0.35)"/>
  <polygon points="150,74 150,106 182,90" fill="${textColor}" opacity="0.9"/>
  <text x="160" y="155" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" fill="${textColor}" opacity="0.8">${escapeXml(letter)}</text>
</svg>`;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function generateThumbnail(videoPath, videoDir, title, videoId) {
  const jpgPath = join(videoDir, 'thumbnail.jpg');
  const svgPath = join(videoDir, 'thumbnail.svg');

  // Try ffmpeg first
  try {
    execSync(`ffmpeg -y -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf scale=320:180 "${jpgPath}" 2>/dev/null`, {
      timeout: 15000,
    });
    // Verify file was created and has content
    const stat = await fs.stat(jpgPath);
    if (stat.size > 0) return '.jpg';
  } catch {
    // ffmpeg not available or failed — use SVG placeholder
  }

  await fs.writeFile(svgPath, svgPlaceholder(title, videoId), 'utf8');
  return '.svg';
}

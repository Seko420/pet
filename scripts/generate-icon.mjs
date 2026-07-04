/**
 * Generates the app icon (apps/desktop/build/icon.png, 512x512) without any
 * image dependencies: pixels are drawn in a buffer and encoded as PNG via
 * zlib. Re-run with: node scripts/generate-icon.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SIZE = 512;
const px = new Uint8Array(SIZE * SIZE * 4);

function put(x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  px[i] = r;
  px[i + 1] = g;
  px[i + 2] = b;
  px[i + 3] = a;
}

// --- rounded-rect background with vertical gradient (forge violet)
const RADIUS = 100;
const insideRoundedRect = (x, y) => {
  const min = 16;
  const max = SIZE - 16;
  if (x < min || x > max || y < min || y > max) return false;
  const cx = x < min + RADIUS ? min + RADIUS : x > max - RADIUS ? max - RADIUS : x;
  const cy = y < min + RADIUS ? min + RADIUS : y > max - RADIUS ? max - RADIUS : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= RADIUS ** 2 || (x >= min + RADIUS && x <= max - RADIUS) || (y >= min + RADIUS && y <= max - RADIUS)
    ? (x - cx) ** 2 + (y - cy) ** 2 <= RADIUS ** 2 || ((x >= min + RADIUS && x <= max - RADIUS) || (y >= min + RADIUS && y <= max - RADIUS))
    : false;
};

const top = [126, 110, 255];
const bottom = [66, 48, 190];
for (let y = 0; y < SIZE; y++) {
  const t = y / SIZE;
  const r = Math.round(top[0] + (bottom[0] - top[0]) * t);
  const g = Math.round(top[1] + (bottom[1] - top[1]) * t);
  const b = Math.round(top[2] + (bottom[2] - top[2]) * t);
  for (let x = 0; x < SIZE; x++) {
    if (insideRoundedRect(x, y)) put(x, y, r, g, b, 255);
  }
}

// --- white hammer silhouette (simple, bold, readable at 32px)
const white = (x, y) => put(x, y, 250, 250, 255, 255);
const fillRect = (x0, y0, x1, y1, fn = white) => {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) fn(x, y);
};
const fillRoundRect = (x0, y0, x1, y1, r, fn = white) => {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const cx = x < x0 + r ? x0 + r : x > x1 - r ? x1 - r : x;
      const cy = y < y0 + r ? y0 + r : y > y1 - r ? y1 - r : y;
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r ** 2 || (x >= x0 + r && x <= x1 - r) || (y >= y0 + r && y <= y1 - r)) fn(x, y);
    }
  }
};

// Hammer head (horizontal block) + handle (vertical) + anvil base line
fillRoundRect(136, 140, 376, 232, 26); // head
fillRoundRect(232, 232, 280, 398, 16); // handle
fillRoundRect(150, 398, 362, 426, 12); // base / anvil hint

// Spark (diamond) top-right
const sparkCx = 396;
const sparkCy = 118;
const sparkR = 34;
for (let dy = -sparkR; dy <= sparkR; dy++) {
  for (let dx = -sparkR; dx <= sparkR; dx++) {
    if (Math.abs(dx) + Math.abs(dy) <= sparkR) put(sparkCx + dx, sparkCy + dy, 255, 214, 92, 255);
  }
}

// --- PNG encoding
function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
const scanlines = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  scanlines[y * (SIZE * 4 + 1)] = 0; // filter: none
  Buffer.from(px.buffer, y * SIZE * 4, SIZE * 4).copy(scanlines, y * (SIZE * 4 + 1) + 1);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(scanlines, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, '..', 'apps', 'desktop', 'build', 'icon.png');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, png);
console.log(`Icon geschrieben: ${target} (${png.length} Bytes)`);

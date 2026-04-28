const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

function createPNG(size, draw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // RGBA

  const raw = [];
  for (let y = 0; y < size; y++) {
    raw.push(0);
    for (let x = 0; x < size; x++) raw.push(...draw(x, y, size));
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.from(raw))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// indigo-500 background + white 2×2 grid cells
function draw(x, y, size) {
  const BG = [99, 102, 241, 255];
  const FG = [255, 255, 255, 255];

  const p = Math.max(2, Math.round(size * 0.14));
  const g = Math.max(1, Math.round(size * 0.07));
  const inner = size - p * 2;
  const cell = Math.floor((inner - g) / 2);

  const lx = x - p;
  const ly = y - p;
  if (lx < 0 || ly < 0 || lx >= inner || ly >= inner) return BG;

  const inCellX = lx < cell || lx >= cell + g + cell - (lx >= cell + g ? 0 : 0);
  const cx = lx < cell ? 0 : lx >= cell + g ? 1 : -1;
  const cy = ly < cell ? 0 : ly >= cell + g ? 1 : -1;

  return (cx >= 0 && cy >= 0) ? FG : BG;
}

const outDir = path.join(__dirname, 'extension');
for (const size of [16, 48, 128]) {
  fs.writeFileSync(path.join(outDir, `icon${size}.png`), createPNG(size, draw));
  console.log(`✓ icon${size}.png`);
}

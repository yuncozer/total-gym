const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');

async function createIcon(size, filename) {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#0a0a0a"/>
      <g transform="translate(${size * 0.15}, ${size * 0.15})">
        <rect x="${size * 0.1}" y="${size * 0.55}" width="${size * 0.5}" height="${size * 0.15}" rx="${size * 0.05}" fill="#eab308"/>
        <rect x="${size * 0.1}" y="${size * 0.55}" width="${size * 0.5}" height="${size * 0.15}" rx="${size * 0.05}" fill="#eab308"/>
        <circle cx="${size * 0.4}" cy="${size * 0.15}" r="${size * 0.18}" fill="#eab308"/>
        <circle cx="${size * 0.4}" cy="${size * 0.62}" r="${size * 0.18}" fill="#eab308"/>
        <rect x="${size * 0.2}" y="${size * 0.2}" width="${size * 0.4}" height="${size * 0.35}" rx="${size * 0.03}" fill="#27272a"/>
        <text x="${size * 0.4}" y="${size * 0.45}" font-family="Arial Black, sans-serif" font-size="${size * 0.2}" font-weight="bold" fill="#eab308" text-anchor="middle">GYM</text>
      </g>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(path.join(publicDir, filename));
  
  console.log(`Created ${filename}`);
}

async function main() {
  await createIcon(192, 'icon-192.png');
  await createIcon(512, 'icon-512.png');
  console.log('PWA icons created successfully!');
}

main().catch(console.error);
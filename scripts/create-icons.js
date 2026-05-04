const sharp = require('sharp');
const path = require('path');

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

async function createOGImage() {
  const width = 1200;
  const height = 630;
  const size = 400;
  
  // OG Image design - larger dumbbell centered
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a0a0a"/>
          <stop offset="100%" style="stop-color:#18181b"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      
      <!-- Dumbbell icon -->
      <g transform="translate(${width/2 - 160}, ${height/2 - 150})">
        <!-- Left weight -->
        <rect x="0" y="140" width="60" height="100" rx="10" fill="#eab308"/>
        <!-- Bar -->
        <rect x="60" y="165" width="200" height="30" rx="5" fill="#eab308"/>
        <!-- Right weight -->
        <rect x="260" y="140" width="60" height="100" rx="10" fill="#eab308"/>
        <rect x="270" y="155" width="40" height="70" rx="5" fill="#ca9a04"/>
        
        <!-- TG text -->
        <text x="130" y="320" font-family="Arial Black, sans-serif" font-size="140" font-weight="bold" fill="#eab308" text-anchor="middle">TOTAL GYM</text>
      </g>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));
  
  console.log('Created og-image.png');
}

async function main() {
  await createIcon(192, 'icon-192.png');
  await createIcon(512, 'icon-512.png');
  await createOGImage();
  console.log('All PWA and OG images created successfully!');
}

main().catch(console.error);
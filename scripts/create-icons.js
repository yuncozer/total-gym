const sharp = require('sharp');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const logoPath = path.join(publicDir, 'logo.png');

async function createPwaIcon(size, filename) {
  await sharp(logoPath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 10, g: 10, b: 10, alpha: 1 }
    })
    .png()
    .toFile(path.join(publicDir, filename));
  
  console.log(`Created ${filename}`);
}

async function createOGImage() {
  const width = 1200;
  const height = 630;
  
  await sharp(logoPath)
    .resize(width, height, {
      fit: 'contain',
      background: { r: 10, g: 10, b: 10, alpha: 1 }
    })
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));
  
  console.log('Created og-image.png');
}

async function main() {
  // Create PWA icons with logo image (192x192 and 512x512)
  await createPwaIcon(192, 'icon-192.png');
  await createPwaIcon(512, 'icon-512.png');
  
  // Create apple-touch-icon with logo (180x180)
  await createPwaIcon(180, 'apple-touch-icon.png');
  
  // Create OG Image
  await createOGImage();
  
  console.log('All PWA and OG images created from logo.png!');
}

main().catch(console.error);
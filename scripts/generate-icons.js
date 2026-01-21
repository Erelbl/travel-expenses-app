const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const sourceImage = path.join(__dirname, '../public/brand/app-icon-source.png');
  const appDir = path.join(__dirname, '../app');

  // Ensure brand directory exists
  const brandDir = path.join(__dirname, '../public/brand');
  if (!fs.existsSync(brandDir)) {
    fs.mkdirSync(brandDir, { recursive: true });
  }

  // Generate app/icon.png (512x512)
  await sharp(sourceImage)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(appDir, 'icon.png'));

  // Generate app/apple-icon.png (180x180)
  await sharp(sourceImage)
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(appDir, 'apple-icon.png'));

  // Generate favicons for ICO (16x16 and 32x32)
  const favicon16Buffer = await sharp(sourceImage)
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const favicon32Buffer = await sharp(sourceImage)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Save as PNG for favicon (browsers support PNG favicons)
  await sharp(sourceImage)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(appDir, 'favicon.ico'));

  console.log('✓ Generated app/icon.png (512x512)');
  console.log('✓ Generated app/apple-icon.png (180x180)');
  console.log('✓ Generated app/favicon.ico (32x32)');
}

generateIcons().catch(console.error);


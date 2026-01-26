import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const sourceIcon = join(projectRoot, 'public', 'brand', 'app-icon-source.png');

const icons = [
  { name: 'icon-192.png', size: 192, path: 'public/icons' },
  { name: 'icon-512.png', size: 512, path: 'public/icons' },
  { name: 'apple-touch-icon.png', size: 180, path: 'public' },
  { name: 'icon.png', size: 192, path: 'app' }, // Next.js app icon
  { name: 'apple-icon.png', size: 180, path: 'app' }, // Next.js apple icon
];

async function generateIcons() {
  console.log('📱 Generating app icons from source...');
  
  // Read source image
  const sourceBuffer = await readFile(sourceIcon);
  
  // Ensure directories exist
  await mkdir(join(projectRoot, 'public', 'icons'), { recursive: true });
  
  // Generate each icon size
  for (const icon of icons) {
    const outputPath = join(projectRoot, icon.path, icon.name);
    
    await sharp(sourceBuffer)
      .resize(icon.size, icon.size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Generated ${icon.name} (${icon.size}x${icon.size})`);
  }
  
  // Generate favicon.ico (using 32x32 size, which is standard)
  const faviconPath = join(projectRoot, 'app', 'favicon.ico');
  await sharp(sourceBuffer)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toFormat('png')
    .toFile(faviconPath);
  
  console.log('✅ Generated favicon.ico (32x32)');
  
  console.log('\n🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);


const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const pngToIco = require('png-to-ico');
const sharp = require('sharp');

async function main() {
  const rootDir = path.join(__dirname, '..');
  const sourcePng = path.join(rootDir, 'icon.png');
  const buildDir = path.join(rootDir, 'build');
  const outputIco = path.join(buildDir, 'icon.ico');
  const tempDir = path.join(buildDir, '.icon-temp');
  const iconSizes = [16, 24, 32, 48, 64, 128, 256];

  if (!fs.existsSync(sourcePng)) {
    throw new Error(`Source icon file is missing: ${sourcePng}`);
  }

  await fsp.mkdir(buildDir, { recursive: true });
  await fsp.mkdir(tempDir, { recursive: true });

  // Remove transparent margins so Windows desktop icon uses more visible area.
  const trimmedBuffer = await sharp(sourcePng)
    .trim()
    .png()
    .toBuffer();

  const pngVariants = [];
  for (const size of iconSizes) {
    const targetPng = path.join(tempDir, `icon-${size}.png`);
    await sharp(trimmedBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(targetPng);
    pngVariants.push(targetPng);
  }

  const icoBuffer = await pngToIco(pngVariants);
  await fsp.writeFile(outputIco, icoBuffer);
  await fsp.rm(tempDir, { recursive: true, force: true });
  console.log(`[icon] generated ${outputIco}`);
}

main().catch((error) => {
  console.error('[icon] failed to generate .ico', error);
  process.exit(1);
});

const fs = require('node:fs');
const path = require('node:path');
const rcedit = require('rcedit');

module.exports = async (context) => {
  if (context.electronPlatformName !== 'win32') return;

  const appOutDir = context.appOutDir;
  const productFilename = context.packager?.appInfo?.productFilename || 'KonLauncher';
  const exePath = path.join(appOutDir, `${productFilename}.exe`);
  const iconPath = path.join(context.packager.projectDir, 'build', 'icon.ico');
  const version = context.packager?.appInfo?.version || '0.0.0';

  if (!fs.existsSync(exePath)) {
    throw new Error(`[afterPack] Missing executable: ${exePath}`);
  }
  if (!fs.existsSync(iconPath)) {
    throw new Error(`[afterPack] Missing icon: ${iconPath}`);
  }

  await rcedit(exePath, {
    icon: iconPath,
    'file-version': version,
    'product-version': version,
    'version-string': {
      CompanyName: 'KonLauncher',
      FileDescription: 'KonLauncher',
      ProductName: 'KonLauncher',
      InternalName: productFilename,
      OriginalFilename: `${productFilename}.exe`
    }
  });

  console.log(`[afterPack] patched ${exePath}`);
};

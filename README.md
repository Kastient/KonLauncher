# KonLauncher

Electron + React Minecraft launcher with:

- offline nickname launch flow
- animated background atmosphere (`stars`, `rain`, `snow`) with default `stars`
- NSIS installer build target
- auto-update hooks via `electron-updater`

## Development

```bash
npm install
npm run dev:app
```

## Build

- `npm run build:exe` -> Windows NSIS installer
- `npm run build:portable` -> Windows portable build
- `npm run build:dist` -> NSIS + portable

## Visual Effects

In launcher settings you can switch background atmosphere between:

- `Stars` (default)
- `Rain`
- `Snow`

Selection is stored in launcher state.

## Auto Update

KonLauncher uses `electron-updater` with **GitHub Releases** as update source.
Updater checks for updates automatically on start in production mode.

### Release flow

1. Bump app version in `package.json` (for example `1.0.18`).
2. Create and push matching git tag (`v1.0.18`).
3. GitHub Actions workflow builds NSIS installer and publishes release assets.

Required assets in each GitHub release:

- `KonLauncher-<version>-x64.exe`
- `KonLauncher-<version>-x64.exe.blockmap`
- `latest.yml`

`updater:check` IPC channel is available for manual check from renderer.

### Optional override

If you need a custom update server instead of GitHub Releases, set:

```bash
KON_UPDATE_URL=https://your-update-host/path/
```

## Code Signing

Unsigned binaries may trigger antivirus/SmartScreen warnings.
For production distribution, sign your executable and installer with a trusted code signing certificate.

const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const { registerMinecraftIpc } = require('./minecraft-ipc.cjs');

const DEV_SERVER_URL = process.env.KON_DEV_SERVER_URL || '';
const shouldUseDevServer = Boolean(DEV_SERVER_URL);
const updateFeedUrl = String(process.env.KON_UPDATE_URL || '').trim();
const shouldUseAutoUpdater = !shouldUseDevServer;
const INDEX_FILE = path.join(__dirname, '..', 'dist', 'index.html');
const APP_NAME = 'KonLauncher';
const APP_USER_MODEL_ID = 'com.konlauncher.app';
const CHROMIUM_CACHE_DIRS = ['GPUCache', 'DawnCache', 'Code Cache'];
const WINDOW_ICON = [
  path.join(__dirname, '..', 'build', 'icon.ico'),
  path.join(__dirname, '..', 'icon.ico'),
  path.join(__dirname, '..', 'icon.png')
].find((iconPath) => fs.existsSync(iconPath));
let updaterConfigured = false;
let latestAvailableVersion = '';
let latestDownloadedVersion = '';
let latestAvailableNotes = [];
let latestDownloadedNotes = [];
let updaterDownloadPromise = null;

const redactSensitiveText = (value) => {
  let text = String(value || '');
  if (!text) return text;

  text = text.replace(/(Bearer\s+)[^\s"']+/gi, '$1[REDACTED]');
  text = text.replace(/(XBL3\.0\s+x=[^;\s]+;)[^\s"']+/gi, '$1[REDACTED]');
  text = text.replace(/([?&](?:access_token|refresh_token|code)=)[^&\s]+/gi, '$1[REDACTED]');
  text = text.replace(/((?:access_token|refresh_token|client_token|id_token|authorization|cookie)\s*[:=]\s*["']?)[^"',\s}]+/gi, '$1[REDACTED]');
  text = text.replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[REDACTED_JWT]');

  return text;
};

const sanitizePayload = (value, depth = 0) => {
  if (depth > 8) return '[Truncated]';
  if (typeof value === 'string') return redactSensitiveText(value);
  if (Array.isArray(value)) return value.map((entry) => sanitizePayload(entry, depth + 1));
  if (!value || typeof value !== 'object') return value;

  const next = {};
  for (const [key, entry] of Object.entries(value)) {
    if (/(token|cookie|authorization|password|secret|session)/i.test(key)) {
      next[key] = '[REDACTED]';
      continue;
    }
    next[key] = sanitizePayload(entry, depth + 1);
  }
  return next;
};

const normalizeReleaseNoteText = (value) =>
  String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const extractReleaseNotes = (info) => {
  const notes = [];
  const appendNote = (rawValue) => {
    const note = normalizeReleaseNoteText(rawValue);
    if (!note) return;
    if (!notes.includes(note)) notes.push(note);
  };

  const source = info?.releaseNotes;
  if (Array.isArray(source)) {
    source.forEach((entry) => {
      if (!entry) return;
      if (typeof entry === 'string') {
        appendNote(entry);
        return;
      }
      appendNote(entry.note || entry.text || entry.description || entry.body || entry.message || '');
    });
  } else if (source && typeof source === 'object') {
    appendNote(source.note || source.text || source.description || source.body || source.message || '');
  } else {
    appendNote(source);
  }

  return notes.slice(0, 4);
};

const emitUpdaterState = (payload) => {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach((win) => {
    if (!win || win.isDestroyed()) return;
    win.webContents.send('updater:state', payload);
  });
};

const configureAutoUpdater = () => {
  if (!shouldUseAutoUpdater || updaterConfigured) return;
  updaterConfigured = true;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  if (updateFeedUrl) {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: updateFeedUrl
    });
  }

  autoUpdater.on('checking-for-update', () => {
    emitUpdaterState({ state: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    latestAvailableVersion = String(info?.version || '').trim();
    latestAvailableNotes = extractReleaseNotes(info);
    emitUpdaterState({ state: 'available', version: latestAvailableVersion, notes: latestAvailableNotes });
  });

  autoUpdater.on('update-not-available', (info) => {
    latestAvailableVersion = '';
    latestAvailableNotes = [];
    latestDownloadedNotes = [];
    if (!latestDownloadedVersion) {
      updaterDownloadPromise = null;
    }
    emitUpdaterState({ state: 'idle', version: String(info?.version || ''), notes: [] });
  });

  autoUpdater.on('download-progress', (progress) => {
    emitUpdaterState({
      state: 'downloading',
      percent: Number.isFinite(progress?.percent) ? Math.max(0, Math.min(100, Math.round(progress.percent))) : 0,
      transferred: Number(progress?.transferred || 0),
      total: Number(progress?.total || 0)
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    latestDownloadedVersion = String(info?.version || '').trim();
    latestDownloadedNotes = extractReleaseNotes(info);
    updaterDownloadPromise = null;
    emitUpdaterState({ state: 'downloaded', version: latestDownloadedVersion, notes: latestDownloadedNotes });
  });

  autoUpdater.on('error', (error) => {
    updaterDownloadPromise = null;
    const message = redactSensitiveText(error?.message || 'Unknown updater error');
    emitUpdaterState({ state: 'error', message });
    console.error('[updater error]', message);
  });
};

const checkForUpdatesNow = async () => {
  if (!shouldUseAutoUpdater) {
    const error = new Error('Updater is disabled in development mode.');
    error.code = 'UPDATER_DISABLED';
    throw error;
  }

  configureAutoUpdater();
  const result = await autoUpdater.checkForUpdates();
  const updateVersion = String(result?.updateInfo?.version || '').trim();
  if (updateVersion && updateVersion !== app.getVersion()) {
    latestAvailableVersion = updateVersion;
    latestAvailableNotes = extractReleaseNotes(result?.updateInfo);
  }
  return result?.updateInfo || null;
};

const downloadUpdateNow = async () => {
  if (!shouldUseAutoUpdater) {
    const error = new Error('Updater is disabled in development mode.');
    error.code = 'UPDATER_DISABLED';
    throw error;
  }

  configureAutoUpdater();

  if (latestDownloadedVersion) {
    return { version: latestDownloadedVersion, downloaded: true, notes: latestDownloadedNotes };
  }

  if (!latestAvailableVersion) {
    const updateInfo = await checkForUpdatesNow();
    const updateVersion = String(updateInfo?.version || '').trim();
    if (updateVersion && updateVersion !== app.getVersion()) {
      latestAvailableVersion = updateVersion;
    }
  }

  if (!latestAvailableVersion) {
    const error = new Error('No update is available right now.');
    error.code = 'UPDATER_NOT_AVAILABLE';
    throw error;
  }

  if (!updaterDownloadPromise) {
    updaterDownloadPromise = autoUpdater.downloadUpdate();
  }

  await updaterDownloadPromise;
  return {
    version: latestDownloadedVersion || latestAvailableVersion,
    downloaded: true,
    notes: latestDownloadedNotes.length ? latestDownloadedNotes : latestAvailableNotes
  };
};

const installDownloadedUpdateNow = async () => {
  if (!shouldUseAutoUpdater) {
    const error = new Error('Updater is disabled in development mode.');
    error.code = 'UPDATER_DISABLED';
    throw error;
  }

  configureAutoUpdater();

  if (!latestDownloadedVersion) {
    const error = new Error('Update package is not downloaded yet.');
    error.code = 'UPDATER_NOT_DOWNLOADED';
    throw error;
  }

  emitUpdaterState({ state: 'installing', version: latestDownloadedVersion });
  setImmediate(() => {
    autoUpdater.quitAndInstall(true, true);
  });

  return { queued: true, version: latestDownloadedVersion };
};

app.setName(APP_NAME);
if (process.platform === 'win32') {
  app.setAppUserModelId(APP_USER_MODEL_ID);
}
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

const clearChromiumCacheDirs = async () => {
  const userDataPath = app.getPath('userData');
  for (const dirName of CHROMIUM_CACHE_DIRS) {
    const targetPath = path.join(userDataPath, dirName);
    try {
      await fs.promises.rm(targetPath, { recursive: true, force: true });
    } catch {
      // noop
    }
  }
};

const emitMaximizedState = (win) => {
  if (!win || win.isDestroyed()) return;
  win.webContents.send('window:maximized-change', win.isMaximized());
};

const resolveSenderWindow = (event) => BrowserWindow.fromWebContents(event.sender);

ipcMain.on('window:minimize', (event) => {
  resolveSenderWindow(event)?.minimize();
});

ipcMain.on('window:maximize', (event) => {
  resolveSenderWindow(event)?.maximize();
});

ipcMain.on('window:unmaximize', (event) => {
  const win = resolveSenderWindow(event);
  if (win?.isMaximized()) win.unmaximize();
});

ipcMain.on('window:close', (event) => {
  resolveSenderWindow(event)?.close();
});

ipcMain.on('renderer:error', (_event, payload) => {
  console.error('[renderer error]', sanitizePayload(payload));
});

ipcMain.handle('window:is-maximized', (event) => {
  const win = resolveSenderWindow(event);
  return Boolean(win?.isMaximized());
});

ipcMain.handle('updater:check', async () => {
  try {
    const updateInfo = await checkForUpdatesNow();
    return {
      ok: true,
      data: {
        enabled: shouldUseAutoUpdater,
        updateInfo
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: error?.code || 'UPDATER_CHECK_FAILED',
        message: redactSensitiveText(error?.message || 'Failed to check updates')
      }
    };
  }
});

ipcMain.handle('updater:download', async () => {
  try {
    const data = await downloadUpdateNow();
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: error?.code || 'UPDATER_DOWNLOAD_FAILED',
        message: redactSensitiveText(error?.message || 'Failed to download update')
      }
    };
  }
});

ipcMain.handle('updater:install', async () => {
  try {
    const data = await installDownloadedUpdateNow();
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: error?.code || 'UPDATER_INSTALL_FAILED',
        message: redactSensitiveText(error?.message || 'Failed to install update')
      }
    };
  }
});

function createMainWindow() {
  const debugEnabled = process.env.KON_DEBUG_ELECTRON === '1';
  const win = new BrowserWindow({
    title: APP_NAME,
    width: 1600,
    height: 940,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    icon: WINDOW_ICON,
    backgroundColor: '#080808',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  win.once('ready-to-show', () => {
    if (!win.isMaximized()) {
      win.maximize();
    }
    win.show();
    emitMaximizedState(win);
  });

  if (debugEnabled) {
    win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      console.error('[renderer did-fail-load]', {
        errorCode,
        errorDescription: redactSensitiveText(errorDescription),
        validatedURL: redactSensitiveText(validatedURL)
      });
    });
    win.webContents.on('render-process-gone', (_event, details) => {
      console.error('[renderer gone]', sanitizePayload(details));
    });
    win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
      console.log(`[renderer console:${level}] ${redactSensitiveText(sourceId)}:${line} ${redactSensitiveText(message)}`);
    });
    win.webContents.on('did-finish-load', () => {
      console.log('[renderer did-finish-load]');
    });
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.on('maximize', () => emitMaximizedState(win));
  win.on('unmaximize', () => emitMaximizedState(win));

  if (shouldUseDevServer) {
    win.loadURL(DEV_SERVER_URL).catch(async () => {
      await win.loadFile(INDEX_FILE);
    });
    return;
  }

  win.loadFile(INDEX_FILE);
}

app.whenReady().then(async () => {
  await clearChromiumCacheDirs();
  registerMinecraftIpc();
  configureAutoUpdater();
  Menu.setApplicationMenu(null);
  createMainWindow();

  if (shouldUseAutoUpdater) {
    void checkForUpdatesNow().catch(() => {});
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

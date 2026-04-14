const { contextBridge, ipcRenderer } = require('electron');

const subscribe = (channel, callback) => {
  if (typeof callback !== 'function') return () => {};

  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
};

const reportRendererError = (payload) => {
  try {
    ipcRenderer.send('renderer:error', payload);
  } catch {
    // noop
  }
};

window.addEventListener('error', (event) => {
  reportRendererError({
    type: 'error',
    message: event?.message || 'Unknown renderer error',
    filename: event?.filename || '',
    lineno: event?.lineno || 0,
    colno: event?.colno || 0,
    stack: event?.error?.stack || ''
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason;
  reportRendererError({
    type: 'unhandledrejection',
    message: reason?.message || String(reason || 'Unhandled promise rejection'),
    stack: reason?.stack || ''
  });
});

contextBridge.exposeInMainWorld('launcherWindow', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  unmaximize: () => ipcRenderer.send('window:unmaximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  onMaximizedChange: (callback) => {
    if (typeof callback !== 'function') return () => {};

    const listener = (_event, isMaximized) => {
      callback(Boolean(isMaximized));
    };

    ipcRenderer.on('window:maximized-change', listener);
    return () => {
      ipcRenderer.removeListener('window:maximized-change', listener);
    };
  }
});

contextBridge.exposeInMainWorld('launcherMinecraft', {
  installInstance: (payload) => ipcRenderer.invoke('minecraft:install-instance', payload),
  launchInstance: (payload) => ipcRenderer.invoke('minecraft:launch-instance', payload),
  stopInstance: (payload) => ipcRenderer.invoke('minecraft:stop-instance', payload),
  listGameVersions: (payload) => ipcRenderer.invoke('minecraft:list-game-versions', payload),
  listLoaderVersions: (payload) => ipcRenderer.invoke('minecraft:list-loader-versions', payload),
  getLoaderAvailability: (version) => ipcRenderer.invoke('minecraft:get-loader-availability', version),
  getDefaultInstallPath: (payload) => ipcRenderer.invoke('minecraft:get-default-install-path', payload),
  renameProfileFolder: (payload) => ipcRenderer.invoke('minecraft:rename-profile-folder', payload),
  deleteProfileFolder: (payload) => ipcRenderer.invoke('minecraft:delete-profile-folder', payload),
  scanInstanceContent: (payload) => ipcRenderer.invoke('minecraft:scan-instance-content', payload),
  importFromLauncher: (payload) => ipcRenderer.invoke('minecraft:import-from-launcher', payload),
  pickInstanceAvatar: (payload) => ipcRenderer.invoke('minecraft:pick-instance-avatar', payload),
  installMod: (payload) => ipcRenderer.invoke('minecraft:install-mod', payload),
  updateMod: (payload) => ipcRenderer.invoke('minecraft:update-mod', payload),
  deleteMod: (payload) => ipcRenderer.invoke('minecraft:delete-mod', payload),
  toggleMod: (payload) => ipcRenderer.invoke('minecraft:toggle-mod', payload),
  checkModUpdates: (payload) => ipcRenderer.invoke('minecraft:check-mod-updates', payload),
  getJavaDownloadUrl: (requiredMajor) => ipcRenderer.invoke('minecraft:get-java-download-url', requiredMajor),
  onInstallProgress: (callback) => subscribe('minecraft:install-progress', callback),
  onLaunchState: (callback) => subscribe('minecraft:launch-state', callback),
  onModDownloadProgress: (callback) => subscribe('minecraft:mod-download-progress', callback)
});

contextBridge.exposeInMainWorld('launcherData', {
  loadState: () => ipcRenderer.invoke('launcher:load-state'),
  saveState: (payload) => ipcRenderer.invoke('launcher:save-state', payload)
});

contextBridge.exposeInMainWorld('launcherSkins', {
  getState: () => ipcRenderer.invoke('skins:get-state'),
  getOfficialProfile: (payload) => ipcRenderer.invoke('skins:get-official-profile', payload),
  save: (payload) => ipcRenderer.invoke('skins:save', payload),
  update: (payload) => ipcRenderer.invoke('skins:update', payload),
  delete: (payload) => ipcRenderer.invoke('skins:delete', payload),
  setActive: (payload) => ipcRenderer.invoke('skins:set-active', payload),
  reorder: (payload) => ipcRenderer.invoke('skins:reorder', payload),
  updateSync: (payload) => ipcRenderer.invoke('skins:update-sync', payload),
  openFolder: () => ipcRenderer.invoke('skins:open-folder')
});

contextBridge.exposeInMainWorld('launcherSystem', {
  openExternal: (url) => ipcRenderer.invoke('system:open-external', url),
  openPath: (targetPath) => ipcRenderer.invoke('system:open-path', targetPath),
  getMemoryInfo: () => ipcRenderer.invoke('system:get-memory-info')
});

contextBridge.exposeInMainWorld('launcherUpdater', {
  check: () => ipcRenderer.invoke('updater:check'),
  download: () => ipcRenderer.invoke('updater:download'),
  install: () => ipcRenderer.invoke('updater:install'),
  onState: (callback) => subscribe('updater:state', callback)
});

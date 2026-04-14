const path = require('node:path');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const http = require('node:http');
const https = require('node:https');
const { execFileSync, execFile } = require('node:child_process');
const { promisify } = require('node:util');
const EventEmitter = require('node:events');
const { createHash, randomUUID } = require('node:crypto');
const { ipcMain, dialog, shell, BrowserWindow, app, nativeImage, safeStorage } = require('electron');
const { Client, Authenticator } = require('minecraft-launcher-core');
const Handler = require('minecraft-launcher-core/components/handler');
let yauzl = null;
try {
  // Optional dependency (available through electron -> extract-zip).
  yauzl = require('yauzl');
} catch {
  yauzl = null;
}

const execFileAsync = promisify(execFile);

const DEFAULT_URLS = {
  meta: 'https://launchermeta.mojang.com',
  resource: 'https://resources.download.minecraft.net',
  mavenForge: 'https://maven.minecraftforge.net/',
  defaultRepoForge: 'https://libraries.minecraft.net/',
  fallbackMaven: 'https://search.maven.org/remotecontent?filepath='
};

const DEFAULT_FW = {
  baseUrl: 'https://github.com/ZekerZhayard/ForgeWrapper/releases/download/',
  version: '1.6.0',
  sh1: '035a51fe6439792a61507630d89382f621da0f1f',
  size: 28679
};

const STAGE_LABELS = {
  prepare: 'Preparing',
  metadata: 'Resolving version metadata',
  natives: 'Downloading native libraries',
  jar: 'Downloading Minecraft client',
  classes: 'Downloading libraries',
  assets: 'Downloading assets',
  loader: 'Installing loader',
  done: 'Done'
};

const PROFILE_META_FILENAME = '.konlauncher-profile.json';
const STATE_FILENAME = 'state.json';
const SKINS_STATE_FILENAME = 'skins-state.json';
const AUTH_SESSION_FILENAME = 'auth-session.bin';
const MIN_VERSION_TUPLE = [1, 8, 0];
const MAX_VERSION_TUPLE = [26, 99, 99];
const REQUEST_HEADERS = {
  'User-Agent': 'KonLauncher/0.2'
};
const MICROSOFT_OAUTH_CLIENT_ID = String(process.env.KON_MSA_CLIENT_ID || '00000000402b5328').trim();
const MICROSOFT_OAUTH_SCOPE = 'XboxLive.signin offline_access';

const CUSTOM_SKIN_LOADER_PROJECT_ID = 'idMHQ4n2';
const THREE_D_SKIN_LAYERS_PROJECT_ID = '3dskinlayers';
const AUTO_INSTALL_THREE_D_SKIN_LAYERS = false;
const DEFAULT_SKIN_SERVICE_URL = String(process.env.KON_SKIN_SERVICE_URL || '').trim();
const DEFAULT_SKIN_SERVICE_TOKEN = String(process.env.KON_SKIN_SERVICE_TOKEN || '').trim();
const LOCAL_CONTENT_ID_PREFIX = 'local:';
const IMPORT_SOURCE_IDS = new Set(['official', 'tlauncher', 'modrinth', 'prism', 'multimc']);

const DEFAULT_CAPE_LIBRARY = [
  {
    id: 'pan',
    name: 'Pan',
    pngBase64:
      'iVBORw0KGgoAAAANSUhEUgAAAEAAAAAgCAYAAACinX6EAAAAAXNSR0IArs4c6QAAA79JREFUaEPtmF9IU1Ecx3+jLFg6va3lcok0xT8QNBgtCEKlkAIh1osQ9GQvvvXcYw+9+NKbTz4FkS+N6KGSQOmtOWM9rRIFs+lkytoag8y88T35u1z17u7sOCXmDozt3vu9597f5/s75/zOHERE4YdX9M5uD7nO67SZO0GF3G/j93HXBuW+O+jr5zR9e7tJmUwGt4imaZo4xrfX6xWfeDxOs7OzDkNk88Pv9+uldAsLC1J9leqn2HUHgvdcrKM2b6MIHgHjG42Dd7rqKB5dJujQZLSRxx+kXpwhHHSgRQHcCbXrN0JdFL+a2xMYZ8JiKktrT1aoq62ZWpubpLQvovNSAPjFYISdi7JAy80EBwNIzC/Rr3uNAgJac8MFSiaTlCykyR3Zoi+LqwYAGa0KAKtMZBNi79boICAYALK+a7T8/pmA4HN6RPrD+ZNPs6S399Jy9LUBQEZbLgBAhxlnHpyzNUGlX7usMAAsrf4Qunz+J1161EvRubgInltyvWAAkNGqvCgA+NxOWxNU+i0JQHM56azWYOgwzpHm5gYA0KHJaFVeFAAwz9iZoNKvLYBgMKhjKev3n6KO63cp9/GVmOjMABD84p8mYwmU0couheaXYwA4V8yE+JpOlVwxHADgcbspvb5OAW1DuMsP57GPh2Kthw5NRqsK4HL4fkkTKgrg5sDAjuXHt7VCwe5WkQFwvtDUTrfDYXoZiezJJDvtm8nJspZBdI6l8HS0UNIElb6L1gEMoFHTKLtd5SGwTO5f8Ow4u49jGa3KS3ItAAh2Jqj0XRTA0NCQyIC+vj6anp6m+vp6Uc6KeaG/n/L5/J57ZbQzMzNKY9UMoZgJMGBiYqLsDLOC4BgeHtY5SHPwEGPcBwIBAQHXzDBKaaemppQBBEItovT+9DxtaQIMGBkZqSwAc0C8yenp6RHQBgcHKRaLGQBktPsBgIoQpTdPvlYmVCwDxsbGdASHtOfGOz4MAZzHLo8hQCOjHR0dVc6A7rljovQGACsTYMD4+HhlMgDLIILibe3u7S6uAUAqldoBiLOET+LYrEU/KssVaoGW0C1RegOAlQnlbLntiiBcE3UAAzAHY7XP350hPE9YaVUBoE9AEJm2XX+YwcKMRCKhBNdyEixFSPU69vkqGWAFwPxny5EBwKU3Dy024kgAQLDIoM6ODlF2m9uRA8DBMwiepFWH1+4hXZGlxGqe2M8cwP3Z/Wn63wNQnTwP+74Dy4DDDkT1eTUAquSq5b5aBlSLk6px1DJAlVy13FfLgGpxUjWOv7cNJ07u+H1SAAAAAElFTkSuQmCC'
  },
  {
    id: 'common',
    name: 'Common',
    pngBase64:
      'iVBORw0KGgoAAAANSUhEUgAAAEAAAAAgCAYAAACinX6EAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAOwwAADsMBx2+oZAAAAAd0SU1FB98KBgk2H0ui5CgAAAMpSURBVGje7Zg/axtJGIef2VkFicQg7lhisiyoUZdKJqS5Kw3XOfgjpE3hFMkXSJsmKdznI9hpElB5RRLCqbsmgkOwkROzJBhikNDO7qRYz2il+I8k7/oC2QeEFlbMzPub3zvvOxIAz6+5upekHGrNadwUgo50eDJRLMIXECzIP43azKQff0sBGETZEDsTtfBYq+D+5QgNsL0uGEQOvSS1LzvSAaDlaQYR3HEE/50hUp7fQX/QLLXwjVGc/X7IleICWdCRQ8vT/PFVMr8jg0jMCFMkJvB5J8y7oSwnuAAemlcqgU8AKTfFdK7DT9m6bgs4vIIdMUHnaXmafaTeGiaFi+AABFLOBn1icw/NbcHMu7KwKQC0gwbtoGF3fxAJ/v6c8kgKXYoABhOsOfQCKQlklhLm+zT8gnf/6JuyQrQ8bec/bw2XSgFDICVRkuKh+T+JjmIAmmsu7aCB18xVn39VOQ7YXhfsxoo36TQHd2PFbqzYXhdXErgpfUYE44Tmmms/+77UhQsQJonNOT9ndz+XkxdRVBp4zdqpInR7Y7q9MaWdAd3emL27N9hwhN35DUewd/fGmRP7JbiguebiNWtWiOgoptsbEybJwpux9BkQISBJ6PbGvEynDnuZav4MR4Ql9QDniWB431eESUIgJZudenkOMPXW7Kx/Sbs/v+Yunas7EyXybnvfz+x//851Njt1+uGIfjhaaewLq0CW9xofeHhL0g4aPHh3bN8ZC15FGvTDEYMoS0UArCiiPAe0PE07aHCvNrVf/nkRihIjn+f+XEXai5V1aqGtsFHXWM08Z+VpvHSwm506vD1eekEmuM1OndbJOh4fKDvnvZpLO6jD8LhYB5x3uhap+KJ0e+OZvmA+RQq/C1zEom2onwtgFbaGiT0Id2PFs4OEByepOAT2YnWmMCulwOtUi9cT9aNdz7HYh8XGvpRtWp6Gg+nfA09vyR+6xcLvAj8L5kB+0VQn9wJtgz+rGhXSBxQdxKpsDRPRD0e2K8yPWfStsDQBLtuyGqvPt8YtTxdfBn9GdiZK7IcjPYiELcf5FrmoMlhRUVFRUVFRUfGr8h1KVExpP3QPdAAAAABJRU5ErkJggg=='
  }
];

const OFFLINE_MULTIPLAYER_FIX = {
  minVersion: '1.16.4',
  maxVersion: '1.16.5',
  artifacts: {
    '1.16.4': {
      fabric: {
        filename: 'MultiOfflineFix-fabric-1.0.3+1.16.4.jar',
        url: 'https://github.com/MCTeamPotato/MultiOfflineFix/releases/download/1.0.3/MultiOfflineFix-fabric-1.0.3%2B1.16.4.jar'
      },
      forge: {
        filename: 'MultiOfflineFix-forge-1.0.3+1.16.4.jar',
        url: 'https://github.com/MCTeamPotato/MultiOfflineFix/releases/download/1.0.3/MultiOfflineFix-forge-1.0.3%2B1.16.4.jar'
      }
    },
    '1.16.5': {
      fabric: {
        filename: 'MultiOfflineFix-fabric-1.0.1+1.16.5.jar',
        url: 'https://github.com/MCTeamPotato/MultiOfflineFix/releases/download/1.0.1/MultiOfflineFix-fabric-1.0.1%2B1.16.5.jar'
      },
      forge: {
        filename: 'MultiOfflineFix-forge-1.0.1+1.16.5.jar',
        url: 'https://github.com/MCTeamPotato/MultiOfflineFix/releases/download/1.0.1/MultiOfflineFix-forge-1.0.1%2B1.16.5.jar'
      }
    }
  }
};

const OFFLINE_MULTIPLAYER_WORKAROUND = {
  minVersion: '1.16',
  maxVersion: '1.16.5',
  hosts: {
    auth: 'https://authserver.mojang.com',
    account: 'https://api.mojang.com',
    session: 'https://sessionserver.mojang.com'
  }
};

const FALLBACK_RELEASE_VERSIONS = [
  '26.1.2',
  '26.1.1',
  '26.1',
  '1.21.11',
  '1.21.10',
  '1.21.9',
  '1.21.8',
  '1.21.7',
  '1.21.6',
  '1.21.5',
  '1.21.4',
  '1.21.3',
  '1.21.2',
  '1.21.1',
  '1.21',
  '1.20.6',
  '1.20.5',
  '1.20.4',
  '1.20.3',
  '1.20.2',
  '1.20.1',
  '1.20',
  '1.19.4',
  '1.19.3',
  '1.19.2',
  '1.19.1',
  '1.19',
  '1.18.2',
  '1.18.1',
  '1.18',
  '1.17.1',
  '1.17',
  '1.16.5',
  '1.16.4',
  '1.16.3',
  '1.16.2',
  '1.16.1',
  '1.16',
  '1.15.2',
  '1.15.1',
  '1.15',
  '1.14.4',
  '1.14.3',
  '1.14.2',
  '1.14.1',
  '1.14',
  '1.13.2',
  '1.13.1',
  '1.13',
  '1.12.2',
  '1.12.1',
  '1.12',
  '1.11.2',
  '1.11.1',
  '1.11',
  '1.10.2',
  '1.10.1',
  '1.10',
  '1.9.4',
  '1.9.3',
  '1.9.2',
  '1.9.1',
  '1.9',
  '1.8.9',
  '1.8.8',
  '1.8.7',
  '1.8.6',
  '1.8.5',
  '1.8.4',
  '1.8.3',
  '1.8.2',
  '1.8.1',
  '1.8'
];

const FALLBACK_PRERELEASE_VERSIONS = ['26.2-snapshot-3', '26.2-snapshot-2', '26.2-snapshot-1', '26.1.2-rc-1'];

const MAX_SUPPORTED_VERSION_TEXT = `${MAX_VERSION_TUPLE[0]}.${MAX_VERSION_TUPLE[1]}.${MAX_VERSION_TUPLE[2]}`;

let handlersRegistered = false;
let activeInstallId = null;
const canceledInstallIds = new Set();
const runningGames = new Map();
const launchingGames = new Set();
let cachedVersions = {
  release: {
    expiresAt: 0,
    values: FALLBACK_RELEASE_VERSIONS
  },
  all: {
    expiresAt: 0,
    values: [...FALLBACK_PRERELEASE_VERSIONS, ...FALLBACK_RELEASE_VERSIONS]
  }
};
let forgePromotionsCache = null;
let neoForgeVersionsCache = null;
const loaderVersionsCache = new Map();
const officialProfileCache = new Map();
let cachedSecureAuthSession = null;
let offlineMultiplayerServicesServer = null;
let offlineMultiplayerServicesServerPromise = null;
const localContentIconCache = new Map();

const normalizeId = (value) => String(value ?? '').trim();

const makeInstallCancelledError = (instanceId) => {
  const error = new Error('Installation was cancelled.');
  error.code = 'INSTALL_CANCELLED';
  error.details = { instanceId: normalizeId(instanceId) };
  return error;
};

const isInstallCancelled = (instanceId) => canceledInstallIds.has(normalizeId(instanceId));

const assertInstallNotCancelled = (instanceId) => {
  if (isInstallCancelled(instanceId)) {
    throw makeInstallCancelledError(instanceId);
  }
};

const normalizeLoader = (loader) => {
  const value = String(loader || 'vanilla').toLowerCase();
  if (value === 'vanilla' || value === 'fabric' || value === 'forge' || value === 'quilt' || value === 'neoforge') {
    return value;
  }
  return 'vanilla';
};

const toFabricFamilyLoader = (loader) => {
  const normalized = normalizeLoader(loader);
  if (normalized === 'quilt') return 'fabric';
  return normalized;
};

const emitToSender = (event, channel, payload) => {
  event.sender.send(channel, payload);
};

const safeUnlink = async (targetPath) => {
  try {
    await fsp.unlink(targetPath);
  } catch (error) {
    if (error && error.code !== 'ENOENT') throw error;
  }
};

const hasZipHeader = async (targetPath) => {
  try {
    const handle = await fsp.open(targetPath, 'r');
    const buffer = Buffer.alloc(2);
    const { bytesRead } = await handle.read(buffer, 0, 2, 0);
    await handle.close();
    return bytesRead === 2 && buffer[0] === 0x50 && buffer[1] === 0x4b;
  } catch (_error) {
    return false;
  }
};

const hasValidJarCache = async (targetPath) => {
  try {
    const stat = await fsp.stat(targetPath);
    if (!stat.isFile() || stat.size < 64 * 1024) return false;
    return hasZipHeader(targetPath);
  } catch (_error) {
    return false;
  }
};

const isSensitiveFieldName = (name) =>
  /(token|cookie|authorization|password|secret|session|code_verifier|device_code)/i.test(String(name || '').trim());

const redactSensitiveText = (value) => {
  let text = String(value || '');
  if (!text) return text;

  text = text.replace(/(Bearer\s+)[^\s"']+/gi, '$1[REDACTED]');
  text = text.replace(/(XBL3\.0\s+x=[^;\s]+;)[^\s"']+/gi, '$1[REDACTED]');
  text = text.replace(/(--accessToken\s+)[^\s"']+/gi, '$1[REDACTED]');
  text = text.replace(/(--clientId\s+)[^\s"']+/gi, '$1[REDACTED]');
  text = text.replace(/([?&](?:access_token|refresh_token|code|client_id)=)[^&\s]+/gi, '$1[REDACTED]');
  text = text.replace(/((?:access_token|refresh_token|client_token|id_token|authorization|cookie)\s*[:=]\s*["']?)[^"',\s}]+/gi, '$1[REDACTED]');
  text = text.replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[REDACTED_JWT]');

  return text;
};

const sanitizeSensitiveValue = (value, depth = 0) => {
  if (depth > 8) return '[Truncated]';
  if (typeof value === 'string') return redactSensitiveText(value);
  if (Array.isArray(value)) return value.map((entry) => sanitizeSensitiveValue(entry, depth + 1));
  if (!value || typeof value !== 'object') return value;

  const next = {};
  for (const [key, entry] of Object.entries(value)) {
    if (isSensitiveFieldName(key)) {
      next[key] = '[REDACTED]';
      continue;
    }
    next[key] = sanitizeSensitiveValue(entry, depth + 1);
  }
  return next;
};

const toErrorResult = (error, fallbackMessage = 'Unknown error') => {
  if (!error) {
    return { code: 'UNKNOWN', message: fallbackMessage };
  }

  return {
    code: error.code || 'UNKNOWN',
    message: redactSensitiveText(error.message || fallbackMessage),
    requiredJavaMajor: error.requiredJavaMajor || null,
    detectedJavaMajor: error.detectedJavaMajor || null,
    javaDownloadUrl: redactSensitiveText(error.javaDownloadUrl || '') || null,
    details: sanitizeSensitiveValue(error.details || null)
  };
};

const getJavaDownloadUrl = (major) => {
  if (major >= 21) return 'https://adoptium.net/temurin/releases/?version=21';
  if (major >= 17) return 'https://adoptium.net/temurin/releases/?version=17';
  if (major >= 16) return 'https://adoptium.net/temurin/releases/?version=16';
  return 'https://adoptium.net/temurin/releases/?version=8';
};

const parseJavaMajor = (versionText) => {
  if (!versionText) return null;
  const cleaned = versionText.trim().split('-')[0];
  const segments = cleaned.split('.');
  if (!segments.length) return null;

  if (segments[0] === '1' && segments[1]) {
    const major = Number.parseInt(segments[1], 10);
    return Number.isNaN(major) ? null : major;
  }

  const major = Number.parseInt(segments[0], 10);
  return Number.isNaN(major) ? null : major;
};

const parseVersionOutput = (text) => {
  const fromQuoted = text.match(/version\s+"([^"]+)"/i);
  if (fromQuoted) return fromQuoted[1];

  const fromOpenJdk = text.match(/openjdk\s+([^\s]+)/i);
  if (fromOpenJdk) return fromOpenJdk[1];

  return null;
};

const probeJavaCandidate = async (candidate) => {
  try {
    const { stdout, stderr } = await execFileAsync(candidate, ['-version'], { windowsHide: true });
    const combined = `${stdout || ''}\n${stderr || ''}`;
    const parsedVersion = parseVersionOutput(combined);
    const major = parseJavaMajor(parsedVersion);

    if (!major) return null;
    return {
      path: candidate,
      major,
      version: parsedVersion || String(major)
    };
  } catch {
    return null;
  }
};

const listJavaCandidates = () => {
  const result = new Set();
  result.add('java');

  if (process.env.JAVA_HOME) {
    const javaFromHome = path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
    result.add(javaFromHome);
  }

  if (process.platform === 'win32') {
    try {
      const whereOutput = execFileSync('where', ['java'], { encoding: 'utf8', windowsHide: true });
      for (const line of whereOutput.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed) result.add(trimmed);
      }
    } catch {
      // noop
    }

    const windowsRoots = [
      'C:\\Program Files\\Java',
      'C:\\Program Files (x86)\\Java',
      'C:\\Program Files\\Eclipse Adoptium',
      'C:\\Program Files\\Microsoft',
      'C:\\Program Files\\Amazon Corretto',
      'C:\\Program Files\\Zulu'
    ];

    for (const root of windowsRoots) {
      if (!fs.existsSync(root)) continue;
      try {
        const entries = fs.readdirSync(root, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          result.add(path.join(root, entry.name, 'bin', 'java.exe'));
        }
      } catch {
        // noop
      }
    }
  }

  return [...result];
};

const parseGameVersion = (version) => {
  const text = String(version || '').trim();
  const match = text.match(/(\d+)\.(\d+)(?:\.(\d+))?/);
  if (match) {
    return [Number.parseInt(match[1], 10), Number.parseInt(match[2], 10), Number.parseInt(match[3] || '0', 10)];
  }
  const snapshotMatch = text.match(/^(\d{2})w(\d{2})[a-z]?$/i);
  if (snapshotMatch) {
    return [Number.parseInt(snapshotMatch[1], 10), Number.parseInt(snapshotMatch[2], 10), 0];
  }
  return null;
};

const compareVersionTuple = (left, right) => {
  const size = Math.max(left.length, right.length);
  for (let i = 0; i < size; i += 1) {
    const a = Number(left[i] || 0);
    const b = Number(right[i] || 0);
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
};

const compareGameVersions = (left, right) => {
  const leftTuple = parseGameVersion(left);
  const rightTuple = parseGameVersion(right);
  if (!leftTuple || !rightTuple) return 0;
  return compareVersionTuple(leftTuple, rightTuple);
};

const isOfflineMultiplayerAffectedVersion = (version) => {
  if (!parseGameVersion(version)) return false;
  if (compareGameVersions(version, OFFLINE_MULTIPLAYER_FIX.minVersion) < 0) return false;
  if (compareGameVersions(version, OFFLINE_MULTIPLAYER_FIX.maxVersion) > 0) return false;
  return true;
};

const resolveOfflineMultiplayerFixArtifact = (loader, minecraftVersion) => {
  if (!isOfflineMultiplayerAffectedVersion(minecraftVersion)) return null;

  const artifactLoader = toFabricFamilyLoader(loader);
  if (artifactLoader !== 'fabric' && artifactLoader !== 'forge') return null;

  const versionKey = compareGameVersions(minecraftVersion, '1.16.5') === 0 ? '1.16.5' : '1.16.4';
  return OFFLINE_MULTIPLAYER_FIX.artifacts[versionKey]?.[artifactLoader] || null;
};

const isOfflineMultiplayerWorkaroundVersion = (version) => {
  if (!parseGameVersion(version)) return false;
  if (compareGameVersions(version, OFFLINE_MULTIPLAYER_WORKAROUND.minVersion) < 0) return false;
  if (compareGameVersions(version, OFFLINE_MULTIPLAYER_WORKAROUND.maxVersion) > 0) return false;
  return true;
};

const sendJsonResponse = (res, statusCode, payload) => {
  const body = JSON.stringify(payload || {});
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
};

const handleOfflineMultiplayerServicesRequest = (req, res) => {
  const requestUrl = new URL(req.url || '/', 'http://127.0.0.1');
  const pathname = requestUrl.pathname;

  if ((req.method === 'GET' || req.method === 'HEAD') && pathname === '/privileges') {
    sendJsonResponse(res, 200, {
      privileges: {
        onlineChat: { enabled: true },
        multiplayerServer: { enabled: true },
        multiplayerRealms: { enabled: true }
      }
    });
    return;
  }

  if ((req.method === 'GET' || req.method === 'HEAD') && pathname === '/privacy/blocklist') {
    sendJsonResponse(res, 200, {
      blockedProfiles: []
    });
    return;
  }

  sendJsonResponse(res, 404, {
    error: 'Not found'
  });
};

const ensureOfflineMultiplayerServicesServer = async () => {
  if (offlineMultiplayerServicesServer?.baseUrl) {
    return offlineMultiplayerServicesServer;
  }

  if (offlineMultiplayerServicesServerPromise) {
    return offlineMultiplayerServicesServerPromise;
  }

  offlineMultiplayerServicesServerPromise = new Promise((resolve, reject) => {
    const server = http.createServer(handleOfflineMultiplayerServicesRequest);
    const cleanup = () => {
      server.removeAllListeners('error');
      server.removeAllListeners('listening');
    };

    server.once('error', (error) => {
      cleanup();
      reject(error);
    });

    server.once('listening', () => {
      cleanup();
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Offline multiplayer service failed to bind to a TCP port.'));
        return;
      }

      const state = {
        server,
        baseUrl: `http://127.0.0.1:${address.port}`
      };
      offlineMultiplayerServicesServer = state;
      resolve(state);
    });

    server.listen(0, '127.0.0.1');
  });

  try {
    return await offlineMultiplayerServicesServerPromise;
  } catch (error) {
    offlineMultiplayerServicesServer = null;
    throw error;
  } finally {
    offlineMultiplayerServicesServerPromise = null;
  }
};

const buildOfflineMultiplayerWorkaroundArgs = async (minecraftVersion) => {
  if (!isOfflineMultiplayerWorkaroundVersion(minecraftVersion)) return [];

  const service = await ensureOfflineMultiplayerServicesServer();
  return [
    `-Dminecraft.api.auth.host=${OFFLINE_MULTIPLAYER_WORKAROUND.hosts.auth}`,
    `-Dminecraft.api.account.host=${OFFLINE_MULTIPLAYER_WORKAROUND.hosts.account}`,
    `-Dminecraft.api.session.host=${OFFLINE_MULTIPLAYER_WORKAROUND.hosts.session}`,
    `-Dminecraft.api.services.host=${service.baseUrl}`
  ];
};

const isVersionInRange = (version) => {
  const tuple = parseGameVersion(version);
  if (!tuple) return false;
  if (compareVersionTuple(tuple, MIN_VERSION_TUPLE) < 0) return false;
  if (compareVersionTuple(tuple, MAX_VERSION_TUPLE) > 0) return false;
  return true;
};

const supportsLoaderForVersion = (loader, version) => {
  const targetLoader = normalizeLoader(loader);
  if (!isVersionInRange(version)) {
    return {
      supported: false,
      reason: `Version is outside of launcher supported range 1.8 .. ${MAX_SUPPORTED_VERSION_TEXT}.`
    };
  }

  if (targetLoader === 'vanilla') return { supported: true, reason: '' };
  if (targetLoader === 'forge') return { supported: compareGameVersions(version, '1.8') >= 0, reason: 'Forge automation supports 1.8+' };
  if (targetLoader === 'fabric') return { supported: compareGameVersions(version, '1.14') >= 0, reason: 'Fabric started from 1.14+' };
  if (targetLoader === 'quilt') return { supported: compareGameVersions(version, '1.14') >= 0, reason: 'Quilt started from 1.14+' };
  if (targetLoader === 'neoforge') return { supported: compareGameVersions(version, '1.20.1') >= 0, reason: 'NeoForge started from 1.20.1+' };

  return { supported: false, reason: `Loader ${targetLoader} is unknown.` };
};

const ensureLoaderSupportsVersion = (loader, version) => {
  const check = supportsLoaderForVersion(loader, version);
  if (check.supported) return;

  const error = new Error(check.reason || `Loader ${loader} is not compatible with ${version}`);
  error.code = 'LOADER_INCOMPATIBLE';
  error.details = {
    loader,
    version,
    reason: check.reason
  };
  throw error;
};

const getRequiredJavaMajor = (version) => {
  const tuple = parseGameVersion(version);
  if (!tuple) return 17;

  const [major, minor, patch] = tuple;

  if (major > 1) return 21;

  if (minor <= 16) return 8;
  if (minor === 17) return 16;
  if (minor >= 18 && minor <= 20 && patch <= 4) return 17;
  return 21;
};

const resolveJava = async (requiredMajor) => {
  const candidates = listJavaCandidates();
  const detections = [];

  for (const candidate of candidates) {
    const probed = await probeJavaCandidate(candidate);
    if (probed) detections.push(probed);
  }

  const compatible = detections
    .filter((item) => item.major >= requiredMajor)
    .sort((a, b) => a.major - b.major);

  return {
    selected: compatible[0] || null,
    detections
  };
};

const DEFAULT_FETCH_TIMEOUT_MS = 1000 * 60;
const DEFAULT_DOWNLOAD_TIMEOUT_MS = 1000 * 60 * 20;

const fetchWithTimeout = async (url, { timeoutMs = DEFAULT_FETCH_TIMEOUT_MS, ...options } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, Number(timeoutMs) || DEFAULT_FETCH_TIMEOUT_MS));

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error(`Request timed out after ${Math.round((Math.max(1000, Number(timeoutMs) || DEFAULT_FETCH_TIMEOUT_MS)) / 1000)}s: ${url}`);
      timeoutError.code = 'NETWORK_TIMEOUT';
      timeoutError.details = { url, timeoutMs: Math.max(1000, Number(timeoutMs) || DEFAULT_FETCH_TIMEOUT_MS) };
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const fetchJson = async (url) => {
  const response = await fetchWithTimeout(url, { headers: REQUEST_HEADERS, timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
};

const fetchText = async (url) => {
  const response = await fetchWithTimeout(url, { headers: REQUEST_HEADERS, timeoutMs: DEFAULT_FETCH_TIMEOUT_MS });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
};

const sanitizeProfileName = (name) => {
  const trimmed = String(name || '').trim();
  const safe = trimmed
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\.+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return safe || 'Profile';
};

const getLauncherRoot = () => path.join(app.getPath('appData'), 'KonLauncher');
const getProfilesRoot = () => path.join(getLauncherRoot(), 'profiles');
const getCacheRoot = () => path.join(getLauncherRoot(), 'cache');
const getAvatarsRoot = () => path.join(getLauncherRoot(), 'avatars');
const getStateFilePath = () => path.join(getLauncherRoot(), STATE_FILENAME);
const getSkinsRoot = () => path.join(getLauncherRoot(), 'skins');
const getSkinTexturesRoot = () => path.join(getSkinsRoot(), 'textures');
const getSkinCapesRoot = () => path.join(getSkinsRoot(), 'capes');
const getSkinsStateFilePath = () => path.join(getLauncherRoot(), SKINS_STATE_FILENAME);
const getAuthSessionFilePath = () => path.join(getLauncherRoot(), AUTH_SESSION_FILENAME);

const buildProfilePath = (instanceName) => path.join(getProfilesRoot(), sanitizeProfileName(instanceName));

const ensureLauncherDirectories = async () => {
  await fsp.mkdir(getLauncherRoot(), { recursive: true });
  await fsp.mkdir(getProfilesRoot(), { recursive: true });
  await fsp.mkdir(getCacheRoot(), { recursive: true });
  await fsp.mkdir(getAvatarsRoot(), { recursive: true });
  await fsp.mkdir(getSkinsRoot(), { recursive: true });
  await fsp.mkdir(getSkinTexturesRoot(), { recursive: true });
  await fsp.mkdir(getSkinCapesRoot(), { recursive: true });
};

const pathExists = async (targetPath) => {
  try {
    await fsp.access(targetPath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const isPathInside = (targetPath, parentPath) => {
  const relative = path.relative(parentPath, targetPath);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
};

const readProfileMeta = async (profilePath) => {
  const filePath = path.join(profilePath, PROFILE_META_FILENAME);
  try {
    const raw = await fsp.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeProfileMeta = async (profilePath, payload) => {
  const filePath = path.join(profilePath, PROFILE_META_FILENAME);
  await fsp.mkdir(profilePath, { recursive: true });
  await fsp.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
};

const withUniqueSuffix = async (basePath, ownershipCheck) => {
  if (!(await pathExists(basePath))) return basePath;

  if (ownershipCheck) {
    const owned = await ownershipCheck(basePath);
    if (owned) return basePath;
  }

  for (let index = 2; index <= 9999; index += 1) {
    const candidate = `${basePath} (${index})`;
    if (!(await pathExists(candidate))) return candidate;
    if (ownershipCheck) {
      const owned = await ownershipCheck(candidate);
      if (owned) return candidate;
    }
  }

  throw new Error('Cannot resolve a unique profile directory name');
};

const resolveInstallPath = async ({ instanceId, instanceName, preferredInstallPath }) => {
  await ensureLauncherDirectories();

  if (preferredInstallPath) {
    return path.resolve(preferredInstallPath);
  }

  const basePath = buildProfilePath(instanceName);

  return withUniqueSuffix(basePath, async (candidatePath) => {
    const meta = await readProfileMeta(candidatePath);
    if (!meta || !meta.instanceId) return false;
    return normalizeId(meta.instanceId) === normalizeId(instanceId);
  });
};

const mapLauncherLanguageToMinecraftLang = (launcherLanguage) => {
  if (String(launcherLanguage || '').toLowerCase() === 'ru') return 'ru_ru';
  return 'en_us';
};

const upsertMinecraftOption = (fileContent, key, value) => {
  const line = `${key}:${value}`;
  const rows = String(fileContent || '')
    .split(/\r?\n/)
    .filter(Boolean);

  const nextRows = [];
  let replaced = false;

  for (const row of rows) {
    if (row.startsWith(`${key}:`)) {
      nextRows.push(line);
      replaced = true;
    } else {
      nextRows.push(row);
    }
  }

  if (!replaced) nextRows.push(line);
  return `${nextRows.join('\n')}\n`;
};

const applyLanguageToOptions = async (instanceRoot, launcherLanguage) => {
  const minecraftLanguage = mapLauncherLanguageToMinecraftLang(launcherLanguage);
  const optionsPath = path.join(instanceRoot, 'options.txt');

  let current = '';
  try {
    current = await fsp.readFile(optionsPath, 'utf8');
  } catch (error) {
    if (error && error.code !== 'ENOENT') throw error;
  }

  const next = upsertMinecraftOption(current, 'lang', minecraftLanguage);
  await fsp.writeFile(optionsPath, next, 'utf8');
  return minecraftLanguage;
};

const simplifyDownloadLabel = (value) => {
  if (!value) return '';
  const source = String(value).split(/[?#]/)[0];
  const normalized = source.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  if (!parts.length) return source;
  if (parts.length === 1) return parts[0];
  return parts.slice(-2).join('/');
};

const stageLabel = (stage) => STAGE_LABELS[stage] || 'Working';

const toPercent = (task, total) => {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((task / total) * 100)));
};

const mapProgressToOverall = (type, task, total) => {
  const ratio = total > 0 ? task / total : 0;

  if (type === 'natives') return Math.round(8 + ratio * 14);
  if (type === 'classes-maven-custom') return Math.round(22 + ratio * 8);
  if (type === 'classes-custom') return Math.round(30 + ratio * 12);
  if (type === 'classes') return Math.round(30 + ratio * 30);
  if (type === 'assets') return Math.round(60 + ratio * 28);
  if (type === 'assets-copy') return Math.round(88 + ratio * 2);
  return 0;
};

const normalizeOptions = (baseOptions) => {
  const overrides = baseOptions.overrides || {};
  return {
    ...baseOptions,
    root: path.resolve(baseOptions.root),
    overrides: {
      detached: false,
      ...overrides,
      url: {
        ...DEFAULT_URLS,
        ...(overrides.url || {})
      },
      fw: {
        ...DEFAULT_FW,
        ...(overrides.fw || {})
      }
    }
  };
};

const installVanillaLikeBase = async ({ event, instanceId, instanceName, rootDir, minecraftVersion, customVersionId, javaPath, assertNotCancelled }) => {
  const rawOptions = {
    root: rootDir,
    javaPath,
    version: {
      number: minecraftVersion,
      type: 'release',
      ...(customVersionId ? { custom: customVersionId } : {})
    }
  };
  const options = normalizeOptions(rawOptions);

  const emitter = new EventEmitter();
  emitter.options = options;
  const handler = new Handler(emitter);

  const sendProgress = (stage, percent, message) => {
    emitToSender(event, 'minecraft:install-progress', {
      instanceId,
      instanceName,
      stage,
      stageLabel: stageLabel(stage),
      percent: Math.max(0, Math.min(100, Math.round(percent))),
      message: message || stageLabel(stage)
    });
  };

  let lastStage = 'prepare';
  let lastPercent = 1;

  const checkCancelled = () => {
    if (typeof assertNotCancelled === 'function') {
      assertNotCancelled(instanceId);
    }
  };

  const progressListener = (progress) => {
    if (isInstallCancelled(instanceId)) return;
    const overall = mapProgressToOverall(progress.type, progress.task, progress.total);
    if (overall <= 0) return;

    const stage = progress.type.startsWith('assets') ? 'assets' : progress.type.startsWith('classes') ? 'classes' : 'natives';
    lastStage = stage;
    lastPercent = overall;
    sendProgress(stage, overall, `${stageLabel(stage)} ${toPercent(progress.task, progress.total)}%`);
  };

  const downloadListener = (payload) => {
    if (isInstallCancelled(instanceId)) return;
    const label = simplifyDownloadLabel(payload);
    if (!label) return;
    sendProgress(lastStage, lastPercent, `Downloading ${label}`);
  };

  const downloadStatusListener = (payload) => {
    if (isInstallCancelled(instanceId)) return;
    if (!payload || typeof payload !== 'object') return;
    const label = simplifyDownloadLabel(payload.name || payload.path || payload.url);
    if (!label) return;
    sendProgress(lastStage, lastPercent, `Downloading ${label}`);
  };

  emitter.on('progress', progressListener);
  emitter.on('download', downloadListener);
  emitter.on('download-status', downloadStatusListener);

  try {
    checkCancelled();
    sendProgress('prepare', 1, 'Preparing profile directory');
    await fsp.mkdir(options.root, { recursive: true });

    checkCancelled();
    const javaCheck = await handler.checkJava(options.javaPath || 'java');
    if (!javaCheck.run) {
      const error = new Error('Java found but cannot be executed');
      error.code = 'JAVA_NOT_EXECUTABLE';
      throw error;
    }

    const directory =
      options.overrides.directory ||
      path.join(options.root, 'versions', options.version.custom ? options.version.custom : options.version.number);
    options.directory = directory;
    await fsp.mkdir(directory, { recursive: true });

    checkCancelled();
    sendProgress('metadata', 4, 'Fetching version metadata');
    const versionFile = await handler.getVersion();
    if (!versionFile || versionFile instanceof Error) {
      const error = new Error(`Failed to resolve version ${minecraftVersion}`);
      error.code = 'VERSION_RESOLVE_FAILED';
      throw error;
    }

    options.mcPath =
      options.overrides.minecraftJar ||
      (options.version.custom
        ? path.join(options.root, 'versions', options.version.custom, `${options.version.custom}.jar`)
        : path.join(directory, `${options.version.number}.jar`));

    checkCancelled();
    sendProgress('natives', 10, 'Preparing native libraries');
    await handler.getNatives();

    checkCancelled();
    if (!fs.existsSync(options.mcPath)) {
      sendProgress('jar', 24, 'Downloading Minecraft client');
      await handler.getJar();
    } else {
      sendProgress('jar', 24, 'Minecraft client already downloaded');
    }

    let customJson = null;
    if (options.version.custom) {
      const customJsonPath = path.join(options.root, 'versions', options.version.custom, `${options.version.custom}.json`);
      customJson = JSON.parse(await fsp.readFile(customJsonPath, 'utf8'));
    }

    checkCancelled();
    sendProgress('classes', 30, 'Downloading required libraries');
    await handler.getClasses(customJson);

    checkCancelled();
    sendProgress('assets', 62, 'Downloading assets');
    await handler.getAssets();
    checkCancelled();
  } finally {
    emitter.removeListener('progress', progressListener);
    emitter.removeListener('download', downloadListener);
    emitter.removeListener('download-status', downloadStatusListener);
  }
};

const normalizeVersionSelection = (value) => String(value || '').trim();

const selectPreferredLoaderVersion = (loaders, { preferredVersion = '', includePrerelease = false } = {}) => {
  const requested = normalizeVersionSelection(preferredVersion);
  if (!Array.isArray(loaders) || !loaders.length) return null;

  if (requested) {
    const exact = loaders.find((item) => String(item?.loader?.version || '').trim() === requested);
    if (exact) return exact;
  }

  if (!includePrerelease) {
    const stable = loaders.find((item) => item?.loader?.stable);
    if (stable) return stable;
  }

  return loaders[0] || null;
};

const prepareFabricProfile = async (rootDir, minecraftVersion, { loaderVersion = '', includePrerelease = false } = {}) => {
  const loaders = await fetchJson(`https://meta.fabricmc.net/v2/versions/loader/${encodeURIComponent(minecraftVersion)}`);
  if (!Array.isArray(loaders) || !loaders.length) {
    const error = new Error(`Fabric loader was not found for ${minecraftVersion}`);
    error.code = 'LOADER_NOT_AVAILABLE';
    throw error;
  }

  const preferred = selectPreferredLoaderVersion(loaders, {
    preferredVersion: loaderVersion,
    includePrerelease
  });
  const resolvedLoaderVersion = preferred?.loader?.version;
  if (!resolvedLoaderVersion) {
    throw new Error(`Invalid Fabric loader payload for ${minecraftVersion}`);
  }

  const profile = await fetchJson(
    `https://meta.fabricmc.net/v2/versions/loader/${encodeURIComponent(minecraftVersion)}/${encodeURIComponent(resolvedLoaderVersion)}/profile/json`
  );

  const customVersionId = profile.id || `fabric-loader-${resolvedLoaderVersion}-${minecraftVersion}`;
  profile.id = customVersionId;

  const versionDir = path.join(rootDir, 'versions', customVersionId);
  await fsp.mkdir(versionDir, { recursive: true });
  await fsp.writeFile(path.join(versionDir, `${customVersionId}.json`), JSON.stringify(profile, null, 2), 'utf8');

  return { customVersionId, loaderVersion: resolvedLoaderVersion };
};

const prepareQuiltProfile = async (rootDir, minecraftVersion, { loaderVersion = '', includePrerelease = false } = {}) => {
  const loaders = await fetchJson(`https://meta.quiltmc.org/v3/versions/loader/${encodeURIComponent(minecraftVersion)}`);
  if (!Array.isArray(loaders) || !loaders.length) {
    const error = new Error(`Quilt loader was not found for ${minecraftVersion}`);
    error.code = 'LOADER_NOT_AVAILABLE';
    throw error;
  }

  const preferred = selectPreferredLoaderVersion(loaders, {
    preferredVersion: loaderVersion,
    includePrerelease
  });
  const resolvedLoaderVersion = preferred?.loader?.version;
  if (!resolvedLoaderVersion) {
    throw new Error(`Invalid Quilt loader payload for ${minecraftVersion}`);
  }

  const profile = await fetchJson(
    `https://meta.quiltmc.org/v3/versions/loader/${encodeURIComponent(minecraftVersion)}/${encodeURIComponent(resolvedLoaderVersion)}/profile/json`
  );

  const customVersionId = profile.id || `quilt-loader-${resolvedLoaderVersion}-${minecraftVersion}`;
  profile.id = customVersionId;

  const versionDir = path.join(rootDir, 'versions', customVersionId);
  await fsp.mkdir(versionDir, { recursive: true });
  await fsp.writeFile(path.join(versionDir, `${customVersionId}.json`), JSON.stringify(profile, null, 2), 'utf8');

  return { customVersionId, loaderVersion: resolvedLoaderVersion };
};

const streamDownloadToFile = async ({ url, destination, onProgress, timeoutMs = DEFAULT_DOWNLOAD_TIMEOUT_MS }) => {
  const safeTimeoutMs = Math.max(15_000, Number(timeoutMs) || DEFAULT_DOWNLOAD_TIMEOUT_MS);
  const idleTimeoutMs = Math.min(45_000, Math.max(15_000, Math.floor(safeTimeoutMs / 8)));

  const controller = new AbortController();
  let abortReason = 'total';
  let totalTimer = null;
  let idleTimer = null;

  const clearTimers = () => {
    if (totalTimer) clearTimeout(totalTimer);
    if (idleTimer) clearTimeout(idleTimer);
  };

  const restartIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      abortReason = 'idle';
      controller.abort();
    }, idleTimeoutMs);
  };

  totalTimer = setTimeout(() => {
    abortReason = 'total';
    controller.abort();
  }, safeTimeoutMs);

  let response;
  try {
    response = await fetch(url, {
      headers: REQUEST_HEADERS,
      redirect: 'follow',
      signal: controller.signal
    });
  } catch (error) {
    clearTimers();
    if (error?.name === 'AbortError') {
      const timeoutError = new Error(`Download timed out (${abortReason}) for ${url}`);
      timeoutError.code = 'NETWORK_TIMEOUT';
      timeoutError.details = { url, timeoutMs: safeTimeoutMs, idleTimeoutMs, reason: abortReason };
      throw timeoutError;
    }
    throw error;
  }

  if (!response.ok) {
    clearTimers();
    const error = new Error(`Download failed with HTTP ${response.status}: ${url}`);
    error.code = 'DOWNLOAD_FAILED';
    throw error;
  }

  if (!response.body) {
    clearTimers();
    const error = new Error(`No response body while downloading ${url}`);
    error.code = 'DOWNLOAD_FAILED';
    throw error;
  }

  await fsp.mkdir(path.dirname(destination), { recursive: true });

  const tempFile = `${destination}.part`;
  const writeStream = fs.createWriteStream(tempFile);
  const reader = response.body.getReader();

  const total = Number.parseInt(response.headers.get('content-length') || '0', 10) || 0;
  let transferred = 0;

  const closeWriter = async () =>
    new Promise((resolve, reject) => {
      writeStream.end((error) => (error ? reject(error) : resolve()));
    });

  restartIdleTimer();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      restartIdleTimer();

      const buffer = Buffer.from(value);
      transferred += buffer.length;

      await new Promise((resolve, reject) => {
        writeStream.write(buffer, (error) => (error ? reject(error) : resolve()));
      });

      if (onProgress) {
        // Some Forge mirrors do not return content-length; keep progress moving instead of freezing at 90%.
        const percent = total > 0 ? Math.round((transferred / total) * 100) : Math.min(95, Math.max(1, Math.round(transferred / (1024 * 1024))));
        onProgress({ transferred, total, percent: Math.max(0, Math.min(100, percent)) });
      }
    }

    if (onProgress) {
      onProgress({ transferred, total, percent: 100 });
    }

    await closeWriter();
    await fsp.rename(tempFile, destination);
  } catch (error) {
    writeStream.destroy();
    await safeUnlink(tempFile);
    if (error?.name === 'AbortError') {
      const timeoutError = new Error(`Download timed out (${abortReason}) for ${url}`);
      timeoutError.code = 'NETWORK_TIMEOUT';
      timeoutError.details = { url, timeoutMs: safeTimeoutMs, idleTimeoutMs, reason: abortReason };
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimers();
  }

  return {
    destination,
    transferred,
    total
  };
};

const streamDownloadToFileViaNodeHttp = async ({ url, destination, onProgress, timeoutMs = DEFAULT_DOWNLOAD_TIMEOUT_MS, maxRedirects = 6 }) => {
  const safeTimeoutMs = Math.max(15_000, Number(timeoutMs) || DEFAULT_DOWNLOAD_TIMEOUT_MS);
  const idleTimeoutMs = Math.min(60_000, Math.max(15_000, Math.floor(safeTimeoutMs / 6)));
  const tempFile = `${destination}.part`;

  const toTimeoutError = (reason, targetUrl) => {
    const error = new Error(`Download timed out (${reason}) for ${targetUrl}`);
    error.code = 'NETWORK_TIMEOUT';
    error.details = { url: targetUrl, timeoutMs: safeTimeoutMs, idleTimeoutMs, reason };
    return error;
  };

  const toDownloadError = (statusCode, targetUrl) => {
    const error = new Error(`Download failed with HTTP ${statusCode}: ${targetUrl}`);
    error.code = 'DOWNLOAD_FAILED';
    error.details = { url: targetUrl, statusCode };
    return error;
  };

  await fsp.mkdir(path.dirname(destination), { recursive: true });
  await safeUnlink(tempFile);

  const downloadWithRedirects = (targetUrl, redirectsLeft) =>
    new Promise((resolve, reject) => {
      let settled = false;
      let requestRef = null;
      let responseRef = null;
      let writeStream = null;

      const finishWithError = async (error) => {
        if (settled) return;
        settled = true;
        if (requestRef) requestRef.destroy();
        if (responseRef) responseRef.destroy();
        if (writeStream) writeStream.destroy();
        await safeUnlink(tempFile);
        reject(error);
      };

      const parsedUrl = new URL(targetUrl);
      const transport = parsedUrl.protocol === 'http:' ? http : https;
      const totalTimer = setTimeout(() => {
        void finishWithError(toTimeoutError('total', targetUrl));
      }, safeTimeoutMs);

      requestRef = transport.request(
        targetUrl,
        {
          method: 'GET',
          headers: {
            ...REQUEST_HEADERS,
            'Accept-Encoding': 'identity'
          }
        },
        (response) => {
          responseRef = response;
          const statusCode = Number(response.statusCode || 0);

          if ([301, 302, 303, 307, 308].includes(statusCode)) {
            const location = response.headers.location;
            response.resume();
            clearTimeout(totalTimer);

            if (!location) {
              void finishWithError(toDownloadError(statusCode, targetUrl));
              return;
            }

            if (redirectsLeft <= 0) {
              const redirectError = new Error(`Too many redirects while downloading ${targetUrl}`);
              redirectError.code = 'DOWNLOAD_FAILED';
              redirectError.details = { url: targetUrl, redirects: maxRedirects };
              void finishWithError(redirectError);
              return;
            }

            settled = true;
            const nextUrl = new URL(location, targetUrl).toString();
            downloadWithRedirects(nextUrl, redirectsLeft - 1).then(resolve).catch(reject);
            return;
          }

          if (statusCode < 200 || statusCode >= 300) {
            response.resume();
            clearTimeout(totalTimer);
            void finishWithError(toDownloadError(statusCode, targetUrl));
            return;
          }

          const total = Number.parseInt(String(response.headers['content-length'] || '0'), 10) || 0;
          let transferred = 0;

          writeStream = fs.createWriteStream(tempFile, { flags: 'w' });

          requestRef.setTimeout(idleTimeoutMs, () => {
            void finishWithError(toTimeoutError('idle', targetUrl));
          });

          response.on('data', (chunk) => {
            transferred += chunk.length;
            if (onProgress) {
              const percent = total > 0 ? Math.round((transferred / total) * 100) : Math.min(95, Math.max(1, Math.round(transferred / (1024 * 1024))));
              onProgress({ transferred, total, percent: Math.max(0, Math.min(100, percent)) });
            }
          });

          response.on('error', (error) => {
            clearTimeout(totalTimer);
            void finishWithError(error);
          });

          writeStream.on('error', (error) => {
            clearTimeout(totalTimer);
            void finishWithError(error);
          });

          writeStream.on('finish', () => {
            if (settled) return;
            settled = true;
            clearTimeout(totalTimer);
            resolve({ transferred, total, finalUrl: targetUrl });
          });

          response.pipe(writeStream);
        }
      );

      requestRef.on('error', (error) => {
        clearTimeout(totalTimer);
        void finishWithError(error);
      });

      requestRef.end();
    });

  const result = await downloadWithRedirects(url, maxRedirects);
  if (onProgress) {
    onProgress({ transferred: result.transferred, total: result.total, percent: 100 });
  }
  await fsp.rename(tempFile, destination);

  return {
    destination,
    transferred: result.transferred,
    total: result.total
  };
};

const emitLaunchDebug = (event, instanceId, instanceName, message) => {
  emitToSender(event, 'minecraft:launch-state', {
    instanceId,
    instanceName,
    state: 'debug',
    message: redactSensitiveText(message)
  });
};

const ensureOfflineMultiplayerFix = async ({ event, instanceId, instanceName, installPath, minecraftVersion, loader }) => {
  if (!isOfflineMultiplayerAffectedVersion(minecraftVersion)) {
    return { status: 'skipped', reason: 'version-not-affected' };
  }

  const artifact = resolveOfflineMultiplayerFixArtifact(loader, minecraftVersion);
  if (!artifact) {
    emitLaunchDebug(
      event,
      instanceId,
      instanceName,
      '[OfflineFix] Offline multiplayer patch is not available for this loader. Use Fabric/Quilt/Forge on 1.16.4/1.16.5.'
    );
    return { status: 'skipped', reason: 'loader-not-supported' };
  }

  const modsDir = path.join(installPath, 'mods');
  await fsp.mkdir(modsDir, { recursive: true });

  const candidateEntries = await fsp.readdir(modsDir, { withFileTypes: true });
  const existingJar = candidateEntries.find((entry) => entry.isFile() && /^MultiOfflineFix-.*\.jar$/i.test(entry.name));
  if (existingJar) {
    return { status: 'ready', source: 'existing-jar', filePath: path.join(modsDir, existingJar.name) };
  }

  const existingDisabled = candidateEntries.find((entry) => entry.isFile() && /^MultiOfflineFix-.*\.disable$/i.test(entry.name));
  if (existingDisabled) {
    const fromPath = path.join(modsDir, existingDisabled.name);
    const toPath = fromPath.replace(/\.disable$/i, '.jar');
    await safeUnlink(toPath);
    await fsp.rename(fromPath, toPath);
    emitLaunchDebug(event, instanceId, instanceName, '[OfflineFix] Re-enabled local Multiplayer Fix mod.');
    return { status: 'ready', source: 're-enabled', filePath: toPath };
  }

  const destination = path.join(modsDir, artifact.filename);
  const destinationDisabled = destination.replace(/\.jar$/i, '.disable');
  if (await pathExists(destinationDisabled)) {
    await safeUnlink(destination);
    await fsp.rename(destinationDisabled, destination);
    emitLaunchDebug(event, instanceId, instanceName, '[OfflineFix] Re-enabled Multiplayer Fix mod.');
    return { status: 'ready', source: 're-enabled-target', filePath: destination };
  }

  if (await pathExists(destination)) {
    return { status: 'ready', source: 'existing-target', filePath: destination };
  }

  emitLaunchDebug(event, instanceId, instanceName, '[OfflineFix] Installing Multiplayer Fix for offline profile...');

  let lastReported = -1;
  await streamDownloadToFile({
    url: artifact.url,
    destination,
    onProgress: ({ percent }) => {
      const safePercent = Math.max(0, Math.min(100, Number(percent || 0)));
      if (safePercent === 100 || safePercent >= lastReported + 25) {
        lastReported = safePercent;
        emitLaunchDebug(event, instanceId, instanceName, `[OfflineFix] Download ${safePercent}%`);
      }
    }
  });

  emitLaunchDebug(event, instanceId, instanceName, `[OfflineFix] Installed ${artifact.filename}`);
  return { status: 'ready', source: 'downloaded', filePath: destination };
};

const CORE_MOD_IDS = new Set(['minecraft', 'forge', 'neoforge', 'fabric', 'quilt', 'fml', 'mcp']);

const getEnabledModJarNames = async (installPath) => {
  const modsDir = path.join(installPath, 'mods');
  try {
    const entries = await fsp.readdir(modsDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && /\.jar$/i.test(entry.name))
      .map((entry) => entry.name);
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
};

const buildSearchQueryFromJarName = (jarName) => {
  const cleaned = String(jarName || '')
    .replace(/\.jar$/i, '')
    .replace(/[_\-.]?(?:mc)?\d+(?:[._-]\d+)*(?:[a-z]+)?$/i, '')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'mod';
};

const sanitizeDependencyId = (rawValue) => {
  const cleaned = String(rawValue || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\-:.]/g, '');
  if (!cleaned) return null;
  if (CORE_MOD_IDS.has(cleaned)) return null;
  return cleaned;
};

const parseMissingDependencyIds = (crashText) => {
  const text = String(crashText || '');
  if (!text) return [];

  const missing = new Set();

  for (const match of text.matchAll(/requires(?:\s+mods?)?\s*\[([^\]]+)\]/gi)) {
    const list = String(match[1] || '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    for (const entry of list) {
      const candidate = sanitizeDependencyId(entry.split('@')[0]);
      if (candidate) missing.add(candidate);
    }
  }

  for (const match of text.matchAll(/of\s+([a-z0-9_\-:.]+)\s*,\s*which is missing!?/gi)) {
    const candidate = sanitizeDependencyId(match[1]);
    if (candidate) missing.add(candidate);
  }

  for (const match of text.matchAll(/Install\s+([a-z0-9_\-:.]+)\s*,\s*any version/gi)) {
    const candidate = sanitizeDependencyId(match[1]);
    if (candidate) missing.add(candidate);
  }

  for (const match of text.matchAll(/depends on\s+([a-z0-9_\-:.]+).*missing/gi)) {
    const candidate = sanitizeDependencyId(match[1]);
    if (candidate) missing.add(candidate);
  }

  const lines = text.split(/\r?\n/);
  const missingStart = lines.findIndex((line) => /Missing Mods:/i.test(line));
  if (missingStart >= 0) {
    for (let index = missingStart + 1; index < Math.min(lines.length, missingStart + 15); index += 1) {
      const line = lines[index].trim();
      if (!line || /^[-=]{3,}/.test(line)) break;

      const asPair = line.match(/^([a-z0-9_\-:.]+)\s*:/i);
      const asArrow = line.match(/->\s*([a-z0-9_\-:.]+)/i);
      const candidate = sanitizeDependencyId((asPair?.[1] || asArrow?.[1] || '').trim());
      if (candidate) missing.add(candidate);
    }
  }

  return [...missing];
};

const assertKnownModCompatibility = async ({ installPath, minecraftVersion, loader }) => {
  if (loader !== 'forge') return;
  if (compareGameVersions(minecraftVersion, '1.8.9') >= 0) return;

  const modJars = await getEnabledModJarNames(installPath);
  const replayModJar = modJars.find((name) => /^replaymod-.*\.jar$/i.test(name));
  if (!replayModJar) return;

  const error = new Error(
    `Replay Mod (${replayModJar}) is incompatible with Forge ${minecraftVersion}. ` +
      'Use Minecraft 1.8.9 for this mod or disable Replay Mod.'
  );
  error.code = 'MOD_INCOMPATIBLE';
  error.details = {
    loader,
    minecraftVersion,
    modJar: replayModJar,
    suggestedVersion: '1.8.9',
    installCandidates: [{ query: buildSearchQueryFromJarName(replayModJar) }]
  };
  throw error;
};

const trimCrashLine = (value, maxLength = 220) => {
  const text = String(value || '').trim().replace(/\s+/g, ' ');
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
};

const parseCrashInfo = (content, minecraftVersion, loader) => {
  const text = String(content || '');
  if (!text) return null;

  if (
    loader === 'forge' &&
    compareGameVersions(minecraftVersion, '1.8.9') < 0 &&
    /mixins\.replay\.replaymod\.json/i.test(text)
  ) {
    const replayJarMatch = text.match(/replaymod-[^\s)]+\.jar/i);
    const modJar = replayJarMatch ? replayJarMatch[0] : 'replaymod.jar';
    return {
      code: 'MOD_INCOMPATIBLE',
      message: 'Replay Mod is incompatible with this Forge version. Switch instance to 1.8.9 or disable Replay Mod.',
      details: {
        loader,
        minecraftVersion,
        modJar,
        suggestedVersion: '1.8.9',
        installCandidates: [{ query: buildSearchQueryFromJarName(modJar) }]
      }
    };
  }

  const requiredMods = parseMissingDependencyIds(text);
  if (requiredMods.length) {
    return {
      code: 'MOD_DEPENDENCY_MISSING',
      message: `Missing required mods: ${requiredMods.join(', ')}.`,
      details: {
        loader,
        minecraftVersion,
        requiredMods,
        installCandidates: requiredMods.map((id) => ({ query: id }))
      }
    };
  }

  const causedByLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith('Caused by:'));

  if (causedByLine) {
    return {
      code: 'GAME_CRASHED',
      message: `Minecraft crashed: ${trimCrashLine(causedByLine.replace(/^Caused by:\s*/i, ''))}`,
      details: { loader, minecraftVersion }
    };
  }

  const descriptionMatch = text.match(/Description:\s*(.+)/i);
  if (descriptionMatch?.[1]) {
    return {
      code: 'GAME_CRASHED',
      message: `Minecraft crashed: ${trimCrashLine(descriptionMatch[1])}`,
      details: { loader, minecraftVersion }
    };
  }

  return {
    code: 'GAME_CRASHED',
    message: 'Minecraft crashed right after launch. Check crash-reports for details.',
    details: { loader, minecraftVersion }
  };
};

const readRecentCrashInfo = async ({ installPath, startedAtMs, minecraftVersion, loader }) => {
  const crashDir = path.join(installPath, 'crash-reports');
  let entries = [];
  try {
    entries = await fsp.readdir(crashDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    return null;
  }

  const reportFiles = entries
    .filter((entry) => entry.isFile() && /^crash-.*-client\.txt$/i.test(entry.name))
    .map((entry) => path.join(crashDir, entry.name));
  if (!reportFiles.length) return null;

  const reportStats = await Promise.all(
    reportFiles.map(async (filePath) => {
      try {
        const stat = await fsp.stat(filePath);
        return { filePath, mtimeMs: stat.mtimeMs };
      } catch {
        return null;
      }
    })
  );

  const newest = reportStats
    .filter(Boolean)
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .find((entry) => entry.mtimeMs >= startedAtMs - 60 * 1000);
  if (!newest) return null;

  try {
    const content = await fsp.readFile(newest.filePath, 'utf8');
    return parseCrashInfo(content, minecraftVersion, loader);
  } catch {
    return null;
  }
};

const parseLaunchLogInfo = (content, minecraftVersion, loader) => {
  const text = String(content || '');
  if (!text) return null;

  const requiredMods = parseMissingDependencyIds(text);
  if (requiredMods.length) {
    return {
      code: 'MOD_DEPENDENCY_MISSING',
      message: `Missing required mods: ${requiredMods.join(', ')}.`,
      details: {
        loader,
        minecraftVersion,
        requiredMods,
        installCandidates: requiredMods.map((id) => ({ query: id }))
      }
    };
  }

  if (/Incompatible mods found!/i.test(text) || /Some of your mods are incompatible/i.test(text)) {
    const problematicMods = [...new Set([...text.matchAll(/Mod\s+'[^']+'\s+\(([a-z0-9_\-:.]+)\)/gi)].map((match) => sanitizeDependencyId(match[1])).filter(Boolean))];
    return {
      code: 'MOD_INCOMPATIBLE',
      message: 'Some installed mods are incompatible with this game version or loader.',
      details: {
        loader,
        minecraftVersion,
        problematicMods,
        installCandidates: problematicMods.map((id) => ({ query: id }))
      }
    };
  }

  return null;
};

const readRecentLatestLogInfo = async ({ installPath, startedAtMs, minecraftVersion, loader }) => {
  const latestLogPath = path.join(installPath, 'logs', 'latest.log');
  try {
    const stat = await fsp.stat(latestLogPath);
    if (!stat.isFile()) return null;
    if (stat.mtimeMs < startedAtMs - 60 * 1000) return null;

    const raw = await fsp.readFile(latestLogPath, 'utf8');
    if (!raw) return null;
    const lines = raw.split(/\r?\n/);
    const tail = lines.slice(-800).join('\n');
    return parseLaunchLogInfo(tail, minecraftVersion, loader);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    return null;
  }
};

const parseForgePromotions = async () => {
  if (forgePromotionsCache) return forgePromotionsCache;
  const payload = await fetchJson('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json');
  forgePromotionsCache = payload;
  return payload;
};

const resolveForgeVersion = async (minecraftVersion, preferredVersion = '') => {
  const explicitVersion = normalizeVersionSelection(preferredVersion);
  if (explicitVersion) return explicitVersion;

  const payload = await parseForgePromotions();
  const promos = payload?.promos || {};
  const recommended = promos[`${minecraftVersion}-recommended`];
  const latest = promos[`${minecraftVersion}-latest`];
  const forgeVersion = recommended || latest;

  if (!forgeVersion) {
    const error = new Error(`Forge was not found for ${minecraftVersion}`);
    error.code = 'LOADER_NOT_AVAILABLE';
    throw error;
  }

  return forgeVersion;
};

const ensureForgeJar = async ({ minecraftVersion, forgeVersion, onProgress }) => {
  const isLegacyUniversal = compareGameVersions(minecraftVersion, '1.12.2') <= 0;
  const baseName = `forge-${minecraftVersion}-${forgeVersion}`;
  const mirrorBases = ['https://maven.minecraftforge.net', 'https://maven.creeperhost.net', 'https://files.minecraftforge.net/maven'];
  const classifiers = isLegacyUniversal ? ['universal', 'installer'] : ['installer', 'universal'];
  const attemptErrors = [];

  for (const classifier of classifiers) {
    const filename = `${baseName}-${classifier}.jar`;
    const relativePath = `net/minecraftforge/forge/${minecraftVersion}-${forgeVersion}/${filename}`;
    const destination = path.join(getCacheRoot(), 'forge', minecraftVersion, forgeVersion, filename);

    for (const mirrorBase of mirrorBases) {
      const url = `${mirrorBase}/${relativePath}`;
      try {
        const cacheValid = await hasValidJarCache(destination);
        if (!cacheValid) {
          await safeUnlink(destination);
          await streamDownloadToFileViaNodeHttp({
            url,
            destination,
            onProgress,
            timeoutMs: 1000 * 60 * 30
          });
        }

        return {
          forgeJarPath: destination,
          forgeVersion,
          classifier,
          mirrorBase
        };
      } catch (error) {
        attemptErrors.push(`${classifier} @ ${mirrorBase}: ${error?.message || String(error)}`);
        await safeUnlink(destination);
      }
    }
  }

  const error = new Error(`Unable to download Forge installer for ${minecraftVersion}`);
  error.code = 'LOADER_NOT_AVAILABLE';
  error.details = attemptErrors.slice(-8);
  throw error;
};

const parseNeoForgeVersionsFromXml = (xmlPayload) => {
  return [...String(xmlPayload || '').matchAll(/<version>([^<]+)<\/version>/g)]
    .map((match) => match[1])
    .filter(Boolean);
};

const getNeoForgeVersions = async () => {
  if (neoForgeVersionsCache) return neoForgeVersionsCache;
  const xml = await fetchText('https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml');
  neoForgeVersionsCache = parseNeoForgeVersionsFromXml(xml);
  return neoForgeVersionsCache;
};

const compareDotVersions = (left, right) => {
  const leftParts = String(left || '')
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = String(right || '')
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);

  return compareVersionTuple(leftParts, rightParts);
};

const compareDotVersionsDesc = (left, right) => compareDotVersions(right, left);

const listNeoForgeVersionsForMinecraft = async (minecraftVersion) => {
  const tuple = parseGameVersion(minecraftVersion);
  if (!tuple) return [];

  const [, minor, patch] = tuple;
  const exactPrefix = `${minor}.${patch}`;
  const broadPrefix = `${minor}`;
  const versions = await getNeoForgeVersions();

  const exact = versions
    .filter((item) => item === exactPrefix || item.startsWith(`${exactPrefix}.`))
    .sort(compareDotVersionsDesc);
  const broad = versions
    .filter((item) => item === broadPrefix || item.startsWith(`${broadPrefix}.`))
    .sort(compareDotVersionsDesc);

  return [...new Set([...exact, ...broad])];
};

const resolveNeoForgeVersion = async (minecraftVersion, preferredVersion = '') => {
  const explicitVersion = normalizeVersionSelection(preferredVersion);
  if (explicitVersion) return explicitVersion;

  if (!parseGameVersion(minecraftVersion)) {
    const error = new Error(`Invalid Minecraft version: ${minecraftVersion}`);
    error.code = 'INVALID_VERSION';
    throw error;
  }

  const candidates = await listNeoForgeVersionsForMinecraft(minecraftVersion);
  if (candidates.length) {
    return candidates[0];
  }

  const error = new Error(`NeoForge was not found for ${minecraftVersion}`);
  error.code = 'LOADER_NOT_AVAILABLE';
  throw error;
};

const listLoaderVersionsInternal = async ({ loader, minecraftVersion, includePrerelease = false }) => {
  const normalizedLoader = normalizeLoader(loader);
  const targetVersion = String(minecraftVersion || '').trim();
  const withPrerelease = includePrerelease === true;

  if (!targetVersion) {
    const error = new Error('minecraftVersion is required for loader version list.');
    error.code = 'INVALID_LOADER_VERSION_PAYLOAD';
    throw error;
  }

  if (normalizedLoader === 'vanilla') {
    return [];
  }

  const cacheKey = `${normalizedLoader}:${targetVersion}:${withPrerelease ? 'all' : 'stable'}`;
  const cached = loaderVersionsCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt && Array.isArray(cached.values)) {
    return cached.values;
  }

  let values = [];

  if (normalizedLoader === 'fabric') {
    const loaders = await fetchJson(`https://meta.fabricmc.net/v2/versions/loader/${encodeURIComponent(targetVersion)}`);
    const mapped = (Array.isArray(loaders) ? loaders : [])
      .map((item) => {
        const id = String(item?.loader?.version || '').trim();
        if (!id) return null;
        const stable = item?.loader?.stable === true;
        return {
          id,
          stable,
          prerelease: !stable
        };
      })
      .filter(Boolean);
    const stableOnly = mapped.filter((item) => item.stable);
    values = (withPrerelease ? mapped : stableOnly.length ? stableOnly : mapped).sort((a, b) => compareDotVersionsDesc(a.id, b.id));
  } else if (normalizedLoader === 'quilt') {
    const loaders = await fetchJson(`https://meta.quiltmc.org/v3/versions/loader/${encodeURIComponent(targetVersion)}`);
    const mapped = (Array.isArray(loaders) ? loaders : [])
      .map((item) => {
        const id = String(item?.loader?.version || '').trim();
        if (!id) return null;
        const stable = item?.loader?.stable === true;
        return {
          id,
          stable,
          prerelease: !stable
        };
      })
      .filter(Boolean);
    const stableOnly = mapped.filter((item) => item.stable);
    values = (withPrerelease ? mapped : stableOnly.length ? stableOnly : mapped).sort((a, b) => compareDotVersionsDesc(a.id, b.id));
  } else if (normalizedLoader === 'forge') {
    const payload = await parseForgePromotions();
    const promos = payload?.promos || {};
    const latest = normalizeVersionSelection(promos[`${targetVersion}-latest`]);
    const recommended = normalizeVersionSelection(promos[`${targetVersion}-recommended`]);
    const ordered = [latest, recommended].filter(Boolean);
    values = [...new Set(ordered)].map((id, index) => ({
      id,
      stable: index !== 0 || !recommended || recommended === id,
      prerelease: false
    }));
  } else if (normalizedLoader === 'neoforge') {
    const versions = await listNeoForgeVersionsForMinecraft(targetVersion);
    values = versions.map((id) => ({
      id,
      stable: true,
      prerelease: false
    }));
  }

  const normalizedValues = values.map((entry) => ({
    id: entry.id,
    name: entry.id,
    stable: entry.stable !== false,
    prerelease: entry.prerelease === true
  }));

  loaderVersionsCache.set(cacheKey, {
    values: normalizedValues,
    expiresAt: Date.now() + 1000 * 60 * 10
  });

  return normalizedValues;
};

const listVersionDirectories = async (rootDir) => {
  const versionsDir = path.join(rootDir, 'versions');
  if (!(await pathExists(versionsDir))) return [];

  const entries = await fsp.readdir(versionsDir, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
};

const detectNeoForgeVersionId = async (rootDir, minecraftVersion, beforeList = []) => {
  const afterList = await listVersionDirectories(rootDir);
  const beforeSet = new Set(beforeList);

  const newEntries = afterList.filter((entry) => !beforeSet.has(entry));
  const newNeoForge = newEntries.filter((entry) => entry.toLowerCase().includes('neoforge'));
  if (newNeoForge.length) {
    return newNeoForge.sort().at(-1);
  }

  const existingNeoForge = afterList.filter((entry) => entry.toLowerCase().includes('neoforge'));
  if (existingNeoForge.length) {
    const normalizedVersion = minecraftVersion.replace(/\./g, '');
    const matching = existingNeoForge.filter(
      (entry) => entry.includes(minecraftVersion) || entry.replace(/\./g, '').includes(normalizedVersion)
    );
    return (matching.length ? matching : existingNeoForge).sort().at(-1);
  }

  return null;
};

const runJavaCommand = async (javaPath, args, cwd) => {
  return execFileAsync(javaPath, args, {
    cwd,
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 8,
    timeout: 1000 * 60 * 30
  });
};

const ensureNeoForgeProfile = async ({ javaPath, rootDir, minecraftVersion, preferredLoaderVersion = '', onProgress }) => {
  const neoForgeVersion = await resolveNeoForgeVersion(minecraftVersion, preferredLoaderVersion);
  const filename = `neoforge-${neoForgeVersion}-installer.jar`;
  const relativePath = `net/neoforged/neoforge/${neoForgeVersion}/${filename}`;
  const url = `https://maven.neoforged.net/releases/${relativePath}`;
  const installerPath = path.join(getCacheRoot(), 'neoforge', minecraftVersion, neoForgeVersion, filename);

  if (!(await pathExists(installerPath))) {
    await streamDownloadToFile({
      url,
      destination: installerPath,
      onProgress
    });
  }

  const before = await listVersionDirectories(rootDir);

  const commandVariants = [
    ['-jar', installerPath, '--install-client', rootDir],
    ['-jar', installerPath, '--installClient', rootDir],
    ['-jar', installerPath, '--install-client'],
    ['-jar', installerPath, '--installClient']
  ];

  const errors = [];
  for (const args of commandVariants) {
    try {
      await runJavaCommand(javaPath, args, rootDir);
      const customVersionId = await detectNeoForgeVersionId(rootDir, minecraftVersion, before);
      if (!customVersionId) {
        const error = new Error('NeoForge installer finished but no NeoForge profile was detected in versions folder.');
        error.code = 'NEOFORGE_PROFILE_NOT_FOUND';
        throw error;
      }

      return {
        customVersionId,
        neoForgeVersion,
        installerPath
      };
    } catch (error) {
      errors.push(error.message || String(error));
    }
  }

  const fatal = new Error('NeoForge installer failed. Try another version or loader.');
  fatal.code = 'NEOFORGE_INSTALL_FAILED';
  fatal.details = errors;
  throw fatal;
};

const installInstanceInternal = async (event, payload) => {
  const instanceId = normalizeId(payload.instanceId);
  const instanceName = String(payload.instanceName || `Instance ${instanceId}`).trim() || `Instance ${instanceId}`;
  const minecraftVersion = String(payload.version || '').trim();
  const loader = normalizeLoader(payload.loader || 'vanilla');
  const preferredLoaderVersion = normalizeVersionSelection(payload?.loaderVersion);
  const includePrereleaseLoaders = payload?.includePrereleaseLoaders === true || payload?.showPrereleaseVersions === true;

  if (!instanceId) {
    const error = new Error('Instance id is required');
    error.code = 'INVALID_INSTANCE';
    throw error;
  }

  if (!minecraftVersion) {
    const error = new Error('Minecraft version is required');
    error.code = 'INVALID_VERSION';
    throw error;
  }

  ensureLoaderSupportsVersion(loader, minecraftVersion);
  assertInstallNotCancelled(instanceId);

  const sendProgress = (stage, percent, message) => {
    if (isInstallCancelled(instanceId)) return;
    emitToSender(event, 'minecraft:install-progress', {
      instanceId,
      instanceName,
      stage,
      stageLabel: stageLabel(stage),
      percent: Math.max(0, Math.min(100, Math.round(percent))),
      message: message || stageLabel(stage)
    });
  };

  sendProgress('prepare', 1, 'Preparing installation');
  assertInstallNotCancelled(instanceId);

  const installPath = await resolveInstallPath({
    instanceId,
    instanceName,
    preferredInstallPath: payload.installPath
  });

  await fsp.mkdir(installPath, { recursive: true });
  assertInstallNotCancelled(instanceId);

  const requiredJavaMajor = getRequiredJavaMajor(minecraftVersion);
  const javaResolution = await resolveJava(requiredJavaMajor);
  const selectedJava = javaResolution.selected;

  if (!selectedJava) {
    const error = new Error(`Java ${requiredJavaMajor}+ not found. Install Java and retry.`);
    error.code = 'JAVA_REQUIRED';
    error.requiredJavaMajor = requiredJavaMajor;
    error.detectedJavaMajor = javaResolution.detections.length ? Math.max(...javaResolution.detections.map((item) => item.major)) : null;
    error.javaDownloadUrl = getJavaDownloadUrl(requiredJavaMajor);
    throw error;
  }

  let customVersionId = null;
  let loaderVersion = null;
  let forgeJarPath = null;

  if (loader === 'fabric') {
    assertInstallNotCancelled(instanceId);
    sendProgress('loader', 5, 'Resolving Fabric');
    const prepared = await prepareFabricProfile(installPath, minecraftVersion, {
      loaderVersion: preferredLoaderVersion,
      includePrerelease: includePrereleaseLoaders
    });
    customVersionId = prepared.customVersionId;
    loaderVersion = prepared.loaderVersion;
  }

  if (loader === 'quilt') {
    assertInstallNotCancelled(instanceId);
    sendProgress('loader', 5, 'Resolving Quilt');
    const prepared = await prepareQuiltProfile(installPath, minecraftVersion, {
      loaderVersion: preferredLoaderVersion,
      includePrerelease: includePrereleaseLoaders
    });
    customVersionId = prepared.customVersionId;
    loaderVersion = prepared.loaderVersion;
  }

  await installVanillaLikeBase({
    event,
    instanceId,
    instanceName,
    rootDir: installPath,
    minecraftVersion,
    customVersionId,
    javaPath: selectedJava.path,
    assertNotCancelled: assertInstallNotCancelled
  });
  assertInstallNotCancelled(instanceId);

  if (loader === 'forge') {
    sendProgress('loader', 90, 'Resolving Forge version');
    const forgeVersion = await resolveForgeVersion(minecraftVersion, preferredLoaderVersion);
    assertInstallNotCancelled(instanceId);

    const forgeInfo = await ensureForgeJar({
      minecraftVersion,
      forgeVersion,
      onProgress: ({ percent }) => {
        sendProgress('loader', 90 + Math.round(percent * 0.08), `Downloading Forge ${forgeVersion} (${percent}%)`);
      }
    });

    assertInstallNotCancelled(instanceId);
    forgeJarPath = forgeInfo.forgeJarPath;
    loaderVersion = forgeVersion;
    sendProgress('loader', 98, `Forge ${forgeVersion} prepared`);
  }

  if (loader === 'neoforge') {
    sendProgress('loader', 90, 'Resolving NeoForge version');
    assertInstallNotCancelled(instanceId);
    const neoForgeInfo = await ensureNeoForgeProfile({
      javaPath: selectedJava.path,
      rootDir: installPath,
      minecraftVersion,
      preferredLoaderVersion,
      onProgress: ({ percent }) => {
        sendProgress('loader', 90 + Math.round(percent * 0.08), `Downloading NeoForge installer (${percent}%)`);
      }
    });

    assertInstallNotCancelled(instanceId);
    customVersionId = neoForgeInfo.customVersionId;
    loaderVersion = neoForgeInfo.neoForgeVersion;
    sendProgress('loader', 98, `NeoForge ${neoForgeInfo.neoForgeVersion} installed`);
  }

  assertInstallNotCancelled(instanceId);
  await writeProfileMeta(installPath, {
    instanceId,
    instanceName,
    minecraftVersion,
    loader,
    loaderVersion: loaderVersion || preferredLoaderVersion || null,
    updatedAt: new Date().toISOString()
  });

  // Apply Minecraft language only when a fresh installation is performed.
  const installedLanguage = await applyLanguageToOptions(installPath, payload?.launcherLanguage || 'en');
  assertInstallNotCancelled(instanceId);

  sendProgress('done', 100, 'Installation completed');

  return {
    installPath,
    javaPath: selectedJava.path,
    javaMajor: selectedJava.major,
    requiredJavaMajor,
    customVersionId,
    loaderVersion,
    forgeJarPath,
    installedLanguage
  };
};
const resolveFabricCustomVersion = async (rootDir, minecraftVersion, preferredCustomId) => {
  if (preferredCustomId) {
    const preferredJson = path.join(rootDir, 'versions', preferredCustomId, `${preferredCustomId}.json`);
    if (fs.existsSync(preferredJson)) return preferredCustomId;
  }

  const versions = await listVersionDirectories(rootDir);
  const candidates = versions
    .filter((name) => name.startsWith('fabric-loader-') && name.endsWith(`-${minecraftVersion}`))
    .sort();

  return candidates.at(-1) || null;
};

const resolveQuiltCustomVersion = async (rootDir, minecraftVersion, preferredCustomId) => {
  if (preferredCustomId) {
    const preferredJson = path.join(rootDir, 'versions', preferredCustomId, `${preferredCustomId}.json`);
    if (fs.existsSync(preferredJson)) return preferredCustomId;
  }

  const versions = await listVersionDirectories(rootDir);
  const candidates = versions
    .filter((name) => name.startsWith('quilt-loader-') && name.endsWith(`-${minecraftVersion}`))
    .sort();

  return candidates.at(-1) || null;
};

const resolveNeoForgeCustomVersion = async (rootDir, minecraftVersion, preferredCustomId) => {
  if (preferredCustomId) {
    const preferredJson = path.join(rootDir, 'versions', preferredCustomId, `${preferredCustomId}.json`);
    if (fs.existsSync(preferredJson)) return preferredCustomId;
  }

  return detectNeoForgeVersionId(rootDir, minecraftVersion, []);
};

const launchInstanceInternal = async (event, payload) => {
  const instanceId = normalizeId(payload.instanceId);
  const instanceName = String(payload.instanceName || `Instance ${instanceId}`).trim() || `Instance ${instanceId}`;

  const runningEntry = runningGames.get(instanceId);
  const runningChild = runningEntry?.child;
  if (runningEntry && runningChild && (runningChild.killed || runningChild.exitCode !== null)) {
    runningGames.delete(instanceId);
  }

  if (launchingGames.has(instanceId)) {
    const error = new Error('This instance is already launching');
    error.code = 'INSTANCE_LAUNCHING';
    throw error;
  }

  if (runningGames.has(instanceId)) {
    const error = new Error('This instance is already running');
    error.code = 'INSTANCE_ALREADY_RUNNING';
    throw error;
  }

  launchingGames.add(instanceId);
  try {
    const installPath = path.resolve(payload.installPath || '');
    const minecraftVersion = String(payload.version || '').trim();
    const loader = normalizeLoader(payload.loader || 'vanilla');
    const preferredLoaderVersion = normalizeVersionSelection(payload?.loaderVersion);

    if (!minecraftVersion) {
      const error = new Error('Minecraft version is required');
      error.code = 'INVALID_VERSION';
      throw error;
    }

    ensureLoaderSupportsVersion(loader, minecraftVersion);

    if (!installPath || !fs.existsSync(installPath)) {
      const error = new Error('Install path does not exist. Install the instance first.');
      error.code = 'INSTALL_PATH_NOT_FOUND';
      throw error;
    }

    const requiredJavaMajor = getRequiredJavaMajor(minecraftVersion);
    const javaResolution = await resolveJava(requiredJavaMajor);
    const selectedJava = javaResolution.selected;

    if (!selectedJava) {
      const error = new Error(`Java ${requiredJavaMajor}+ not found. Install Java and retry.`);
      error.code = 'JAVA_REQUIRED';
      error.requiredJavaMajor = requiredJavaMajor;
      error.detectedJavaMajor = javaResolution.detections.length ? Math.max(...javaResolution.detections.map((item) => item.major)) : null;
      error.javaDownloadUrl = getJavaDownloadUrl(requiredJavaMajor);
      throw error;
    }

    let customVersionId = null;
    let forgeJarPath = null;

    if (loader === 'fabric') {
      customVersionId = await resolveFabricCustomVersion(installPath, minecraftVersion, payload.customVersionId);
      if (!customVersionId) {
        const error = new Error('Fabric is not installed for this instance.');
        error.code = 'LOADER_NOT_INSTALLED';
        throw error;
      }
    }

    if (loader === 'quilt') {
      customVersionId = await resolveQuiltCustomVersion(installPath, minecraftVersion, payload.customVersionId);
      if (!customVersionId) {
        const error = new Error('Quilt is not installed for this instance.');
        error.code = 'LOADER_NOT_INSTALLED';
        throw error;
      }
    }

    if (loader === 'neoforge') {
      customVersionId = await resolveNeoForgeCustomVersion(installPath, minecraftVersion, payload.customVersionId);
      if (!customVersionId) {
        const error = new Error('NeoForge is not installed for this instance.');
        error.code = 'LOADER_NOT_INSTALLED';
        throw error;
      }
    }

    if (loader === 'forge') {
      const givenForgePath = payload.forgeJarPath ? path.resolve(payload.forgeJarPath) : null;
      if (givenForgePath && fs.existsSync(givenForgePath)) {
        forgeJarPath = givenForgePath;
      } else {
        const forgeVersion = await resolveForgeVersion(minecraftVersion, preferredLoaderVersion);
        const forgeInfo = await ensureForgeJar({
          minecraftVersion,
          forgeVersion
        });
        forgeJarPath = forgeInfo.forgeJarPath;
      }
    }

    const ramGb = Math.max(2, Number(payload.ramGb || 4));
    const offlineUsername = String(payload.username || 'Player').trim() || 'Player';
    const authResolution = await resolveLaunchAuthorization(offlineUsername);
    const launchAuthorization = authResolution.authorization;
    const launchUsername = authResolution.username;
    const launchAuthMode = authResolution.authMode;

    await assertKnownModCompatibility({
      installPath,
      minecraftVersion,
      loader
    });

    emitLaunchDebug(event, instanceId, instanceName, `[Auth] Launching with ${launchAuthMode} session as ${launchUsername}.`);

    let launchCustomArgs = [];
    if (launchAuthMode === 'offline') {
      try {
        launchCustomArgs = await buildOfflineMultiplayerWorkaroundArgs(minecraftVersion);
        if (launchCustomArgs.length) {
          emitLaunchDebug(
            event,
            instanceId,
            instanceName,
            '[OfflineFix] Enabled built-in offline multiplayer workaround for 1.16.x.'
          );
        }
      } catch (error) {
        emitLaunchDebug(
          event,
          instanceId,
          instanceName,
          `[OfflineFix] Built-in workaround failed: ${error?.message || 'unknown error'}`
        );
      }
    }

    if (launchAuthMode === 'offline' && !launchCustomArgs.length) {
      try {
        await ensureOfflineMultiplayerFix({
          event,
          instanceId,
          instanceName,
          installPath,
          minecraftVersion,
          loader
        });
      } catch (error) {
        emitLaunchDebug(
          event,
          instanceId,
          instanceName,
          `[OfflineFix] Failed to apply patch: ${error?.message || 'unknown error'}`
        );
      }
    }

    try {
      await prepareSkinsForLaunch({
        event,
        instanceId,
        instanceName,
        installPath,
        minecraftVersion,
        loader,
        username: launchUsername
      });
    } catch (error) {
      emitLaunchDebug(event, instanceId, instanceName, `[Skins] Failed to prepare skins: ${error?.message || 'unknown error'}`);
    }

    const launchStartedAtMs = Date.now();
    const launcher = new Client();
    const launchLogBuffer = [];
    const appendLaunchLog = (message) => {
      const lines = redactSensitiveText(message)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (!lines.length) return;
      launchLogBuffer.push(...lines);
      if (launchLogBuffer.length > 1200) {
        launchLogBuffer.splice(0, launchLogBuffer.length - 1200);
      }
    };

    const collectCrashInfoFromRuntime = async (code = null) => {
      let crashInfo = null;
      if (code !== null && code !== 0) {
        crashInfo = await readRecentCrashInfo({
          installPath,
          startedAtMs: launchStartedAtMs,
          minecraftVersion,
          loader
        });
      }

      if (!crashInfo && launchLogBuffer.length) {
        crashInfo = parseLaunchLogInfo(launchLogBuffer.join('\n'), minecraftVersion, loader);
      }

      if (!crashInfo) {
        const runtimeMs = Date.now() - launchStartedAtMs;
        const shouldInspectLatestLog = code !== null && (code !== 0 || runtimeMs < 2 * 60 * 1000);
        if (shouldInspectLatestLog) {
          crashInfo = await readRecentLatestLogInfo({
            installPath,
            startedAtMs: launchStartedAtMs,
            minecraftVersion,
            loader
          });
        }
      }

      return crashInfo;
    };

    let stoppedEmitted = false;
    const emitStopped = (code = null, crashInfo = null) => {
      if (stoppedEmitted) return;
      stoppedEmitted = true;
      runningGames.delete(instanceId);
      emitToSender(event, 'minecraft:launch-state', {
        instanceId,
        instanceName,
        state: 'stopped',
        code,
        ...(crashInfo?.message ? { crashMessage: crashInfo.message } : {}),
        ...(crashInfo?.code ? { crashCode: crashInfo.code } : {}),
        ...(crashInfo?.details ? { crashDetails: crashInfo.details } : {})
      });
    };

    const handleProcessStopped = async (code = null) => {
      if (stoppedEmitted) return;
      const crashInfo = await collectCrashInfoFromRuntime(code);
      if (crashInfo?.message) {
        emitLaunchDebug(event, instanceId, instanceName, `[Crash] ${crashInfo.message}`);
      }
      emitStopped(code, crashInfo);
    };

    launcher.on('close', (code) => {
      void handleProcessStopped(code);
    });

    launcher.on('error', (error) => {
      emitLaunchDebug(
        event,
        instanceId,
        instanceName,
        `[Launch] Launcher error: ${error?.message || 'unknown error'}`
      );
      emitStopped(null);
    });

    launcher.on('debug', (message) => {
      const safeMessage = redactSensitiveText(message);
      appendLaunchLog(safeMessage);
      emitToSender(event, 'minecraft:launch-state', {
        instanceId,
        instanceName,
        state: 'debug',
        message: safeMessage
      });
    });

    launcher.on('data', (message) => {
      const safeMessage = redactSensitiveText(message);
      appendLaunchLog(safeMessage);
      emitToSender(event, 'minecraft:launch-state', {
        instanceId,
        instanceName,
        state: 'log',
        message: safeMessage
      });
    });

    const launchOptions = {
      authorization: launchAuthorization,
      root: installPath,
      javaPath: selectedJava.path,
      version: {
        number: minecraftVersion,
        type: 'release',
        ...(customVersionId ? { custom: customVersionId } : {})
      },
      memory: {
        max: `${ramGb}G`,
        min: '1G'
      },
      overrides: {
        detached: false
      },
      ...(launchCustomArgs.length ? { customArgs: launchCustomArgs } : {}),
      ...(forgeJarPath ? { forge: forgeJarPath } : {})
    };

    const child = await launcher.launch(launchOptions);
    if (!child) {
      const error = new Error('Failed to start Minecraft process');
      error.code = 'LAUNCH_FAILED';
      throw error;
    }

    if (typeof child.once === 'function') {
      child.once('exit', (code) => {
        void handleProcessStopped(code);
      });
      child.once('error', (error) => {
        emitLaunchDebug(
          event,
          instanceId,
          instanceName,
          `[Launch] Process error: ${error?.message || 'unknown error'}`
        );
        emitStopped(null);
      });
    }

    runningGames.set(instanceId, { launcher, child });

    const childExitCode = typeof child.exitCode === 'number' ? child.exitCode : null;
    if (stoppedEmitted || childExitCode !== null) {
      runningGames.delete(instanceId);
      let message = 'Minecraft process exited right after launch.';
      let errorCode = 'LAUNCH_FAILED';
      let errorDetails = { exitCode: childExitCode };
      const crashInfo = await collectCrashInfoFromRuntime(childExitCode);
      if (crashInfo?.message) message = crashInfo.message;
      if (crashInfo?.code) {
        errorCode = crashInfo.code;
      } else if (childExitCode !== null && childExitCode !== 0) {
        errorCode = 'GAME_CRASHED';
      }
      if (crashInfo?.details && typeof crashInfo.details === 'object') {
        errorDetails = { ...errorDetails, ...crashInfo.details };
      }
      const error = new Error(message);
      error.code = errorCode;
      error.details = errorDetails;
      throw error;
    }

    emitToSender(event, 'minecraft:launch-state', {
      instanceId,
      instanceName,
      state: 'running',
      pid: child.pid || null
    });

    return {
      pid: child.pid || null,
      javaPath: selectedJava.path,
      javaMajor: selectedJava.major,
      requiredJavaMajor,
      customVersionId,
      forgeJarPath,
      username: launchUsername
    };
  } finally {
    launchingGames.delete(instanceId);
  }
};

const stopInstanceInternal = async (payload) => {
  const instanceId = normalizeId(payload?.instanceId);
  if (!instanceId) {
    const error = new Error('instanceId is required to stop Minecraft.');
    error.code = 'INVALID_STOP_PAYLOAD';
    throw error;
  }

  const runningEntry = runningGames.get(instanceId);
  const child = runningEntry?.child;
  if (!runningEntry || !child) {
    return {
      instanceId,
      requested: false,
      running: false
    };
  }

  if (child.exitCode !== null || child.killed) {
    runningGames.delete(instanceId);
    return {
      instanceId,
      requested: false,
      running: false
    };
  }

  const pid = Number(child.pid || 0);

  if (process.platform === 'win32' && pid > 0) {
    try {
      await execFileAsync('taskkill', ['/PID', String(pid), '/T', '/F']);
    } catch {
      try {
        child.kill('SIGTERM');
      } catch {
        // noop
      }
    }
  } else {
    try {
      child.kill('SIGTERM');
    } catch {
      // noop
    }
  }

  return {
    instanceId,
    pid: pid || null,
    requested: true,
    running: true
  };
};
const getFallbackGameVersions = (includeSnapshots = false) =>
  includeSnapshots ? [...FALLBACK_PRERELEASE_VERSIONS, ...FALLBACK_RELEASE_VERSIONS] : FALLBACK_RELEASE_VERSIONS;

const sortGameVersionsDesc = (left, right) => {
  const byParsed = compareGameVersions(right, left);
  if (byParsed !== 0) return byParsed;
  return String(right || '').localeCompare(String(left || ''), 'en', { sensitivity: 'base' });
};

const getGameVersions = async ({ includeSnapshots = false } = {}) => {
  const mode = includeSnapshots ? 'all' : 'release';
  const cacheEntry = cachedVersions[mode];

  if (cacheEntry && Date.now() < cacheEntry.expiresAt && cacheEntry.values?.length) {
    return cacheEntry.values;
  }

  try {
    const manifest = await fetchJson('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
    const allowedTypes = includeSnapshots ? new Set(['release', 'snapshot']) : new Set(['release']);
    const versions = (manifest?.versions || [])
      .filter((entry) => allowedTypes.has(String(entry?.type || '').toLowerCase()) && isVersionInRange(entry.id))
      .map((entry) => String(entry.id || '').trim())
      .filter(Boolean);

    const fallback = getFallbackGameVersions(includeSnapshots);
    const unique = [...new Set([...fallback, ...versions])].sort(sortGameVersionsDesc);
    cachedVersions[mode] = {
      values: unique.length ? unique : fallback,
      expiresAt: Date.now() + 1000 * 60 * 10
    };

    return cachedVersions[mode].values;
  } catch {
    const fallback = getFallbackGameVersions(includeSnapshots);
    cachedVersions[mode] = {
      values: fallback,
      expiresAt: Date.now() + 1000 * 60 * 5
    };
    return cachedVersions[mode].values;
  }
};

const DEFAULT_VISUAL_THEME_ID = 'default';
const CUSTOM_VISUAL_THEME_ID = 'custom';
const DEFAULT_CUSTOM_VISUAL_THEME = {
  mode: 'solid',
  solidColor: '#22c55e',
  gradientFrom: '#0ea5e9',
  gradientTo: '#22c55e'
};
const CUSTOM_VISUAL_THEME_MODES = new Set(['solid', 'gradient']);
const ALLOWED_VISUAL_THEME_IDS = new Set([
  'default',
  'emerald',
  'sapphire',
  'amber',
  'rose',
  'violet',
  'aurora',
  'sunset',
  'ocean',
  'lava',
  'neon',
  CUSTOM_VISUAL_THEME_ID
]);
const ALLOWED_AMBIENT_EFFECTS = new Set(['stars', 'rain', 'snow']);
const ALLOWED_AUTH_MODES = new Set(['offline', 'online']);

const normalizeAuthMode = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return ALLOWED_AUTH_MODES.has(normalized) ? normalized : 'offline';
};

const normalizeProfileName = (value) =>
  String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 16);

const normalizeProfileUuid = (value) => {
  const raw = String(value || '')
    .trim()
    .replace(/-/g, '')
    .toLowerCase();
  return /^[0-9a-f]{32}$/.test(raw) ? raw : '';
};

const normalizeOnlineProfile = (rawProfile) => {
  const source = rawProfile && typeof rawProfile === 'object' ? rawProfile : {};
  const name = normalizeProfileName(source.name || source.username || '');
  const uuid = normalizeProfileUuid(source.uuid || source.id || '');
  const xuid = String(source.xuid || '').trim();

  if (!name || !uuid) return null;

  return {
    name,
    uuid,
    xuid
  };
};

const normalizeLauncherUpdateNotes = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry || '').replace(/\r/g, '').trim())
    .filter(Boolean)
    .slice(0, 8);
};

const normalizeLatestInstalledUpdate = (value) => {
  const source = value && typeof value === 'object' ? value : {};
  const version = String(source.version || '').trim();
  const notes = normalizeLauncherUpdateNotes(source.notes);
  return { version, notes };
};

const normalizeOfflineNickname = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 16);

const normalizeNicknamePresets = (value, fallback = 'Player') => {
  const fallbackName = normalizeOfflineNickname(fallback) || 'Player';
  const list = Array.isArray(value) ? value : [];
  const seen = new Set();
  const normalized = [];

  for (const entry of list) {
    const nickname = normalizeOfflineNickname(entry);
    if (!nickname) continue;
    const key = nickname.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(nickname);
    if (normalized.length >= 24) break;
  }

  if (!normalized.some((item) => item.toLowerCase() === fallbackName.toLowerCase())) {
    normalized.unshift(fallbackName);
  }
  return normalized.slice(0, 24);
};

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

const normalizeHexColor = (value, fallback = '#22c55e') => {
  const normalized = String(value || '').trim().toLowerCase();
  return HEX_COLOR_RE.test(normalized) ? normalized : fallback;
};

const normalizeCustomVisualTheme = (value) => {
  const source = value && typeof value === 'object' ? value : {};
  const modeRaw = String(source.mode || '').trim().toLowerCase();
  const mode = CUSTOM_VISUAL_THEME_MODES.has(modeRaw) ? modeRaw : DEFAULT_CUSTOM_VISUAL_THEME.mode;

  return {
    mode,
    solidColor: normalizeHexColor(source.solidColor, DEFAULT_CUSTOM_VISUAL_THEME.solidColor),
    gradientFrom: normalizeHexColor(source.gradientFrom, DEFAULT_CUSTOM_VISUAL_THEME.gradientFrom),
    gradientTo: normalizeHexColor(source.gradientTo, DEFAULT_CUSTOM_VISUAL_THEME.gradientTo)
  };
};

const normalizeLauncherState = (rawState) => {
  const source = rawState && typeof rawState === 'object' ? rawState : {};
  const username = normalizeOfflineNickname(source.username || 'Player') || 'Player';
  const language = String(source.language || '').toLowerCase() === 'ru' ? 'ru' : 'en';
  const visualThemeIdRaw = String(source.visualThemeId || '').trim().toLowerCase();
  const visualThemeId = ALLOWED_VISUAL_THEME_IDS.has(visualThemeIdRaw) ? visualThemeIdRaw : DEFAULT_VISUAL_THEME_ID;
  const customVisualTheme = normalizeCustomVisualTheme(source.customVisualTheme);
  const ambientEffectRaw = String(source.ambientEffect || '').trim().toLowerCase();
  const ambientEffect = ALLOWED_AMBIENT_EFFECTS.has(ambientEffectRaw) ? ambientEffectRaw : 'stars';

  return {
    username,
    nicknamePresets: normalizeNicknamePresets(source.nicknamePresets, username),
    globalRam: Number.isFinite(Number(source.globalRam)) ? Math.max(1, Math.round(Number(source.globalRam))) : 4,
    language,
    cursorGlowEnabled: source.cursorGlowEnabled !== false,
    cursorDistortionEnabled: source.cursorDistortionEnabled === true,
    visualThemeId,
    customVisualTheme,
    ambientEffect,
    instances: Array.isArray(source.instances) ? source.instances : [],
    latestInstalledUpdate: normalizeLatestInstalledUpdate(source.latestInstalledUpdate)
  };
};

const loadLauncherState = async () => {
  await ensureLauncherDirectories();
  const stateFile = getStateFilePath();

  try {
    const raw = await fsp.readFile(stateFile, 'utf8');
    return normalizeLauncherState(JSON.parse(raw));
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      throw error;
    }

    return normalizeLauncherState({});
  }
};

const saveLauncherState = async (payload) => {
  await ensureLauncherDirectories();
  const stateFile = getStateFilePath();
  const normalized = normalizeLauncherState(payload);
  await fsp.writeFile(stateFile, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  return normalized;
};

const secureStorageAvailable = () => {
  try {
    return Boolean(safeStorage.isEncryptionAvailable());
  } catch {
    return false;
  }
};

const normalizeSecureAuthSession = (rawSession) => {
  const source = rawSession && typeof rawSession === 'object' ? rawSession : {};
  const profile = normalizeOnlineProfile(source.profile);
  const microsoftRefreshToken = String(source.microsoftRefreshToken || '').trim();
  const microsoftAccessToken = String(source.microsoftAccessToken || '').trim();
  const minecraftAccessToken = String(source.minecraftAccessToken || '').trim();
  const microsoftAccessExpiresAt = Math.max(0, Math.round(Number(source.microsoftAccessExpiresAt || 0)));
  const minecraftAccessExpiresAt = Math.max(0, Math.round(Number(source.minecraftAccessExpiresAt || 0)));
  const userHash = String(source.userHash || '').trim();
  const clientId = String(source.clientId || MICROSOFT_OAUTH_CLIENT_ID).trim() || MICROSOFT_OAUTH_CLIENT_ID;

  if (!microsoftRefreshToken || !profile) return null;

  return {
    version: 1,
    clientId,
    microsoftRefreshToken,
    microsoftAccessToken,
    microsoftAccessExpiresAt,
    minecraftAccessToken,
    minecraftAccessExpiresAt,
    userHash,
    profile,
    updatedAt: Math.max(0, Math.round(Number(source.updatedAt || Date.now())))
  };
};

const readSecureAuthSession = async () => {
  if (cachedSecureAuthSession) return cachedSecureAuthSession;

  await ensureLauncherDirectories();
  const authFile = getAuthSessionFilePath();
  if (!(await pathExists(authFile))) return null;
  if (!secureStorageAvailable()) return null;

  try {
    const encrypted = await fsp.readFile(authFile);
    const decrypted = safeStorage.decryptString(encrypted);
    const parsed = JSON.parse(decrypted);
    const normalized = normalizeSecureAuthSession(parsed);
    if (!normalized) {
      await safeUnlink(authFile);
      return null;
    }
    cachedSecureAuthSession = normalized;
    return normalized;
  } catch {
    await safeUnlink(authFile);
    return null;
  }
};

const writeSecureAuthSession = async (session) => {
  await ensureLauncherDirectories();
  if (!secureStorageAvailable()) {
    const error = new Error('Secure token storage is not available on this system.');
    error.code = 'SECURE_STORAGE_UNAVAILABLE';
    throw error;
  }

  const normalized = normalizeSecureAuthSession(session);
  if (!normalized) {
    const error = new Error('Online session payload is invalid.');
    error.code = 'ONLINE_SESSION_INVALID';
    throw error;
  }

  const encrypted = safeStorage.encryptString(JSON.stringify(normalized));
  await fsp.writeFile(getAuthSessionFilePath(), encrypted);
  cachedSecureAuthSession = normalized;
  return normalized;
};

const clearSecureAuthSession = async () => {
  cachedSecureAuthSession = null;
  await safeUnlink(getAuthSessionFilePath());
};

const hasFreshMinecraftToken = (session, minRemainingMs = 1000 * 60 * 2) => {
  if (!session || typeof session !== 'object') return false;
  const accessToken = String(session.minecraftAccessToken || '').trim();
  const expiresAt = Number(session.minecraftAccessExpiresAt || 0);
  if (!accessToken || !Number.isFinite(expiresAt) || expiresAt <= 0) return false;
  return expiresAt > Date.now() + Math.max(1000, Number(minRemainingMs) || 1000);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));

const readJsonBody = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const postFormForJson = async (url, formData, timeoutMs = DEFAULT_FETCH_TIMEOUT_MS) => {
  const body = new URLSearchParams(formData).toString();
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    timeoutMs,
    headers: {
      ...REQUEST_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });
  const payload = await readJsonBody(response);
  return { response, payload };
};

const postJsonForJson = async (url, payload, timeoutMs = DEFAULT_FETCH_TIMEOUT_MS, extraHeaders = {}) => {
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    timeoutMs,
    headers: {
      ...REQUEST_HEADERS,
      'Content-Type': 'application/json',
      ...extraHeaders
    },
    body: JSON.stringify(payload || {})
  });
  const body = await readJsonBody(response);
  return { response, payload: body };
};

const buildMicrosoftErrorMessage = (payload, fallbackMessage) => {
  const description = String(payload?.error_description || payload?.error || '').trim();
  if (!description) return fallbackMessage;
  return description.replace(/\s+/g, ' ').trim();
};

const requestMicrosoftDeviceCode = async () => {
  const endpoint = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode';
  const { response, payload } = await postFormForJson(endpoint, {
    client_id: MICROSOFT_OAUTH_CLIENT_ID,
    scope: MICROSOFT_OAUTH_SCOPE
  });

  if (!response.ok || !payload?.device_code) {
    const error = new Error(buildMicrosoftErrorMessage(payload, 'Failed to start Microsoft sign-in flow.'));
    error.code = 'MICROSOFT_DEVICE_CODE_FAILED';
    throw error;
  }

  return {
    deviceCode: String(payload.device_code || '').trim(),
    userCode: String(payload.user_code || '').trim(),
    verificationUri: String(payload.verification_uri || '').trim(),
    verificationUriComplete: String(payload.verification_uri_complete || '').trim(),
    expiresInSec: Math.max(60, Number(payload.expires_in || 900)),
    intervalSec: Math.max(2, Number(payload.interval || 5)),
    message: String(payload.message || '').trim()
  };
};

const requestMicrosoftDeviceToken = async (deviceCode) => {
  const endpoint = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
  const { response, payload } = await postFormForJson(endpoint, {
    client_id: MICROSOFT_OAUTH_CLIENT_ID,
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    device_code: deviceCode
  });

  return { ok: response.ok, payload };
};

const pollMicrosoftDeviceToken = async ({ deviceCode, intervalSec, expiresInSec }) => {
  const deadline = Date.now() + Math.max(60, Number(expiresInSec) || 900) * 1000;
  let waitMs = Math.max(2000, Number(intervalSec || 5) * 1000);

  while (Date.now() < deadline) {
    await sleep(waitMs);
    const { ok, payload } = await requestMicrosoftDeviceToken(deviceCode);

    if (ok && payload?.access_token) {
      return payload;
    }

    const errorCode = String(payload?.error || '').trim().toLowerCase();
    if (errorCode === 'authorization_pending') continue;
    if (errorCode === 'slow_down') {
      waitMs += 5000;
      continue;
    }
    if (errorCode === 'authorization_declined') {
      const error = new Error('Microsoft sign-in was cancelled.');
      error.code = 'MICROSOFT_LOGIN_CANCELLED';
      throw error;
    }
    if (errorCode === 'expired_token' || errorCode === 'bad_verification_code') {
      const error = new Error('Microsoft sign-in session has expired. Try again.');
      error.code = 'MICROSOFT_LOGIN_EXPIRED';
      throw error;
    }

    const error = new Error(buildMicrosoftErrorMessage(payload, 'Microsoft sign-in failed.'));
    error.code = 'MICROSOFT_LOGIN_FAILED';
    throw error;
  }

  const timeoutError = new Error('Microsoft sign-in timed out. Try again.');
  timeoutError.code = 'MICROSOFT_LOGIN_TIMEOUT';
  throw timeoutError;
};

const exchangeMicrosoftRefreshToken = async (refreshToken) => {
  const endpoint = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
  const { response, payload } = await postFormForJson(endpoint, {
    client_id: MICROSOFT_OAUTH_CLIENT_ID,
    scope: MICROSOFT_OAUTH_SCOPE,
    grant_type: 'refresh_token',
    refresh_token: String(refreshToken || '').trim()
  });

  if (!response.ok || !payload?.access_token) {
    const oauthCode = String(payload?.error || '').trim().toLowerCase();
    const error = new Error(buildMicrosoftErrorMessage(payload, 'Failed to refresh Microsoft session.'));
    error.code = oauthCode === 'invalid_grant' ? 'AUTH_SESSION_EXPIRED' : 'MICROSOFT_REFRESH_FAILED';
    throw error;
  }

  return payload;
};

const exchangeMicrosoftAccessToXboxToken = async (microsoftAccessToken) => {
  const { response, payload } = await postJsonForJson(
    'https://user.auth.xboxlive.com/user/authenticate',
    {
      Properties: {
        AuthMethod: 'RPS',
        SiteName: 'user.auth.xboxlive.com',
        RpsTicket: `d=${String(microsoftAccessToken || '').trim()}`
      },
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType: 'JWT'
    },
    DEFAULT_FETCH_TIMEOUT_MS,
    { Accept: 'application/json', 'x-xbl-contract-version': '1' }
  );

  const token = String(payload?.Token || '').trim();
  const userHash = String(payload?.DisplayClaims?.xui?.[0]?.uhs || '').trim();
  const xuid = String(payload?.DisplayClaims?.xui?.[0]?.xid || payload?.DisplayClaims?.xui?.[0]?.xuid || '').trim();
  if (!response.ok || !token || !userHash) {
    const error = new Error(buildMicrosoftErrorMessage(payload, 'Failed to authenticate with Xbox Live.'));
    error.code = 'XBOX_AUTH_FAILED';
    throw error;
  }

  return { token, userHash, xuid };
};

const mapXstsErrorCode = (xerr) => {
  const normalized = String(xerr || '').trim();
  if (normalized === '2148916233') return 'No Xbox profile found for this Microsoft account.';
  if (normalized === '2148916235') return 'Xbox Live is unavailable in your region for this account.';
  if (normalized === '2148916238') return 'This child account must be added to a Microsoft family before playing online.';
  return '';
};

const exchangeXboxTokenToXstsToken = async (xboxToken) => {
  const { response, payload } = await postJsonForJson(
    'https://xsts.auth.xboxlive.com/xsts/authorize',
    {
      Properties: {
        SandboxId: 'RETAIL',
        UserTokens: [String(xboxToken || '').trim()]
      },
      RelyingParty: 'rp://api.minecraftservices.com/',
      TokenType: 'JWT'
    },
    DEFAULT_FETCH_TIMEOUT_MS,
    { Accept: 'application/json', 'x-xbl-contract-version': '1' }
  );

  const token = String(payload?.Token || '').trim();
  const userHash = String(payload?.DisplayClaims?.xui?.[0]?.uhs || '').trim();
  const xuid = String(payload?.DisplayClaims?.xui?.[0]?.xid || payload?.DisplayClaims?.xui?.[0]?.xuid || '').trim();
  if (!response.ok || !token || !userHash) {
    const errorMessage = mapXstsErrorCode(payload?.XErr) || buildMicrosoftErrorMessage(payload, 'Failed to authorize Xbox security token.');
    const error = new Error(errorMessage);
    error.code = 'XSTS_AUTH_FAILED';
    throw error;
  }

  return { token, userHash, xuid };
};

const exchangeXstsTokenToMinecraftToken = async ({ xstsToken, userHash }) => {
  const { response, payload } = await postJsonForJson('https://api.minecraftservices.com/authentication/login_with_xbox', {
    identityToken: `XBL3.0 x=${String(userHash || '').trim()};${String(xstsToken || '').trim()}`
  });

  const accessToken = String(payload?.access_token || '').trim();
  if (!response.ok || !accessToken) {
    const error = new Error(buildMicrosoftErrorMessage(payload, 'Failed to authenticate with Minecraft services.'));
    error.code = 'MINECRAFT_AUTH_FAILED';
    throw error;
  }

  return {
    accessToken,
    expiresInSec: Math.max(60, Number(payload?.expires_in || 3600))
  };
};

const fetchMinecraftEntitlements = async (minecraftAccessToken) => {
  const response = await fetchWithTimeout('https://api.minecraftservices.com/entitlements/mcstore', {
    headers: {
      ...REQUEST_HEADERS,
      Authorization: `Bearer ${String(minecraftAccessToken || '').trim()}`
    }
  });
  const payload = await readJsonBody(response);
  if (!response.ok) {
    const error = new Error(buildMicrosoftErrorMessage(payload, 'Failed to check Minecraft entitlements.'));
    error.code = 'MINECRAFT_ENTITLEMENTS_FAILED';
    throw error;
  }
  return payload;
};

const hasMinecraftLicense = (entitlementsPayload) => {
  const items = Array.isArray(entitlementsPayload?.items) ? entitlementsPayload.items : [];
  if (!items.length) return false;

  const knownProductIds = new Set(['game_minecraft', 'product_minecraft', 'game_minecraft_launcher']);
  return items.some((entry) => {
    const name = String(entry?.name || entry?.itemId || '').trim().toLowerCase();
    if (knownProductIds.has(name)) return true;
    return name.includes('minecraft');
  });
};

const fetchMinecraftProfile = async (minecraftAccessToken) => {
  const response = await fetchWithTimeout('https://api.minecraftservices.com/minecraft/profile', {
    headers: {
      ...REQUEST_HEADERS,
      Authorization: `Bearer ${String(minecraftAccessToken || '').trim()}`
    }
  });
  const payload = await readJsonBody(response);
  if (!response.ok) {
    const error = new Error(buildMicrosoftErrorMessage(payload, 'Failed to load Minecraft profile.'));
    error.code = response.status === 404 ? 'MINECRAFT_PROFILE_NOT_FOUND' : 'MINECRAFT_PROFILE_FAILED';
    throw error;
  }
  return payload;
};

const buildOnlineSessionFromMicrosoftToken = async ({
  microsoftAccessToken,
  microsoftRefreshToken,
  microsoftExpiresInSec
}) => {
  const accessToken = String(microsoftAccessToken || '').trim();
  const refreshToken = String(microsoftRefreshToken || '').trim();

  if (!accessToken || !refreshToken) {
    const error = new Error('Microsoft session payload is incomplete.');
    error.code = 'MICROSOFT_SESSION_INVALID';
    throw error;
  }

  const xbox = await exchangeMicrosoftAccessToXboxToken(accessToken);
  const xsts = await exchangeXboxTokenToXstsToken(xbox.token);
  const minecraft = await exchangeXstsTokenToMinecraftToken({
    xstsToken: xsts.token,
    userHash: xsts.userHash
  });
  const entitlements = await fetchMinecraftEntitlements(minecraft.accessToken);
  if (!hasMinecraftLicense(entitlements)) {
    const error = new Error('Minecraft license was not found on this Microsoft account.');
    error.code = 'MINECRAFT_LICENSE_REQUIRED';
    throw error;
  }

  const profilePayload = await fetchMinecraftProfile(minecraft.accessToken);
  const profile = normalizeOnlineProfile({
    name: profilePayload?.name,
    uuid: profilePayload?.id,
    xuid: xsts.xuid || xbox.xuid || ''
  });
  if (!profile) {
    const error = new Error('Minecraft profile is invalid.');
    error.code = 'MINECRAFT_PROFILE_INVALID';
    throw error;
  }

  const now = Date.now();
  return normalizeSecureAuthSession({
    version: 1,
    clientId: MICROSOFT_OAUTH_CLIENT_ID,
    microsoftRefreshToken: refreshToken,
    microsoftAccessToken: accessToken,
    microsoftAccessExpiresAt: now + Math.max(60, Number(microsoftExpiresInSec || 3600)) * 1000,
    minecraftAccessToken: minecraft.accessToken,
    minecraftAccessExpiresAt: now + Math.max(60, Number(minecraft.expiresInSec || 3600)) * 1000,
    userHash: xsts.userHash,
    profile,
    updatedAt: now
  });
};

const persistOnlineProfileToLauncherState = async (profile, targetAuthMode = null) => {
  const currentState = await loadLauncherState();
  const next = {
    ...currentState,
    onlineProfile: normalizeOnlineProfile(profile)
  };
  if (targetAuthMode) {
    next.authMode = normalizeAuthMode(targetAuthMode);
  }
  await saveLauncherState(next);
  return next;
};

const loginWithMicrosoft = async () => {
  if (!secureStorageAvailable()) {
    const error = new Error('Secure token storage is unavailable. Online login is disabled on this system.');
    error.code = 'SECURE_STORAGE_UNAVAILABLE';
    throw error;
  }

  const deviceCode = await requestMicrosoftDeviceCode();
  const verificationUrl = deviceCode.verificationUriComplete || deviceCode.verificationUri;
  if (!verificationUrl) {
    const error = new Error('Microsoft sign-in URL is missing.');
    error.code = 'MICROSOFT_DEVICE_CODE_FAILED';
    throw error;
  }

  await shell.openExternal(verificationUrl);
  const tokenPayload = await pollMicrosoftDeviceToken(deviceCode);
  const session = await buildOnlineSessionFromMicrosoftToken({
    microsoftAccessToken: tokenPayload.access_token,
    microsoftRefreshToken: tokenPayload.refresh_token,
    microsoftExpiresInSec: tokenPayload.expires_in
  });
  await writeSecureAuthSession(session);
  await persistOnlineProfileToLauncherState(session.profile, 'online');

  return {
    mode: 'online',
    signedIn: true,
    profile: session.profile,
    verificationUrl,
    userCode: deviceCode.userCode
  };
};

const logoutOnlineSession = async () => {
  await clearSecureAuthSession();
  await persistOnlineProfileToLauncherState(null, null);
  return {
    mode: 'online',
    signedIn: false,
    profile: null
  };
};

const getAuthState = async () => {
  const launcherState = await loadLauncherState();
  const mode = normalizeAuthMode(launcherState.authMode || 'offline');
  const secureSession = await readSecureAuthSession();
  const profileFromState = normalizeOnlineProfile(launcherState.onlineProfile);
  const profile = profileFromState || secureSession?.profile || null;

  return {
    mode,
    secureStorageAvailable: secureStorageAvailable(),
    online: {
      signedIn: Boolean(secureSession && profile),
      profile
    }
  };
};

const refreshOnlineSession = async (session) => {
  const refreshed = await exchangeMicrosoftRefreshToken(session.microsoftRefreshToken);
  const nextSession = await buildOnlineSessionFromMicrosoftToken({
    microsoftAccessToken: refreshed.access_token,
    microsoftRefreshToken: refreshed.refresh_token || session.microsoftRefreshToken,
    microsoftExpiresInSec: refreshed.expires_in
  });
  await writeSecureAuthSession(nextSession);
  await persistOnlineProfileToLauncherState(nextSession.profile, null);
  return nextSession;
};

const ensureOnlineSessionForLaunch = async () => {
  const session = await readSecureAuthSession();
  if (!session) {
    const error = new Error('Online mode requires Microsoft sign-in.');
    error.code = 'ONLINE_AUTH_REQUIRED';
    throw error;
  }

  if (hasFreshMinecraftToken(session)) {
    return session;
  }

  try {
    return await refreshOnlineSession(session);
  } catch (error) {
    const code = String(error?.code || '').toUpperCase();
    if (code === 'AUTH_SESSION_EXPIRED' || code === 'MICROSOFT_REFRESH_FAILED') {
      await clearSecureAuthSession();
      await persistOnlineProfileToLauncherState(null, null);
    }
    throw error;
  }
};

const buildOfflineAuthorization = async (username) => {
  const rawAuth = await Authenticator.getAuth(username);
  return {
    ...rawAuth,
    access_token: String(rawAuth?.access_token || rawAuth?.uuid || username),
    client_token: String(rawAuth?.client_token || rawAuth?.uuid || username),
    uuid: String(rawAuth?.uuid || username),
    name: String(rawAuth?.name || username),
    user_properties: typeof rawAuth?.user_properties === 'string' ? rawAuth.user_properties : '{}',
    meta: {
      type: 'legacy',
      demo: false,
      xuid: String(rawAuth?.uuid || username),
      clientId: String(rawAuth?.client_token || rawAuth?.uuid || username)
    }
  };
};

const buildOnlineAuthorization = (session) => {
  const profile = normalizeOnlineProfile(session?.profile);
  const minecraftAccessToken = String(session?.minecraftAccessToken || '').trim();
  if (!profile || !minecraftAccessToken) {
    const error = new Error('Online authorization session is invalid.');
    error.code = 'ONLINE_SESSION_INVALID';
    throw error;
  }

  const stableClientToken = createHash('sha1').update(profile.uuid).digest('hex').slice(0, 32);
  return {
    access_token: minecraftAccessToken,
    client_token: stableClientToken,
    uuid: profile.uuid,
    name: profile.name,
    user_properties: '{}',
    meta: {
      type: 'msa',
      demo: false,
      xuid: String(profile.xuid || ''),
      clientId: String(session?.clientId || MICROSOFT_OAUTH_CLIENT_ID || '')
    }
  };
};

const resolveLaunchAuthorization = async (offlineUsername) => {
  const launcherState = await loadLauncherState();
  const authMode = normalizeAuthMode(launcherState.authMode || 'offline');

  if (authMode === 'online') {
    const session = await ensureOnlineSessionForLaunch();
    const authorization = buildOnlineAuthorization(session);
    return {
      authorization,
      authMode,
      username: String(authorization.name || '').trim() || offlineUsername
    };
  }

  const authorization = await buildOfflineAuthorization(offlineUsername);
  return {
    authorization,
    authMode: 'offline',
    username: String(authorization.name || '').trim() || offlineUsername
  };
};

const normalizeSkinModel = (value) => (String(value || '').toLowerCase() === 'slim' ? 'slim' : 'wide');

const sanitizeSkinServiceUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    parsed.hash = '';
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return '';
  }
};

const buildSkinServiceHeaders = (token = '') => {
  const headers = {
    ...REQUEST_HEADERS
  };
  const normalizedToken = String(token || '').trim();
  if (normalizedToken) {
    headers.Authorization = `Bearer ${normalizedToken}`;
  }
  return headers;
};

const toPngDataUrl = (base64) => `data:image/png;base64,${String(base64 || '')}`;

const decodePngDataUrl = (dataUrl, fieldName) => {
  const source = String(dataUrl || '').trim();
  const match = source.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) {
    const error = new Error(`${fieldName} must be a PNG image.`);
    error.code = 'INVALID_IMAGE_DATA';
    error.details = { field: fieldName };
    throw error;
  }

  try {
    return Buffer.from(match[1], 'base64');
  } catch {
    const error = new Error(`${fieldName} contains invalid base64 data.`);
    error.code = 'INVALID_IMAGE_DATA';
    error.details = { field: fieldName };
    throw error;
  }
};

const readPngFileDataUrl = async (targetPath) => {
  try {
    const buffer = await fsp.readFile(targetPath);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch {
    return '';
  }
};

const validateSkinTextureBuffer = (buffer) => {
  const image = nativeImage.createFromBuffer(buffer);
  if (image.isEmpty()) {
    const error = new Error('Skin texture is invalid or damaged.');
    error.code = 'SKIN_TEXTURE_INVALID';
    throw error;
  }

  const { width, height } = image.getSize();
  const ratioOk = height === width || height * 2 === width;
  const sizeOk = width >= 32 && height >= 16 && width <= 2048 && height <= 2048;
  if (!ratioOk || !sizeOk) {
    const error = new Error('Skin texture must be PNG with size like 64x64 or 64x32.');
    error.code = 'SKIN_TEXTURE_INVALID_SIZE';
    error.details = { width, height };
    throw error;
  }

  return { width, height };
};

const validateCapeTextureBuffer = (buffer) => {
  const image = nativeImage.createFromBuffer(buffer);
  if (image.isEmpty()) {
    const error = new Error('Cape texture is invalid or damaged.');
    error.code = 'CAPE_TEXTURE_INVALID';
    throw error;
  }

  const { width, height } = image.getSize();
  const sizeOk = width >= 16 && height >= 16 && width <= 2048 && height <= 2048;
  if (!sizeOk) {
    const error = new Error('Cape texture size is out of allowed range.');
    error.code = 'CAPE_TEXTURE_INVALID_SIZE';
    error.details = { width, height };
    throw error;
  }

  return { width, height };
};

const sha1Hex = (buffer) => createHash('sha1').update(buffer).digest('hex');

const sanitizeMinecraftUsername = (value) =>
  String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 16);

const getDefaultCapeById = (capeId) => {
  const normalized = String(capeId || '').trim().toLowerCase();
  return DEFAULT_CAPE_LIBRARY.find((entry) => String(entry.id).toLowerCase() === normalized) || null;
};

const normalizeMojangUuid = (value) => {
  const raw = String(value || '')
    .trim()
    .replace(/-/g, '')
    .toLowerCase();
  return /^[0-9a-f]{32}$/.test(raw) ? raw : '';
};

const parseMojangTexturesPayload = (sessionPayload) => {
  const properties = Array.isArray(sessionPayload?.properties) ? sessionPayload.properties : [];
  const texturesProperty = properties.find((entry) => entry && entry.name === 'textures' && typeof entry.value === 'string');
  if (!texturesProperty?.value) {
    return { skinUrl: '', capeUrl: '', model: 'wide' };
  }

  try {
    const decodedRaw = Buffer.from(texturesProperty.value, 'base64').toString('utf8');
    const decoded = JSON.parse(decodedRaw);
    const skinUrl = String(decoded?.textures?.SKIN?.url || '').trim();
    const capeUrl = String(decoded?.textures?.CAPE?.url || '').trim();
    const model = String(decoded?.textures?.SKIN?.metadata?.model || '').toLowerCase() === 'slim' ? 'slim' : 'wide';
    return { skinUrl, capeUrl, model };
  } catch {
    return { skinUrl: '', capeUrl: '', model: 'wide' };
  }
};

const fetchRemotePngAsDataUrl = async (url, kind = 'cape') => {
  const response = await fetchWithTimeout(url, {
    timeoutMs: DEFAULT_FETCH_TIMEOUT_MS,
    headers: REQUEST_HEADERS
  });
  if (!response.ok) {
    const error = new Error(`Failed to fetch official ${kind} texture: HTTP ${response.status}.`);
    error.code = 'OFFICIAL_TEXTURE_FETCH_FAILED';
    throw error;
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (kind === 'skin') {
    validateSkinTextureBuffer(buffer);
  } else {
    validateCapeTextureBuffer(buffer);
  }

  return `data:image/png;base64,${buffer.toString('base64')}`;
};

const resolveOfficialProfileInternal = async (usernameInput) => {
  const username = sanitizeMinecraftUsername(usernameInput);
  const fallback = {
    username,
    uuid: '',
    hasLicense: false,
    hasCape: false,
    model: 'wide',
    skinUrl: '',
    capeUrl: '',
    skinDataUrl: '',
    capeDataUrl: ''
  };

  if (!username) return fallback;

  const cacheKey = username.toLowerCase();
  const cached = officialProfileCache.get(cacheKey);
  if (cached && Number(cached.expiresAt) > Date.now() && cached.data) {
    return cached.data;
  }

  let profileResponse;
  try {
    profileResponse = await fetchWithTimeout(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`, {
      timeoutMs: DEFAULT_FETCH_TIMEOUT_MS,
      headers: REQUEST_HEADERS
    });
  } catch (_error) {
    return fallback;
  }

  if (profileResponse.status === 204 || profileResponse.status === 404) {
    officialProfileCache.set(cacheKey, {
      expiresAt: Date.now() + 1000 * 60 * 5,
      data: fallback
    });
    return fallback;
  }

  if (!profileResponse.ok) {
    return fallback;
  }

  let profilePayload;
  try {
    profilePayload = await profileResponse.json();
  } catch {
    return fallback;
  }

  const uuid = normalizeMojangUuid(profilePayload?.id);
  if (!uuid) {
    return fallback;
  }

  const result = {
    ...fallback,
    username: sanitizeMinecraftUsername(profilePayload?.name || username) || username,
    uuid,
    hasLicense: true
  };

  try {
    const sessionResponse = await fetchWithTimeout(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`, {
      timeoutMs: DEFAULT_FETCH_TIMEOUT_MS,
      headers: REQUEST_HEADERS
    });

    if (sessionResponse.ok) {
      const sessionPayload = await sessionResponse.json();
      const textures = parseMojangTexturesPayload(sessionPayload);
      result.model = textures.model;
      result.skinUrl = textures.skinUrl;
      result.capeUrl = textures.capeUrl;

      if (textures.skinUrl) {
        try {
          result.skinDataUrl = await fetchRemotePngAsDataUrl(textures.skinUrl, 'skin');
        } catch {
          result.skinDataUrl = '';
        }
      }

      if (textures.capeUrl) {
        try {
          result.capeDataUrl = await fetchRemotePngAsDataUrl(textures.capeUrl, 'cape');
        } catch {
          result.capeDataUrl = '';
        }
      }
    }
  } catch {
    // keep fallback values
  }

  result.hasCape = Boolean(result.capeDataUrl || result.capeUrl);
  officialProfileCache.set(cacheKey, {
    expiresAt: Date.now() + 1000 * 60 * 2,
    data: result
  });
  return result;
};

const normalizeSkinEntry = (rawEntry, index = 0) => {
  const source = rawEntry && typeof rawEntry === 'object' ? rawEntry : {};
  const id = String(source.id || '').trim() || randomUUID();
  const name = String(source.name || '').trim() || `Skin ${index + 1}`;
  const textureFile = path.basename(String(source.textureFile || '').trim());
  const capeFile = source.capeFile ? path.basename(String(source.capeFile).trim()) : null;
  const capeModeValue = String(source.capeMode || '').trim().toLowerCase();
  const capeMode = capeModeValue === 'default' || capeModeValue === 'custom' || capeModeValue === 'official' ? capeModeValue : 'none';
  const defaultCapeId = source.defaultCapeId ? String(source.defaultCapeId).trim().toLowerCase() : null;
  const createdAt = String(source.createdAt || '').trim() || new Date().toISOString();
  const updatedAt = String(source.updatedAt || '').trim() || createdAt;

  return {
    id,
    name,
    model: normalizeSkinModel(source.model),
    textureFile,
    capeFile,
    capeMode,
    defaultCapeId,
    createdAt,
    updatedAt
  };
};

const normalizeSkinsState = (rawState) => {
  const source = rawState && typeof rawState === 'object' ? rawState : {};
  const inputSkins = Array.isArray(source.skins) ? source.skins : [];
  const normalizedSkins = [];
  const usedIds = new Set();

  for (let i = 0; i < inputSkins.length; i += 1) {
    const entry = normalizeSkinEntry(inputSkins[i], i);
    if (!entry.textureFile) continue;
    if (usedIds.has(entry.id)) continue;
    usedIds.add(entry.id);
    normalizedSkins.push(entry);
  }

  const requestedActive = String(source.activeSkinId || '').trim();
  const activeSkinId = normalizedSkins.some((entry) => entry.id === requestedActive)
    ? requestedActive
    : normalizedSkins[0]?.id || null;

  const forcedServiceUrl = sanitizeSkinServiceUrl(DEFAULT_SKIN_SERVICE_URL);
  const forcedServiceToken = String(DEFAULT_SKIN_SERVICE_TOKEN || '').trim();
  const serviceUrl = forcedServiceUrl || sanitizeSkinServiceUrl(source.serviceUrl || '');
  const serviceToken = forcedServiceToken || String(source.serviceToken || '').trim();

  return {
    activeSkinId,
    serviceUrl,
    serviceToken,
    skins: normalizedSkins
  };
};

const loadSkinsState = async () => {
  await ensureLauncherDirectories();
  const stateFile = getSkinsStateFilePath();

  try {
    const raw = await fsp.readFile(stateFile, 'utf8');
    return normalizeSkinsState(JSON.parse(raw));
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      throw error;
    }
    return normalizeSkinsState({});
  }
};

const saveSkinsState = async (payload) => {
  await ensureLauncherDirectories();
  const stateFile = getSkinsStateFilePath();
  const normalized = normalizeSkinsState(payload);
  await fsp.writeFile(stateFile, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  return normalized;
};

const resolveSkinTexturePath = (entry) => path.join(getSkinTexturesRoot(), path.basename(String(entry?.textureFile || '')));
const resolveSkinCapePath = (entry) =>
  entry?.capeFile ? path.join(getSkinCapesRoot(), path.basename(String(entry.capeFile))) : null;

const buildPublicSkinEntry = async (entry) => {
  const texturePath = resolveSkinTexturePath(entry);
  const capePath = resolveSkinCapePath(entry);

  const textureDataUrl = await readPngFileDataUrl(texturePath);
  const capeDataUrl = capePath ? await readPngFileDataUrl(capePath) : '';

  return {
    id: entry.id,
    name: entry.name,
    model: normalizeSkinModel(entry.model),
    capeMode: entry.capeMode,
    defaultCapeId: entry.defaultCapeId || null,
    textureDataUrl,
    capeDataUrl,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt
  };
};

const getSkinsOverviewInternal = async () => {
  const state = await loadSkinsState();
  const skins = [];
  for (const entry of state.skins) {
    skins.push(await buildPublicSkinEntry(entry));
  }

  return {
    rootPath: getSkinsRoot(),
    activeSkinId: state.activeSkinId,
    skins,
    defaultCapes: DEFAULT_CAPE_LIBRARY.map((entry) => ({
      id: entry.id,
      name: entry.name,
      dataUrl: toPngDataUrl(entry.pngBase64)
    })),
    sync: {
      serviceUrl: state.serviceUrl,
      serviceToken: state.serviceToken
    }
  };
};

const saveSkinInternal = async (payload, mode = 'create') => {
  const state = await loadSkinsState();
  const now = new Date().toISOString();
  const isUpdate = mode === 'update';
  const requestedId = String(payload?.id || '').trim();
  const targetId = isUpdate ? requestedId : randomUUID();

  if (!targetId) {
    const error = new Error('Skin id is required for update.');
    error.code = 'SKIN_ID_REQUIRED';
    throw error;
  }

  const currentIndex = state.skins.findIndex((item) => item.id === targetId);
  if (isUpdate && currentIndex < 0) {
    const error = new Error('Skin was not found.');
    error.code = 'SKIN_NOT_FOUND';
    throw error;
  }

  const current = currentIndex >= 0 ? state.skins[currentIndex] : null;
  const textureDataUrl = typeof payload?.textureDataUrl === 'string' ? payload.textureDataUrl.trim() : '';
  const capeDataUrl = typeof payload?.capeDataUrl === 'string' ? payload.capeDataUrl.trim() : '';
  const requestedCapeMode = String(payload?.capeMode || current?.capeMode || 'none').trim().toLowerCase();
  const capeMode = requestedCapeMode === 'default' || requestedCapeMode === 'custom' || requestedCapeMode === 'official' ? requestedCapeMode : 'none';
  const requestedDefaultCapeId = String(payload?.defaultCapeId || current?.defaultCapeId || '').trim().toLowerCase();

  const textureFile = `${targetId}.png`;
  const texturePath = path.join(getSkinTexturesRoot(), textureFile);
  if (textureDataUrl) {
    const textureBuffer = decodePngDataUrl(textureDataUrl, 'Skin texture');
    validateSkinTextureBuffer(textureBuffer);
    await fsp.writeFile(texturePath, textureBuffer);
  } else if (!(await pathExists(texturePath))) {
    const error = new Error('Skin texture is required.');
    error.code = 'SKIN_TEXTURE_REQUIRED';
    throw error;
  }

  let capeFile = current?.capeFile ? `${targetId}.png` : null;
  const capePath = path.join(getSkinCapesRoot(), `${targetId}.png`);
  let defaultCapeId = null;

  if (capeMode === 'none') {
    await safeUnlink(capePath);
    capeFile = null;
  } else if (capeMode === 'official') {
    await safeUnlink(capePath);
    capeFile = null;
  } else if (capeMode === 'default') {
    const defaultCape = getDefaultCapeById(requestedDefaultCapeId);
    if (!defaultCape) {
      const error = new Error('Default cape is not selected.');
      error.code = 'DEFAULT_CAPE_REQUIRED';
      throw error;
    }
    const capeBuffer = Buffer.from(defaultCape.pngBase64, 'base64');
    validateCapeTextureBuffer(capeBuffer);
    await fsp.writeFile(capePath, capeBuffer);
    capeFile = `${targetId}.png`;
    defaultCapeId = defaultCape.id;
  } else if (capeMode === 'custom') {
    if (capeDataUrl) {
      const capeBuffer = decodePngDataUrl(capeDataUrl, 'Cape texture');
      validateCapeTextureBuffer(capeBuffer);
      await fsp.writeFile(capePath, capeBuffer);
      capeFile = `${targetId}.png`;
    } else if (await pathExists(capePath)) {
      capeFile = `${targetId}.png`;
    } else {
      const error = new Error('Cape texture is required for custom cape mode.');
      error.code = 'CAPE_TEXTURE_REQUIRED';
      throw error;
    }
  }

  const nextEntry = normalizeSkinEntry(
    {
      ...(current || {}),
      id: targetId,
      name: String(payload?.name || current?.name || '').trim() || `Skin ${state.skins.length + 1}`,
      model: normalizeSkinModel(payload?.model || current?.model || 'wide'),
      textureFile,
      capeFile,
      capeMode,
      defaultCapeId,
      createdAt: current?.createdAt || now,
      updatedAt: now
    },
    currentIndex >= 0 ? currentIndex : state.skins.length
  );

  if (currentIndex >= 0) {
    state.skins[currentIndex] = nextEntry;
  } else {
    state.skins.unshift(nextEntry);
  }

  if (payload?.setActive || !state.activeSkinId) {
    state.activeSkinId = targetId;
  }

  await saveSkinsState(state);
  return getSkinsOverviewInternal();
};

const deleteSkinInternal = async (payload) => {
  const targetId = String(payload?.id || '').trim();
  if (!targetId) {
    const error = new Error('Skin id is required.');
    error.code = 'SKIN_ID_REQUIRED';
    throw error;
  }

  const state = await loadSkinsState();
  const index = state.skins.findIndex((entry) => entry.id === targetId);
  if (index < 0) {
    const error = new Error('Skin was not found.');
    error.code = 'SKIN_NOT_FOUND';
    throw error;
  }

  const [removed] = state.skins.splice(index, 1);
  await safeUnlink(resolveSkinTexturePath(removed));
  if (removed?.capeFile) {
    await safeUnlink(resolveSkinCapePath(removed));
  }

  if (state.activeSkinId === targetId) {
    state.activeSkinId = state.skins[0]?.id || null;
  }

  await saveSkinsState(state);
  return getSkinsOverviewInternal();
};

const setActiveSkinInternal = async (payload) => {
  const requestedId = String(payload?.id || '').trim();
  const state = await loadSkinsState();

  if (!requestedId) {
    state.activeSkinId = null;
    await saveSkinsState(state);
    return getSkinsOverviewInternal();
  }

  if (!state.skins.some((entry) => entry.id === requestedId)) {
    const error = new Error('Skin was not found.');
    error.code = 'SKIN_NOT_FOUND';
    throw error;
  }

  state.activeSkinId = requestedId;
  await saveSkinsState(state);
  return getSkinsOverviewInternal();
};

const reorderSkinsInternal = async (payload) => {
  const orderedIds = Array.isArray(payload?.ids)
    ? payload.ids.map((entry) => String(entry || '').trim()).filter(Boolean)
    : [];

  if (!orderedIds.length) {
    return getSkinsOverviewInternal();
  }

  const state = await loadSkinsState();
  const byId = new Map(state.skins.map((entry) => [entry.id, entry]));
  const nextSkins = [];

  for (const id of orderedIds) {
    const found = byId.get(id);
    if (!found) continue;
    nextSkins.push(found);
    byId.delete(id);
  }

  byId.forEach((entry) => {
    nextSkins.push(entry);
  });

  state.skins = nextSkins;
  await saveSkinsState(state);
  return getSkinsOverviewInternal();
};

const updateSkinSyncConfigInternal = async (payload) => {
  const state = await loadSkinsState();
  state.serviceUrl = sanitizeSkinServiceUrl(payload?.serviceUrl || '');
  state.serviceToken = String(payload?.serviceToken || '').trim();
  await saveSkinsState(state);
  return getSkinsOverviewInternal();
};

const openSkinsFolderInternal = async () => {
  await ensureLauncherDirectories();
  const targetPath = getSkinsRoot();
  const openResult = await shell.openPath(targetPath);
  if (openResult) {
    const error = new Error(openResult);
    error.code = 'OPEN_PATH_FAILED';
    throw error;
  }

  return { path: targetPath };
};

const downloadToFileWithFallback = async ({ url, destination, timeoutMs = DEFAULT_DOWNLOAD_TIMEOUT_MS, onProgress = null }) => {
  try {
    return await streamDownloadToFile({ url, destination, timeoutMs, onProgress });
  } catch (_error) {
    return streamDownloadToFileViaNodeHttp({ url, destination, timeoutMs, onProgress });
  }
};

const resolveSkinSyncLoaders = (loader) => {
  const normalized = normalizeLoader(loader);
  if (normalized === 'fabric') return ['fabric'];
  if (normalized === 'quilt') return ['quilt', 'fabric'];
  if (normalized === 'forge') return ['forge'];
  if (normalized === 'neoforge') return ['neoforge', 'forge'];
  return [];
};

const ensureCustomSkinLoaderForInstance = async ({ event, instanceId, instanceName, installPath, minecraftVersion, loader }) => {
  const loaderCandidates = resolveSkinSyncLoaders(loader);
  if (!loaderCandidates.length) {
    return { status: 'skipped', reason: 'loader-not-supported' };
  }

  const modsDir = path.join(installPath, 'mods');
  await fsp.mkdir(modsDir, { recursive: true });

  const existingEntries = await fsp.readdir(modsDir, { withFileTypes: true });
  const existingJar = existingEntries.find((entry) => entry.isFile() && /^CustomSkinLoader-.*\.jar$/i.test(entry.name));
  if (existingJar) {
    return { status: 'ready', source: 'existing', filePath: path.join(modsDir, existingJar.name) };
  }

  const existingDisabled = existingEntries.find((entry) => entry.isFile() && /^CustomSkinLoader-.*\.disable$/i.test(entry.name));
  if (existingDisabled) {
    const disabledPath = path.join(modsDir, existingDisabled.name);
    const jarPath = disabledPath.replace(/\.disable$/i, '.jar');
    await safeUnlink(jarPath);
    await fsp.rename(disabledPath, jarPath);
    emitLaunchDebug(event, instanceId, instanceName, '[Skins] Re-enabled local CustomSkinLoader.');
    return { status: 'ready', source: 'reenabled', filePath: jarPath };
  }

  let targetVersion = null;
  for (const candidateLoader of loaderCandidates) {
    try {
      const versions = await fetchModrinthVersions({
        projectId: CUSTOM_SKIN_LOADER_PROJECT_ID,
        minecraftVersion,
        loaders: [candidateLoader]
      });
      if (Array.isArray(versions) && versions.length) {
        targetVersion = versions.find((entry) => entry.version_type === 'release') || versions[0];
        if (targetVersion) break;
      }
    } catch {
      // try next loader candidate
    }
  }

  if (!targetVersion) {
    emitLaunchDebug(
      event,
      instanceId,
      instanceName,
      `[Skins] CustomSkinLoader was not found for ${minecraftVersion} (${loaderCandidates.join(', ')}).`
    );
    return { status: 'skipped', reason: 'mod-not-found' };
  }

  const file = resolvePrimaryModFile(targetVersion);
  const destination = path.join(modsDir, file.filename);
  await downloadToFileWithFallback({
    url: file.url,
    destination,
    timeoutMs: DEFAULT_DOWNLOAD_TIMEOUT_MS
  });

  emitLaunchDebug(event, instanceId, instanceName, `[Skins] Installed CustomSkinLoader ${targetVersion.version_number || targetVersion.name || ''}.`);
  return { status: 'ready', source: 'downloaded', filePath: destination };
};

const ensureThreeDSkinLayersForInstance = async ({ event, instanceId, instanceName, installPath, minecraftVersion, loader }) => {
  const loaderCandidates = resolveSkinSyncLoaders(loader);
  if (!loaderCandidates.length) {
    return { status: 'skipped', reason: 'loader-not-supported' };
  }

  const modsDir = path.join(installPath, 'mods');
  await fsp.mkdir(modsDir, { recursive: true });

  const existingEntries = await fsp.readdir(modsDir, { withFileTypes: true });
  const existingJar = existingEntries.find((entry) => entry.isFile() && /3dskinlayers.*\.jar$/i.test(entry.name));
  if (existingJar) {
    return { status: 'ready', source: 'existing', filePath: path.join(modsDir, existingJar.name) };
  }

  const existingDisabled = existingEntries.find((entry) => entry.isFile() && /3dskinlayers.*\.disable$/i.test(entry.name));
  if (existingDisabled) {
    const disabledPath = path.join(modsDir, existingDisabled.name);
    const jarPath = disabledPath.replace(/\.disable$/i, '.jar');
    await safeUnlink(jarPath);
    await fsp.rename(disabledPath, jarPath);
    emitLaunchDebug(event, instanceId, instanceName, '[Skins] Re-enabled local 3D Skin Layers.');
    return { status: 'ready', source: 'reenabled', filePath: jarPath };
  }

  let targetVersion = null;
  for (const candidateLoader of loaderCandidates) {
    try {
      const versions = await fetchModrinthVersions({
        projectId: THREE_D_SKIN_LAYERS_PROJECT_ID,
        minecraftVersion,
        loaders: [candidateLoader]
      });
      if (Array.isArray(versions) && versions.length) {
        targetVersion = versions.find((entry) => entry.version_type === 'release') || versions[0];
        if (targetVersion) break;
      }
    } catch {
      // try next loader candidate
    }
  }

  if (!targetVersion) {
    emitLaunchDebug(
      event,
      instanceId,
      instanceName,
      `[Skins] 3D Skin Layers was not found for ${minecraftVersion} (${loaderCandidates.join(', ')}).`
    );
    return { status: 'skipped', reason: 'mod-not-found' };
  }

  const file = resolvePrimaryModFile(targetVersion);
  const destination = path.join(modsDir, file.filename);
  await downloadToFileWithFallback({
    url: file.url,
    destination,
    timeoutMs: DEFAULT_DOWNLOAD_TIMEOUT_MS
  });

  emitLaunchDebug(event, instanceId, instanceName, `[Skins] Installed 3D Skin Layers ${targetVersion.version_number || targetVersion.name || ''}.`);
  return { status: 'ready', source: 'downloaded', filePath: destination };
};

const uploadLocalSkinToService = async ({ serviceUrl, serviceToken, username, model, skinPath, capePath }) => {
  const skinBuffer = await fsp.readFile(skinPath);
  const capeBuffer = capePath && (await pathExists(capePath)) ? await fsp.readFile(capePath) : null;

  const response = await fetchWithTimeout(`${serviceUrl}/v1/profiles/${encodeURIComponent(username)}`, {
    method: 'PUT',
    timeoutMs: DEFAULT_FETCH_TIMEOUT_MS,
    headers: {
      ...buildSkinServiceHeaders(serviceToken),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: normalizeSkinModel(model),
      skinBase64: skinBuffer.toString('base64'),
      capeBase64: capeBuffer ? capeBuffer.toString('base64') : null
    })
  });

  if (!response.ok) {
    const error = new Error(`Skin upload failed with HTTP ${response.status}.`);
    error.code = 'SKIN_UPLOAD_FAILED';
    throw error;
  }
};

const readSkinSyncCache = async (cachePath) => {
  try {
    const raw = await fsp.readFile(cachePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeSkinSyncCache = async (cachePath, payload) => {
  await fsp.writeFile(cachePath, `${JSON.stringify(payload || {}, null, 2)}\n`, 'utf8');
};

const syncSkinsFromService = async ({ serviceUrl, serviceToken, username, localSkinDir, localCapeDir }) => {
  const response = await fetchWithTimeout(`${serviceUrl}/v1/profiles`, {
    timeoutMs: DEFAULT_FETCH_TIMEOUT_MS,
    headers: buildSkinServiceHeaders(serviceToken)
  });

  if (!response.ok) {
    const error = new Error(`Skin sync list failed with HTTP ${response.status}.`);
    error.code = 'SKIN_SYNC_FAILED';
    throw error;
  }

  const payload = await response.json();
  const profiles = Array.isArray(payload?.profiles) ? payload.profiles.slice(0, 500) : [];
  const cachePath = path.join(path.dirname(localSkinDir), '.konlauncher-skin-cache.json');
  const cache = await readSkinSyncCache(cachePath);
  const nextCache = {};

  for (const profile of profiles) {
    const profileName = sanitizeMinecraftUsername(profile?.username || '');
    if (!profileName) continue;

    const skinUrlRaw = String(profile?.skinUrl || '').trim();
    const capeUrlRaw = String(profile?.capeUrl || '').trim();
    const skinHash = String(profile?.skinHash || '').trim();
    const capeHash = String(profile?.capeHash || '').trim();

    const skinDestination = path.join(localSkinDir, `${profileName}.png`);
    const capeDestination = path.join(localCapeDir, `${profileName}.png`);
    const cacheEntry = cache[profileName] && typeof cache[profileName] === 'object' ? cache[profileName] : {};

    if (skinUrlRaw) {
      const needsSkinDownload =
        !skinHash ||
        cacheEntry.skinHash !== skinHash ||
        !(await pathExists(skinDestination));
      if (needsSkinDownload) {
        const skinUrl = new URL(skinUrlRaw, `${serviceUrl}/`).toString();
        await downloadToFileWithFallback({ url: skinUrl, destination: skinDestination, timeoutMs: DEFAULT_DOWNLOAD_TIMEOUT_MS });
      }
    }

    if (capeUrlRaw) {
      const needsCapeDownload =
        !capeHash ||
        cacheEntry.capeHash !== capeHash ||
        !(await pathExists(capeDestination));
      if (needsCapeDownload) {
        const capeUrl = new URL(capeUrlRaw, `${serviceUrl}/`).toString();
        await downloadToFileWithFallback({ url: capeUrl, destination: capeDestination, timeoutMs: DEFAULT_DOWNLOAD_TIMEOUT_MS });
      }
    } else if (profileName !== username) {
      await safeUnlink(capeDestination);
    }

    nextCache[profileName] = {
      skinHash,
      capeHash
    };
  }

  await writeSkinSyncCache(cachePath, nextCache);
};

const prepareSkinsForLaunch = async ({ event, instanceId, instanceName, installPath, minecraftVersion, loader, username }) => {
  const sanitizedUsername = sanitizeMinecraftUsername(username);
  if (!sanitizedUsername) {
    return { status: 'skipped', reason: 'username-invalid' };
  }

  const state = await loadSkinsState();
  const activeSkin = state.skins.find((entry) => entry.id === state.activeSkinId);
  if (!activeSkin) {
    return { status: 'skipped', reason: 'active-skin-missing' };
  }

  await ensureCustomSkinLoaderForInstance({ event, instanceId, instanceName, installPath, minecraftVersion, loader });
  if (AUTO_INSTALL_THREE_D_SKIN_LAYERS) {
    try {
      await ensureThreeDSkinLayersForInstance({ event, instanceId, instanceName, installPath, minecraftVersion, loader });
    } catch (error) {
      emitLaunchDebug(event, instanceId, instanceName, `[Skins] 3D Skin Layers install failed: ${error?.message || 'unknown error'}`);
    }
  } else {
    emitLaunchDebug(event, instanceId, instanceName, '[Skins] Auto-install for 3D Skin Layers is disabled.');
  }

  const localSkinRoot = path.join(installPath, 'CustomSkinLoader', 'LocalSkin');
  const localSkinDir = path.join(localSkinRoot, 'skins');
  const localCapeDir = path.join(localSkinRoot, 'capes');
  await fsp.mkdir(localSkinDir, { recursive: true });
  await fsp.mkdir(localCapeDir, { recursive: true });

  const sourceSkinPath = resolveSkinTexturePath(activeSkin);
  const sourceCapePath = resolveSkinCapePath(activeSkin);
  const ownSkinDestination = path.join(localSkinDir, `${sanitizedUsername}.png`);
  const ownCapeDestination = path.join(localCapeDir, `${sanitizedUsername}.png`);
  let uploadCapePath = sourceCapePath;
  const capeMode = String(activeSkin?.capeMode || 'none').toLowerCase();
  let officialProfile = null;

  await fsp.copyFile(sourceSkinPath, ownSkinDestination);
  if (capeMode === 'official' || capeMode === 'default') {
    officialProfile = await resolveOfficialProfileInternal(sanitizedUsername);
  }

  if ((capeMode === 'official' || capeMode === 'default') && officialProfile?.capeDataUrl) {
    const capeBuffer = decodePngDataUrl(officialProfile.capeDataUrl, 'Official cape');
    validateCapeTextureBuffer(capeBuffer);
    await fsp.writeFile(ownCapeDestination, capeBuffer);
    uploadCapePath = ownCapeDestination;
  } else if (capeMode === 'official') {
    await safeUnlink(ownCapeDestination);
    uploadCapePath = null;
  } else if (sourceCapePath && (await pathExists(sourceCapePath))) {
    await fsp.copyFile(sourceCapePath, ownCapeDestination);
    uploadCapePath = sourceCapePath;
  } else {
    await safeUnlink(ownCapeDestination);
    uploadCapePath = null;
  }

  const serviceUrl = sanitizeSkinServiceUrl(state.serviceUrl);
  const serviceToken = String(state.serviceToken || '').trim();
  if (serviceUrl) {
    try {
      await uploadLocalSkinToService({
        serviceUrl,
        serviceToken,
        username: sanitizedUsername,
        model: activeSkin.model,
        skinPath: sourceSkinPath,
        capePath: uploadCapePath
      });
    } catch (error) {
      emitLaunchDebug(event, instanceId, instanceName, `[Skins] Upload failed: ${error?.message || 'unknown error'}`);
    }

    try {
      await syncSkinsFromService({
        serviceUrl,
        serviceToken,
        username: sanitizedUsername,
        localSkinDir,
        localCapeDir
      });
    } catch (error) {
      emitLaunchDebug(event, instanceId, instanceName, `[Skins] Sync failed: ${error?.message || 'unknown error'}`);
    }
  }

  return {
    status: 'ready',
    username: sanitizedUsername,
    hasService: Boolean(serviceUrl)
  };
};

const resolveModrinthLoaders = (loader) => {
  const normalized = normalizeLoader(loader);
  if (normalized === 'vanilla') return [];
  if (normalized === 'quilt') return ['quilt', 'fabric'];
  if (normalized === 'neoforge') return ['neoforge', 'forge'];
  return [normalized];
};

const normalizeContentType = (value) => {
  const normalized = String(value || 'mod').trim().toLowerCase();
  if (normalized === 'resourcepack' || normalized === 'shader' || normalized === 'mod') {
    return normalized;
  }
  return 'mod';
};

const resolveContentFolderName = (contentType) => {
  const normalized = normalizeContentType(contentType);
  if (normalized === 'resourcepack') return 'resourcepacks';
  if (normalized === 'shader') return 'shaderpacks';
  return 'mods';
};

const isLocalContentId = (value) => String(value || '').trim().toLowerCase().startsWith(LOCAL_CONTENT_ID_PREFIX);

const toSafeLocalContentId = (contentType, relativePath) => {
  const normalizedType = normalizeContentType(contentType);
  const normalizedPath = String(relativePath || '')
    .replace(/\\/g, '/')
    .toLowerCase();
  return `${LOCAL_CONTENT_ID_PREFIX}${normalizedType}:${normalizedPath}`;
};

const toDisplayTitleFromFilename = (filename) => {
  const base = String(filename || '')
    .replace(/\.(disabled?|jar|zip)$/i, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return base || filename || 'Local content';
};

const isSupportedContentEntry = (entry, contentType) => {
  const normalizedType = normalizeContentType(contentType);
  const name = String(entry?.name || '');

  if (entry?.isDirectory?.()) {
    return normalizedType === 'resourcepack' || normalizedType === 'shader';
  }

  if (!entry?.isFile?.()) return false;

  if (normalizedType === 'mod') {
    return /\.(jar|disable|disabled)$/i.test(name);
  }

  return /\.(zip|jar)$/i.test(name);
};

const MAX_LOCAL_ICON_BYTES = 512 * 1024;

const toIconMimeType = (name) => {
  const ext = path.extname(String(name || '')).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'image/png';
};

const bufferToDataUrl = (buffer, mime = 'image/png') => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return '';
  return `data:${mime};base64,${buffer.toString('base64')}`;
};

const detectBufferMimeType = (buffer, fallback = 'image/png') => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return fallback;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }
  return fallback;
};

const readFileAsDataUrlSafe = async (targetPath) => {
  try {
    const stat = await fsp.stat(targetPath);
    if (!stat.isFile() || stat.size <= 0 || stat.size > MAX_LOCAL_ICON_BYTES) return '';
    const buffer = await fsp.readFile(targetPath);
    return bufferToDataUrl(buffer, toIconMimeType(targetPath));
  } catch {
    return '';
  }
};

const readArchiveEntryBuffer = async (archivePath, matcher, maxBytes = MAX_LOCAL_ICON_BYTES) => {
  if (!yauzl || typeof matcher !== 'function') return Buffer.alloc(0);

  return new Promise((resolve) => {
    yauzl.open(archivePath, { lazyEntries: true, autoClose: true }, (openError, zipfile) => {
      if (openError || !zipfile) {
        resolve(Buffer.alloc(0));
        return;
      }

      let completed = false;
      const finish = (value = Buffer.alloc(0)) => {
        if (completed) return;
        completed = true;
        try {
          zipfile.close();
        } catch {
          // noop
        }
        resolve(value);
      };

      zipfile.on('error', () => finish(Buffer.alloc(0)));
      zipfile.on('end', () => finish(Buffer.alloc(0)));
      zipfile.readEntry();

      zipfile.on('entry', (entry) => {
        if (completed) return;
        const entryName = String(entry?.fileName || '');
        const uncompressedSize = Number(entry?.uncompressedSize || 0);
        if (!matcher(entryName) || uncompressedSize <= 0 || uncompressedSize > maxBytes) {
          zipfile.readEntry();
          return;
        }

        zipfile.openReadStream(entry, (streamError, stream) => {
          if (streamError || !stream) {
            finish(Buffer.alloc(0));
            return;
          }

          const chunks = [];
          let totalBytes = 0;
          stream.on('data', (chunk) => {
            totalBytes += chunk.length;
            if (totalBytes > maxBytes) {
              stream.destroy();
              finish(Buffer.alloc(0));
              return;
            }
            chunks.push(chunk);
          });
          stream.on('error', () => finish(Buffer.alloc(0)));
          stream.on('end', () => {
            if (completed) return;
            const data = Buffer.concat(chunks);
            finish(data);
          });
        });
      });
    });
  });
};

const readArchiveEntryDataUrl = async (archivePath, matcher) => {
  const buffer = await readArchiveEntryBuffer(archivePath, matcher, MAX_LOCAL_ICON_BYTES);
  if (!Buffer.isBuffer(buffer) || !buffer.length) return '';
  return bufferToDataUrl(buffer, detectBufferMimeType(buffer));
};

const readArchiveEntryText = async (archivePath, matcher, maxBytes = 256 * 1024) => {
  const buffer = await readArchiveEntryBuffer(archivePath, matcher, maxBytes);
  if (!Buffer.isBuffer(buffer) || !buffer.length) return '';
  return buffer.toString('utf8');
};

const normalizeArchiveEntryPath = (value) =>
  String(value || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .toLowerCase();

const resolveIconPathFromFabricMeta = (payload) => {
  if (!payload || typeof payload !== 'object') return '';
  const icon = payload.icon;
  if (typeof icon === 'string') return icon;
  if (!icon || typeof icon !== 'object') return '';
  const iconEntries = Object.entries(icon)
    .filter(([, pathValue]) => typeof pathValue === 'string' && pathValue.trim())
    .sort((left, right) => (Number.parseInt(right[0], 10) || 0) - (Number.parseInt(left[0], 10) || 0));
  return iconEntries[0]?.[1] || '';
};

const resolveIconPathFromQuiltMeta = (payload) => {
  if (!payload || typeof payload !== 'object') return '';
  const quiltLoader = payload.quilt_loader && typeof payload.quilt_loader === 'object' ? payload.quilt_loader : {};
  const direct = quiltLoader.icon || quiltLoader?.metadata?.icon || payload.icon;
  if (typeof direct === 'string') return direct;
  if (direct && typeof direct === 'object') {
    const entries = Object.entries(direct)
      .filter(([, pathValue]) => typeof pathValue === 'string' && pathValue.trim())
      .sort((left, right) => (Number.parseInt(right[0], 10) || 0) - (Number.parseInt(left[0], 10) || 0));
    return entries[0]?.[1] || '';
  }
  return '';
};

const resolveIconPathFromMcmodInfo = (payload) => {
  const list = Array.isArray(payload) ? payload : payload && typeof payload === 'object' ? [payload] : [];
  for (const entry of list) {
    const logoFile = String(entry?.logoFile || '').trim();
    if (logoFile) return logoFile;
  }
  return '';
};

const resolveIconPathFromModsToml = (payloadText) => {
  const match = String(payloadText || '').match(/logoFile\s*=\s*["']([^"']+)["']/i);
  return String(match?.[1] || '').trim();
};

const resolveIconPathFromArchiveMetadata = async (archivePath) => {
  try {
    const fabricRaw = await readArchiveEntryText(archivePath, (entryName) => {
      const lowered = normalizeArchiveEntryPath(entryName);
      return lowered === 'fabric.mod.json' || lowered.endsWith('/fabric.mod.json');
    });
    if (fabricRaw) {
      const iconPath = resolveIconPathFromFabricMeta(JSON.parse(fabricRaw));
      if (iconPath) return iconPath;
    }
  } catch {
    // noop
  }

  try {
    const quiltRaw = await readArchiveEntryText(archivePath, (entryName) => {
      const lowered = normalizeArchiveEntryPath(entryName);
      return lowered === 'quilt.mod.json' || lowered.endsWith('/quilt.mod.json');
    });
    if (quiltRaw) {
      const iconPath = resolveIconPathFromQuiltMeta(JSON.parse(quiltRaw));
      if (iconPath) return iconPath;
    }
  } catch {
    // noop
  }

  try {
    const mcmodRaw = await readArchiveEntryText(archivePath, (entryName) => {
      const lowered = normalizeArchiveEntryPath(entryName);
      return lowered === 'mcmod.info' || lowered.endsWith('/mcmod.info');
    });
    if (mcmodRaw) {
      const iconPath = resolveIconPathFromMcmodInfo(JSON.parse(mcmodRaw));
      if (iconPath) return iconPath;
    }
  } catch {
    // noop
  }

  try {
    const modsTomlRaw = await readArchiveEntryText(archivePath, (entryName) => {
      const lowered = normalizeArchiveEntryPath(entryName);
      return lowered === 'meta-inf/mods.toml' || lowered.endsWith('/meta-inf/mods.toml');
    });
    const iconPath = resolveIconPathFromModsToml(modsTomlRaw);
    if (iconPath) return iconPath;
  } catch {
    // noop
  }

  return '';
};

const resolveLocalContentIconDataUrl = async ({ absolutePath, contentType, entryName, isDirectory }) => {
  const cacheKey = `${String(absolutePath || '').toLowerCase()}::${normalizeContentType(contentType)}`;
  if (localContentIconCache.has(cacheKey)) {
    return localContentIconCache.get(cacheKey) || '';
  }

  const normalizedType = normalizeContentType(contentType);
  let resolved = '';

  if (isDirectory) {
    resolved = await readFileAsDataUrlSafe(path.join(absolutePath, 'pack.png'));
  } else {
    const normalizedName = String(entryName || '').toLowerCase();
    const isArchive = /\.(jar|zip|disable|disabled)$/i.test(normalizedName);
    if (isArchive) {
      if (normalizedType === 'mod') {
        const metadataIconPath = normalizeArchiveEntryPath(await resolveIconPathFromArchiveMetadata(absolutePath));
        if (metadataIconPath) {
          resolved = await readArchiveEntryDataUrl(absolutePath, (name) => {
            const lowered = normalizeArchiveEntryPath(name);
            return lowered === metadataIconPath || lowered.endsWith(`/${metadataIconPath}`);
          });
        }
        if (!resolved) {
          resolved = await readArchiveEntryDataUrl(absolutePath, (name) => {
            const lowered = String(name || '').toLowerCase().replace(/\\/g, '/');
            return (
              lowered === 'icon.png' ||
              lowered.endsWith('/icon.png') ||
              lowered === 'logo.png' ||
              lowered.endsWith('/logo.png') ||
              /\/logo[^/]*\.(png|jpg|jpeg|webp)$/i.test(lowered)
            );
          });
        }
      } else {
        resolved = await readArchiveEntryDataUrl(absolutePath, (name) => {
          const lowered = String(name || '').toLowerCase().replace(/\\/g, '/');
          return lowered === 'pack.png' || lowered.endsWith('/pack.png');
        });
      }
    }
  }

  localContentIconCache.set(cacheKey, resolved || '');
  return resolved || '';
};

const scanContentFolderInternal = async ({ installPath, contentType, items = [] }) => {
  const normalizedType = normalizeContentType(contentType);
  const basePath = path.resolve(String(installPath || '').trim());
  if (!basePath) {
    const error = new Error('installPath is required for content scan.');
    error.code = 'INVALID_SCAN_PAYLOAD';
    throw error;
  }

  const folderPath = path.join(basePath, resolveContentFolderName(normalizedType));
  await fsp.mkdir(folderPath, { recursive: true });

  const knownItems = Array.isArray(items) ? items : [];
  const knownByPath = new Map();
  const knownByFilename = new Map();

  for (const entry of knownItems) {
    const filePath = typeof entry?.filePath === 'string' && entry.filePath.trim() ? path.resolve(entry.filePath) : '';
    const filename = String(entry?.filename || '').trim().toLowerCase();
    if (filePath) {
      knownByPath.set(filePath, entry);
    }
    if (filename) {
      knownByFilename.set(filename, entry);
    }
  }

  const dirEntries = await fsp.readdir(folderPath, { withFileTypes: true });
  const nextItems = [];

  for (const entry of dirEntries) {
    if (!isSupportedContentEntry(entry, normalizedType)) continue;

    const absolutePath = path.join(folderPath, entry.name);
    const existing = knownByPath.get(path.resolve(absolutePath)) || knownByFilename.get(String(entry.name || '').toLowerCase()) || null;
    const relativePath = path.relative(basePath, absolutePath).replace(/\\/g, '/');
    const localId = toSafeLocalContentId(normalizedType, relativePath);
    const projectId = String(existing?.projectId || existing?.id || '').trim();
    const hasRemoteProject = projectId && !isLocalContentId(projectId);
    const author = String(existing?.author || existing?.creator || '').trim();
    const organization = String(existing?.organization || '').trim();
    const title = String(existing?.title || '').trim() || toDisplayTitleFromFilename(entry.name);
    const isDisabled = normalizedType === 'mod' ? /\.(disable|disabled)$/i.test(entry.name) : false;
    let iconUrl = existing?.icon_url || null;
    if (!iconUrl) {
      iconUrl = await resolveLocalContentIconDataUrl({
        absolutePath,
        contentType: normalizedType,
        entryName: entry.name,
        isDirectory: entry.isDirectory?.() === true
      });
    }

    nextItems.push({
      id: hasRemoteProject ? projectId : localId,
      projectId: hasRemoteProject ? projectId : localId,
      contentType: normalizedType,
      title,
      author,
      creator: author,
      organization: organization || null,
      version: String(existing?.version || '').trim() || 'local',
      versionId: hasRemoteProject ? existing?.versionId || null : null,
      filename: entry.name,
      filePath: absolutePath,
      icon_url: iconUrl || null,
      enabled: normalizedType === 'mod' ? !isDisabled : true,
      hasUpdate: hasRemoteProject ? Boolean(existing?.hasUpdate) : false,
      latestVersionId: hasRemoteProject ? existing?.latestVersionId || null : null,
      latestVersion: hasRemoteProject ? existing?.latestVersion || null : null,
      localOnly: !hasRemoteProject,
      updatedAt: existing?.updatedAt || new Date().toISOString()
    });
  }

  nextItems.sort((a, b) => {
    const byLocal = Number(a.localOnly) - Number(b.localOnly);
    if (byLocal !== 0) return byLocal;
    return String(a.title || '').localeCompare(String(b.title || ''), 'en', { sensitivity: 'base' });
  });

  return {
    contentType: normalizedType,
    folderPath,
    items: nextItems
  };
};

const normalizeImportSource = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (IMPORT_SOURCE_IDS.has(normalized)) return normalized;
  const error = new Error(`Unsupported launcher import source: ${normalized || 'unknown'}`);
  error.code = 'IMPORT_SOURCE_UNSUPPORTED';
  throw error;
};

const normalizeMinecraftVersionFromText = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  if (parseGameVersion(text)) return text;
  const match = text.match(/(\d+\.\d+(?:\.\d+)?)/);
  if (!match) return '';
  return parseGameVersion(match[1]) ? match[1] : '';
};

const normalizeLoaderFromText = (value) => {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return '';
  if (text.includes('neoforge') || text.includes('neo-forge') || text.includes('neo forge')) return 'neoforge';
  if (text.includes('fabric')) return 'fabric';
  if (text.includes('quilt')) return 'quilt';
  if (text.includes('forge')) return 'forge';
  if (text.includes('vanilla')) return 'vanilla';
  const normalized = normalizeLoader(text);
  if (normalized === 'vanilla' && text !== 'vanilla') return '';
  return normalized;
};

const extractVersionAndLoaderFromText = (value) => {
  return {
    minecraftVersion: normalizeMinecraftVersionFromText(value),
    loader: normalizeLoaderFromText(value)
  };
};

const parseTimestampToMs = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value <= 0) return 0;
    return value > 1e12 ? value : value * 1000;
  }

  const text = String(value || '').trim();
  if (!text) return 0;
  const normalized = text.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const expandWindowsEnvVariables = (value) => {
  return String(value || '').replace(/%([^%]+)%/g, (_match, key) => {
    const envName = String(key || '').trim();
    return process.env[envName] || `%${envName}%`;
  });
};

const resolveCandidatePath = (basePath, maybeRelativePath) => {
  const raw = expandWindowsEnvVariables(String(maybeRelativePath || '').trim());
  if (!raw) return path.resolve(basePath);
  if (path.isAbsolute(raw)) return path.resolve(raw);
  return path.resolve(basePath, raw);
};

const parseInstanceDirFromLauncherConfig = (rawConfig) => {
  const text = String(rawConfig || '');
  const match = text.match(/^\s*InstanceDir\s*=\s*(.+)\s*$/im);
  if (!match) return '';
  return String(match[1] || '')
    .trim()
    .replace(/^"(.*)"$/, '$1')
    .trim();
};

const resolveMmcInstanceRoots = async (launcherRoot, configFileName) => {
  const roots = new Set();
  const absoluteLauncherRoot = path.resolve(launcherRoot);
  const configPath = path.join(absoluteLauncherRoot, configFileName);
  const configRaw = await fsp.readFile(configPath, 'utf8').catch(() => '');
  const configuredInstanceDir = parseInstanceDirFromLauncherConfig(configRaw);
  if (configuredInstanceDir) {
    roots.add(resolveCandidatePath(absoluteLauncherRoot, configuredInstanceDir));
  }
  roots.add(path.join(absoluteLauncherRoot, 'instances'));
  return [...roots];
};

const getImportSourceRoots = async (sourceId) => {
  const appData = app.getPath('appData');
  if (sourceId === 'official' || sourceId === 'tlauncher') {
    return [path.join(appData, '.minecraft')];
  }
  if (sourceId === 'modrinth') {
    return [path.join(appData, 'ModrinthApp', 'profiles'), path.join(appData, 'com.modrinth.theseus', 'profiles')];
  }
  if (sourceId === 'prism') {
    return resolveMmcInstanceRoots(path.join(appData, 'PrismLauncher'), 'prismlauncher.cfg');
  }
  if (sourceId === 'multimc') {
    return resolveMmcInstanceRoots(path.join(appData, 'MultiMC'), 'multimc.cfg');
  }
  return [];
};

const resolveGameRootCandidate = async (basePath) => {
  const nestedMinecraft = path.join(basePath, '.minecraft');
  if (await pathExists(nestedMinecraft)) {
    return nestedMinecraft;
  }
  return basePath;
};

const hasImportablePayload = async (profilePath) => {
  const markers = ['mods', 'resourcepacks', 'shaderpacks', 'saves', 'config', 'options.txt'];
  for (const marker of markers) {
    if (await pathExists(path.join(profilePath, marker))) {
      return true;
    }
  }
  return false;
};

const readJsonIfExists = async (targetPath) => {
  try {
    const raw = await fsp.readFile(targetPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const readMmcCandidateMetadata = async (rawPath) => {
  const fromName = extractVersionAndLoaderFromText(path.basename(rawPath));
  const mmcPack = await readJsonIfExists(path.join(rawPath, 'mmc-pack.json'));
  const components = Array.isArray(mmcPack?.components) ? mmcPack.components : [];
  let minecraftVersion = fromName.minecraftVersion || '';
  let loader = fromName.loader || '';

  for (const component of components) {
    const uid = String(component?.uid || '').trim().toLowerCase();
    const componentVersion = String(component?.version || component?.cachedVersion || '').trim();
    if (!uid) continue;

    if (!minecraftVersion && uid.startsWith('net.minecraft')) {
      minecraftVersion = normalizeMinecraftVersionFromText(componentVersion);
    }

    if (!loader) {
      if (uid.includes('fabric-loader')) loader = 'fabric';
      else if (uid.includes('quilt-loader')) loader = 'quilt';
      else if (uid.includes('net.neoforged')) loader = 'neoforge';
      else if (uid.includes('net.minecraftforge')) loader = 'forge';
    }
  }

  return { minecraftVersion, loader };
};

const detectLoaderFromProfileMarkers = async (profilePath) => {
  const markerChecks = [
    [path.join(profilePath, '.fabric'), 'fabric'],
    [path.join(profilePath, 'config', 'fabric_loader_dependencies.json'), 'fabric'],
    [path.join(profilePath, '.quilt'), 'quilt'],
    [path.join(profilePath, 'config', 'quilt_loader.json'), 'quilt'],
    [path.join(profilePath, 'config', 'forge-client.toml'), 'forge'],
    [path.join(profilePath, 'config', 'fml.toml'), 'forge']
  ];

  for (const [markerPath, loader] of markerChecks) {
    if (await pathExists(markerPath)) return loader;
  }

  const modsDir = path.join(profilePath, 'mods');
  if (!(await pathExists(modsDir))) return '';
  const names = await fsp.readdir(modsDir).catch(() => []);
  const loader = normalizeLoaderFromText(names.slice(0, 120).join(' '));
  return loader || '';
};

const readModrinthMetadataFromAppDb = async (appRoot) => {
  const metadata = new Map();
  const dbPath = path.join(appRoot, 'app.db');
  if (!(await pathExists(dbPath))) return metadata;

  let DatabaseSync = null;
  try {
    ({ DatabaseSync } = require('node:sqlite'));
  } catch {
    return metadata;
  }

  let db = null;
  try {
    db = new DatabaseSync(dbPath, { readonly: true });
    const rows = db
      .prepare('SELECT path, name, game_version, mod_loader, modified, last_played FROM profiles')
      .all();
    for (const row of rows) {
      const relativePath = String(row?.path || '').trim();
      if (!relativePath) continue;
      const absoluteProfilePath = path.resolve(path.join(appRoot, 'profiles', relativePath));
      metadata.set(absoluteProfilePath, {
        profileName: String(row?.name || relativePath).trim() || path.basename(relativePath),
        minecraftVersion: normalizeMinecraftVersionFromText(row?.game_version || ''),
        loader: normalizeLoaderFromText(row?.mod_loader || ''),
        updatedAtMs: Math.max(parseTimestampToMs(row?.modified), parseTimestampToMs(row?.last_played))
      });
    }
  } catch {
    return metadata;
  } finally {
    try {
      db?.close();
    } catch {
      // noop
    }
  }

  return metadata;
};

const readModrinthCandidateMetadata = async ({ rawPath, profilePath, profileName, modrinthDbMetadata }) => {
  const fromName = extractVersionAndLoaderFromText(profileName);
  const dbEntry = modrinthDbMetadata.get(path.resolve(rawPath));
  const metadataFileCandidates = ['profile.json', 'instance.json', '.profile.json', 'modrinth.index.json'];
  let fromJson = { minecraftVersion: '', loader: '' };

  for (const filename of metadataFileCandidates) {
    const payload = await readJsonIfExists(path.join(rawPath, filename));
    if (!payload || typeof payload !== 'object') continue;
    const directVersion =
      payload.game_version ||
      payload.gameVersion ||
      payload.minecraft_version ||
      payload.minecraftVersion ||
      payload.version ||
      payload.version_id ||
      payload.versionId ||
      '';
    const directLoader =
      payload.mod_loader ||
      payload.modLoader ||
      payload.loader ||
      payload.loaderType ||
      payload.loader_type ||
      '';
    const combined = extractVersionAndLoaderFromText(`${directVersion} ${directLoader}`);
    if (!fromJson.minecraftVersion && combined.minecraftVersion) fromJson.minecraftVersion = combined.minecraftVersion;
    if (!fromJson.loader && combined.loader) fromJson.loader = combined.loader;
    if (fromJson.minecraftVersion && fromJson.loader) break;
  }

  const detectedLoader = await detectLoaderFromProfileMarkers(profilePath);
  return {
    profileName: dbEntry?.profileName || profileName,
    minecraftVersion: dbEntry?.minecraftVersion || fromJson.minecraftVersion || fromName.minecraftVersion,
    loader: dbEntry?.loader || fromJson.loader || detectedLoader || fromName.loader,
    updatedAtMs: Number(dbEntry?.updatedAtMs || 0)
  };
};

const listOfficialLikeImportCandidates = async (rootPath) => {
  const candidates = [];
  const launcherProfiles = await readJsonIfExists(path.join(rootPath, 'launcher_profiles.json'));
  const profileEntries =
    launcherProfiles?.profiles && typeof launcherProfiles.profiles === 'object' ? Object.entries(launcherProfiles.profiles) : [];

  for (const [profileId, profileValue] of profileEntries) {
    const profile = profileValue && typeof profileValue === 'object' ? profileValue : {};
    const gameDirValue = typeof profile.gameDir === 'string' ? profile.gameDir : '';
    const basePath = gameDirValue ? resolveCandidatePath(rootPath, gameDirValue) : rootPath;
    const profilePath = await resolveGameRootCandidate(basePath);
    if (!(await hasImportablePayload(profilePath))) continue;
    const stat = await fsp.stat(profilePath).catch(() => null);
    const parsed = extractVersionAndLoaderFromText(profile.lastVersionId || profile.name || profileId);
    candidates.push({
      profilePath,
      profileName: String(profile.name || profileId || path.basename(profilePath)),
      minecraftVersion: parsed.minecraftVersion || '',
      loader: parsed.loader || '',
      updatedAtMs: Math.max(stat?.mtimeMs || 0, parseTimestampToMs(profile.lastUsed))
    });
  }

  const rootCandidatePath = await resolveGameRootCandidate(rootPath);
  if (await hasImportablePayload(rootCandidatePath)) {
    const stat = await fsp.stat(rootCandidatePath).catch(() => null);
    candidates.push({
      profilePath: rootCandidatePath,
      profileName: path.basename(rootCandidatePath),
      minecraftVersion: '',
      loader: '',
      updatedAtMs: stat?.mtimeMs || 0
    });
  }

  return candidates;
};

const listImportCandidates = async (sourceId) => {
  const roots = await getImportSourceRoots(sourceId);
  const candidates = [];

  for (const root of roots) {
    const absoluteRoot = path.resolve(root);
    if (!(await pathExists(absoluteRoot))) continue;

    if (sourceId === 'official' || sourceId === 'tlauncher') {
      const officialCandidates = await listOfficialLikeImportCandidates(absoluteRoot);
      candidates.push(...officialCandidates);
      continue;
    }

    let modrinthDbMetadata = new Map();
    if (sourceId === 'modrinth') {
      modrinthDbMetadata = await readModrinthMetadataFromAppDb(path.dirname(absoluteRoot));
    }

    const entries = await fsp.readdir(absoluteRoot, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (!entry?.isDirectory?.()) continue;
      const rawPath = path.join(absoluteRoot, entry.name);
      const profilePath = await resolveGameRootCandidate(rawPath);
      if (!(await hasImportablePayload(profilePath))) continue;
      const stat = await fsp.stat(profilePath).catch(() => null);
      let metadata = {
        profileName: entry.name,
        minecraftVersion: '',
        loader: '',
        updatedAtMs: 0
      };
      if (sourceId === 'prism' || sourceId === 'multimc') {
        const mmc = await readMmcCandidateMetadata(rawPath);
        metadata = {
          ...metadata,
          ...mmc
        };
      } else if (sourceId === 'modrinth') {
        const modrinth = await readModrinthCandidateMetadata({
          rawPath,
          profilePath,
          profileName: entry.name,
          modrinthDbMetadata
        });
        metadata = {
          ...metadata,
          ...modrinth
        };
      } else {
        const fromName = extractVersionAndLoaderFromText(entry.name);
        metadata = {
          ...metadata,
          ...fromName
        };
      }
      candidates.push({
        profilePath,
        profileName: metadata.profileName || entry.name,
        minecraftVersion: metadata.minecraftVersion || '',
        loader: metadata.loader || '',
        updatedAtMs: Math.max(stat?.mtimeMs || 0, Number(metadata.updatedAtMs || 0))
      });
    }
  }

  candidates.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  return candidates;
};

const selectBestImportCandidate = (candidates, { version, loader } = {}) => {
  const targetVersion = normalizeMinecraftVersionFromText(version);
  const targetLoader = normalizeLoader(loader || 'vanilla');
  const ranked = (Array.isArray(candidates) ? candidates : []).map((candidate, index) => {
    const candidateVersion = normalizeMinecraftVersionFromText(candidate?.minecraftVersion || '');
    const candidateLoader = normalizeLoaderFromText(candidate?.loader || '');
    const sameVersion = Boolean(targetVersion && candidateVersion && candidateVersion === targetVersion);
    const sameLoader = Boolean(targetLoader && candidateLoader && candidateLoader === targetLoader);
    const hasVersion = Boolean(candidateVersion);
    const hasLoader = Boolean(candidateLoader);

    let score = 0;
    if (targetVersion) {
      if (sameVersion) score += 1000;
      else if (hasVersion) score -= 80;
    }
    if (targetLoader && targetLoader !== 'vanilla') {
      if (sameLoader) score += 260;
      else if (hasLoader) score -= 40;
    } else if (targetLoader === 'vanilla' && candidateLoader === 'vanilla') {
      score += 140;
    }
    if (!targetVersion && hasVersion) score += 20;
    if (!targetLoader && hasLoader) score += 10;

    return {
      candidate,
      index,
      score,
      updatedAtMs: Number(candidate?.updatedAtMs || 0)
    };
  });

  ranked.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    if (right.updatedAtMs !== left.updatedAtMs) return right.updatedAtMs - left.updatedAtMs;
    return left.index - right.index;
  });

  return ranked[0]?.candidate || null;
};

const copyFileOrDirectoryIfExists = async (sourcePath, destinationPath) => {
  if (!(await pathExists(sourcePath))) return 0;
  const stat = await fsp.stat(sourcePath);
  if (stat.isDirectory()) {
    const entries = await fsp.readdir(sourcePath).catch(() => []);
    await fsp.cp(sourcePath, destinationPath, { recursive: true, force: true, errorOnExist: false });
    return entries.length;
  }
  await fsp.mkdir(path.dirname(destinationPath), { recursive: true });
  await fsp.copyFile(sourcePath, destinationPath);
  return 1;
};

const importFromLauncherInternal = async (payload = {}) => {
  const sourceLauncher = normalizeImportSource(payload?.sourceLauncher);
  const targetInstallPath = path.resolve(String(payload?.targetInstallPath || '').trim());
  const requestedVersion = normalizeMinecraftVersionFromText(payload?.version || '');
  const requestedLoader = normalizeLoader(payload?.loader || 'vanilla');
  const existingContent = payload?.existingContent && typeof payload.existingContent === 'object' ? payload.existingContent : {};

  if (!targetInstallPath) {
    const error = new Error('targetInstallPath is required for import.');
    error.code = 'IMPORT_TARGET_REQUIRED';
    throw error;
  }

  const candidates = await listImportCandidates(sourceLauncher);
  const selected = selectBestImportCandidate(candidates, {
    version: requestedVersion,
    loader: requestedLoader
  });
  if (!selected) {
    const error = new Error('No launcher profile found to import from.');
    error.code = 'IMPORT_SOURCE_NOT_FOUND';
    throw error;
  }

  await fsp.mkdir(targetInstallPath, { recursive: true });
  const sourcePath = selected.profilePath;

  const copied = {
    mods: await copyFileOrDirectoryIfExists(path.join(sourcePath, 'mods'), path.join(targetInstallPath, 'mods')),
    resourcepacks: await copyFileOrDirectoryIfExists(path.join(sourcePath, 'resourcepacks'), path.join(targetInstallPath, 'resourcepacks')),
    shaderpacks: await copyFileOrDirectoryIfExists(path.join(sourcePath, 'shaderpacks'), path.join(targetInstallPath, 'shaderpacks')),
    config: await copyFileOrDirectoryIfExists(path.join(sourcePath, 'config'), path.join(targetInstallPath, 'config')),
    saves: await copyFileOrDirectoryIfExists(path.join(sourcePath, 'saves'), path.join(targetInstallPath, 'saves')),
    options: await copyFileOrDirectoryIfExists(path.join(sourcePath, 'options.txt'), path.join(targetInstallPath, 'options.txt')),
    optionsof: await copyFileOrDirectoryIfExists(path.join(sourcePath, 'optionsof.txt'), path.join(targetInstallPath, 'optionsof.txt')),
    optionsshaders: await copyFileOrDirectoryIfExists(path.join(sourcePath, 'optionsshaders.txt'), path.join(targetInstallPath, 'optionsshaders.txt')),
    servers: await copyFileOrDirectoryIfExists(path.join(sourcePath, 'servers.dat'), path.join(targetInstallPath, 'servers.dat'))
  };

  const mods = await scanContentFolderInternal({
    installPath: targetInstallPath,
    contentType: 'mod',
    items: Array.isArray(existingContent.mods) ? existingContent.mods : []
  });
  const resourcepacks = await scanContentFolderInternal({
    installPath: targetInstallPath,
    contentType: 'resourcepack',
    items: Array.isArray(existingContent.resourcepacks) ? existingContent.resourcepacks : []
  });
  const shaders = await scanContentFolderInternal({
    installPath: targetInstallPath,
    contentType: 'shader',
    items: Array.isArray(existingContent.shaders) ? existingContent.shaders : []
  });

  return {
    sourceLauncher,
    sourcePath,
    sourceProfileName: selected.profileName,
    sourceVersion: selected.minecraftVersion || null,
    sourceLoader: selected.loader || null,
    copied,
    contents: {
      mods: mods.items,
      resourcepacks: resourcepacks.items,
      shaders: shaders.items
    }
  };
};

const fetchModrinthVersions = async ({ projectId, minecraftVersion, loaders }) => {
  const params = new URLSearchParams();
  params.set('game_versions', JSON.stringify([minecraftVersion]));
  if (loaders.length > 0) {
    params.set('loaders', JSON.stringify(loaders));
  }

  return fetchJson(`https://api.modrinth.com/v2/project/${encodeURIComponent(projectId)}/version?${params.toString()}`);
};

const resolveLatestProjectVersion = async ({ projectId, minecraftVersion, loader, contentType }) => {
  const normalizedType = normalizeContentType(contentType);
  const loaderCandidates = normalizedType === 'mod' ? resolveModrinthLoaders(loader) : [];
  const loaderQueries = loaderCandidates.length ? loaderCandidates.map((item) => [item]) : [[]];

  for (const loaders of loaderQueries) {
    const versions = await fetchModrinthVersions({
      projectId,
      minecraftVersion,
      loaders
    });

    if (Array.isArray(versions) && versions.length) {
      const release = versions.find((item) => item.version_type === 'release') || versions[0];
      return {
        version: release,
        effectiveLoaders: loaders
      };
    }
  }

  const error = new Error(`No compatible mod version found for ${projectId} (${minecraftVersion}, ${loader}).`);
  error.code = 'MOD_VERSION_NOT_FOUND';
  throw error;
};

const resolvePrimaryModFile = (versionPayload) => {
  const files = Array.isArray(versionPayload?.files) ? versionPayload.files : [];
  const primary = files.find((item) => item.primary) || files[0];
  if (!primary?.url || !primary?.filename) {
    const error = new Error('Version payload does not contain a downloadable file.');
    error.code = 'MOD_FILE_NOT_FOUND';
    throw error;
  }
  return primary;
};

const emitModProgress = (event, payload) => {
  emitToSender(event, 'minecraft:mod-download-progress', payload);
};

const installModInternal = async (event, payload) => {
  const instanceId = normalizeId(payload?.instanceId);
  const installPath = path.resolve(payload?.installPath || '');
  const minecraftVersion = String(payload?.version || '').trim();
  const loader = normalizeLoader(payload?.loader || 'vanilla');
  const contentType = normalizeContentType(payload?.contentType || 'mod');
  const projectId = String(payload?.projectId || '').trim();

  if (!instanceId || !installPath || !projectId || !minecraftVersion) {
    const error = new Error('instanceId, installPath, version and projectId are required for content installation.');
    error.code = 'INVALID_MOD_INSTALL_PAYLOAD';
    throw error;
  }

  const modsDir = path.join(installPath, resolveContentFolderName(contentType));
  await fsp.mkdir(modsDir, { recursive: true });

  emitModProgress(event, {
    instanceId,
    projectId,
    contentType,
    operation: 'install',
    status: 'resolving',
    percent: 0
  });

  const latest = await resolveLatestProjectVersion({
    projectId,
    minecraftVersion,
    loader,
    contentType
  });

  const latestVersion = latest.version;
  const file = resolvePrimaryModFile(latestVersion);
  const destination = path.join(modsDir, file.filename);

  emitModProgress(event, {
    instanceId,
    projectId,
    contentType,
    operation: 'install',
    status: 'downloading',
    percent: 0,
    filename: file.filename
  });

  await streamDownloadToFile({
    url: file.url,
    destination,
    onProgress: ({ percent, transferred, total }) => {
      emitModProgress(event, {
        instanceId,
        projectId,
        contentType,
        operation: 'install',
        status: 'downloading',
        percent,
        transferred,
        total,
        filename: file.filename
      });
    }
  });

  emitModProgress(event, {
    instanceId,
    projectId,
    contentType,
    operation: 'install',
    status: 'done',
    percent: 100,
    filename: file.filename
  });

  return {
    id: projectId,
    projectId,
    contentType,
    title: payload?.title || latestVersion?.name || projectId,
    author: payload?.author || payload?.creator || '',
    creator: payload?.creator || payload?.author || '',
    organization: payload?.organization || null,
    version: latestVersion?.version_number || latestVersion?.name || 'unknown',
    versionId: latestVersion?.id || null,
    filename: path.basename(destination),
    filePath: destination,
    icon_url: payload?.iconUrl || null,
    enabled: true,
    hasUpdate: false,
    latestVersionId: latestVersion?.id || null,
    updatedAt: new Date().toISOString()
  };
};

const updateModInternal = async (event, payload) => {
  const instanceId = normalizeId(payload?.instanceId);
  const installPath = path.resolve(payload?.installPath || '');
  const minecraftVersion = String(payload?.version || '').trim();
  const loader = normalizeLoader(payload?.loader || 'vanilla');
  const mod = payload?.mod;
  const contentType = normalizeContentType(payload?.contentType || mod?.contentType || 'mod');
  const projectId = String(mod?.projectId || mod?.id || '').trim();

  if (!instanceId || !installPath || !projectId || !minecraftVersion || !mod) {
    const error = new Error('instanceId, installPath, version and content are required for update.');
    error.code = 'INVALID_MOD_UPDATE_PAYLOAD';
    throw error;
  }

  const latest = await resolveLatestProjectVersion({
    projectId,
    minecraftVersion,
    loader,
    contentType
  });

  if (latest.version?.id && mod.versionId && latest.version.id === mod.versionId) {
    return {
      ...mod,
      hasUpdate: false,
      latestVersionId: latest.version.id
    };
  }

  const modsDir = path.join(installPath, resolveContentFolderName(contentType));
  await fsp.mkdir(modsDir, { recursive: true });

  const file = resolvePrimaryModFile(latest.version);
  const jarPath = path.join(modsDir, file.filename);
  emitModProgress(event, {
    instanceId,
    projectId,
    contentType,
    operation: 'update',
    status: 'downloading',
    percent: 0,
    filename: file.filename
  });

  await streamDownloadToFile({
    url: file.url,
    destination: jarPath,
    onProgress: ({ percent, transferred, total }) => {
      emitModProgress(event, {
        instanceId,
        projectId,
        contentType,
        operation: 'update',
        status: 'downloading',
        percent,
        transferred,
        total,
        filename: file.filename
      });
    }
  });

  if (mod.filePath && path.resolve(mod.filePath) !== path.resolve(jarPath)) {
    await safeUnlink(path.resolve(mod.filePath));
  }

  let finalPath = jarPath;
  if (contentType === 'mod' && mod.enabled === false) {
    const disabledPath = jarPath.replace(/\.jar$/i, '.disable');
    if (disabledPath !== jarPath) {
      await safeUnlink(disabledPath);
      await fsp.rename(jarPath, disabledPath);
      finalPath = disabledPath;
    }
  }

  emitModProgress(event, {
    instanceId,
    projectId,
    contentType,
    operation: 'update',
    status: 'done',
    percent: 100,
    filename: path.basename(finalPath)
  });

  return {
    ...mod,
    contentType,
    version: latest.version?.version_number || latest.version?.name || mod.version,
    versionId: latest.version?.id || mod.versionId || null,
    filename: path.basename(finalPath),
    filePath: finalPath,
    hasUpdate: false,
    latestVersionId: latest.version?.id || null,
    updatedAt: new Date().toISOString()
  };
};

const deleteModInternal = async (payload) => {
  const mod = payload?.mod;
  if (!mod?.filePath) {
    return { removed: false };
  }

  await safeUnlink(path.resolve(mod.filePath));
  return { removed: true };
};

const toggleModInternal = async (payload) => {
  const mod = payload?.mod;
  if (!mod?.filePath) {
    const error = new Error('Mod file path is required to toggle mod state.');
    error.code = 'INVALID_MOD_TOGGLE_PAYLOAD';
    throw error;
  }

  const absolutePath = path.resolve(mod.filePath);
  const contentType = normalizeContentType(mod.contentType || 'mod');
  if (contentType !== 'mod') {
    const error = new Error('Toggle is only supported for mods.');
    error.code = 'TOGGLE_NOT_SUPPORTED';
    throw error;
  }
  const currentEnabled = mod.enabled !== false;

  if (!(await pathExists(absolutePath))) {
    const error = new Error('Mod file was not found on disk.');
    error.code = 'MOD_FILE_NOT_FOUND';
    throw error;
  }

  let nextPath = absolutePath;

  if (currentEnabled) {
    if (/\.jar$/i.test(absolutePath)) {
      nextPath = absolutePath.replace(/\.jar$/i, '.disable');
    } else {
      nextPath = `${absolutePath}.disable`;
    }
  } else if (/\.disable$/i.test(absolutePath)) {
    nextPath = absolutePath.replace(/\.disable$/i, '.jar');
  } else if (/\.disabled$/i.test(absolutePath)) {
    nextPath = absolutePath.replace(/\.disabled$/i, '.jar');
  }

  if (nextPath !== absolutePath) {
    await safeUnlink(nextPath);
    await fsp.rename(absolutePath, nextPath);
  }

  return {
    filePath: nextPath,
    filename: path.basename(nextPath),
    enabled: !currentEnabled
  };
};

const checkModUpdatesInternal = async (payload) => {
  const minecraftVersion = String(payload?.version || '').trim();
  const loader = normalizeLoader(payload?.loader || 'vanilla');
  const contentType = normalizeContentType(payload?.contentType || 'mod');
  const mods = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.mods) ? payload.mods : [];

  const result = [];
  for (const mod of mods) {
    const projectId = String(mod?.projectId || mod?.id || '').trim();
    if (!projectId || isLocalContentId(projectId)) {
      result.push({
        id: mod?.id || '',
        projectId: '',
        hasUpdate: false,
        latestVersionId: null,
        latestVersion: null,
        error: 'Missing project id'
      });
      continue;
    }

    try {
      const latest = await resolveLatestProjectVersion({ projectId, minecraftVersion, loader, contentType });
      const latestId = latest.version?.id || null;
      const hasUpdate = Boolean(latestId && mod?.versionId && latestId !== mod.versionId);

      result.push({
        id: mod?.id || projectId,
        projectId,
        contentType,
        hasUpdate,
        latestVersionId: latestId,
        latestVersion: latest.version?.version_number || latest.version?.name || null,
        error: null
      });
    } catch (error) {
      result.push({
        id: mod?.id || projectId,
        projectId,
        contentType,
        hasUpdate: false,
        latestVersionId: null,
        latestVersion: null,
        error: error.message || 'Failed to check updates'
      });
    }
  }

  return result;
};

const renameProfileFolderInternal = async (payload) => {
  const instanceId = normalizeId(payload?.instanceId);
  const newName = String(payload?.newName || '').trim();
  const oldInstallPath = payload?.oldInstallPath ? path.resolve(payload.oldInstallPath) : null;

  if (!instanceId || !newName) {
    const error = new Error('instanceId and newName are required for profile rename.');
    error.code = 'INVALID_RENAME_PAYLOAD';
    throw error;
  }

  const desiredPath = await resolveInstallPath({
    instanceId,
    instanceName: newName,
    preferredInstallPath: null
  });

  const hasOldPath = oldInstallPath && (await pathExists(oldInstallPath));

  if (!hasOldPath) {
    await writeProfileMeta(desiredPath, {
      instanceId,
      instanceName: newName,
      updatedAt: new Date().toISOString()
    });

    return {
      installPath: desiredPath,
      renamedOnDisk: false
    };
  }

  if (path.resolve(oldInstallPath) === path.resolve(desiredPath)) {
    await writeProfileMeta(desiredPath, {
      instanceId,
      instanceName: newName,
      updatedAt: new Date().toISOString()
    });
    return {
      installPath: desiredPath,
      renamedOnDisk: false
    };
  }

  await fsp.mkdir(path.dirname(desiredPath), { recursive: true });

  try {
    await fsp.rename(oldInstallPath, desiredPath);
  } catch (error) {
    // Some Windows setups can refuse renames for non-latin paths while files are open.
    // Keep the existing folder and only refresh profile metadata instead of failing UI rename.
    await writeProfileMeta(oldInstallPath, {
      instanceId,
      instanceName: newName,
      updatedAt: new Date().toISOString()
    });
    return {
      installPath: oldInstallPath,
      renamedOnDisk: false,
      renameSkipped: true
    };
  }

  await writeProfileMeta(desiredPath, {
    instanceId,
    instanceName: newName,
    updatedAt: new Date().toISOString()
  });

  return {
    installPath: desiredPath,
    renamedOnDisk: true
  };
};

const deleteProfileFolderInternal = async (payload) => {
  const targetInstanceId = normalizeId(payload?.instanceId || '');
  if (targetInstanceId && normalizeId(activeInstallId) === targetInstanceId) {
    canceledInstallIds.add(targetInstanceId);
    activeInstallId = null;
  }

  const installPath = String(payload?.installPath || '').trim();
  if (!installPath) {
    const error = new Error('installPath is required for profile deletion.');
    error.code = 'INVALID_DELETE_PAYLOAD';
    throw error;
  }

  await ensureLauncherDirectories();

  const profilesRoot = path.resolve(getProfilesRoot());
  const absolutePath = path.resolve(installPath);

  if (!isPathInside(absolutePath, profilesRoot)) {
    const error = new Error('Refusing to delete a path outside of launcher profiles folder.');
    error.code = 'INVALID_PROFILE_PATH';
    error.details = { installPath: absolutePath, profilesRoot };
    throw error;
  }

  if (!(await pathExists(absolutePath))) {
    return {
      deleted: false,
      missing: true,
      installPath: absolutePath
    };
  }

  await fsp.rm(absolutePath, { recursive: true, force: true, maxRetries: 2 });
  return {
    deleted: true,
    missing: false,
    installPath: absolutePath
  };
};

const pickAvatarInternal = async (event, payload) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  const instanceId = normalizeId(payload?.instanceId || Date.now());

  const result = await dialog.showOpenDialog(senderWindow, {
    title: 'Select instance avatar',
    buttonLabel: 'Use image',
    properties: ['openFile'],
    filters: [
      {
        name: 'Images',
        extensions: ['png', 'jpg', 'jpeg', 'webp']
      }
    ]
  });

  if (result.canceled || !result.filePaths?.[0]) {
    return {
      canceled: true,
      path: null,
      width: null,
      height: null
    };
  }

  const source = result.filePaths[0];
  const image = nativeImage.createFromPath(source);
  if (image.isEmpty()) {
    const error = new Error('Selected image cannot be loaded.');
    error.code = 'AVATAR_INVALID_IMAGE';
    throw error;
  }

  const { width, height } = image.getSize();
  if (width !== height) {
    const error = new Error('Avatar image must be square (for example 219x219 or 321x321).');
    error.code = 'AVATAR_NOT_SQUARE';
    error.details = { width, height };
    throw error;
  }

  if (width < 100 || height < 100 || width > 1000 || height > 1000) {
    const error = new Error('Avatar image must be from 100x100 up to 1000x1000 pixels.');
    error.code = 'AVATAR_INVALID_SIZE';
    error.details = { width, height };
    throw error;
  }

  await ensureLauncherDirectories();

  const extension = path.extname(source).toLowerCase() || '.png';
  const targetPath = path.join(getAvatarsRoot(), `${instanceId}${extension}`);

  await fsp.copyFile(source, targetPath);

  return {
    canceled: false,
    path: targetPath,
    width,
    height
  };
};

const getLoaderAvailability = (version) => {
  const loaders = ['vanilla', 'fabric', 'forge', 'quilt', 'neoforge'];
  const map = {};

  for (const loader of loaders) {
    const support = supportsLoaderForVersion(loader, version);
    map[loader] = support;
  }

  return map;
};
const registerMinecraftIpc = () => {
  if (handlersRegistered) return;
  handlersRegistered = true;

  ipcMain.handle('system:open-external', async (_event, url) => {
    if (!url || typeof url !== 'string') return false;
    await shell.openExternal(url);
    return true;
  });

  ipcMain.handle('system:open-path', async (_event, targetPath) => {
    if (!targetPath || typeof targetPath !== 'string') {
      return { ok: false, error: { code: 'INVALID_PATH', message: 'Path is required' } };
    }

    const absolutePath = path.resolve(targetPath);
    if (!fs.existsSync(absolutePath)) {
      return { ok: false, error: { code: 'PATH_NOT_FOUND', message: 'Path does not exist' } };
    }

    const openResult = await shell.openPath(absolutePath);
    if (openResult) {
      return { ok: false, error: { code: 'OPEN_PATH_FAILED', message: openResult } };
    }

    return { ok: true };
  });

  ipcMain.handle('system:get-memory-info', async () => {
    const totalBytes = os.totalmem();
    const freeBytes = os.freemem();
    const totalGb = Math.max(1, Math.floor(totalBytes / (1024 ** 3)));
    const freeGb = Math.max(0, Math.floor(freeBytes / (1024 ** 3)));

    return {
      ok: true,
      data: {
        totalBytes,
        freeBytes,
        totalGb,
        freeGb
      }
    };
  });

  ipcMain.handle('launcher:load-state', async () => {
    try {
      const data = await loadLauncherState();
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to load launcher state') };
    }
  });

  ipcMain.handle('launcher:save-state', async (_event, payload) => {
    try {
      const data = await saveLauncherState(payload);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to save launcher state') };
    }
  });

  ipcMain.handle('skins:get-state', async () => {
    try {
      const data = await getSkinsOverviewInternal();
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to load skins state') };
    }
  });

  ipcMain.handle('skins:get-official-profile', async (_event, payload = {}) => {
    try {
      const data = await resolveOfficialProfileInternal(payload?.username || '');
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to resolve official profile') };
    }
  });

  ipcMain.handle('skins:save', async (_event, payload = {}) => {
    try {
      const data = await saveSkinInternal(payload, 'create');
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to save skin') };
    }
  });

  ipcMain.handle('skins:update', async (_event, payload = {}) => {
    try {
      const data = await saveSkinInternal(payload, 'update');
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to update skin') };
    }
  });

  ipcMain.handle('skins:delete', async (_event, payload = {}) => {
    try {
      const data = await deleteSkinInternal(payload);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to delete skin') };
    }
  });

  ipcMain.handle('skins:set-active', async (_event, payload = {}) => {
    try {
      const data = await setActiveSkinInternal(payload);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to set active skin') };
    }
  });

  ipcMain.handle('skins:reorder', async (_event, payload = {}) => {
    try {
      const data = await reorderSkinsInternal(payload);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to reorder skins') };
    }
  });

  ipcMain.handle('skins:update-sync', async (_event, payload = {}) => {
    try {
      const data = await updateSkinSyncConfigInternal(payload);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to save skin sync config') };
    }
  });

  ipcMain.handle('skins:open-folder', async () => {
    try {
      const data = await openSkinsFolderInternal();
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to open skins folder') };
    }
  });

  ipcMain.handle('minecraft:get-java-download-url', async (_event, requiredMajor) => {
    return getJavaDownloadUrl(Number(requiredMajor) || 17);
  });

  ipcMain.handle('minecraft:list-game-versions', async (_event, payload = {}) => {
    try {
      const data = await getGameVersions({
        includeSnapshots: payload?.includeSnapshots === true
      });
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to load game versions') };
    }
  });

  ipcMain.handle('minecraft:list-loader-versions', async (_event, payload = {}) => {
    try {
      const data = await listLoaderVersionsInternal({
        loader: payload?.loader || 'vanilla',
        minecraftVersion: payload?.minecraftVersion || '',
        includePrerelease: payload?.includePrerelease === true
      });
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to load loader versions') };
    }
  });

  ipcMain.handle('minecraft:get-loader-availability', async (_event, version) => {
    try {
      return {
        ok: true,
        data: getLoaderAvailability(version)
      };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to resolve loader compatibility') };
    }
  });

  ipcMain.handle('minecraft:get-default-install-path', async (_event, payload = {}) => {
    try {
      const instanceId = normalizeId(payload?.instanceId || 'preview');
      const instanceName = String(payload?.instanceName || 'Profile').trim();
      const pathValue = await resolveInstallPath({
        instanceId,
        instanceName,
        preferredInstallPath: null
      });

      return {
        ok: true,
        data: {
          path: pathValue,
          launcherRoot: getLauncherRoot(),
          profilesRoot: getProfilesRoot()
        }
      };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to resolve default profile path') };
    }
  });

  ipcMain.handle('minecraft:scan-instance-content', async (_event, payload = {}) => {
    try {
      const data = await scanContentFolderInternal({
        installPath: payload?.installPath,
        contentType: payload?.contentType,
        items: payload?.items
      });
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to scan instance content') };
    }
  });

  ipcMain.handle('minecraft:import-from-launcher', async (_event, payload = {}) => {
    try {
      const data = await importFromLauncherInternal(payload);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to import launcher data') };
    }
  });

  ipcMain.handle('minecraft:rename-profile-folder', async (_event, payload = {}) => {
    try {
      const data = await renameProfileFolderInternal(payload);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to rename profile folder') };
    }
  });

  ipcMain.handle('minecraft:delete-profile-folder', async (_event, payload = {}) => {
    try {
      const data = await deleteProfileFolderInternal(payload);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to delete profile folder') };
    }
  });

  ipcMain.handle('minecraft:pick-instance-avatar', async (event, payload = {}) => {
    try {
      const data = await pickAvatarInternal(event, payload);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to select avatar image') };
    }
  });

  ipcMain.handle('minecraft:install-instance', async (event, payload) => {
    const instanceId = normalizeId(payload?.instanceId);
    if (!instanceId) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INSTANCE',
          message: 'Instance id is required'
        }
      };
    }

    if (activeInstallId) {
      return {
        ok: false,
        error: {
          code: 'INSTALL_BUSY',
          message: 'Another instance is being installed right now. Wait for it to finish.'
        }
      };
    }

    activeInstallId = instanceId;
    canceledInstallIds.delete(instanceId);
    try {
      const data = await installInstanceInternal(event, payload);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Installation failed') };
    } finally {
      canceledInstallIds.delete(instanceId);
      activeInstallId = null;
    }
  });

  ipcMain.handle('minecraft:launch-instance', async (event, payload) => {
    const instanceId = normalizeId(payload?.instanceId);
    if (!instanceId) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INSTANCE',
          message: 'Instance id is required'
        }
      };
    }

    try {
      const data = await launchInstanceInternal(event, payload);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Launch failed') };
    }
  });

  ipcMain.handle('minecraft:stop-instance', async (_event, payload) => {
    try {
      const data = await stopInstanceInternal(payload);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to stop Minecraft') };
    }
  });

  ipcMain.handle('minecraft:install-mod', async (event, payload) => {
    try {
      const data = await installModInternal(event, payload);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to install mod') };
    }
  });

  ipcMain.handle('minecraft:update-mod', async (event, payload) => {
    try {
      const data = await updateModInternal(event, payload);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to update mod') };
    }
  });

  ipcMain.handle('minecraft:delete-mod', async (_event, payload) => {
    try {
      const data = await deleteModInternal(payload);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to delete mod') };
    }
  });

  ipcMain.handle('minecraft:toggle-mod', async (_event, payload) => {
    try {
      const data = await toggleModInternal(payload);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to toggle mod') };
    }
  });

  ipcMain.handle('minecraft:check-mod-updates', async (_event, payload) => {
    try {
      const data = await checkModUpdatesInternal(payload);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: toErrorResult(error, 'Failed to check mod updates') };
    }
  });
};

module.exports = {
  registerMinecraftIpc
};

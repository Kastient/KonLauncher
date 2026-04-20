const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const fsPromises = require("node:fs/promises");
const { once } = require("node:events");
const { pipeline } = require("node:stream/promises");
const { spawn } = require("node:child_process");
const unzipper = require("unzipper");

const VERSIONS_FILE = path.join(__dirname, "bedrock-data", "versions.json");
const INSTALL_EVENT_CHANNEL = "bedrock:install:event";
const UWP_SOURCE_URL = "https://raw.githubusercontent.com/ddf8196/mc-w10-versiondb-auto-update/master/versions.json.min";
const GDK_SOURCE_URL = "https://raw.githubusercontent.com/MinecraftBedrockArchiver/GdkLinks/master/urls.min.json";
const USER_HOME = process.env.USERPROFILE || process.env.HOME || "";
const LOCAL_UWP_CANDIDATES = [
  path.join(USER_HOME, "Desktop", "Новая папка (2)", "versions_uwp.json"),
  path.join(process.cwd(), "versions_uwp.json"),
];
const LOCAL_GDK_CANDIDATES = [
  path.join(USER_HOME, "Desktop", "Новая папка (2)", "versions_gdk.json"),
  path.join(process.cwd(), "versions_gdk.json"),
];

let versions = [];
let activeInstallId = null;
let handlersRegistered = false;
let versionsRefreshPromise = null;
const PACKAGE_EXTENSIONS = [".msixbundle", ".appxbundle", ".msix", ".appx", ".msixvc"];
let cachedWorkspaceRoot = null;
const DEFAULT_RESOURCE_PACK_ID = "launcher-default-rp";
const DEFAULT_RESOURCE_PACK_FILE_NAME = "The Best RP.mcpack";
const DEFAULT_RESOURCE_PACK_STORED_FILE = "launcher-default-rp.mcpack";
const SUPPORTED_RESOURCE_PACK_EXTENSIONS = [".mcpack", ".zip"];
const RESOURCE_PACK_LIBRARY_FILE = "library.json";

function loadVersions() {
  try {
    const raw = fs.readFileSync(VERSIONS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    versions = Array.isArray(parsed) ? parsed : [];
  } catch {
    versions = [];
  }
}

async function readFirstExistingJson(candidatePaths) {
  for (const filePath of candidatePaths || []) {
    try {
      const raw = await fsPromises.readFile(filePath, "utf8");
      return { data: JSON.parse(raw), source: filePath, local: true };
    } catch {
      // try next path
    }
  }
  return null;
}

function compareVersionDesc(a, b) {
  const aParts = parseVersionParts(a);
  const bParts = parseVersionParts(b);
  const max = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < max; i += 1) {
    const av = aParts[i] || 0;
    const bv = bParts[i] || 0;
    if (av !== bv) return bv - av;
  }

  return 0;
}

function channelFromCode(typeCode) {
  return Number(typeCode) === 0 ? "Release" : "Preview";
}

function familyOf(version) {
  const parts = String(version || "").split(".");
  return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : String(version || "");
}

function normalizeVersionEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const id = String(entry.id || "").trim();
  if (!id) return null;

  const type = String(entry.type || "Release").trim() || "Release";
  const displayId = String(entry.displayId || entry.shortId || formatDisplayVersionId(id)).trim() || formatDisplayVersionId(id);
  const shortId = String(entry.shortId || displayId).trim() || displayId;
  const family = String(entry.family || familyOf(id)).trim() || familyOf(id);
  const source = String(entry.source || "UWP").trim() || "UWP";

  return {
    id,
    shortId,
    displayId,
    family,
    clientVersion: String(entry.clientVersion || id),
    type,
    source,
    name: String(entry.name || `Bedrock ${displayId}${type === "Preview" ? " Preview" : ""}`),
    date: String(entry.date || ""),
    downloadable: entry.downloadable !== false,
    updateId: entry.updateId ? String(entry.updateId) : null,
    revisionNumber: Number.isFinite(Number(entry.revisionNumber)) ? Number(entry.revisionNumber) : 1,
    directUrls: Array.isArray(entry.directUrls) ? entry.directUrls.filter((url) => typeof url === "string" && url.trim()) : undefined,
    downloadUrl: entry.downloadUrl ? String(entry.downloadUrl) : undefined
  };
}

function buildUwpEntryFromRemoteRow(row) {
  if (!Array.isArray(row) || row.length < 3) return null;
  const id = String(row[0] || "").trim();
  const updateId = String(row[1] || "").trim();
  if (!id || !updateId) return null;

  const type = channelFromCode(row[2]);
  const displayId = formatDisplayVersionId(id);
  return normalizeVersionEntry({
    id,
    shortId: displayId,
    displayId,
    family: familyOf(id),
    clientVersion: id,
    type,
    source: "UWP",
    name: `Bedrock ${displayId}${type === "Preview" ? " Preview" : ""}`,
    date: "",
    downloadable: true,
    updateId,
    revisionNumber: 1,
  });
}

function buildGdkEntry(version, urls, type) {
  const id = String(version || "").trim();
  if (!id) return null;
  const links = Array.isArray(urls)
    ? urls.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  const displayId = formatDisplayVersionId(id);

  return normalizeVersionEntry({
    id,
    shortId: displayId,
    displayId,
    family: familyOf(id),
    clientVersion: id,
    type: String(type || "Release"),
    source: "GDK",
    name: `Bedrock ${displayId}${type === "Preview" ? " Preview" : ""}`,
    date: "",
    downloadable: links.length > 0,
    updateId: null,
    revisionNumber: 1,
    directUrls: links,
    downloadUrl: links[0] || null,
  });
}

async function loadUwpRows() {
  const local = await readFirstExistingJson(LOCAL_UWP_CANDIDATES);
  if (local?.data) {
    return local;
  }

  const response = await fetch(UWP_SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Не удалось обновить каталог UWP версий (${response.status}).`);
  }
  return { data: await response.json(), source: UWP_SOURCE_URL, local: false };
}

async function loadGdkRows() {
  const local = await readFirstExistingJson(LOCAL_GDK_CANDIDATES);
  if (local?.data && typeof local.data === "object") {
    return local;
  }

  try {
    const response = await fetch(GDK_SOURCE_URL);
    if (!response.ok) {
      throw new Error(`status ${response.status}`);
    }
    return { data: await response.json(), source: GDK_SOURCE_URL, local: false };
  } catch {
    return { data: null, source: "not-found", local: false };
  }
}

function sortVersionsList(items) {
  return [...items].sort((left, right) => {
    const typeRankLeft = String(left?.type || "Release") === "Release" ? 0 : 1;
    const typeRankRight = String(right?.type || "Release") === "Release" ? 0 : 1;
    if (typeRankLeft !== typeRankRight) return typeRankLeft - typeRankRight;

    const versionCmp = compareVersionDesc(left?.id, right?.id);
    if (versionCmp !== 0) return versionCmp;

    const sourceLeft = String(left?.source || "");
    const sourceRight = String(right?.source || "");
    if (sourceLeft < sourceRight) return -1;
    if (sourceLeft > sourceRight) return 1;
    return 0;
  });
}

function mergeVersionCatalog(currentVersions, incomingVersions) {
  const map = new Map();
  for (const entry of currentVersions || []) {
    const normalized = normalizeVersionEntry(entry);
    if (!normalized) continue;
    map.set(`${normalized.id}::${normalized.type}`, normalized);
  }

  let added = 0;
  let changed = 0;

  for (const entry of incomingVersions || []) {
    const normalized = normalizeVersionEntry(entry);
    if (!normalized) continue;
    const key = `${normalized.id}::${normalized.type}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, normalized);
      added += 1;
      continue;
    }

    const merged = {
      ...existing,
      ...normalized,
      source: existing.updateId ? existing.source : (normalized.updateId ? normalized.source : (existing.source || normalized.source)),
      downloadable: existing.downloadable || normalized.downloadable,
      updateId: normalized.updateId || existing.updateId || null,
      revisionNumber: Number.isFinite(Number(normalized.revisionNumber))
        ? Number(normalized.revisionNumber)
        : existing.revisionNumber,
      directUrls: Array.isArray(normalized.directUrls) && normalized.directUrls.length > 0
        ? normalized.directUrls
        : existing.directUrls,
      downloadUrl: normalized.downloadUrl || existing.downloadUrl || (Array.isArray(normalized.directUrls) ? normalized.directUrls[0] : null) || (Array.isArray(existing.directUrls) ? existing.directUrls[0] : null),
    };
    if (JSON.stringify(existing) !== JSON.stringify(merged)) {
      changed += 1;
      map.set(key, merged);
    }
  }

  return {
    versions: sortVersionsList(Array.from(map.values())),
    added,
    changed,
  };
}

async function refreshVersionsCatalogFromRemote() {
  if (versionsRefreshPromise) return versionsRefreshPromise;

  versionsRefreshPromise = (async () => {
    const remoteEntries = [];

    const uwp = await loadUwpRows();
    if (!Array.isArray(uwp.data)) {
      throw new Error("Некорректный ответ источника UWP версий.");
    }
    remoteEntries.push(...uwp.data.map((row) => buildUwpEntryFromRemoteRow(row)).filter(Boolean));

    const gdk = await loadGdkRows();
    if (gdk?.data && typeof gdk.data === "object") {
      const releaseMap = gdk.data.release || {};
      const previewMap = gdk.data.preview || {};
      for (const [version, urls] of Object.entries(releaseMap)) {
        const entry = buildGdkEntry(version, urls, "Release");
        if (entry) remoteEntries.push(entry);
      }
      for (const [version, urls] of Object.entries(previewMap)) {
        const entry = buildGdkEntry(version, urls, "Preview");
        if (entry) remoteEntries.push(entry);
      }
    }

    if (remoteEntries.length === 0) {
      throw new Error("Источники версий вернули пустой список.");
    }

    const merged = mergeVersionCatalog(versions, remoteEntries);
    versions = merged.versions;
    await fsPromises.writeFile(VERSIONS_FILE, JSON.stringify(versions, null, 2), "utf8");

    return {
      ok: true,
      source: `${uwp.source}${gdk?.data ? ` + ${gdk.source}` : ""}`,
      total: versions.length,
      added: merged.added,
      changed: merged.changed,
    };
  })();

  try {
    return await versionsRefreshPromise;
  } finally {
    versionsRefreshPromise = null;
  }
}

function getWorkspaceRoot() {
  if (cachedWorkspaceRoot) return cachedWorkspaceRoot;

  const preferred = path.join(app.getPath("userData"), "bedrock");
  const localAppData = process.env.LOCALAPPDATA || path.join(app.getPath("home"), "AppData", "Local");
  const legacyCandidates = [
    path.join(localAppData, "KonSwicherBedrockData"),
    path.join(path.dirname(app.getPath("exe")), "KonSwicherBedrockData"),
    path.join(app.getPath("userData"), "KonSwicherBedrockData"),
    path.join(process.cwd(), ".konswicherbedrock-data"),
  ].filter((candidate, index, all) => candidate && all.indexOf(candidate) === index);

  const hasEntriesSync = (targetPath) => {
    try {
      return fs.readdirSync(targetPath).length > 0;
    } catch {
      return false;
    }
  };

  try {
    fs.mkdirSync(preferred, { recursive: true });
    fs.accessSync(preferred, fs.constants.W_OK);

    if (!hasEntriesSync(preferred)) {
      for (const legacyPath of legacyCandidates) {
        if (legacyPath === preferred) continue;
        if (!hasEntriesSync(legacyPath)) continue;
        try {
          fs.cpSync(legacyPath, preferred, { recursive: true, force: false, errorOnExist: false });
          break;
        } catch {
          // ignore migration errors and keep using preferred path
        }
      }
    }

    cachedWorkspaceRoot = preferred;
    return cachedWorkspaceRoot;
  } catch {
    const fallback = path.join(app.getPath("userData"), "bedrock");
    fs.mkdirSync(fallback, { recursive: true });
    cachedWorkspaceRoot = fallback;
    return cachedWorkspaceRoot;
  }
}

function getVersionRoot() {
  return path.join(getWorkspaceRoot(), "Version");
}

function getDownloadRoot() {
  return path.join(getWorkspaceRoot(), "DownloadCache");
}

function getBackupRoot() {
  return path.join(getWorkspaceRoot(), "DataBackup");
}

function sanitizeId(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getInstallPath(version) {
  const suffix = version.type === "Preview" ? "-preview" : "";
  return path.join(getVersionRoot(), `${sanitizeId(version.id)}${suffix}`);
}

async function ensureDirs() {
  await fsPromises.mkdir(getVersionRoot(), { recursive: true });
  await fsPromises.mkdir(getDownloadRoot(), { recursive: true });
}

async function exists(targetPath) {
  try {
    await fsPromises.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function getDefaultResourcePackSourcePath() {
  return path.join(app.getPath("desktop"), DEFAULT_RESOURCE_PACK_FILE_NAME);
}

function getStoredLauncherResourcePackPath() {
  return path.join(getResourcePackFilesRoot(), DEFAULT_RESOURCE_PACK_STORED_FILE);
}

function getResourcePackRoot() {
  return path.join(getWorkspaceRoot(), "ResourcePacks");
}

function getResourcePackFilesRoot() {
  return path.join(getResourcePackRoot(), "files");
}

function getResourcePackLibraryPath() {
  return path.join(getResourcePackRoot(), RESOURCE_PACK_LIBRARY_FILE);
}

async function ensureResourcePackDirs() {
  await fsPromises.mkdir(getResourcePackFilesRoot(), { recursive: true });
}

function isSupportedResourcePackFile(filePath) {
  const ext = path.extname(String(filePath || "")).toLowerCase();
  return SUPPORTED_RESOURCE_PACK_EXTENSIONS.includes(ext);
}

function createResourcePackId() {
  return `rp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeArchivePath(entryPath) {
  return String(entryPath || "").replace(/\\/g, "/").replace(/^[/\\]+/g, "");
}

function toVersionString(versionArray) {
  if (!Array.isArray(versionArray)) return null;
  return versionArray.map((part) => Number.parseInt(part, 10)).filter((part) => Number.isFinite(part)).join(".");
}

async function streamToBuffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function readArchiveEntryBuffer(entry) {
  if (!entry) return null;
  if (typeof entry.buffer === "function") {
    return entry.buffer();
  }
  return streamToBuffer(entry.stream());
}

function createDataUrlFromBuffer(buffer, extension) {
  if (!buffer) return null;
  const ext = String(extension || "").toLowerCase();
  const mime = ext === ".jpg" || ext === ".jpeg"
    ? "image/jpeg"
    : ext === ".webp"
      ? "image/webp"
      : "image/png";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

async function readResourcePackMetaFromArchive(sourcePath, id, options = {}) {
  const archive = await unzipper.Open.file(sourcePath);
  const manifestEntry = archive.files.find((entry) => /(^|\/)manifest\.json$/i.test(normalizeArchivePath(entry.path)));
  if (!manifestEntry) {
    throw new Error("В архиве не найден manifest.json.");
  }

  const manifestBuffer = await readArchiveEntryBuffer(manifestEntry);
  const manifestText = manifestBuffer.toString("utf8").replace(/^\uFEFF/, "");
  const manifest = JSON.parse(manifestText);
  const header = manifest?.header || {};
  const manifestRelativePath = normalizeArchivePath(manifestEntry.path);
  const manifestDir = path.posix.dirname(manifestRelativePath);
  const iconRegex = /(^|\/)pack_icon\.(png|jpg|jpeg|webp)$/i;

  const pickIcon = (candidateDir) => archive.files.find((entry) => {
    const entryPath = normalizeArchivePath(entry.path);
    if (!iconRegex.test(entryPath)) return false;
    if (!candidateDir || candidateDir === "." || candidateDir === "/") return true;
    return entryPath.toLowerCase().startsWith(`${candidateDir.toLowerCase()}/`);
  });

  const iconEntry = pickIcon(manifestDir) || pickIcon("");
  let iconDataUrl = null;
  if (iconEntry) {
    const iconBuffer = await readArchiveEntryBuffer(iconEntry);
    const iconExt = path.extname(String(iconEntry.path || "")).toLowerCase();
    iconDataUrl = createDataUrlFromBuffer(iconBuffer, iconExt);
  }

  return {
    id,
    sourcePath,
    available: true,
    origin: options.origin || "custom",
    removable: Boolean(options.removable),
    tag: options.tag || "Мои рп",
    name: typeof header.name === "string" && header.name.trim() ? header.name : path.parse(sourcePath).name,
    description: typeof header.description === "string" ? header.description : "",
    version: toVersionString(header.version),
    uuid: typeof header.uuid === "string" ? header.uuid : null,
    minEngineVersion: toVersionString(header.min_engine_version),
    addedAt: options.addedAt || null,
    originalFileName: options.originalFileName || path.basename(sourcePath),
    iconDataUrl,
  };
}

async function readResourcePackLibrary() {
  await ensureResourcePackDirs();
  const dbPath = getResourcePackLibraryPath();
  if (!(await exists(dbPath))) {
    return { packs: [] };
  }

  try {
    const parsed = JSON.parse(await fsPromises.readFile(dbPath, "utf8"));
    if (!Array.isArray(parsed?.packs)) return { packs: [] };
    return { packs: parsed.packs };
  } catch (error) {
    return { packs: [] };
  }
}

async function writeResourcePackLibrary(packs) {
  await ensureResourcePackDirs();
  const dbPath = getResourcePackLibraryPath();
  const payload = {
    updatedAt: new Date().toISOString(),
    packs,
  };
  await fsPromises.writeFile(dbPath, JSON.stringify(payload, null, 2), "utf8");
}

async function ensureStoredLauncherResourcePack() {
  await ensureResourcePackDirs();

  const storedPath = getStoredLauncherResourcePackPath();
  if (await exists(storedPath)) {
    return storedPath;
  }

  const desktopPath = getDefaultResourcePackSourcePath();
  if (await exists(desktopPath)) {
    await fsPromises.copyFile(desktopPath, storedPath);
    return storedPath;
  }

  return desktopPath;
}

async function getDefaultLauncherResourcePack() {
  const sourcePath = await ensureStoredLauncherResourcePack();
  if (!(await exists(sourcePath))) {
    return {
      id: DEFAULT_RESOURCE_PACK_ID,
      sourcePath,
      available: false,
      origin: "launcher",
      removable: false,
      tag: "Рп от лаунчера",
      name: "The Best RP",
      description: `Файл не найден: ${sourcePath}`,
      version: null,
      uuid: null,
      minEngineVersion: null,
      iconDataUrl: null,
      addedAt: null,
      originalFileName: DEFAULT_RESOURCE_PACK_FILE_NAME,
    };
  }

  try {
    return await readResourcePackMetaFromArchive(sourcePath, DEFAULT_RESOURCE_PACK_ID, {
      origin: "launcher",
      removable: false,
      tag: "Рп от лаунчера",
      originalFileName: DEFAULT_RESOURCE_PACK_FILE_NAME,
    });
  } catch (error) {
    return {
      id: DEFAULT_RESOURCE_PACK_ID,
      sourcePath,
      available: false,
      origin: "launcher",
      removable: false,
      tag: "Рп от лаунчера",
      name: "The Best RP",
      description: error instanceof Error ? error.message : "Не удалось прочитать ресурспак.",
      version: null,
      uuid: null,
      minEngineVersion: null,
      iconDataUrl: null,
      addedAt: null,
      originalFileName: DEFAULT_RESOURCE_PACK_FILE_NAME,
    };
  }
}

async function getCustomResourcePacksFromLibrary() {
  const library = await readResourcePackLibrary();
  const nextPacks = [];
  const normalizedItems = [];

  for (const item of library.packs) {
    const id = String(item?.id || "");
    const fileName = String(item?.fileName || "");
    if (!id || !fileName) continue;

    const sourcePath = path.join(getResourcePackFilesRoot(), fileName);
    if (!(await exists(sourcePath))) {
      continue;
    }

    try {
      const meta = await readResourcePackMetaFromArchive(sourcePath, id, {
        origin: "custom",
        removable: true,
        tag: "Мои рп",
        addedAt: item.addedAt || null,
        originalFileName: item.originalFileName || fileName,
      });
      nextPacks.push(meta);
      normalizedItems.push({
        id,
        fileName,
        addedAt: item.addedAt || new Date().toISOString(),
        originalFileName: item.originalFileName || fileName,
      });
    } catch (error) {
      nextPacks.push({
        id,
        sourcePath,
        available: false,
        origin: "custom",
        removable: true,
        tag: "Мои рп",
        name: item.originalFileName || fileName,
        description: error instanceof Error ? error.message : "Не удалось прочитать ресурспак.",
        version: null,
        uuid: null,
        minEngineVersion: null,
        iconDataUrl: null,
        addedAt: item.addedAt || null,
        originalFileName: item.originalFileName || fileName,
      });
      normalizedItems.push({
        id,
        fileName,
        addedAt: item.addedAt || new Date().toISOString(),
        originalFileName: item.originalFileName || fileName,
      });
    }
  }

  if (JSON.stringify(normalizedItems) !== JSON.stringify(library.packs)) {
    await writeResourcePackLibrary(normalizedItems);
  }

  return nextPacks;
}

async function listResourcePacks() {
  const [defaultPack, customPacks] = await Promise.all([
    getDefaultLauncherResourcePack(),
    getCustomResourcePacksFromLibrary(),
  ]);

  customPacks.sort((a, b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime());
  return [defaultPack, ...customPacks];
}

async function addResourcePackFiles(filePaths) {
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    return { added: [], errors: [] };
  }

  const library = await readResourcePackLibrary();
  const normalized = [...library.packs];
  const added = [];
  const errors = [];

  for (const rawPath of filePaths) {
    const sourcePath = path.resolve(String(rawPath || ""));
    if (!isSupportedResourcePackFile(sourcePath)) {
      errors.push(`${path.basename(sourcePath)}: поддерживаются только .mcpack и .zip`);
      continue;
    }

    if (!(await exists(sourcePath))) {
      errors.push(`${path.basename(sourcePath)}: файл не найден`);
      continue;
    }

    const id = createResourcePackId();
    const targetFileName = `${id}.mcpack`;
    const targetPath = path.join(getResourcePackFilesRoot(), targetFileName);

    try {
      await ensureResourcePackDirs();
      await fsPromises.copyFile(sourcePath, targetPath);

      const meta = await readResourcePackMetaFromArchive(targetPath, id, {
        origin: "custom",
        removable: true,
        tag: "Мои рп",
        addedAt: new Date().toISOString(),
        originalFileName: path.basename(sourcePath),
      });

      normalized.push({
        id,
        fileName: targetFileName,
        addedAt: meta.addedAt || new Date().toISOString(),
        originalFileName: path.basename(sourcePath),
      });
      added.push(meta);
    } catch (error) {
      await fsPromises.rm(targetPath, { force: true });
      errors.push(`${path.basename(sourcePath)}: ${error instanceof Error ? error.message : "ошибка импорта"}`);
    }
  }

  await writeResourcePackLibrary(normalized);
  return { added, errors };
}

async function addResourcePackBuffers(bufferItems) {
  if (!Array.isArray(bufferItems) || bufferItems.length === 0) {
    return { added: [], errors: [] };
  }

  const library = await readResourcePackLibrary();
  const normalized = [...library.packs];
  const added = [];
  const errors = [];

  for (const item of bufferItems) {
    const originalFileName = String(item?.name || "resourcepack.mcpack");
    if (!isSupportedResourcePackFile(originalFileName)) {
      errors.push(`${path.basename(originalFileName)}: поддерживаются только .mcpack и .zip`);
      continue;
    }

    let fileBuffer = null;
    const rawBuffer = item?.buffer;
    if (rawBuffer instanceof ArrayBuffer) {
      fileBuffer = Buffer.from(rawBuffer);
    } else if (ArrayBuffer.isView(rawBuffer)) {
      fileBuffer = Buffer.from(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength);
    } else if (typeof item?.base64 === "string" && item.base64.length > 0) {
      fileBuffer = Buffer.from(item.base64, "base64");
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      errors.push(`${path.basename(originalFileName)}: не удалось прочитать файл`);
      continue;
    }

    const id = createResourcePackId();
    const targetFileName = `${id}.mcpack`;
    const targetPath = path.join(getResourcePackFilesRoot(), targetFileName);

    try {
      await ensureResourcePackDirs();
      await fsPromises.writeFile(targetPath, fileBuffer);

      const meta = await readResourcePackMetaFromArchive(targetPath, id, {
        origin: "custom",
        removable: true,
        tag: "Мои рп",
        addedAt: new Date().toISOString(),
        originalFileName: path.basename(originalFileName),
      });

      normalized.push({
        id,
        fileName: targetFileName,
        addedAt: meta.addedAt || new Date().toISOString(),
        originalFileName: path.basename(originalFileName),
      });
      added.push(meta);
    } catch (error) {
      await fsPromises.rm(targetPath, { force: true });
      errors.push(`${path.basename(originalFileName)}: ${error instanceof Error ? error.message : "ошибка импорта"}`);
    }
  }

  await writeResourcePackLibrary(normalized);
  return { added, errors };
}

async function removeResourcePack(resourcePackId) {
  if (!resourcePackId || resourcePackId === DEFAULT_RESOURCE_PACK_ID) {
    throw new Error("Этот ресурспак нельзя удалить.");
  }

  const library = await readResourcePackLibrary();
  const index = library.packs.findIndex((item) => item.id === resourcePackId);
  if (index === -1) {
    return { ok: true, removed: false };
  }

  const [removed] = library.packs.splice(index, 1);
  await writeResourcePackLibrary(library.packs);

  if (removed?.fileName) {
    const storedPath = path.join(getResourcePackFilesRoot(), removed.fileName);
    await fsPromises.rm(storedPath, { force: true });
  }

  return { ok: true, removed: true };
}

async function pickResourcePackFiles(targetWindow = null) {
  const effectiveTargetWindow = targetWindow || BrowserWindow.getFocusedWindow() || null;
  const result = await dialog.showOpenDialog(effectiveTargetWindow || undefined, {
    title: "Выбери ресурспаки",
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "Resource Packs", extensions: ["mcpack", "zip"] },
    ],
  });

  if (result.canceled) return [];
  return (result.filePaths || []).filter((filePath) => isSupportedResourcePackFile(filePath));
}

async function importResourcePackViaMinecraft(sourcePath) {
  const ext = path.extname(sourcePath).toLowerCase();
  let launchPath = sourcePath;
  let cleanupPath = null;

  if (ext === ".zip") {
    await fsPromises.mkdir(getDownloadRoot(), { recursive: true });
    cleanupPath = path.join(getDownloadRoot(), `rp-import-${Date.now()}-${sanitizeId(path.basename(sourcePath, ext))}.mcpack`);
    await fsPromises.copyFile(sourcePath, cleanupPath);
    launchPath = cleanupPath;
  }

  const script = `
$ErrorActionPreference = 'Stop'
$packPath = '${escapePwsh(launchPath)}'
if(!(Test-Path -LiteralPath $packPath)){
  throw 'MC_PACK_NOT_FOUND'
}
Start-Sleep -Milliseconds 450
Start-Process -FilePath $packPath
'OK'
`;

  try {
    const result = await runPowerShell(script, { hidden: true });
    if (result.code !== 0) {
      throw new Error(result.stderr || result.stdout || "Windows не смог открыть .mcpack файл.");
    }
  } finally {
    if (cleanupPath) {
      await fsPromises.rm(cleanupPath, { force: true });
    }
  }
}

async function installResourcePack(resourcePackId) {
  const availablePacks = await listResourcePacks();
  const selectedPack = availablePacks.find((pack) => pack.id === resourcePackId);
  if (!selectedPack || !selectedPack.available) {
    throw new Error("Ресурспак недоступен. Проверь файл и попробуй снова.");
  }

  await importResourcePackViaMinecraft(selectedPack.sourcePath);

  return {
    ok: true,
    id: selectedPack.id,
    name: selectedPack.name,
    method: "mcpack-import",
  };
}

function hasPackageExtension(fileName) {
  const normalized = String(fileName || "").toLowerCase();
  return PACKAGE_EXTENSIONS.some((ext) => normalized.endsWith(ext));
}

async function findPackageFileInDir(dirPath) {
  try {
    const preferred = PACKAGE_EXTENSIONS.map((ext) => path.join(dirPath, `package${ext}`));
    for (const filePath of preferred) {
      if (await exists(filePath)) return filePath;
    }

    const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });
    const candidate = entries.find((entry) => entry.isFile() && hasPackageExtension(entry.name));
    if (!candidate) return null;

    return path.join(dirPath, candidate.name);
  } catch {
    return null;
  }
}

function getPackageExtensionByName(fileName) {
  const normalized = String(fileName || "").toLowerCase();
  for (const ext of PACKAGE_EXTENSIONS) {
    if (normalized.endsWith(ext)) return ext;
  }
  return null;
}

async function detectPackageExtension(packagePath) {
  const archive = await unzipper.Open.file(packagePath);
  const names = archive.files.map((entry) => String(entry.path || "").replace(/\\/g, "/"));
  const hasBundleManifest = names.some((entryPath) => /(^|\/)AppxMetadata\/AppxBundleManifest\.xml$/i.test(entryPath));
  if (hasBundleManifest) return ".appxbundle";

  const hasManifestAtRoot = names.some((entryPath) => /^AppxManifest\.xml$/i.test(entryPath));
  if (hasManifestAtRoot) return ".appx";

  throw new Error("Скачанный пакет не содержит AppxManifest.xml. Похоже, это не клиент Minecraft.");
}

async function dirSizeBytes(root) {
  let total = 0;
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = await fsPromises.readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else {
        const stat = await fsPromises.stat(full);
        total += stat.size;
      }
    }
  }

  return total;
}

function sendInstallEvent(targetWindow, payload) {
  if (!targetWindow || targetWindow.isDestroyed()) return;

  targetWindow.webContents.send(INSTALL_EVENT_CHANNEL, {
    ...payload,
    time: new Date().toLocaleTimeString("ru-RU"),
  });
}

function escapePwsh(value) {
  return String(value).replace(/'/g, "''");
}

function parseVersionParts(value) {
  return String(value || "")
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part));
}

function versionIdToPackageVersion(versionId) {
  const parts = parseVersionParts(versionId);
  if (parts.length === 4 && parts[3] >= 0 && parts[3] < 100) {
    return `${parts[0]}.${parts[1]}.${parts[2] * 100 + parts[3]}.0`;
  }

  return String(versionId || "");
}

function versionsEqual(left, right) {
  const a = parseVersionParts(left);
  const b = parseVersionParts(right);
  if (a.length === 0 || b.length === 0) return false;

  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    if (av !== bv) return false;
  }

  return true;
}

function formatDisplayVersionId(versionId) {
  const parts = parseVersionParts(versionId);
  if (parts.length >= 4) {
    if (parts[0] === 1 && parts[1] === 26) {
      return `${parts[1]}.${parts[2]}`;
    }
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  }

  return String(versionId || "");
}

async function runPowerShell(script, { hidden = true } = {}) {
  return new Promise((resolve) => {
    const wrappedScript = `
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
chcp 65001 > $null
${script}
`;

    const ps = spawn(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", wrappedScript],
      {
        windowsHide: hidden,
      },
    );

    let stdout = "";
    let stderr = "";

    ps.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    ps.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    ps.on("close", (code) => {
      resolve({ code: code ?? 1, stdout: stdout.trim(), stderr: stderr.trim() });
    });

    ps.on("error", (error) => {
      resolve({ code: 1, stdout: "", stderr: String(error?.message || error) });
    });
  });
}

function getComMojangRoot(packageFamilyName) {
  const localAppData = process.env.LOCALAPPDATA || path.join(app.getPath("home"), "AppData", "Local");
  return path.join(localAppData, "Packages", packageFamilyName, "LocalState", "games", "com.mojang");
}

async function copyIfExists(sourcePath, destinationPath, options = {}) {
  if (!(await exists(sourcePath))) return false;
  await fsPromises.mkdir(path.dirname(destinationPath), { recursive: true });
  await fsPromises.cp(sourcePath, destinationPath, {
    recursive: true,
    force: options.force ?? false,
    errorOnExist: false,
  });
  return true;
}

async function backupCurrentGameData(packageFamilyName, targetWindow, versionId) {
  if (!packageFamilyName) return false;
  const sourceRoot = getComMojangRoot(packageFamilyName);
  if (!(await exists(sourceRoot))) return false;

  const backupRoot = path.join(getBackupRoot(), "com.mojang");
  await fsPromises.rm(backupRoot, { recursive: true, force: true });
  await fsPromises.mkdir(path.dirname(backupRoot), { recursive: true });
  await fsPromises.cp(sourceRoot, backupRoot, { recursive: true, force: true });

  sendInstallEvent(targetWindow, {
    versionId,
    kind: "log",
    level: "process",
    text: "Создан бэкап настроек и паков перед применением версии.",
  });
  return true;
}

async function restoreGameDataToPackage(packageFamilyName, targetWindow, versionId) {
  if (!packageFamilyName) return false;

  const backupRoot = path.join(getBackupRoot(), "com.mojang");
  if (!(await exists(backupRoot))) return false;

  const destinationRoot = getComMojangRoot(packageFamilyName);
  await fsPromises.mkdir(destinationRoot, { recursive: true });

  const foldersToSync = [
    "minecraftWorlds",
    "resource_packs",
    "behavior_packs",
    "skin_packs",
    "development_behavior_packs",
    "development_resource_packs",
  ];
  const filesToSync = [
    "options.txt",
    "global_resource_packs.json",
    "valid_known_packs.json",
  ];

  let changed = false;
  for (const folder of foldersToSync) {
    const source = path.join(backupRoot, folder);
    const dest = path.join(destinationRoot, folder);
    if (await copyIfExists(source, dest, { force: true })) {
      changed = true;
    }
  }

  for (const file of filesToSync) {
    const source = path.join(backupRoot, file);
    const dest = path.join(destinationRoot, file);
    if (await copyIfExists(source, dest, { force: true })) {
      changed = true;
    }
  }

  if (changed) {
    sendInstallEvent(targetWindow, {
      versionId,
      kind: "log",
      level: "process",
      text: "Восстановлены настройки, миры и паки в новой версии.",
    });
  }

  return changed;
}

async function getClientInfo() {
  if (process.platform !== "win32") {
    return { installed: false, version: null, source: "unsupported-platform" };
  }

  const script = `
$pkgs = @()
$pkgs += Get-AppxPackage -Name Microsoft.MinecraftUWP -ErrorAction SilentlyContinue
$pkgs += Get-AppxPackage -Name Microsoft.MinecraftWindowsBeta -ErrorAction SilentlyContinue
$pkgs = $pkgs | Where-Object { $_ } | Sort-Object Version -Descending
if($pkgs.Count -gt 0){
  $pkg = $pkgs[0]
  [PSCustomObject]@{
    installed = $true
    version = $pkg.Version.ToString()
    packageFamilyName = $pkg.PackageFamilyName
    packageName = $pkg.Name
  } | ConvertTo-Json -Compress
} else {
  [PSCustomObject]@{
    installed = $false
    version = $null
    packageFamilyName = $null
    packageName = $null
  } | ConvertTo-Json -Compress
}
`;

  const result = await runPowerShell(script);
  if (result.code !== 0) {
    return { installed: false, version: null, source: "microsoft-store" };
  }

  try {
    const parsed = JSON.parse(result.stdout || "{}");
    return {
      installed: Boolean(parsed.installed),
      version: parsed.version || null,
      source: "microsoft-store",
      packageFamilyName: parsed.packageFamilyName || null,
      packageName: parsed.packageName || null,
    };
  } catch {
    return { installed: false, version: null, source: "microsoft-store" };
  }
}

async function launchInstalledMinecraft() {
  const launchScript = `
$pkgs = @()
$pkgs += Get-AppxPackage -Name Microsoft.MinecraftUWP -ErrorAction SilentlyContinue
$pkgs += Get-AppxPackage -Name Microsoft.MinecraftWindowsBeta -ErrorAction SilentlyContinue
$pkgs = $pkgs | Where-Object { $_ } | Sort-Object Version -Descending
if($pkgs.Count -eq 0){
  Write-Error 'MINECRAFT_NOT_INSTALLED'
  exit 2
}
$pkg = $pkgs[0]
$manifestPath = Join-Path $pkg.InstallLocation 'AppxManifest.xml'
$appId = 'App'
if(Test-Path -LiteralPath $manifestPath){
  try{
    [xml]$xml = Get-Content -LiteralPath $manifestPath
    $firstApp = $xml.Package.Applications.Application | Select-Object -First 1
    if($firstApp -and $firstApp.Id){
      $appId = $firstApp.Id
    }
  } catch {}
}
Start-Process explorer.exe "shell:AppsFolder\\$($pkg.PackageFamilyName)!$appId"
"LAUNCHED:$($pkg.PackageFamilyName)!$appId"
`;

  const launchResult = await runPowerShell(launchScript, { hidden: true });
  if (launchResult.code !== 0) {
    throw new Error(launchResult.stderr || launchResult.stdout || "Не удалось запустить Minecraft после применения версии.");
  }

  return launchResult.stdout || "LAUNCHED";
}

async function readInstalledVersions() {
  await ensureDirs();
  const root = getVersionRoot();
  const entries = await fsPromises.readdir(root, { withFileTypes: true });
  const installed = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const dirPath = path.join(root, entry.name);
    const manifestPath = path.join(dirPath, "AppxManifest.xml");
    const metaPath = path.join(dirPath, "install-meta.json");
    let meta = null;

    if (await exists(metaPath)) {
      try {
        meta = JSON.parse(await fsPromises.readFile(metaPath, "utf8"));
      } catch {
        meta = null;
      }
    }

    let packagePath = null;
    if (meta?.packageFileName) {
      const byMeta = path.join(dirPath, meta.packageFileName);
      if (await exists(byMeta)) {
        packagePath = byMeta;
      }
    }

    if (!packagePath) {
      packagePath = await findPackageFileInDir(dirPath);
    }

    const hasManifest = await exists(manifestPath);
    if (!packagePath) continue;

    const known = versions.find((v) => v.id === meta?.id && v.type === meta?.type) || versions.find((v) => getInstallPath(v) === dirPath);
    const id = meta?.id || known?.id || entry.name;
    const type = meta?.type || known?.type || "Release";
    const stat = await fsPromises.stat(dirPath);
    const sizeBytes = meta?.sizeBytes
      || (packagePath ? (await fsPromises.stat(packagePath)).size : (await dirSizeBytes(dirPath)));

    installed.push({
      id,
      type,
      name: known?.name || `Bedrock ${formatDisplayVersionId(id)}`,
      date: known?.date || "",
      displayId: known?.displayId || known?.shortId || formatDisplayVersionId(id),
      path: dirPath,
      manifestPath: hasManifest ? manifestPath : null,
      packagePath,
      installedAt: meta?.installedAt || stat.mtime.toISOString(),
      sizeBytes,
    });
  }

  installed.sort((a, b) => new Date(b.installedAt).getTime() - new Date(a.installedAt).getTime());
  return installed;
}

function humanBytes(bytes) {
  if (!bytes || Number.isNaN(bytes)) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = units[0];

  for (let i = 0; i < units.length; i += 1) {
    unit = units[i];
    if (value < 1024 || i === units.length - 1) break;
    value /= 1024;
  }

  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${unit}`;
}

async function getDownloadUrl(updateId, revisionNumber) {
  const script = `
$updateId='${escapePwsh(updateId)}'
$revision='${escapePwsh(revisionNumber)}'
$xml=@"
<s:Envelope xmlns:a='http://www.w3.org/2005/08/addressing' xmlns:s='http://www.w3.org/2003/05/soap-envelope'><s:Header><a:Action>http://www.microsoft.com/SoftwareDistribution/Server/ClientWebService/GetExtendedUpdateInfo2</a:Action><a:MessageID>urn:uuid:0ffc5961-414a-4019-9c0f-9247281674d4</a:MessageID><a:To s:mustUnderstand='1'>https://fe3.delivery.mp.microsoft.com/ClientWebService/client.asmx</a:To><o:Security s:mustUnderstand='1' xmlns:o='http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd'><wuws:WindowsUpdateTicketsToken wsu:id='ClientMSA' xmlns:wsu='http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd' xmlns:wuws='http://schemas.microsoft.com/msus/2014/10/WindowsUpdateAuthorization'><TicketType Name='AAD' Version='1.0' Policy='MBI_SSL'></TicketType></wuws:WindowsUpdateTicketsToken></o:Security></s:Header><s:Body><GetExtendedUpdateInfo2 xmlns='http://www.microsoft.com/SoftwareDistribution/Server/ClientWebService'><updateIDs><UpdateIdentity><UpdateID>$updateId</UpdateID><RevisionNumber>$revision</RevisionNumber></UpdateIdentity></updateIDs><infoTypes><XmlUpdateFragmentType>FileUrl</XmlUpdateFragmentType></infoTypes></GetExtendedUpdateInfo2></s:Body></s:Envelope>
"@
$res=Invoke-WebRequest -UseBasicParsing -Uri 'https://fe3.delivery.mp.microsoft.com/ClientWebService/client.asmx' -Method POST -ContentType 'application/soap+xml; charset=utf-8' -Body $xml -Headers @{ 'User-Agent'='Mozilla/5.0'}
$m=[regex]::Match($res.Content,'https?://tlu\\.dl[^<\" ]+')
if($m.Success){$m.Value}else{Write-Error 'LINK_NOT_FOUND'; exit 2}
`;

  const result = await runPowerShell(script);
  if (result.code !== 0) {
    throw new Error(result.stderr || "Не удалось получить ссылку на пакет версии.");
  }

  const url = result.stdout.replace(/&amp;/g, "&").trim();
  if (!url.startsWith("http")) {
    throw new Error("Пакет версии не найден в ответе Microsoft Update.");
  }

  return url;
}

async function downloadArchive(url, destination, version, targetWindow) {
  sendInstallEvent(targetWindow, {
    versionId: version.id,
    kind: "log",
    level: "info",
    text: "Получен URL пакета. Начинаю загрузку...",
  });

  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Ошибка загрузки пакета (${response.status}).`);
  }

  const totalBytes = Number(response.headers.get("content-length") || 0);
  const out = fs.createWriteStream(destination);
  const reader = response.body.getReader();

  let downloadedBytes = 0;
  let lastLogAt = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    downloadedBytes += value.length;

    if (!out.write(Buffer.from(value))) {
      await once(out, "drain");
    }

    if (totalBytes > 0) {
      sendInstallEvent(targetWindow, {
        versionId: version.id,
        kind: "progress",
        progress: Math.floor((downloadedBytes / totalBytes) * 65),
      });
    }

    const now = Date.now();
    if (now - lastLogAt >= 1200) {
      const percent = totalBytes > 0 ? ((downloadedBytes / totalBytes) * 100).toFixed(1) : "?";
      sendInstallEvent(targetWindow, {
        versionId: version.id,
        kind: "log",
        level: "process",
        text: `Скачивание пакета: ${humanBytes(downloadedBytes)} / ${humanBytes(totalBytes)} (${percent}%)`,
      });
      lastLogAt = now;
    }
  }

  out.end();
  await once(out, "finish");

  sendInstallEvent(targetWindow, {
    versionId: version.id,
    kind: "log",
    level: "success",
    text: `Пакет загружен: ${humanBytes(downloadedBytes)}`,
  });
}

async function extractArchive(archivePath, targetDir, version, targetWindow) {
  const archive = await unzipper.Open.file(archivePath);
  const entries = archive.files;
  const baseTarget = path.resolve(targetDir);

  if (entries.length === 0) {
    throw new Error("Пустой архив версии.");
  }

  sendInstallEvent(targetWindow, {
    versionId: version.id,
    kind: "log",
    level: "info",
    text: `Распаковка пакета (${entries.length} файлов)...`,
  });

  let emittedLogs = 0;

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const relativeEntryPath = entry.path.replace(/^[/\\]+/g, "");
    const destinationPath = path.resolve(baseTarget, relativeEntryPath);

    if (!destinationPath.startsWith(baseTarget + path.sep) && destinationPath !== baseTarget) {
      throw new Error(`Небезопасный путь в архиве: ${entry.path}`);
    }

    if (entry.type === "Directory") {
      await fsPromises.mkdir(destinationPath, { recursive: true });
      continue;
    }

    await fsPromises.mkdir(path.dirname(destinationPath), { recursive: true });
    await pipeline(entry.stream(), fs.createWriteStream(destinationPath));

    if (emittedLogs < 20 || i % 100 === 0 || i === entries.length - 1) {
      sendInstallEvent(targetWindow, {
        versionId: version.id,
        kind: "log",
        level: "process",
        text: `Распакован файл: ${relativeEntryPath}`,
      });
      emittedLogs += 1;
    }

    if (i % 15 === 0 || i === entries.length - 1) {
      sendInstallEvent(targetWindow, {
        versionId: version.id,
        kind: "progress",
        progress: 65 + Math.floor(((i + 1) / entries.length) * 30),
      });
    }
  }

  const signaturePath = path.join(targetDir, "AppxSignature.p7x");
  if (await exists(signaturePath)) {
    await fsPromises.rm(signaturePath, { force: true });
  }

  sendInstallEvent(targetWindow, {
    versionId: version.id,
    kind: "log",
    level: "success",
    text: "Распаковка завершена.",
  });
}

async function installVersion(versionId, targetWindow) {
  if (activeInstallId) {
    throw new Error(`Сейчас уже идет установка версии ${activeInstallId}`);
  }

  const version = versions.find((item) => item.id === versionId && item.type === "Release") || versions.find((item) => item.id === versionId);
  if (!version) {
    throw new Error("Версия не найдена.");
  }

  activeInstallId = version.id;
  await ensureDirs();

  sendInstallEvent(targetWindow, {
    versionId: version.id,
    kind: "start",
    progress: 0,
  });

  const installPath = getInstallPath(version);
  const manifestPath = path.join(installPath, "AppxManifest.xml");
  sendInstallEvent(targetWindow, {
    versionId: version.id,
    kind: "log",
    level: "info",
    text: `Папка версии: ${installPath}`,
  });

  try {
    if (await exists(installPath)) {
      const existingPackagePath = await findPackageFileInDir(installPath);
      if (existingPackagePath) {
        sendInstallEvent(targetWindow, {
          versionId: version.id,
          kind: "log",
          level: "success",
          text: "Версия уже скачана в папку Version.",
        });

        const installed = await readInstalledVersions();
        sendInstallEvent(targetWindow, {
          versionId: version.id,
          kind: "done",
          level: "success",
          text: `Версия ${version.id} готова к применению.`,
          installed,
        });
        return;
      }

      if (await exists(manifestPath)) {
        sendInstallEvent(targetWindow, {
          versionId: version.id,
          kind: "log",
          level: "info",
          text: "Найден старый распакованный формат версии. Выполняю миграцию на пакетный формат...",
        });
        await fsPromises.rm(installPath, { recursive: true, force: true });
      }
    }

    await fsPromises.mkdir(installPath, { recursive: true });

    let packageUrl = version.downloadUrl || (Array.isArray(version.directUrls) ? version.directUrls[0] : null);
    if (packageUrl) {
      sendInstallEvent(targetWindow, {
        versionId: version.id,
        kind: "log",
        level: "info",
        text: "Использую прямую ссылку пакета из версии-листа...",
      });
    } else {
      sendInstallEvent(targetWindow, {
        versionId: version.id,
        kind: "log",
        level: "info",
        text: `Запрос ссылки у Microsoft Update (${version.updateId})...`,
      });
      packageUrl = await getDownloadUrl(version.updateId, version.revisionNumber || 1);
    }

    const tempArchivePath = path.join(getDownloadRoot(), `client-${sanitizeId(version.id)}-${Date.now()}.pkg`);

    await downloadArchive(packageUrl, tempArchivePath, version, targetWindow);

    const packageExtByUrl = getPackageExtensionByName(new URL(packageUrl).pathname);
    const packageExt = packageExtByUrl || (await detectPackageExtension(tempArchivePath));
    const packageFileName = `package${packageExt}`;
    const packagePath = path.join(installPath, packageFileName);
    await fsPromises.rename(tempArchivePath, packagePath);

    const sizeBytes = (await fsPromises.stat(packagePath)).size;
    sendInstallEvent(targetWindow, {
      versionId: version.id,
      kind: "log",
      level: "success",
      text: `Пакет сохранён: ${packageFileName} (${humanBytes(sizeBytes)})`,
    });

    sendInstallEvent(targetWindow, {
      versionId: version.id,
      kind: "progress",
      progress: 95,
    });

    const meta = {
      id: version.id,
      type: version.type,
      clientVersion: version.clientVersion,
      updateId: version.updateId,
      revisionNumber: version.revisionNumber || 1,
      installedAt: new Date().toISOString(),
      sizeBytes,
      packageFileName,
      packageUrl,
    };

    await fsPromises.writeFile(path.join(installPath, "install-meta.json"), JSON.stringify(meta, null, 2), "utf8");

    sendInstallEvent(targetWindow, {
      versionId: version.id,
      kind: "progress",
      progress: 100,
    });

    const installed = await readInstalledVersions();
    sendInstallEvent(targetWindow, {
      versionId: version.id,
      kind: "done",
      level: "success",
      text: `Версия ${version.id} скачана в папку Version.`,
      installed,
    });
  } catch (error) {
    await fsPromises.rm(installPath, { recursive: true, force: true });

    sendInstallEvent(targetWindow, {
      versionId: version.id,
      kind: "error",
      level: "error",
      text: error instanceof Error ? error.message : "Ошибка установки версии.",
    });
  } finally {
    activeInstallId = null;
  }
}

async function applyVersion(versionId, targetWindow) {
  sendInstallEvent(targetWindow, {
    versionId,
    kind: "start",
    progress: 0,
  });

  const installed = await readInstalledVersions();
  const item = installed.find((v) => v.id === versionId) || installed.find((v) => sanitizeId(v.id) === sanitizeId(versionId));
  const knownVersion = versions.find((v) => v.id === item?.id) || null;
  const versionLabel = knownVersion?.displayId || knownVersion?.shortId || item?.displayId || item?.id || versionId;

  if (!item) {
    throw new Error("Эта версия не скачана. Сначала нажми Установить.");
  }

  sendInstallEvent(targetWindow, {
    versionId,
    kind: "log",
    level: "info",
    text: `Применяю версию ${versionLabel} через Add-AppxPackage...`,
  });
  sendInstallEvent(targetWindow, {
    versionId,
    kind: "progress",
    progress: 20,
  });

  await runPowerShell(
    "$proc = Get-Process -Name 'Minecraft.Windows','Minecraft.WindowsBeta' -ErrorAction SilentlyContinue; if($proc){ $proc | Stop-Process -Force }",
    { hidden: true },
  );

  const currentClient = await getClientInfo();
  const alreadyApplied = currentClient.installed && versionsEqual(versionIdToPackageVersion(item.id), currentClient.version);

  if (alreadyApplied) {
    sendInstallEvent(targetWindow, {
      versionId,
      kind: "log",
      level: "success",
      text: `Версия ${versionLabel} уже активна. Просто запускаю игру...`,
    });
    sendInstallEvent(targetWindow, {
      versionId,
      kind: "progress",
      progress: 85,
    });
    await launchInstalledMinecraft();

    sendInstallEvent(targetWindow, {
      versionId,
      kind: "progress",
      progress: 100,
    });
    sendInstallEvent(targetWindow, {
      versionId,
      kind: "done",
      level: "success",
      text: `Готово: запущена уже примененная версия ${versionLabel}.`,
      installed,
    });
    return { ok: true };
  }

  await backupCurrentGameData(currentClient.packageFamilyName, targetWindow, versionId);

  sendInstallEvent(targetWindow, {
    versionId,
    kind: "progress",
    progress: 45,
  });
  sendInstallEvent(targetWindow, {
    versionId,
    kind: "log",
    level: "info",
    text: "Применяю пакет без удаления текущего клиента (быстрый режим)...",
  });

  let script = "";
  if (item.packagePath && await exists(item.packagePath)) {
    script = `Add-AppxPackage -Path '${escapePwsh(item.packagePath)}' -ForceApplicationShutdown -ForceUpdateFromAnyVersion -ErrorAction Stop`;
  } else if (item.manifestPath && await exists(item.manifestPath)) {
    throw new Error("Версия скачана в старом распакованном формате и не может быть применена. Удали её и скачай заново.");
  } else {
    throw new Error("Не найден пакет версии для применения. Переустанови выбранную версию.");
  }

  let rollingProgress = 45;
  const progressTimer = setInterval(() => {
    rollingProgress = Math.min(rollingProgress + 2, 89);
    sendInstallEvent(targetWindow, {
      versionId,
      kind: "progress",
      progress: rollingProgress,
    });
  }, 1000);

  const logTimer = setInterval(() => {
    sendInstallEvent(targetWindow, {
      versionId,
      kind: "log",
      level: "process",
      text: "Применение версии в процессе... жду ответ Windows Installer.",
    });
  }, 7000);

  let result;
  try {
    result = await runPowerShell(script, { hidden: true });
  } finally {
    clearInterval(progressTimer);
    clearInterval(logTimer);
  }

  if (result.code !== 0) {
    const hint = result.stderr || result.stdout || "Add-AppxPackage завершился с ошибкой";
    const activityIdMatch = hint.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
    if (activityIdMatch) {
      const activityId = activityIdMatch[0];
      const logResult = await runPowerShell(`Get-AppxLog -ActivityID '${activityId}' | Select-Object -First 4 | Format-List | Out-String`, { hidden: true });
      const extra = logResult.stdout?.trim() ? `\n${logResult.stdout.trim()}` : "";
      throw new Error(`${hint}${extra}`);
    }

    throw new Error(hint);
  }

  sendInstallEvent(targetWindow, {
    versionId,
    kind: "progress",
    progress: 80,
  });

  const clientAfterApply = await getClientInfo();
  if (!clientAfterApply.installed) {
    throw new Error("Пакет применился, но Minecraft не обнаружен в системе.");
  }

  await restoreGameDataToPackage(clientAfterApply.packageFamilyName, targetWindow, versionId);

  sendInstallEvent(targetWindow, {
    versionId,
    kind: "log",
    level: "success",
    text: `Версия ${versionLabel} применена. Текущий клиент: ${clientAfterApply.version || "не определён"}. Открываю Minecraft...`,
  });

  await launchInstalledMinecraft();

  sendInstallEvent(targetWindow, {
    versionId,
    kind: "progress",
    progress: 100,
  });
  sendInstallEvent(targetWindow, {
    versionId,
    kind: "done",
    level: "success",
    text: `Готово: применена версия ${versionLabel}.`,
    installed,
  });

  return { ok: true };
}

const registerBedrockIpc = () => {
  if (handlersRegistered) return;
  handlersRegistered = true;

  loadVersions();
  void refreshVersionsCatalogFromRemote().catch(() => {});

  ipcMain.handle("bedrock:versions:list", async () => versions);
  ipcMain.handle("bedrock:versions:refresh", async () => {
    const result = await refreshVersionsCatalogFromRemote();
    return {
      ...result,
      versions,
    };
  });
  ipcMain.handle("bedrock:installed:list", async () => readInstalledVersions());
  ipcMain.handle("bedrock:client:info", async () => getClientInfo());
  ipcMain.handle("bedrock:storage:paths", async () => ({
    workspaceRoot: getWorkspaceRoot(),
    versionRoot: getVersionRoot(),
    downloadRoot: getDownloadRoot(),
    backupRoot: getBackupRoot(),
  }));
  ipcMain.handle("bedrock:resourcepacks:list", async () => listResourcePacks());
  ipcMain.handle("bedrock:resourcepacks:pick", async (event) => pickResourcePackFiles(BrowserWindow.fromWebContents(event.sender)));
  ipcMain.handle("bedrock:resourcepacks:add", async (_event, filePaths) => addResourcePackFiles(filePaths));
  ipcMain.handle("bedrock:resourcepacks:add-buffered", async (_event, bufferItems) => addResourcePackBuffers(bufferItems));
  ipcMain.handle("bedrock:resourcepack:remove", async (_event, resourcePackId) => removeResourcePack(resourcePackId));
  ipcMain.handle("bedrock:resourcepack:install", async (_event, resourcePackId) => installResourcePack(resourcePackId));

  ipcMain.handle("bedrock:install:start", async (event, versionId) => {
    await installVersion(versionId, BrowserWindow.fromWebContents(event.sender));
    return { ok: true };
  });

  ipcMain.handle("bedrock:version:play", async (event, versionId) => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    try {
      await applyVersion(versionId, targetWindow);
      return { ok: true };
    } catch (error) {
      sendInstallEvent(targetWindow, {
        versionId,
        kind: "error",
        level: "error",
        text: error instanceof Error ? error.message : "Не удалось применить версию.",
      });
      throw error;
    }
  });

  ipcMain.handle("bedrock:version:remove", async (_event, versionId) => {
    const version = versions.find((v) => v.id === versionId) || { id: versionId, type: "Release" };
    const versionPath = getInstallPath(version);
    await fsPromises.rm(versionPath, { recursive: true, force: true });
    return readInstalledVersions();
  });
};

module.exports = {
  registerBedrockIpc,
};


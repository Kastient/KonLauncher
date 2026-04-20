import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Box,
  Check,
  ChevronDown,
  Copy,
  Cpu,
  Download,
  FileCode,
  Globe,
  HardDrive,
  Info,
  LayoutGrid,
  Minus,
  Play,
  ShieldCheck,
  Square,
  Terminal,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";

const api = window.bedrockApi;

function formatBytes(bytes) {
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

function toLogType(level) {
  if (level === "error") return "error";
  if (level === "success") return "success";
  if (level === "process") return "process";
  return "info";
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

function toLegacyBedrockDisplayId(value) {
  const parts = parseVersionParts(value);
  if (parts.length < 3) return "";
  const [major, minor, patch] = parts;

  if (major === 1 && minor === 21) {
    if (patch >= 100 && patch <= 199) {
      return `26.${patch - 100}`;
    }
    if (patch >= 0 && patch < 100) {
      return `25.${patch}`;
    }
  }

  return "";
}

function resolveVersionDisplayId(version) {
  const base = String(version?.displayId || version?.shortId || version?.id || "-").trim();
  const legacy = String(
    version?.legacyDisplayId
      || toLegacyBedrockDisplayId(version?.shortId || version?.displayId || version?.id)
      || ""
  ).trim();

  if (!legacy || legacy === base) return base;
  return `${legacy} • ${base}`;
}

const MINECRAFT_COLOR_CODES = {
  0: "#000000",
  1: "#0000AA",
  2: "#00AA00",
  3: "#00AAAA",
  4: "#AA0000",
  5: "#AA00AA",
  6: "#FFAA00",
  7: "#AAAAAA",
  8: "#555555",
  9: "#5555FF",
  a: "#55FF55",
  b: "#55FFFF",
  c: "#FF5555",
  d: "#FF55FF",
  e: "#FFFF55",
  f: "#FFFFFF",
};

function parseMinecraftTextSegments(text) {
  const value = String(text || "");
  const segments = [];
  const style = {
    color: null,
    bold: false,
    italic: false,
    underline: false,
    strike: false,
  };
  let chunk = "";

  const pushChunk = () => {
    if (!chunk) return;
    segments.push({
      text: chunk,
      color: style.color,
      bold: style.bold,
      italic: style.italic,
      underline: style.underline,
      strike: style.strike,
    });
    chunk = "";
  };

  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === "§" && i + 1 < value.length) {
      const code = value[i + 1].toLowerCase();
      if (MINECRAFT_COLOR_CODES[code]) {
        pushChunk();
        style.color = MINECRAFT_COLOR_CODES[code];
        style.bold = false;
        style.italic = false;
        style.underline = false;
        style.strike = false;
        i += 1;
        continue;
      }

      if (code === "l" || code === "o" || code === "n" || code === "m" || code === "r") {
        pushChunk();
        if (code === "l") style.bold = true;
        if (code === "o") style.italic = true;
        if (code === "n") style.underline = true;
        if (code === "m") style.strike = true;
        if (code === "r") {
          style.color = null;
          style.bold = false;
          style.italic = false;
          style.underline = false;
          style.strike = false;
        }
        i += 1;
        continue;
      }
    }

    chunk += value[i];
  }

  pushChunk();

  if (segments.length === 0) {
    return [{
      text: value,
      color: null,
      bold: false,
      italic: false,
      underline: false,
      strike: false,
    }];
  }

  return segments;
}

function renderMinecraftFormattedText(text, options = {}) {
  const defaultColor = options.defaultColor || null;
  const segments = parseMinecraftTextSegments(text);
  return segments.map((segment, index) => (
    <span
      key={`${index}-${segment.text}`}
      style={{
        color: segment.color || defaultColor || undefined,
        fontWeight: segment.bold ? 800 : undefined,
        fontStyle: segment.italic ? "italic" : undefined,
        textDecoration: `${segment.underline ? "underline " : ""}${segment.strike ? "line-through" : ""}`.trim() || undefined,
      }}
    >
      {segment.text}
    </span>
  ));
}

function hasMinecraftFormatting(text) {
  return String(text || "").includes("§");
}

const LANGUAGES = [
  { id: "ru", label: "Русский", short: "RU" },
  { id: "en", label: "English", short: "EN" },
  { id: "uk", label: "Український", short: "UA" },
];

const UI_TEXT = {
  ru: {
    sidebarLibrary: "Библиотека",
    sidebarResourcePacks: "Ресурспаки",
    sidebarInstalled: "Установлено",
    sidebarLanguage: "Язык",
    sidebarSwitcher: "Переключатель Bedrock",
    launcherErrorPrefix: "Ошибка загрузки данных: {error}",
    apiUnavailable: "API Electron недоступен. Запусти desktop-приложение .exe",
    versionNoDirectDownload: "Для этой версии нет прямой загрузки. Используй официальный лаунчер.",
    filesNotAdded: "Файлы не были добавлены.",
    addPacksFailed: "Не удалось добавить ресурспаки.",
    noBufferedDnd: "Эта версия лаунчера не поддерживает drag&drop для файлов без пути.",
    dragOnlyPackFiles: "Перетащи .mcpack или .zip файл.",
    dragReadFailed: "Не удалось считать данные перетаскиваемого файла.",
    addPacksDragFailed: "Не удалось добавить ресурспаки через перетаскивание.",
    pickerApiUnavailable: "API выбора файлов недоступен.",
    pickerOpenFailed: "Не удалось открыть выбор файлов.",
    removeApiUnavailable: "API удаления недоступен.",
    removeFailed: "Не удалось удалить ресурспак.",
    installPackApiUnavailable: "API Electron недоступен. Запусти desktop-приложение .exe",
    packInstalled: "Ресурспак {name} установлен",
    installPackFailed: "Не удалось установить ресурспак.",
    playActionDownloading: "Загрузка... {progress}%",
    playActionLaunching: "Запуск...",
    playActionPlay: "Играть",
    playActionApplyAndLaunch: "Применить и запустить",
    playActionInstall: "Установить",
    playActionUnavailable: "Недоступно",
    windowMinimize: "Свернуть окно",
    windowRestore: "Восстановить окно",
    windowMaximize: "Развернуть окно",
    windowClose: "Закрыть окно",
    badgeSwitcher: "Лаунчер для смены версий Bedrock",
    selectedVersion: "Выбрана версия",
    source: "Источник",
    sourceUnknown: "UWP",
    statusInstalled: "Установлено",
    statusNotInstalled: "Не установлено",
    clientVersionLabel: "Клиент Minecraft",
    clientNotFound: "не найден",
    versionsStoredAt: "версии хранятся в",
    consoleInstall: "Консоль установки",
    waitingForActions: "Ожидание действий...",
    chooseClientVersion: "Выберите версию клиента",
    chooseVersionPlaceholder: "Выбери версию",
    resourcePacksTitle: "Ресурспаки",
    resourcePacksSubtitle: "Импорт через запуск `.mcpack` без авто-закрытия Minecraft",
    heroClientLabel: "Клиент Bedrock для Windows",
    heroSwitchMethodLabel: "Переключение через Add-AppxPackage",
    loadingResourcePacks: "Загрузка списка ресурспаков...",
    launcherPackTag: "Рп от лаунчера",
    descriptionMissing: "Описание отсутствует.",
    fileLabel: "Файл",
    minEngineVersion: "Минимальная версия движка",
    notSpecified: "не указана",
    installing: "Установка...",
    myResourcePacks: "Мои рп",
    dropReadRetry: "Не удалось прочитать перетаскиваемый файл. Попробуй перетащить .mcpack/.zip ещё раз.",
    dropZoneTitle: "Перетащи сюда `.mcpack` или `.zip`",
    dropZoneHint: "Или просто нажми на эту область",
    myResourcePacksEmpty: "Пока пусто. Добавь свой первый RP перетаскиванием или кликом по области выше.",
    deleteRpTooltip: "Удалить RP",
    drawerInstalledTitle: "Установлено",
    noInstalledVersions: "Нет установленных версий",
    select: "Выбрать",
    confirmTitle: "Подтверждение",
    confirmDeleteRp: "Удалить этот RP из лаунчера?",
    cancel: "Отмена",
    delete: "Удалить",
    versionRemoved: "Версия {id} удалена",
    packIconAlt: "Иконка ресурспака",
  },
  en: {
    sidebarLibrary: "Library",
    sidebarResourcePacks: "Resource Packs",
    sidebarInstalled: "Installed",
    sidebarLanguage: "Language",
    sidebarSwitcher: "Bedrock switcher",
    launcherErrorPrefix: "Data loading failed: {error}",
    apiUnavailable: "Electron API is unavailable. Start the desktop .exe app.",
    versionNoDirectDownload: "No direct download is available for this version. Use the official launcher.",
    filesNotAdded: "No files were added.",
    addPacksFailed: "Failed to add resource packs.",
    noBufferedDnd: "This launcher version does not support drag and drop for files without paths.",
    dragOnlyPackFiles: "Drop a .mcpack or .zip file.",
    dragReadFailed: "Failed to read the dropped file data.",
    addPacksDragFailed: "Failed to add resource packs via drag and drop.",
    pickerApiUnavailable: "File picker API is unavailable.",
    pickerOpenFailed: "Failed to open file picker.",
    removeApiUnavailable: "Remove API is unavailable.",
    removeFailed: "Failed to remove resource pack.",
    installPackApiUnavailable: "Electron API is unavailable. Start the desktop .exe app.",
    packInstalled: "Resource pack {name} installed",
    installPackFailed: "Failed to install resource pack.",
    playActionDownloading: "Downloading... {progress}%",
    playActionLaunching: "Launching...",
    playActionPlay: "Play",
    playActionApplyAndLaunch: "Apply and launch",
    playActionInstall: "Install",
    playActionUnavailable: "Unavailable",
    windowMinimize: "Minimize window",
    windowRestore: "Restore window",
    windowMaximize: "Maximize window",
    windowClose: "Close window",
    badgeSwitcher: "Bedrock version switcher",
    selectedVersion: "Selected version",
    source: "Source",
    sourceUnknown: "UWP",
    statusInstalled: "Installed",
    statusNotInstalled: "Not installed",
    clientVersionLabel: "Minecraft client",
    clientNotFound: "not found",
    versionsStoredAt: "versions are stored in",
    consoleInstall: "Installation console",
    waitingForActions: "Waiting for actions...",
    chooseClientVersion: "Choose client version",
    chooseVersionPlaceholder: "Choose version",
    resourcePacksTitle: "Resource Packs",
    resourcePacksSubtitle: "Import by launching `.mcpack` without auto-closing Minecraft",
    heroClientLabel: "Windows Bedrock Client",
    heroSwitchMethodLabel: "Switch via Add-AppxPackage",
    loadingResourcePacks: "Loading resource packs list...",
    launcherPackTag: "Launcher RP",
    descriptionMissing: "No description provided.",
    fileLabel: "File",
    minEngineVersion: "Minimum engine version",
    notSpecified: "not specified",
    installing: "Installing...",
    myResourcePacks: "My RPs",
    dropReadRetry: "Failed to read the dropped file. Try dropping a .mcpack/.zip again.",
    dropZoneTitle: "Drop `.mcpack` or `.zip` here",
    dropZoneHint: "Or click this area",
    myResourcePacksEmpty: "Nothing here yet. Add your first RP by dropping it or clicking the area above.",
    deleteRpTooltip: "Delete RP",
    drawerInstalledTitle: "Installed",
    noInstalledVersions: "No installed versions",
    select: "Select",
    confirmTitle: "Confirmation",
    confirmDeleteRp: "Delete this RP from the launcher?",
    cancel: "Cancel",
    delete: "Delete",
    versionRemoved: "Version {id} removed",
    packIconAlt: "Resource pack icon",
  },
  uk: {
    sidebarLibrary: "Бібліотека",
    sidebarResourcePacks: "Ресурспаки",
    sidebarInstalled: "Встановлено",
    sidebarLanguage: "Мова",
    sidebarSwitcher: "Перемикач Bedrock",
    launcherErrorPrefix: "Помилка завантаження даних: {error}",
    apiUnavailable: "API Electron недоступний. Запусти desktop .exe застосунок.",
    versionNoDirectDownload: "Для цієї версії немає прямого завантаження. Використай офіційний лаунчер.",
    filesNotAdded: "Файли не були додані.",
    addPacksFailed: "Не вдалося додати ресурспаки.",
    noBufferedDnd: "Ця версія лаунчера не підтримує drag&drop для файлів без шляху.",
    dragOnlyPackFiles: "Перетягни .mcpack або .zip файл.",
    dragReadFailed: "Не вдалося прочитати дані перетягуваного файлу.",
    addPacksDragFailed: "Не вдалося додати ресурспаки через перетягування.",
    pickerApiUnavailable: "API вибору файлів недоступний.",
    pickerOpenFailed: "Не вдалося відкрити вибір файлів.",
    removeApiUnavailable: "API видалення недоступний.",
    removeFailed: "Не вдалося видалити ресурспак.",
    installPackApiUnavailable: "API Electron недоступний. Запусти desktop .exe застосунок.",
    packInstalled: "Ресурспак {name} встановлено",
    installPackFailed: "Не вдалося встановити ресурспак.",
    playActionDownloading: "Завантаження... {progress}%",
    playActionLaunching: "Запуск...",
    playActionPlay: "Грати",
    playActionApplyAndLaunch: "Застосувати і запустити",
    playActionInstall: "Встановити",
    playActionUnavailable: "Недоступно",
    windowMinimize: "Згорнути вікно",
    windowRestore: "Відновити вікно",
    windowMaximize: "Розгорнути вікно",
    windowClose: "Закрити вікно",
    badgeSwitcher: "Лаунчер для зміни версій Bedrock",
    selectedVersion: "Обрана версія",
    source: "Джерело",
    sourceUnknown: "UWP",
    statusInstalled: "Встановлено",
    statusNotInstalled: "Не встановлено",
    clientVersionLabel: "Клієнт Minecraft",
    clientNotFound: "не знайдено",
    versionsStoredAt: "версії зберігаються у",
    consoleInstall: "Консоль встановлення",
    waitingForActions: "Очікування дій...",
    chooseClientVersion: "Вибери версію клієнта",
    chooseVersionPlaceholder: "Вибери версію",
    resourcePacksTitle: "Ресурспаки",
    resourcePacksSubtitle: "Імпорт через запуск `.mcpack` без авто-закриття Minecraft",
    heroClientLabel: "Клієнт Bedrock для Windows",
    heroSwitchMethodLabel: "Перемикання через Add-AppxPackage",
    loadingResourcePacks: "Завантаження списку ресурспаків...",
    launcherPackTag: "Рп від лаунчера",
    descriptionMissing: "Опис відсутній.",
    fileLabel: "Файл",
    minEngineVersion: "Мінімальна версія рушія",
    notSpecified: "не вказано",
    installing: "Встановлення...",
    myResourcePacks: "Мої рп",
    dropReadRetry: "Не вдалося прочитати перетягуваний файл. Спробуй ще раз .mcpack/.zip.",
    dropZoneTitle: "Перетягни сюди `.mcpack` або `.zip`",
    dropZoneHint: "Або просто натисни на цю область",
    myResourcePacksEmpty: "Поки порожньо. Додай свій перший RP перетягуванням або кліком по області вище.",
    deleteRpTooltip: "Видалити RP",
    drawerInstalledTitle: "Встановлено",
    noInstalledVersions: "Немає встановлених версій",
    select: "Обрати",
    confirmTitle: "Підтвердження",
    confirmDeleteRp: "Видалити цей RP з лаунчера?",
    cancel: "Скасувати",
    delete: "Видалити",
    versionRemoved: "Версію {id} видалено",
    packIconAlt: "Іконка ресурспака",
  },
};

const formatUiText = (template, params = {}) =>
  String(template).replace(/\{(\w+)\}/g, (_match, token) => String(params[token] ?? ""));

const SidebarNavItem = ({ icon, label, active, onClick, indicator = false }) => (
  <button
    onClick={onClick}
    className={`group relative flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 transition-all ${
      active
        ? "bg-gradient-to-r from-emerald-500/18 to-cyan-400/12 text-emerald-300 shadow-[0_0_0_1px_rgba(52,211,153,0.25)]"
        : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
    }`}
  >
    <span className={`${active ? "scale-110" : "group-hover:scale-110"} transition-transform`}>{icon}</span>
    <span className="text-sm font-black tracking-tight">{label}</span>
    {(active || indicator) && (
      <div className={`absolute right-4 h-1.5 w-1.5 rounded-full ${active ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" : "bg-zinc-600"}`} />
    )}
  </button>
);

export default function App({ headerCenterSlot = null }) {
  const [activeTab, setActiveTab] = useState("versions");
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [installedVersions, setInstalledVersions] = useState([]);
  const [clientInfo, setClientInfo] = useState({ installed: false, version: null });
  const [storagePaths, setStoragePaths] = useState({ versionRoot: "" });
  const [resourcePacks, setResourcePacks] = useState([]);
  const [resourcePackError, setResourcePackError] = useState("");
  const [resourcePackInstalling, setResourcePackInstalling] = useState(null);
  const [resourcePackBusy, setResourcePackBusy] = useState(false);
  const [resourceDropActive, setResourceDropActive] = useState(false);
  const [resourcePackToDelete, setResourcePackToDelete] = useState(null);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [language, setLanguage] = useState(() => {
    const saved = window.localStorage.getItem("konswicher-language");
    return LANGUAGES.some((item) => item.id === saved) ? saved : "ru";
  });
  const [installing, setInstalling] = useState(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);

  const dropdownRef = useRef(null);
  const languageRef = useRef(null);
  const logEndRef = useRef(null);

  const installedIdSet = useMemo(() => new Set(installedVersions.map((item) => item.id)), [installedVersions]);
  const selectedVerObj = useMemo(
    () => versions.find((v) => v.id === selectedVersion),
    [versions, selectedVersion],
  );
  const launcherResourcePack = useMemo(
    () => resourcePacks.find((pack) => pack.origin === "launcher") || resourcePacks[0] || null,
    [resourcePacks],
  );
  const customResourcePacks = useMemo(
    () => resourcePacks.filter((pack) => pack.origin === "custom"),
    [resourcePacks],
  );
  const selectedLanguage = useMemo(
    () => LANGUAGES.find((item) => item.id === language) || LANGUAGES[0],
    [language],
  );

  const isInstalled = selectedVersion ? installedIdSet.has(selectedVersion) : false;
  const isSelectedActiveClient = useMemo(() => {
    if (!selectedVersion || !clientInfo?.version) return false;
    return versionsEqual(versionIdToPackageVersion(selectedVersion), clientInfo.version);
  }, [selectedVersion, clientInfo?.version]);
  const timeLocale = language === "en" ? "en-US" : language === "uk" ? "uk-UA" : "ru-RU";
  const t = useCallback((key, params = {}) => {
    const dictionary = UI_TEXT[language] || UI_TEXT.ru;
    const template = dictionary[key] ?? UI_TEXT.ru[key] ?? key;
    return formatUiText(template, params);
  }, [language]);
  const selectedDisplayId = selectedVerObj ? resolveVersionDisplayId(selectedVerObj) : "-";
  const isCurrentInstalling = installing === selectedVersion;
  const showConsole = true;
  const hasDesktopWindowApi = Boolean(api?.windowControls);

  const appendLog = useCallback((text, type = "info", time) => {
    setLogs((prev) => {
      const next = [
        ...prev,
        {
          text,
          type,
          time: time || new Date().toLocaleTimeString(timeLocale),
        },
      ];
      return next.length > 320 ? next.slice(next.length - 320) : next;
    });
  }, [timeLocale]);

  useEffect(() => {
    window.localStorage.setItem("konswicher-language", language);
  }, [language]);

  const loadResourcePacks = useCallback(async () => {
    if (!api?.getResourcePacks) return [];
    const items = await api.getResourcePacks();
    const normalized = Array.isArray(items) ? items : [];
    setResourcePacks(normalized);
    return normalized;
  }, []);

  const loadInitialData = useCallback(async () => {
    if (!api) return;

    let refreshedVersions = null;
    if (typeof api.refreshVersions === "function") {
      try {
        const refreshed = await api.refreshVersions();
        if (Array.isArray(refreshed?.versions)) {
          refreshedVersions = refreshed.versions;
        }
      } catch {
        // fallback to cached local catalog
      }
    }

    const [remoteVersions, remoteInstalled, remoteClient, remoteStoragePaths, remoteResourcePacks] = await Promise.all([
      Array.isArray(refreshedVersions) ? refreshedVersions : api.getVersions(),
      api.getInstalled(),
      api.getClientInfo?.(),
      api.getStoragePaths?.(),
      loadResourcePacks(),
    ]);
    setVersions(remoteVersions || []);
    setInstalledVersions(remoteInstalled || []);
    if (remoteClient) {
      setClientInfo(remoteClient);
    }
    if (remoteStoragePaths) {
      setStoragePaths(remoteStoragePaths);
    }
    if (Array.isArray(remoteResourcePacks)) {
      setResourcePacks(remoteResourcePacks);
    }
    setResourcePackError("");

    setSelectedVersion((prev) => prev || remoteVersions?.[0]?.id || "");
  }, [loadResourcePacks]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInitialData().catch((error) => {
        appendLog(t("launcherErrorPrefix", { error: error.message }), "error");
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [appendLog, loadInitialData, t]);

  useEffect(() => {
    if (!api?.onInstallEvent) return undefined;

    const unsubscribe = api.onInstallEvent((event) => {
      if (event.kind === "start") {
        setInstalling(event.versionId);
        setProgress(0);
        setLogs([]);
      }

      if (event.kind === "progress") {
        setInstalling(event.versionId);
        setProgress(event.progress || 0);
      }

      if (event.kind === "log") {
        appendLog(event.text, toLogType(event.level), event.time);
      }

      if (event.kind === "done") {
        appendLog(event.text, "success", event.time);
        setInstalledVersions(event.installed || []);
        setProgress(100);
        api?.getClientInfo?.()
          .then((info) => {
            if (info) setClientInfo(info);
          })
          .catch(() => {});

        setTimeout(() => {
          setInstalling(null);
          setProgress(0);
        }, 1200);
      }

      if (event.kind === "error") {
        appendLog(event.text, "error", event.time);
        setInstalling(null);
        setProgress(0);
      }
    });

    return unsubscribe;
  }, [appendLog]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [logs]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setLanguageMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const preventDefault = (event) => {
      event.preventDefault();
    };
    window.addEventListener("dragover", preventDefault);
    window.addEventListener("drop", preventDefault);
    return () => {
      window.removeEventListener("dragover", preventDefault);
      window.removeEventListener("drop", preventDefault);
    };
  }, []);

  const handleInstall = async () => {
    if (!api) {
      appendLog(t("apiUnavailable"), "error");
      return;
    }

    if (!selectedVerObj) return;
    if (isInstalled || installing) return;

    if (!selectedVerObj.downloadable) {
      appendLog(t("versionNoDirectDownload"), "error");
      return;
    }

    try {
      setInstalling(selectedVersion);
      setProgress(0);
      setLogs([]);
      await api.installVersion(selectedVersion);
    } catch (error) {
      setInstalling(null);
      appendLog(error.message, "error");
    }
  };

  const addResourcePackPaths = useCallback(async (paths) => {
    if (!api?.addResourcePacks) return;
    const normalized = Array.from(new Set((paths || []).map((item) => String(item || "").trim()).filter(Boolean)));
    if (normalized.length === 0) return;

    setResourcePackBusy(true);
    setResourcePackError("");
    try {
      const result = await api.addResourcePacks(normalized);
      await loadResourcePacks();
      const addedCount = Array.isArray(result?.added) ? result.added.length : 0;
      const errors = Array.isArray(result?.errors) ? result.errors : [];

      if (addedCount === 0 && errors.length === 0) {
        setResourcePackError(t("filesNotAdded"));
      }
      if (errors.length > 0) {
        setResourcePackError(errors[0]);
      }
    } catch (error) {
      setResourcePackError(error?.message || t("addPacksFailed"));
    } finally {
      setResourcePackBusy(false);
    }
  }, [loadResourcePacks, t]);

  const addResourcePackBuffersFromFiles = useCallback(async (files) => {
    if (!api?.addResourcePacksBuffered) {
      setResourcePackError(t("noBufferedDnd"));
      return;
    }

    const supportedFiles = Array.from(files || []).filter((file) => {
      const name = String(file?.name || "").toLowerCase();
      return name.endsWith(".mcpack") || name.endsWith(".zip");
    });

    if (supportedFiles.length === 0) {
      setResourcePackError(t("dragOnlyPackFiles"));
      return;
    }

    setResourcePackBusy(true);
    setResourcePackError("");
    try {
      const payload = [];
      for (const file of supportedFiles) {
        if (typeof file?.arrayBuffer !== "function") continue;
        const buffer = await file.arrayBuffer();
        payload.push({
          name: file.name || "resourcepack.mcpack",
          buffer,
        });
      }

      if (payload.length === 0) {
        setResourcePackError(t("dragReadFailed"));
        return;
      }

      const result = await api.addResourcePacksBuffered(payload);
      await loadResourcePacks();

      const addedCount = Array.isArray(result?.added) ? result.added.length : 0;
      const errors = Array.isArray(result?.errors) ? result.errors : [];
      if (addedCount === 0 && errors.length === 0) {
        setResourcePackError(t("filesNotAdded"));
      }
      if (errors.length > 0) {
        setResourcePackError(errors[0]);
      }
    } catch (error) {
      setResourcePackError(error?.message || t("addPacksDragFailed"));
    } finally {
      setResourcePackBusy(false);
    }
  }, [loadResourcePacks, t]);

  const handlePickResourcePacks = async () => {
    if (!api?.pickResourcePacks) {
      setResourcePackError(t("pickerApiUnavailable"));
      return;
    }

    try {
      const filePaths = await api.pickResourcePacks();
      await addResourcePackPaths(filePaths);
    } catch (error) {
      setResourcePackError(error?.message || t("pickerOpenFailed"));
    }
  };

  const handleResourcePackRemove = async (packId) => {
    if (!api?.removeResourcePack) {
      setResourcePackError(t("removeApiUnavailable"));
      return;
    }

    try {
      setResourcePackBusy(true);
      setResourcePackError("");
      await api.removeResourcePack(packId);
      await loadResourcePacks();
    } catch (error) {
      setResourcePackError(error?.message || t("removeFailed"));
    } finally {
      setResourcePackBusy(false);
    }
  };

  const requestResourcePackRemove = (pack) => {
    if (!pack?.id) return;
    setResourcePackToDelete(pack);
  };

  const confirmResourcePackRemove = async () => {
    const packId = resourcePackToDelete?.id;
    setResourcePackToDelete(null);
    if (!packId) return;
    await handleResourcePackRemove(packId);
  };

  const handleResourcePackInstall = async (packId, packName) => {
    if (!api?.installResourcePack) {
      setResourcePackError(t("installPackApiUnavailable"));
      return;
    }

    try {
      setResourcePackInstalling(packId);
      setResourcePackError("");
      await api.installResourcePack(packId);
      appendLog(t("packInstalled", { name: packName || "RP" }), "success");
    } catch (error) {
      const text = error?.message || t("installPackFailed");
      setResourcePackError(text);
      appendLog(text, "error");
    } finally {
      setResourcePackInstalling(null);
    }
  };

  const extractDropPaths = (event) => {
    const isPackPath = (filePath) => {
      const normalized = String(filePath || "").toLowerCase();
      return normalized.endsWith(".mcpack") || normalized.endsWith(".zip");
    };

    const parseUriPath = (value) => {
      if (!value) return null;
      const cleaned = String(value).trim();
      if (!cleaned) return null;
      if (cleaned.startsWith("file:///")) {
        try {
          return decodeURIComponent(cleaned.replace(/^file:\/\/\//i, "").replace(/\//g, "\\"));
        } catch {
          return cleaned.replace(/^file:\/\/\//i, "").replace(/\//g, "\\");
        }
      }
      return cleaned;
    };

    const unique = (items) => Array.from(new Set(items.filter(Boolean)));

    const dataTransfer = event?.dataTransfer;
    const files = Array.from(dataTransfer?.files || []);
    const fromFiles = unique(files.map((file) => file?.path));
    if (fromFiles.length > 0) {
      return fromFiles.filter(isPackPath);
    }

    const items = Array.from(dataTransfer?.items || []);
    const fromItems = unique(items
      .map((item) => item?.getAsFile?.()?.path)
      .filter(Boolean));
    if (fromItems.length > 0) {
      return fromItems.filter(isPackPath);
    }

    const rawUriList = String(dataTransfer?.getData?.("text/uri-list") || "");
    const fromUriList = unique(rawUriList
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map(parseUriPath));
    if (fromUriList.length > 0) {
      return fromUriList.filter(isPackPath);
    }

    const rawPlainText = String(dataTransfer?.getData?.("text/plain") || "").trim();
    if (rawPlainText) {
      const parsed = parseUriPath(rawPlainText);
      return isPackPath(parsed) ? [parsed] : [];
    }

    return [];
  };

  const extractDroppedFiles = (event) => {
    return Array.from(event?.dataTransfer?.files || []);
  };

  const handlePlay = async () => {
    if (!api) {
      appendLog(t("apiUnavailable"), "error");
      return;
    }

    if (!selectedVersion || !isInstalled) return;

    try {
      setLogs([]);
      setProgress(0);
      setInstalling(selectedVersion);
      setIsPlaying(true);
      await api.playVersion(selectedVersion);
      setTimeout(() => setIsPlaying(false), 2000);
    } catch (error) {
      setIsPlaying(false);
      setInstalling(null);
      appendLog(error.message, "error");
    }
  };

  const removeVersion = async (id) => {
    if (!api) {
      appendLog(t("apiUnavailable"), "error");
      return;
    }

    try {
      const updated = await api.removeVersion(id);
      setInstalledVersions(updated || []);
      appendLog(t("versionRemoved", { id }), "info");
    } catch (error) {
      appendLog(error.message, "error");
    }
  };

  const handleWindowMinimize = useCallback(() => {
    api?.windowControls?.minimize?.();
  }, []);

  const handleWindowToggleMaximize = useCallback(async () => {
    if (!api?.windowControls?.maximizeToggle) return;
    await api.windowControls.maximizeToggle();
    setIsWindowMaximized((prev) => !prev);
  }, []);

  const handleWindowClose = useCallback(() => {
    api?.windowControls?.close?.();
  }, []);

  const mainActionLabel = isCurrentInstalling
    ? t("playActionDownloading", { progress })
    : isPlaying
      ? t("playActionLaunching")
      : isInstalled
        ? (isSelectedActiveClient ? t("playActionPlay") : t("playActionApplyAndLaunch"))
        : selectedVerObj?.downloadable
          ? t("playActionInstall")
          : t("playActionUnavailable");

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#080808] font-sans text-white selection:bg-emerald-500/30">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#05070d]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(16,185,129,0.14),transparent_38%),radial-gradient(circle_at_84%_14%,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_52%_100%,rgba(20,184,166,0.1),transparent_48%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:120px_120px] animate-[gridShift_32s_linear_infinite]" />
      </div>
      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden border border-white/[0.06] bg-[#0a0f17]/92">
          <div className="drag-region relative z-40 flex h-11 items-center border-b border-white/[0.05] bg-gradient-to-r from-[#0b111c]/95 via-[#0d121d]/95 to-[#0a1118]/95 pl-4 pr-2 backdrop-blur-xl animate-[slideDown_420ms_ease-out]">
            <div className="pointer-events-none flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)]">
                <Box size={11} className="text-white" />
              </div>
              <p className="text-[11px] font-black tracking-wide text-zinc-100">KonLauncher</p>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/12 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-300">Bedrock</span>
            </div>
            {headerCenterSlot ? (
              <div className="no-drag pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                {headerCenterSlot}
              </div>
            ) : null}

            <div className="no-drag ml-auto flex items-center gap-1">
              <button
                onClick={handleWindowMinimize}
                disabled={!hasDesktopWindowApi}
                className="flex h-8 w-10 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
                aria-label={t("windowMinimize")}
              >
                <Minus size={14} />
              </button>
              <button
                onClick={handleWindowToggleMaximize}
                disabled={!hasDesktopWindowApi}
                className="flex h-8 w-10 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
                aria-label={isWindowMaximized ? t("windowRestore") : t("windowMaximize")}
              >
                {isWindowMaximized ? <Copy size={13} /> : <Square size={12} />}
              </button>
              <button
                onClick={handleWindowClose}
                disabled={!hasDesktopWindowApi}
                className="flex h-8 w-10 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:opacity-40"
                aria-label={t("windowClose")}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="relative z-10 flex flex-1 overflow-hidden">
            <aside className="z-20 flex w-64 flex-col border-r border-white/10 bg-gradient-to-b from-[#0d111a]/94 via-[#0b1017]/94 to-[#0a0f15]/92 backdrop-blur-3xl animate-[slideInLeft_500ms_ease-out]">
              <div className="flex items-center gap-3 p-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-[0_0_22px_rgba(16,185,129,0.35)]">
                  <Box size={20} className="text-white" />
                </div>
                <h1 className="text-xl font-black tracking-tighter">KonLauncher</h1>
              </div>

              <nav className="flex-1 space-y-1.5 px-4">
                <SidebarNavItem
                  icon={<LayoutGrid size={18} />}
                  label={t("sidebarLibrary")}
                  active={activeTab === "versions"}
                  onClick={() => {
                    setActiveTab("versions");
                    setIsDrawerOpen(false);
                  }}
                />
                <SidebarNavItem
                  icon={<FileCode size={18} />}
                  label={t("sidebarResourcePacks")}
                  active={activeTab === "resourcepacks"}
                  onClick={() => {
                    setActiveTab("resourcepacks");
                    setIsDrawerOpen(false);
                  }}
                  indicator={Boolean(launcherResourcePack?.available)}
                />
                <SidebarNavItem
                  icon={<HardDrive size={18} />}
                  label={t("sidebarInstalled")}
                  active={isDrawerOpen}
                  onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                  indicator={installedVersions.length > 0}
                />
              </nav>

              <div className="p-5">
                <div ref={languageRef} className="relative">
                  <button
                    onClick={() => setLanguageMenuOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    <span className="flex items-center gap-2 text-sm font-bold text-zinc-200">
                      <Globe size={15} className="text-zinc-400" />
                      {t("sidebarLanguage")}
                    </span>
                    <span className="rounded-md bg-zinc-900/80 px-2 py-0.5 text-[10px] font-black text-zinc-300">{selectedLanguage.short}</span>
                  </button>

                  {languageMenuOpen && (
                    <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-[70] rounded-2xl border border-white/10 bg-[#101726]/95 p-2 shadow-2xl backdrop-blur">
                      {LANGUAGES.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setLanguage(item.id);
                            setLanguageMenuOpen(false);
                          }}
                          className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors last:mb-0 ${
                            language === item.id ? "bg-emerald-500/20 text-emerald-300" : "text-zinc-300 hover:bg-white/5"
                          }`}
                        >
                          <span>{item.label}</span>
                          <span className="text-[10px] text-zinc-500">{item.short}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2 px-1 text-[11px] font-semibold text-zinc-500">
                  <Info size={13} />
                  <span>{t("sidebarSwitcher")}</span>
                </div>
              </div>
            </aside>

            <div className="relative flex flex-1 flex-col bg-[#0b111b]/72">
              {activeTab === "versions" ? (
                <>
                  <div className="relative flex flex-1 flex-col justify-center overflow-hidden px-4 sm:px-8 lg:px-12 animate-tab">
                    <div className="absolute right-[-5%] top-[-10%] h-[70%] w-[50%] rounded-full bg-emerald-500/12 blur-[88px]" />
                    <div className="absolute bottom-[-5%] left-[10%] h-[50%] w-[30%] rounded-full bg-cyan-500/10 blur-[78px]" />

                    <div className="relative z-20">
                      <div className="mb-6 flex items-center gap-2">
                        <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1">
                          <ShieldCheck size={12} className="text-green-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-green-500">
                            {t("badgeSwitcher")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-zinc-700/50 bg-zinc-800 px-3 py-1 text-zinc-400">
                          <Zap size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">v{selectedDisplayId}</span>
                        </div>
                      </div>

                      <h1 className="mb-4 text-5xl font-black tracking-tighter text-white">
                        Minecraft <span className="text-green-500">Bedrock</span>
                      </h1>

                      <div className="mb-3 flex items-center gap-4 text-zinc-400">
                        <div className="flex items-center gap-2">
                          <Cpu size={16} className="text-zinc-600" />
                          <span className="text-sm font-medium">{t("heroClientLabel")}</span>
                        </div>
                        <div className="h-3 w-px bg-zinc-700" />
                        <div className="flex items-center gap-2">
                          <FileCode size={16} className="text-zinc-600" />
                          <span className="text-sm font-medium">{t("heroSwitchMethodLabel")}</span>
                        </div>
                      </div>

                      <p className="mb-2 text-xs text-zinc-500">
                        {t("selectedVersion")}: <span className="text-zinc-300">{selectedDisplayId}</span>
                        {" • "}
                        {t("source")}: <span className="text-zinc-300">{selectedVerObj?.source || t("sourceUnknown")}</span>
                      </p>
                      <p className="mb-2 text-xs">
                        {isInstalled ? (
                          <span className="font-semibold text-green-400">{t("statusInstalled")}</span>
                        ) : (
                          <span className="font-semibold text-zinc-500">{t("statusNotInstalled")}</span>
                        )}
                      </p>
                      <p className="mb-6 text-xs text-zinc-500">
                        {t("clientVersionLabel")}:{" "}
                        <span className="text-zinc-300">
                          {clientInfo?.installed ? `v${clientInfo.version}` : t("clientNotFound")}
                        </span>{" "}
                        • {t("versionsStoredAt")}{" "}
                        <span className="font-mono text-zinc-300">{storagePaths?.versionRoot || "launcher\\Version"}</span>.
                      </p>

                      {showConsole && (
                        <div className="mb-6 w-full max-w-2xl rounded-xl border border-white/5 bg-black/40 p-4 backdrop-blur-sm">
                          <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
                            <Terminal size={14} className="text-green-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t("consoleInstall")}</span>
                          </div>
                          <div className="custom-scrollbar h-52 overflow-y-auto space-y-1">
                            {logs.length === 0 && (
                              <div className="text-[11px] font-mono text-zinc-500">{t("waitingForActions")}</div>
                            )}
                            {logs.map((log, i) => (
                              <div key={`${log.time}-${i}`} className="flex gap-3 text-[11px] font-mono leading-relaxed">
                                <span className="shrink-0 text-zinc-600">[{log.time}]</span>
                                <span
                                  className={`${
                                    log.type === "success"
                                      ? "text-green-400"
                                      : log.type === "error"
                                        ? "text-red-400"
                                        : "text-zinc-300"
                                  }`}
                                >
                                  {log.type === "process" ? ">> " : ""}
                                  {hasMinecraftFormatting(log.text)
                                    ? renderMinecraftFormattedText(log.text)
                                    : log.text}
                                </span>
                              </div>
                            ))}
                            <div ref={logEndRef} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="z-30 flex min-h-32 flex-wrap items-center justify-between gap-4 border-t border-white/5 bg-zinc-950/80 px-4 py-4 sm:px-8 lg:px-10 backdrop-blur-xl">
                    <div className="relative w-full max-w-md" ref={dropdownRef}>
                      <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        {t("chooseClientVersion")}
                      </label>
                      <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="group flex w-full items-center justify-between rounded-2xl border border-white/5 bg-zinc-900/50 px-5 py-4 text-left transition-colors hover:bg-zinc-800"
                      >
                        <div className="truncate">
                          <div className="text-base font-bold text-white">{selectedVerObj?.name || t("chooseVersionPlaceholder")}</div>
                          <div className="text-[10px] uppercase tracking-wider text-zinc-500">{selectedDisplayId}</div>
                        </div>
                        <ChevronDown
                          size={20}
                          className={`text-zinc-500 transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {dropdownOpen && (
                        <div className="custom-scrollbar absolute bottom-full left-0 z-40 mb-4 max-h-[320px] w-full overflow-y-auto rounded-2xl border border-white/10 bg-zinc-800 p-2 shadow-2xl">
                          {versions.map((version) => {
                            const rowInstalled = installedIdSet.has(version.id);
                            const rowDisplayId = resolveVersionDisplayId(version);
                            return (
                              <button
                                key={version.id}
                                onClick={() => {
                                  setSelectedVersion(version.id);
                                  setDropdownOpen(false);
                                }}
                                className={`mb-1 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors last:mb-0 ${
                                  selectedVersion === version.id
                                    ? "border-green-500/20 bg-green-600/10"
                                    : "border-transparent hover:bg-zinc-700/50"
                                }`}
                              >
                                <div>
                                  <span className={`block text-sm font-bold ${selectedVersion === version.id ? "text-green-500" : "text-zinc-200"}`}>
                                    {version.name}
                                  </span>
                                  <span className={`text-[10px] font-bold uppercase ${rowInstalled ? "text-green-400" : "text-zinc-500"}`}>
                                    {rowDisplayId} • {rowInstalled ? t("statusInstalled") : t("statusNotInstalled")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {rowInstalled && <Check size={18} className="text-green-500" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={isInstalled ? handlePlay : handleInstall}
                      disabled={
                        Boolean(installing && !isCurrentInstalling) ||
                        (!isInstalled && !selectedVerObj?.downloadable)
                      }
                      className={`relative flex h-16 w-full sm:w-auto items-center justify-center gap-4 overflow-hidden rounded-2xl px-8 sm:px-12 text-lg font-black uppercase tracking-tighter shadow-2xl transition-all active:scale-95 ${
                        isInstalled
                          ? "bg-green-600 text-white shadow-green-900/40 hover:bg-green-500"
                          : isCurrentInstalling
                            ? "border border-white/5 bg-zinc-800 text-zinc-500"
                            : selectedVerObj?.downloadable
                              ? "bg-white text-black shadow-white/10 hover:bg-zinc-200"
                              : "cursor-not-allowed bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {isCurrentInstalling && (
                        <div className="absolute bottom-0 left-0 top-0 bg-green-500/30 transition-all duration-300" style={{ width: `${progress}%` }} />
                      )}

                      <span className="relative z-10 flex items-center gap-3">
                        {isCurrentInstalling ? (
                          mainActionLabel
                        ) : isInstalled ? (
                          <>
                            <Play size={24} fill="currentColor" /> {mainActionLabel}
                          </>
                        ) : (
                          <>
                            <Download size={24} /> {mainActionLabel}
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="relative flex flex-1 flex-col overflow-hidden px-4 py-6 sm:px-8 lg:px-10 animate-tab">
                  <div className="absolute right-[-5%] top-[-10%] h-[65%] w-[45%] rounded-full bg-emerald-500/10 blur-[90px]" />
                  <div className="absolute bottom-[-20%] left-[5%] h-[70%] w-[35%] rounded-full bg-cyan-500/10 blur-[90px]" />

                  <div className="custom-scrollbar relative z-20 flex-1 overflow-y-auto pr-1">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2">
                        <FileCode size={18} className="text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black tracking-tight text-white">{t("resourcePacksTitle")}</h2>
                        <p className="text-xs text-zinc-400">{t("resourcePacksSubtitle")}</p>
                      </div>
                    </div>

                    {!launcherResourcePack ? (
                      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 text-sm text-zinc-400">
                        {t("loadingResourcePacks")}
                      </div>
                    ) : (
                      <div className="w-full max-w-5xl space-y-6">
                        <div className="grid grid-cols-1 gap-5 rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.45)] md:grid-cols-[220px_1fr]">
                          <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/70 p-3">
                            {launcherResourcePack.iconDataUrl ? (
                              <img
                                src={launcherResourcePack.iconDataUrl}
                                alt={t("packIconAlt")}
                                className="h-[210px] w-[210px] rounded-2xl object-contain"
                              />
                            ) : (
                              <div className="flex h-[210px] w-[210px] items-center justify-center rounded-xl bg-zinc-800 text-zinc-500">
                                <Box size={44} />
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                                {launcherResourcePack.tag || t("launcherPackTag")}
                              </span>
                              {launcherResourcePack.version && (
                                <span className="rounded-full border border-zinc-700/60 bg-zinc-800/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                                  v{launcherResourcePack.version}
                                </span>
                              )}
                            </div>

                            <h3 className="mb-2 text-3xl font-black leading-tight text-white">
                              {renderMinecraftFormattedText(launcherResourcePack.name, { defaultColor: "#ffffff" })}
                            </h3>
                            <p className="mb-4 text-sm leading-relaxed text-zinc-200">
                              {renderMinecraftFormattedText(launcherResourcePack.description || t("descriptionMissing"), { defaultColor: "#d4d4d8" })}
                            </p>

                            <p className="mb-1 break-all text-xs text-zinc-500">
                              {t("fileLabel")}: <span className="font-mono text-zinc-300">{launcherResourcePack.sourcePath}</span>
                            </p>
                            <p className="mb-5 text-xs text-zinc-500">
                              {t("minEngineVersion")}: <span className="text-zinc-300">{launcherResourcePack.minEngineVersion || t("notSpecified")}</span>
                            </p>

                            <button
                              onClick={() => handleResourcePackInstall(launcherResourcePack.id, launcherResourcePack.name)}
                              disabled={!launcherResourcePack.available || resourcePackInstalling === launcherResourcePack.id}
                              className={`mt-auto flex h-14 items-center justify-center rounded-2xl px-8 text-sm font-black uppercase tracking-widest transition-all ${
                                !launcherResourcePack.available
                                  ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                                  : resourcePackInstalling === launcherResourcePack.id
                                    ? "bg-zinc-800 text-zinc-300"
                                    : "bg-emerald-500 text-black hover:bg-emerald-400"
                              }`}
                            >
                              {resourcePackInstalling === launcherResourcePack.id ? t("installing") : t("playActionInstall")}
                            </button>
                          </div>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-5">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <h3 className="text-lg font-black uppercase tracking-wider text-white">{t("myResourcePacks")}</h3>
                          </div>

                          <div
                            onClick={handlePickResourcePacks}
                            onDragEnter={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setResourceDropActive(true);
                            }}
                            onDragOver={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              if (event.dataTransfer) {
                                event.dataTransfer.dropEffect = "copy";
                              }
                              setResourceDropActive(true);
                            }}
                            onDragLeave={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              if (event.currentTarget.contains(event.relatedTarget)) return;
                              setResourceDropActive(false);
                            }}
                            onDrop={async (event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setResourceDropActive(false);
                              const droppedFiles = extractDroppedFiles(event);
                              const droppedPaths = extractDropPaths(event);

                              if (droppedPaths.length > 0) {
                                await addResourcePackPaths(droppedPaths);
                                return;
                              }

                              if (droppedFiles.length > 0) {
                                await addResourcePackBuffersFromFiles(droppedFiles);
                                return;
                              }

                              setResourcePackError(t("dropReadRetry"));
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handlePickResourcePacks();
                              }
                            }}
                            className={`mb-4 flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center transition-colors ${
                              resourceDropActive
                                ? "border-emerald-400 bg-emerald-500/10"
                                : "border-zinc-700 bg-zinc-900/70 hover:border-zinc-500"
                            }`}
                          >
                            <Upload size={22} className="mb-2 text-zinc-300" />
                            <span className="text-sm font-semibold text-zinc-200">{t("dropZoneTitle")}</span>
                            <span className="mt-1 text-xs text-zinc-500">{t("dropZoneHint")}</span>
                          </div>

                          {customResourcePacks.length === 0 ? (
                            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 text-sm text-zinc-400">
                              {t("myResourcePacksEmpty")}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                              {customResourcePacks.map((pack) => (
                                <div key={pack.id} className="relative rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
                                  <button
                                    onClick={() => requestResourcePackRemove(pack)}
                                    disabled={resourcePackBusy}
                                    className="absolute right-3 top-3 rounded-lg border border-red-500/30 bg-red-500/10 p-1.5 text-red-300 transition-colors hover:bg-red-500/20"
                                    title={t("deleteRpTooltip")}
                                  >
                                    <X size={14} />
                                  </button>

                                  <div className="flex gap-3">
                                    <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-zinc-800 p-1.5">
                                      {pack.iconDataUrl ? (
                                        <img src={pack.iconDataUrl} alt={t("packIconAlt")} className="h-full w-full rounded-xl object-contain" />
                                      ) : (
                                        <Box size={26} className="text-zinc-500" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="mb-2 flex flex-wrap items-center gap-2">
                                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                                          {pack.tag || t("myResourcePacks")}
                                        </span>
                                        {pack.version && (
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">v{pack.version}</span>
                                        )}
                                      </div>
                                      <div className="truncate text-lg font-black text-white">
                                        {renderMinecraftFormattedText(pack.name, { defaultColor: "#ffffff" })}
                                      </div>
                                      <div className="line-clamp-2 text-xs text-zinc-400">
                                        {renderMinecraftFormattedText(pack.description || t("descriptionMissing"), { defaultColor: "#a1a1aa" })}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-3 flex gap-2">
                                    <button
                                      onClick={() => handleResourcePackInstall(pack.id, pack.name)}
                                      disabled={!pack.available || resourcePackInstalling === pack.id}
                                      className={`flex-1 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-colors ${
                                        !pack.available
                                          ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                                          : resourcePackInstalling === pack.id
                                            ? "bg-zinc-800 text-zinc-300"
                                            : "bg-emerald-500 text-black hover:bg-emerald-400"
                                      }`}
                                    >
                                      {resourcePackInstalling === pack.id ? t("installing") : t("playActionInstall")}
                                    </button>
                                    <button
                                      onClick={() => requestResourcePackRemove(pack)}
                                      disabled={resourcePackBusy}
                                      className="rounded-xl bg-red-600/10 px-3 text-red-300 transition-colors hover:bg-red-600/20"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {resourcePackError && (
                            <div className="mt-4 space-y-2">
                              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                                {resourcePackError}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div
                className={`absolute bottom-0 right-0 top-0 z-50 flex w-full max-w-[360px] flex-col border-l border-white/10 bg-zinc-950/95 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                  isDrawerOpen ? "translate-x-0" : "translate-x-full"
                }`}
              >
                <div className="flex items-center justify-between border-b border-white/5 bg-white/5 p-8">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-green-600/20 p-2.5">
                      <HardDrive className="text-green-500" size={24} />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-white">{t("drawerInstalledTitle")}</h2>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-zinc-500 transition-colors hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
                  {installedVersions.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center space-y-4 text-zinc-600 opacity-50">
                      <AlertCircle size={48} />
                      <p className="text-center text-sm font-bold uppercase tracking-widest">{t("noInstalledVersions")}</p>
                    </div>
                  ) : (
                    installedVersions.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-5 transition-all ${
                          selectedVersion === item.id ? "border-green-500/50" : "border-white/5 hover:border-white/10"
                        } bg-white/5`}
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-base font-black text-zinc-100">{item.name}</span>
                            <span className="text-[10px] font-bold uppercase text-green-400">{formatBytes(item.sizeBytes)} • {t("statusInstalled")}</span>
                          </div>
                          <div
                            className={`h-3 w-3 rounded-full ${
                              selectedVersion === item.id ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-zinc-700"
                            }`}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedVersion(item.id);
                              setIsDrawerOpen(false);
                            }}
                            className={`flex-1 rounded-xl py-2.5 text-xs font-bold uppercase transition-all ${
                              selectedVersion === item.id
                                ? "bg-green-600 text-white"
                                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                            }`}
                          >
                            {t("select")}
                          </button>
                          <button
                            onClick={() => removeVersion(item.id)}
                            className="rounded-xl bg-red-600/10 p-2.5 text-red-500 transition-all hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {resourcePackToDelete && (
                <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/55 px-4">
                  <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black uppercase tracking-wider text-white">{t("confirmTitle")}</p>
                        <p className="mt-1 text-xs text-zinc-400">{t("confirmDeleteRp")}</p>
                      </div>
                      <button
                        onClick={() => setResourcePackToDelete(null)}
                        className="rounded-lg border border-white/10 p-1.5 text-zinc-400 transition-colors hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="mb-4 rounded-xl border border-white/10 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200">
                      {renderMinecraftFormattedText(resourcePackToDelete.name || "RP", { defaultColor: "#e4e4e7" })}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setResourcePackToDelete(null)}
                        className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-300 transition-colors hover:bg-zinc-800"
                      >
                        {t("cancel")}
                      </button>
                      <button
                        onClick={confirmResourcePackRemove}
                        className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-red-500"
                      >
                        {t("delete")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}

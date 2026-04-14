import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Plus,
  Play,
  Settings,
  Library,
  Download,
  X,
  Check,
  Cpu,
  ChevronDown,
  Trash2,
  Search,
  Loader2,
  ArrowDownToLine,
  Box,
  Calendar,
  Component as ComponentIcon,
  Sliders,
  HardDrive,
  Clock,
  Heart,
  History,
  GripVertical,
  MoreVertical,
  RefreshCw,
  Minus,
  Square,
  Copy,
  ImagePlus,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ImageOff,
  AlertCircle,
  Shirt,
  PencilLine,
  Zap,
  Palette,
  Pipette,
  Blend,
  Sparkles
} from 'lucide-react';
import LOADER_ICON_SVG_BY_ID from './loaderIcons.json';
import MOD_CATEGORY_ICON_SVG_BY_ID from './modCategoryIcons.json';
import CONTENT_TAG_ICON_SVG_BY_ID from './contentTagIcons.json';
import SkinPreview3D from './components/SkinPreview3D';
import SkinCardPreview3D from './components/SkinCardPreview3D';
import SafeRenderBoundary from './components/SafeRenderBoundary';

const LOADERS = [
  { id: 'vanilla', name: 'Vanilla', icon: '\u{1F366}' },
  { id: 'fabric', name: 'Fabric', icon: '\u{1F9F6}' },
  { id: 'forge', name: 'Forge', icon: '\u2692\uFE0F' },
  { id: 'quilt', name: 'Quilt', icon: '\u{1F308}' },
  { id: 'neoforge', name: 'NeoForge', icon: '\u{1F525}' }
];

const LANGUAGES = [
  { id: 'en', name: 'English', flag: 'us', gameLang: 'en_us' },
  { id: 'ru', name: 'Русский', flag: 'ru', gameLang: 'ru_ru' }
];

const VISUAL_THEME_PRESETS = [
  {
    id: 'default',
    kind: 'default',
    labels: { en: 'Default', ru: 'По умолчанию' },
    preview: 'linear-gradient(135deg, #1e293b 0%, #0b1220 100%)',
    overlay: 'radial-gradient(circle at 12% 14%, rgba(52,211,153,0.16), rgba(0,0,0,0) 38%), radial-gradient(circle at 87% 12%, rgba(59,130,246,0.13), rgba(0,0,0,0) 36%), radial-gradient(circle at 52% 102%, rgba(16,185,129,0.08), rgba(0,0,0,0) 46%)',
    pointerRgb: '74,222,128'
  },
  {
    id: 'emerald',
    kind: 'solid',
    labels: { en: 'Emerald', ru: 'Изумруд' },
    preview: 'linear-gradient(135deg, #34d399 0%, #065f46 100%)',
    overlay: 'radial-gradient(circle at 12% 14%, rgba(52,211,153,0.20), rgba(0,0,0,0) 40%), radial-gradient(circle at 84% 16%, rgba(16,185,129,0.13), rgba(0,0,0,0) 40%), radial-gradient(circle at 52% 100%, rgba(16,185,129,0.09), rgba(0,0,0,0) 47%)',
    pointerRgb: '52,211,153'
  },
  {
    id: 'sapphire',
    kind: 'solid',
    labels: { en: 'Sapphire', ru: 'Сапфир' },
    preview: 'linear-gradient(135deg, #60a5fa 0%, #1e3a8a 100%)',
    overlay: 'radial-gradient(circle at 12% 14%, rgba(96,165,250,0.22), rgba(0,0,0,0) 42%), radial-gradient(circle at 84% 16%, rgba(59,130,246,0.15), rgba(0,0,0,0) 42%), radial-gradient(circle at 52% 100%, rgba(37,99,235,0.09), rgba(0,0,0,0) 48%)',
    pointerRgb: '96,165,250'
  },
  {
    id: 'amber',
    kind: 'solid',
    labels: { en: 'Amber', ru: 'Янтарь' },
    preview: 'linear-gradient(135deg, #fbbf24 0%, #92400e 100%)',
    overlay: 'radial-gradient(circle at 12% 14%, rgba(251,191,36,0.20), rgba(0,0,0,0) 42%), radial-gradient(circle at 84% 16%, rgba(245,158,11,0.14), rgba(0,0,0,0) 42%), radial-gradient(circle at 52% 100%, rgba(217,119,6,0.10), rgba(0,0,0,0) 48%)',
    pointerRgb: '251,191,36'
  },
  {
    id: 'rose',
    kind: 'solid',
    labels: { en: 'Rose', ru: 'Роза' },
    preview: 'linear-gradient(135deg, #fb7185 0%, #9f1239 100%)',
    overlay: 'radial-gradient(circle at 12% 14%, rgba(251,113,133,0.20), rgba(0,0,0,0) 42%), radial-gradient(circle at 84% 16%, rgba(244,63,94,0.14), rgba(0,0,0,0) 42%), radial-gradient(circle at 52% 100%, rgba(190,24,93,0.10), rgba(0,0,0,0) 48%)',
    pointerRgb: '251,113,133'
  },
  {
    id: 'violet',
    kind: 'solid',
    labels: { en: 'Violet', ru: 'Фиолет' },
    preview: 'linear-gradient(135deg, #a78bfa 0%, #5b21b6 100%)',
    overlay: 'radial-gradient(circle at 12% 14%, rgba(167,139,250,0.20), rgba(0,0,0,0) 42%), radial-gradient(circle at 84% 16%, rgba(139,92,246,0.15), rgba(0,0,0,0) 42%), radial-gradient(circle at 52% 100%, rgba(109,40,217,0.10), rgba(0,0,0,0) 48%)',
    pointerRgb: '167,139,250'
  },
  {
    id: 'aurora',
    kind: 'gradient',
    labels: { en: 'Aurora', ru: 'Аврора' },
    preview: 'linear-gradient(130deg, #0ea5e9 0%, #14b8a6 45%, #22c55e 100%)',
    overlay: 'radial-gradient(circle at 14% 16%, rgba(14,165,233,0.20), rgba(0,0,0,0) 42%), radial-gradient(circle at 82% 12%, rgba(20,184,166,0.16), rgba(0,0,0,0) 40%), radial-gradient(circle at 52% 100%, rgba(34,197,94,0.10), rgba(0,0,0,0) 48%)',
    pointerRgb: '45,212,191'
  },
  {
    id: 'sunset',
    kind: 'gradient',
    labels: { en: 'Sunset', ru: 'Закат' },
    preview: 'linear-gradient(130deg, #f97316 0%, #fb7185 52%, #facc15 100%)',
    overlay: 'radial-gradient(circle at 14% 16%, rgba(249,115,22,0.20), rgba(0,0,0,0) 42%), radial-gradient(circle at 82% 12%, rgba(251,113,133,0.16), rgba(0,0,0,0) 40%), radial-gradient(circle at 52% 100%, rgba(250,204,21,0.10), rgba(0,0,0,0) 48%)',
    pointerRgb: '251,113,133'
  },
  {
    id: 'ocean',
    kind: 'gradient',
    labels: { en: 'Ocean', ru: 'Океан' },
    preview: 'linear-gradient(130deg, #0f172a 0%, #1d4ed8 48%, #38bdf8 100%)',
    overlay: 'radial-gradient(circle at 14% 16%, rgba(30,64,175,0.20), rgba(0,0,0,0) 42%), radial-gradient(circle at 82% 12%, rgba(59,130,246,0.17), rgba(0,0,0,0) 40%), radial-gradient(circle at 52% 100%, rgba(56,189,248,0.11), rgba(0,0,0,0) 48%)',
    pointerRgb: '56,189,248'
  },
  {
    id: 'lava',
    kind: 'gradient',
    labels: { en: 'Lava', ru: 'Лава' },
    preview: 'linear-gradient(130deg, #7f1d1d 0%, #ea580c 45%, #facc15 100%)',
    overlay: 'radial-gradient(circle at 14% 16%, rgba(185,28,28,0.20), rgba(0,0,0,0) 42%), radial-gradient(circle at 82% 12%, rgba(234,88,12,0.16), rgba(0,0,0,0) 40%), radial-gradient(circle at 52% 100%, rgba(250,204,21,0.10), rgba(0,0,0,0) 48%)',
    pointerRgb: '234,88,12'
  },
  {
    id: 'neon',
    kind: 'gradient',
    labels: { en: 'Neon', ru: 'Неон' },
    preview: 'linear-gradient(130deg, #22d3ee 0%, #a78bfa 48%, #f43f5e 100%)',
    overlay: 'radial-gradient(circle at 14% 16%, rgba(34,211,238,0.20), rgba(0,0,0,0) 42%), radial-gradient(circle at 82% 12%, rgba(167,139,250,0.17), rgba(0,0,0,0) 40%), radial-gradient(circle at 52% 100%, rgba(244,63,94,0.11), rgba(0,0,0,0) 48%)',
    pointerRgb: '34,211,238'
  }
];

const CUSTOM_VISUAL_THEME_ID = 'custom';
const DEFAULT_CUSTOM_VISUAL_THEME = {
  mode: 'solid',
  solidColor: '#22c55e',
  gradientFrom: '#0ea5e9',
  gradientTo: '#22c55e'
};
const CUSTOM_VISUAL_THEME_MODES = new Set(['solid', 'gradient']);
const ALLOWED_VISUAL_THEME_IDS = new Set([...VISUAL_THEME_PRESETS.map((theme) => theme.id), CUSTOM_VISUAL_THEME_ID]);
const DEFAULT_VISUAL_THEME_ID = VISUAL_THEME_PRESETS[0].id;
const BACKGROUND_FX_OPTIONS = ['stars', 'rain', 'snow'];

const createSeededRandom = (seed = 1) => {
  let state = Math.max(1, Math.floor(seed));
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

const buildStarParticles = (count = 70) => {
  const rand = createSeededRandom(1337);
  return Array.from({ length: count }, (_, index) => ({
    id: `star-${index}`,
    left: `${(rand() * 100).toFixed(3)}%`,
    top: `${(rand() * 100).toFixed(3)}%`,
    size: `${(1 + rand() * 2.6).toFixed(2)}px`,
    opacity: (0.25 + rand() * 0.65).toFixed(3),
    durationSec: (2.2 + rand() * 4.8).toFixed(2),
    delaySec: (rand() * 6.2).toFixed(2)
  }));
};

const buildRainDrops = (count = 85) => {
  const rand = createSeededRandom(2871);
  return Array.from({ length: count }, (_, index) => ({
    id: `rain-${index}`,
    left: `${(rand() * 100).toFixed(3)}%`,
    length: `${(12 + rand() * 20).toFixed(2)}px`,
    opacity: (0.22 + rand() * 0.35).toFixed(3),
    durationSec: (0.6 + rand() * 0.55).toFixed(2),
    delaySec: (rand() * 1.1).toFixed(2)
  }));
};

const buildSnowFlakes = (count = 70) => {
  const rand = createSeededRandom(9241);
  return Array.from({ length: count }, (_, index) => ({
    id: `snow-${index}`,
    left: `${(rand() * 100).toFixed(3)}%`,
    size: `${(2 + rand() * 4.2).toFixed(2)}px`,
    opacity: (0.35 + rand() * 0.45).toFixed(3),
    driftPx: `${(rand() * 42 - 21).toFixed(2)}px`,
    durationSec: (5 + rand() * 6.5).toFixed(2),
    delaySec: (-rand() * 14).toFixed(2)
  }));
};

const buildSnowDustParticles = (count = 56) => {
  const rand = createSeededRandom(11023);
  return Array.from({ length: count }, (_, index) => ({
    id: `snow-dust-${index}`,
    left: `${(rand() * 100).toFixed(3)}%`,
    size: `${(0.9 + rand() * 1.9).toFixed(2)}px`,
    opacity: (0.22 + rand() * 0.32).toFixed(3),
    driftPx: `${(rand() * 24 - 12).toFixed(2)}px`,
    durationSec: (8.5 + rand() * 8.5).toFixed(2),
    delaySec: (-rand() * 16).toFixed(2)
  }));
};

const randomBetween = (min, max) => min + Math.random() * (max - min);

const parseRgbTriplet = (rawValue, fallback = [56, 189, 248]) => {
  if (typeof rawValue !== 'string') return fallback;
  const channels = rawValue
    .split(',')
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((value) => Number.isFinite(value))
    .slice(0, 3);
  if (channels.length < 3) return fallback;
  return channels.map((value) => Math.max(0, Math.min(255, value)));
};

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

const clampColorByte = (value) => Math.max(0, Math.min(255, Math.round(Number(value) || 0)));

const normalizeHexColor = (value, fallback = '#22c55e') => {
  const normalized = String(value || '').trim().toLowerCase();
  return HEX_COLOR_RE.test(normalized) ? normalized : fallback;
};

const parseHexColor = (value, fallback = [34, 197, 94]) => {
  const normalized = normalizeHexColor(value, '');
  if (!normalized) return fallback.slice(0, 3);
  return [
    Number.parseInt(normalized.slice(1, 3), 16),
    Number.parseInt(normalized.slice(3, 5), 16),
    Number.parseInt(normalized.slice(5, 7), 16)
  ];
};

const mixRgb = (from, to, ratio = 0.5) => {
  const clampedRatio = Math.max(0, Math.min(1, Number(ratio) || 0));
  return [
    clampColorByte(from[0] + (to[0] - from[0]) * clampedRatio),
    clampColorByte(from[1] + (to[1] - from[1]) * clampedRatio),
    clampColorByte(from[2] + (to[2] - from[2]) * clampedRatio)
  ];
};

const rgbTripletToString = (rgb) => `${clampColorByte(rgb[0])},${clampColorByte(rgb[1])},${clampColorByte(rgb[2])}`;

const rgbaFromRgb = (rgb, alpha = 0.2) => {
  const clampedAlpha = Math.max(0, Math.min(1, Number(alpha) || 0));
  return `rgba(${rgbTripletToString(rgb)},${clampedAlpha.toFixed(3)})`;
};

const clampUnit = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const rgbToHex = (rgb) =>
  `#${rgb
    .slice(0, 3)
    .map((value) => clampColorByte(value).toString(16).padStart(2, '0'))
    .join('')}`;

const rgbToHsv = (rawRgb) => {
  const red = clampColorByte(rawRgb[0]) / 255;
  const green = clampColorByte(rawRgb[1]) / 255;
  const blue = clampColorByte(rawRgb[2]) / 255;
  const maxChannel = Math.max(red, green, blue);
  const minChannel = Math.min(red, green, blue);
  const delta = maxChannel - minChannel;

  let hue = 0;
  if (delta !== 0) {
    if (maxChannel === red) hue = ((green - blue) / delta) % 6;
    else if (maxChannel === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  const saturation = maxChannel === 0 ? 0 : delta / maxChannel;
  return { h: hue, s: saturation, v: maxChannel };
};

const hsvToRgb = (hueRaw, saturationRaw, valueRaw) => {
  const hue = ((Number(hueRaw) % 360) + 360) % 360;
  const saturation = clampUnit(saturationRaw);
  const value = clampUnit(valueRaw);
  const chroma = value * saturation;
  const segment = hue / 60;
  const second = chroma * (1 - Math.abs((segment % 2) - 1));

  let red = 0;
  let green = 0;
  let blue = 0;
  if (segment >= 0 && segment < 1) {
    red = chroma;
    green = second;
  } else if (segment < 2) {
    red = second;
    green = chroma;
  } else if (segment < 3) {
    green = chroma;
    blue = second;
  } else if (segment < 4) {
    green = second;
    blue = chroma;
  } else if (segment < 5) {
    red = second;
    blue = chroma;
  } else {
    red = chroma;
    blue = second;
  }

  const offset = value - chroma;
  return [
    clampColorByte((red + offset) * 255),
    clampColorByte((green + offset) * 255),
    clampColorByte((blue + offset) * 255)
  ];
};

const hexToHsv = (hexColor, fallback = { h: 195, s: 0.86, v: 0.88 }) => {
  const normalized = normalizeHexColor(hexColor, '');
  if (!normalized) return { ...fallback };
  return rgbToHsv(parseHexColor(normalized, [35, 173, 230]));
};

const normalizeCustomVisualTheme = (rawTheme) => {
  const source = rawTheme && typeof rawTheme === 'object' ? rawTheme : {};
  const modeRaw = String(source.mode || '').trim().toLowerCase();
  const mode = CUSTOM_VISUAL_THEME_MODES.has(modeRaw) ? modeRaw : DEFAULT_CUSTOM_VISUAL_THEME.mode;

  return {
    mode,
    solidColor: normalizeHexColor(source.solidColor, DEFAULT_CUSTOM_VISUAL_THEME.solidColor),
    gradientFrom: normalizeHexColor(source.gradientFrom, DEFAULT_CUSTOM_VISUAL_THEME.gradientFrom),
    gradientTo: normalizeHexColor(source.gradientTo, DEFAULT_CUSTOM_VISUAL_THEME.gradientTo)
  };
};

const buildCustomVisualThemePreset = (rawTheme) => {
  const theme = normalizeCustomVisualTheme(rawTheme);
  const primaryRgb = parseHexColor(theme.mode === 'gradient' ? theme.gradientFrom : theme.solidColor, [34, 197, 94]);
  const secondaryRgb =
    theme.mode === 'gradient' ? parseHexColor(theme.gradientTo, [14, 165, 233]) : mixRgb(primaryRgb, [5, 11, 20], 0.62);
  const tertiaryRgb = mixRgb(primaryRgb, secondaryRgb, 0.5);
  const solidDarkRgb = mixRgb(primaryRgb, [0, 0, 0], 0.58);
  const preview =
    theme.mode === 'gradient'
      ? `linear-gradient(130deg, ${theme.gradientFrom} 0%, ${theme.gradientTo} 100%)`
      : `linear-gradient(135deg, ${theme.solidColor} 0%, rgb(${solidDarkRgb.join(',')}) 100%)`;

  return {
    id: CUSTOM_VISUAL_THEME_ID,
    kind: 'custom',
    labels: { en: 'Custom', ru: 'Своя' },
    preview,
    overlay: `radial-gradient(circle at 14% 16%, ${rgbaFromRgb(primaryRgb, 0.22)}, rgba(0,0,0,0) 42%), radial-gradient(circle at 82% 12%, ${rgbaFromRgb(
      secondaryRgb,
      0.17
    )}, rgba(0,0,0,0) 40%), radial-gradient(circle at 52% 100%, ${rgbaFromRgb(tertiaryRgb, 0.11)}, rgba(0,0,0,0) 48%)`,
    pointerRgb: rgbTripletToString(mixRgb(primaryRgb, secondaryRgb, 0.5))
  };
};

const createCometParticle = () => {
  const direction = Math.floor(randomBetween(0, 4));
  const horizontalMagnitude = randomBetween(34, 64);
  const verticalMagnitude = randomBetween(22, 48);

  let startX = 0;
  let startY = 0;
  let dx = horizontalMagnitude;
  let dy = verticalMagnitude;

  if (direction === 0) {
    startX = randomBetween(-26, -8);
    startY = randomBetween(-18, 24);
    dx = horizontalMagnitude;
    dy = verticalMagnitude;
  } else if (direction === 1) {
    startX = randomBetween(104, 126);
    startY = randomBetween(-18, 24);
    dx = -horizontalMagnitude;
    dy = verticalMagnitude;
  } else if (direction === 2) {
    startX = randomBetween(-24, -6);
    startY = randomBetween(72, 108);
    dx = horizontalMagnitude;
    dy = -verticalMagnitude;
  } else {
    startX = randomBetween(104, 126);
    startY = randomBetween(72, 108);
    dx = -horizontalMagnitude;
    dy = -verticalMagnitude;
  }

  const tailLengthPx = randomBetween(90, 210);
  const thicknessPx = randomBetween(1.1, 3.2);
  const opacity = randomBetween(0.48, 0.86);
  const durationMs = randomBetween(1300, 2900);
  const headSizePx = Math.max(3, thicknessPx * randomBetween(2.4, 3.6));
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    startX,
    startY,
    dx,
    dy,
    tailLengthPx,
    thicknessPx,
    headSizePx,
    opacity,
    angleDeg,
    durationMs
  };
};

const UI_STRINGS = {
  en: {
    navLibrary: 'Library',
    navBrowseMods: 'Browse Mods',
    navSettings: 'Settings',
    navSkins: 'Skins',
    statusOffline: 'Offline',
    searchMods: 'Search mods...',
    searchResourcePacks: 'Search resource packs...',
    searchShaders: 'Search shaders...',
    yourLibrary: 'Your library',
    createInstance: 'Create instance',
    noInstancesYet: 'No instances yet',
    noInstancesHint: 'Create an instance and click Install to download Minecraft files.',
    noInstallPath: 'No install path assigned',
    addModsToInstance: 'Adding mods to {name}',
    addContentToInstance: 'Adding {type} to {name}',
    contentMods: 'Mods',
    contentResourcePacks: 'Resource Packs',
    contentShaders: 'Shaders',
    authorLabel: 'Author',
    filterLoader: 'Loader',
    filterResolution: 'Resolution',
    filterCategory: 'Category',
    filterFeatures: 'Features',
    filterRequirements: 'Requirements',
    clearFilters: 'Clear filters',
    browseType: 'Type',
    allVersions: 'All versions',
    allLoaders: 'All loaders',
    foundMods: 'Found: {count}',
    pageOf: 'Page {page} of {pages}',
    settingsRam: 'RAM',
    allocatedMemory: 'Allocated memory',
    globalRamHint: 'Global value applies to all instances.',
    offlineProfile: 'Offline profile',
    offlineProfileHint: 'The same nickname will be used in offline mode in-game.',
    nicknameManagerTitle: 'Nicknames',
    nicknameAdd: 'Add',
    nicknamePlaceholder: 'Enter nickname...',
    nicknameDelete: 'Delete nickname',
    nicknameEmpty: 'Nickname cannot be empty.',
    nicknameAlreadyExists: 'This nickname already exists.',
    launcherLanguage: 'Launcher language',
    launcherLanguageHint: 'New installations will use this game language automatically.',
    createInstanceTitle: 'Create instance',
    instanceNamePlaceholder: 'Instance name...',
    version: 'Version',
    loader: 'Loader',
    loadingVersions: 'Loading versions...',
    installPathPreview: 'Install path: %APPDATA%\\KonLauncher\\profiles\\{name}',
    installPathNamePlaceholder: '<instance-name>',
    create: 'Create',
    importFromLauncher: 'Import from another launcher',
    importSourceNotSelected: 'No import source selected',
    importSourceSelected: 'Source: {launcher}',
    importLauncherChooseTitle: 'Choose launcher',
    importLauncherChooseHint: 'One-click transfer of mods, resource packs, shaders, config and worlds.',
    importLauncherOfficial: 'Official Launcher',
    importLauncherTLauncher: 'TLauncher',
    importLauncherModrinth: 'Modrinth Launcher',
    importLauncherPrism: 'Prism Launcher',
    importLauncherMultiMC: 'MultiMC',
    importInstallMessage: 'Installing with import from {launcher}',
    importInProgressMessage: 'Importing settings and content from {launcher}',
    importDoneMessage: 'Imported from {launcher}: mods {mods}, resource packs {resourcepacks}, shaders {shaders}, worlds {worlds}.',
    importFailedMessage: 'Failed to import data from {launcher}.',
    cancel: 'Cancel',
    installedMods: 'Installed mods: {count}',
    installedContent: 'Installed {type}: {count}',
    clear: 'Clear',
    delete: 'Delete',
    refresh: 'Refresh',
    folder: 'Folder',
    updateAll: 'Update all',
    installContent: 'Install content',
    columnName: 'Name',
    columnActions: 'Actions',
    noModsInstalled: 'No mods installed',
    noContentInstalled: 'No {type} installed',
    byAuthor: 'by {author}',
    openFolder: 'Open folder',
    updateMod: 'Update mod',
    more: 'More',
    instanceSettings: 'Instance settings',
    instanceName: 'Instance name',
    renameFolderHint: 'Folder name under `%APPDATA%\\KonLauncher\\profiles` will be renamed too.',
    instanceAvatar: 'Instance avatar',
    pickImage: 'Pick image (100x100 to 1000x1000)',
    resetAvatar: 'Reset avatar',
    save: 'Save',
    operationFailed: 'Operation failed',
    code: 'Code',
    details: 'Details',
    installSuggestedMods: 'Install mod(s)',
    installingSuggestedMods: 'Installing mod(s)...',
    checkingSuggestedMods: 'Checking compatible mods...',
    failedInstallSuggestedMods: 'Failed to install some suggested mods.',
    failedFindSuggestedMods: 'Failed to find compatible mods on Modrinth.',
    errorModIncompatible: '{mod} is incompatible with {loader} {version}. Use Minecraft {targetVersion} for this mod or disable it.',
    errorMissingDependencies: 'Missing required mods: {mods}.',
    errorMinecraftCrashed: 'Minecraft crashed: {reason}',
    errorMinecraftExited: 'Minecraft closed right after launch.',
    close: 'Close',
    nameEmpty: 'Name cannot be empty.',
    failedRenameProfile: 'Failed to rename profile folder.',
    failedPickAvatar: 'Failed to pick avatar image.',
    installFirstForMods: 'Install this instance first, then you can add mods.',
    failedInstallMod: 'Failed to install mod.',
    failedInstallContent: 'Failed to install content.',
    failedToggleMod: 'Failed to toggle mod.',
    failedDeleteMod: 'Failed to delete mod.',
    failedDeleteContent: 'Failed to delete content.',
    failedUpdateMod: 'Failed to update mod {name}',
    failedUpdateContent: 'Failed to update content {name}',
    failedCheckUpdates: 'Failed to check updates.',
    creatorUnknown: 'Unknown',
    folderPathMissing: 'Instance folder is not set yet.',
    openFolderApiMissing: 'Open folder API is not available.',
    failedOpenFolder: 'Failed to open folder',
    primaryInstall: 'INSTALL',
    primaryInstalling: 'INSTALL {percent}%',
    primaryRunning: 'RUNNING',
    primaryStop: 'STOP',
    primaryPlay: 'PLAY',
    primaryRetryInstall: 'RETRY INSTALL',
    deleteInstanceConfirm: 'Delete instance "{name}" and remove its profile folder from disk?',
    confirmDeleteTitle: 'Delete instance',
    failedDeleteProfile: 'Failed to delete profile folder.',
    loaderNotCompatible: '{loader} is not compatible with {version}',
    javaRequiredPrompt: 'Java {major}+ is required for this Minecraft version. Open Java download page now?',
    preparing: 'Preparing',
    startingInstallation: 'Starting installation',
    stageError: 'Error',
    installFailed: 'Installation failed',
    failedInstallMinecraft: 'Failed to install Minecraft',
    failedLaunchMinecraft: 'Failed to launch Minecraft',
    failedStopMinecraft: 'Failed to close Minecraft',
    unavailableSuffix: 'Unavailable',
    windowMinimize: 'Minimize window',
    windowRestore: 'Restore window',
    windowMaximize: 'Maximize window',
    windowClose: 'Close window',
    instanceLabel: 'Instance',
    installing: 'Installing',
    preparingFiles: 'Preparing files',
    skinsTitle: 'Skins',
    skinsSaved: 'Saved skins',
    skinsAdd: 'Add a skin',
    skinsOpenFolder: 'Open skins folder',
    skinsDragRotate: 'Drag to rotate',
    skinsChangeCape: 'Change cape',
    skinsNoActive: 'No active skin selected',
    skinsSelectTexture: 'Select skin texture file',
    skinsSelectTextureHint: 'Drag and drop PNG or click to browse',
    skinsUploadTexture: 'Upload skin texture',
    skinsAdding: 'Adding a skin',
    skinsTexture: 'Texture',
    skinsReplaceTexture: 'Replace texture',
    skinsArmStyle: 'Arm style',
    skinsWide: 'Classic - wide',
    skinsSlim: 'Slim - thin',
    skinsCape: 'Cape',
    skinsOfficialCape: 'Original game cape',
    skinsOfficialCapeMissing: 'No official cape for this nickname',
    skinsNoCape: 'No cape',
    skinsAddAction: 'Add skin',
    skinsSaveAction: 'Save skin',
    skinsCancelAction: 'Cancel',
    skinsEditAction: 'Edit',
    skinsDeleteAction: 'Delete',
    skinsSetActive: 'Set active',
    skinsNeedTexture: 'Select a skin texture first.',
    skinsFailedLoad: 'Failed to load skins.',
    skinsFailedSave: 'Failed to save skin.',
    skinsFailedUpdate: 'Failed to update skin.',
    skinsFailedDelete: 'Failed to delete skin.',
    skinsFailedSetActive: 'Failed to set active skin.',
    skinsNamePlaceholder: 'Skin name',
    settingsVisualEffects: 'Visual effects',
    cursorGlowTitle: 'Cursor glow in background',
    cursorGlowHint: 'Soft light follows cursor movement. Disable if it feels heavy.',
    cursorGlowEnabled: 'Enabled',
    cursorGlowDisabled: 'Disabled',
    cursorDistortionTitle: 'Neon cursor trail',
    cursorDistortionHint: 'Animated neon stripe follows cursor and adapts to selected launcher theme.',
    cursorDistortionEnabled: 'Enabled',
    cursorDistortionDisabled: 'Disabled',
    themeEditorTitle: 'Theme editor',
    themeEditorHint: 'Choose launcher look: presets or build your own color/gradient theme.',
    backgroundFxTitle: 'Background atmosphere',
    backgroundFxHint: 'Choose a subtle animated effect for launcher background.',
    backgroundFxStars: 'Stars',
    backgroundFxRain: 'Rain',
    backgroundFxSnow: 'Snow',
    themeSectionSolid: 'Solid colors',
    themeSectionGradient: 'Gradients',
    themeSectionCustom: 'Custom',
    customThemeHint: 'Pick your own color style and apply it as launcher theme.',
    customThemeSolid: 'Solid',
    customThemeGradient: 'Gradient',
    customThemePrimaryColor: 'Primary color',
    customThemeSecondaryColor: 'Secondary color',
    customThemePickerTitle: 'Color picker',
    customThemePickerHint: 'Drag in the field for tint and on slider for hue.',
    customThemeTargetPrimary: 'Primary',
    customThemeTargetSecondary: 'Secondary',
    customThemeHex: 'Hex',
    customThemeApply: 'Use custom theme',
    themeApplied: 'Applied',
    updateBannerTitle: 'Update available',
    updateBannerStatusAvailable: 'Update is ready to install.',
    updateBannerStatusDownloading: 'Downloading update...',
    updateBannerStatusInstalling: 'Installing update and restarting launcher...',
    updateBannerStatusChecking: 'Checking for updates...',
    updateBannerStatusError: 'Update check failed: {message}',
    updateBannerChangesTitle: 'What changed',
    updateBannerChangesFallback: 'Custom theme editor, cleaner color cards and smoother cursor trail.',
    updateBannerAction: 'Update',
    updateBannerActionRetry: 'Retry',
    updateBannerHide: 'Hide update banner',
    latestUpdateLabel: 'Latest update',
    latestUpdateTitle: 'What changed',
    latestUpdateVersion: 'Installed build: {version}',
    latestUpdateEmpty: 'No installed updates yet.',
    failedStartUpdate: 'Failed to start update.',
    installTargetTitle: 'Install Content',
    installTargetHint: 'Choose an installed instance compatible with this content.',
    installTargetLoading: 'Checking compatible instances...',
    installTargetNone: 'No compatible installed instances found.',
    installTargetVersionLabel: 'Minecraft {version} • {loader}'
  },
  ru: {
    navLibrary: 'Библиотека',
    navBrowseMods: 'Обзор модов',
    navSettings: 'Настройки',
    navSkins: 'Скины',
    statusOffline: 'Оффлайн',
    searchMods: 'Поиск модов...',
    searchResourcePacks: 'Поиск ресурспаков...',
    searchShaders: 'Поиск шейдеров...',
    yourLibrary: 'Ваша библиотека',
    createInstance: 'Создать сборку',
    noInstancesYet: 'Пока нет сборок',
    noInstancesHint: 'Создай сборку и нажми Установить, чтобы скачать файлы Minecraft.',
    noInstallPath: 'Путь установки не назначен',
    addModsToInstance: 'Добавление модов в {name}',
    addContentToInstance: 'Добавление {type} в {name}',
    contentMods: 'Моды',
    contentResourcePacks: 'Ресурспаки',
    contentShaders: 'Шейдеры',
    authorLabel: 'Автор',
    filterLoader: 'Загрузчик',
    filterResolution: 'Разрешение',
    filterCategory: 'Категория',
    filterFeatures: 'Особенности',
    filterRequirements: 'Требования',
    clearFilters: 'Сбросить фильтры',
    browseType: 'Тип',
    allVersions: 'Все версии',
    allLoaders: 'Все ядра',
    foundMods: 'Найдено: {count}',
    pageOf: 'Страница {page} из {pages}',
    settingsRam: 'ОЗУ',
    allocatedMemory: 'Выделено памяти',
    globalRamHint: 'Глобальное значение применяется ко всем сборкам.',
    offlineProfile: 'Оффлайн профиль',
    offlineProfileHint: 'Этот ник будет использован в оффлайн-режиме в игре.',
    nicknameManagerTitle: 'Никнеймы',
    nicknameAdd: 'Добавить',
    nicknamePlaceholder: 'Введи ник...',
    nicknameDelete: 'Удалить ник',
    nicknameEmpty: 'Ник не может быть пустым.',
    nicknameAlreadyExists: 'Такой ник уже есть.',
    launcherLanguage: 'Язык лаунчера',
    launcherLanguageHint: 'Для новых установок язык игры выставляется автоматически.',
    createInstanceTitle: 'Создание сборки',
    instanceNamePlaceholder: 'Название сборки...',
    version: 'Версия',
    loader: 'Ядро',
    loadingVersions: 'Загрузка версий...',
    installPathPreview: 'Путь установки: %APPDATA%\\KonLauncher\\profiles\\{name}',
    installPathNamePlaceholder: '<название-сборки>',
    create: 'Создать',
    importFromLauncher: 'Импорт из другого лаунчера',
    importSourceNotSelected: 'Источник импорта не выбран',
    importSourceSelected: 'Источник: {launcher}',
    importLauncherChooseTitle: 'Выбери лаунчер',
    importLauncherChooseHint: 'Перенос в 1 клик: моды, ресурспаки, шейдеры, конфиги и миры.',
    importLauncherOfficial: 'Официальный лаунчер',
    importLauncherTLauncher: 'TLauncher',
    importLauncherModrinth: 'Modrinth Launcher',
    importLauncherPrism: 'Prism Launcher',
    importLauncherMultiMC: 'MultiMC',
    importInstallMessage: 'Установка с переносом из {launcher}',
    importInProgressMessage: 'Перенос настроек и контента из {launcher}',
    importDoneMessage: 'Перенесено из {launcher}: модов {mods}, ресурспаков {resourcepacks}, шейдеров {shaders}, миров {worlds}.',
    importFailedMessage: 'Не удалось перенести данные из {launcher}.',
    cancel: 'Отмена',
    installedMods: 'Установлено модов: {count}',
    installedContent: 'Установлено {type}: {count}',
    clear: 'Очистить',
    delete: 'Удалить',
    refresh: 'Обновить',
    folder: 'Папка',
    updateAll: 'Обновить все',
    installContent: 'Установить контент',
    columnName: 'Название',
    columnActions: 'Действия',
    noModsInstalled: 'Моды не установлены',
    noContentInstalled: '{type} не установлены',
    byAuthor: 'от {author}',
    openFolder: 'Открыть папку',
    updateMod: 'Обновить мод',
    more: 'Еще',
    instanceSettings: 'Настройки сборки',
    instanceName: 'Название сборки',
    renameFolderHint: 'Папка в `%APPDATA%\\KonLauncher\\profiles` тоже будет переименована.',
    instanceAvatar: 'Аватар сборки',
    pickImage: 'Выбрать изображение (100x100 до 1000x1000)',
    resetAvatar: 'Сбросить аватарку',
    save: 'Сохранить',
    operationFailed: 'Операция не выполнена',
    code: 'Код',
    details: 'Подробности',
    installSuggestedMods: 'Установить мод(ы)',
    installingSuggestedMods: 'Установка модов...',
    checkingSuggestedMods: 'Проверка совместимых модов...',
    failedInstallSuggestedMods: 'Не удалось установить часть предложенных модов.',
    failedFindSuggestedMods: 'Не удалось найти совместимые моды на Modrinth.',
    errorModIncompatible: '{mod} несовместим с {loader} {version}. Используй Minecraft {targetVersion} для этого мода или отключи его.',
    errorMissingDependencies: 'Не хватает обязательных модов: {mods}.',
    errorMinecraftCrashed: 'Minecraft завершился с ошибкой: {reason}',
    errorMinecraftExited: 'Minecraft закрылся сразу после запуска.',
    close: 'Закрыть',
    nameEmpty: 'Название не может быть пустым.',
    failedRenameProfile: 'Не удалось переименовать папку профиля.',
    failedPickAvatar: 'Не удалось выбрать аватар.',
    installFirstForMods: 'Сначала установи эту сборку, потом добавляй моды.',
    failedInstallMod: 'Не удалось установить мод.',
    failedInstallContent: 'Не удалось установить контент.',
    failedToggleMod: 'Не удалось включить/выключить мод.',
    failedDeleteMod: 'Не удалось удалить мод.',
    failedDeleteContent: 'Не удалось удалить контент.',
    failedUpdateMod: 'Не удалось обновить мод {name}',
    failedUpdateContent: 'Не удалось обновить контент {name}',
    failedCheckUpdates: 'Не удалось проверить обновления.',
    creatorUnknown: 'Неизвестно',
    folderPathMissing: 'Папка сборки еще не задана.',
    openFolderApiMissing: 'API открытия папки недоступно.',
    failedOpenFolder: 'Не удалось открыть папку',
    primaryInstall: 'УСТАНОВИТЬ',
    primaryInstalling: 'УСТАНОВКА {percent}%',
    primaryRunning: 'ЗАПУЩЕНО',
    primaryStop: 'ВЫКЛЮЧИТЬ',
    primaryPlay: 'ИГРАТЬ',
    primaryRetryInstall: 'ПОВТОРИТЬ УСТАНОВКУ',
    deleteInstanceConfirm: 'Удалить сборку "{name}" и ее папку профиля с диска?',
    confirmDeleteTitle: 'Удалить сборку',
    failedDeleteProfile: 'Не удалось удалить папку профиля.',
    loaderNotCompatible: '{loader} не совместим с {version}',
    javaRequiredPrompt: 'Для этой версии Minecraft нужна Java {major}+. Открыть страницу загрузки Java?',
    preparing: 'Подготовка',
    startingInstallation: 'Запуск установки',
    stageError: 'Ошибка',
    installFailed: 'Установка не удалась',
    failedInstallMinecraft: 'Не удалось установить Minecraft',
    failedLaunchMinecraft: 'Не удалось запустить Minecraft',
    failedStopMinecraft: 'Не удалось закрыть Minecraft',
    unavailableSuffix: 'Недоступно',
    windowMinimize: 'Свернуть окно',
    windowRestore: 'Восстановить окно',
    windowMaximize: 'Развернуть окно',
    windowClose: 'Закрыть окно',
    instanceLabel: 'Сборка',
    installing: 'Установка',
    preparingFiles: 'Подготовка файлов',
    skinsTitle: 'Скины',
    skinsSaved: 'Сохраненные скины',
    skinsAdd: 'Добавить скин',
    skinsOpenFolder: 'Открыть папку скинов',
    skinsDragRotate: 'Потяни мышью для вращения',
    skinsChangeCape: 'Сменить плащ',
    skinsNoActive: 'Активный скин не выбран',
    skinsSelectTexture: 'Выбери файл текстуры скина',
    skinsSelectTextureHint: 'Перетащи PNG или нажми для выбора',
    skinsUploadTexture: 'Загрузка текстуры скина',
    skinsAdding: 'Добавление скина',
    skinsTexture: 'Текстура',
    skinsReplaceTexture: 'Заменить текстуру',
    skinsArmStyle: 'Стиль рук',
    skinsWide: 'Classic - широкие',
    skinsSlim: 'Slim - тонкие',
    skinsCape: 'Плащ',
    skinsOfficialCape: 'Оригинальный плащ с игры',
    skinsOfficialCapeMissing: 'У этого ника нет официального плаща',
    skinsNoCape: 'Без плаща',
    skinsAddAction: 'Добавить скин',
    skinsSaveAction: 'Сохранить скин',
    skinsCancelAction: 'Отмена',
    skinsEditAction: 'Редактировать',
    skinsDeleteAction: 'Удалить',
    skinsSetActive: 'Сделать активным',
    skinsNeedTexture: 'Сначала выбери текстуру скина.',
    skinsFailedLoad: 'Не удалось загрузить скины.',
    skinsFailedSave: 'Не удалось сохранить скин.',
    skinsFailedUpdate: 'Не удалось обновить скин.',
    skinsFailedDelete: 'Не удалось удалить скин.',
    skinsFailedSetActive: 'Не удалось выбрать активный скин.',
    skinsNamePlaceholder: 'Название скина',
    settingsVisualEffects: 'Визуальные эффекты',
    cursorGlowTitle: 'Свечение за курсором',
    cursorGlowHint: 'Мягкий свет двигается за курсором. Выключи, если лагает.',
    cursorGlowEnabled: 'Включено',
    cursorGlowDisabled: 'Выключено',
    cursorDistortionTitle: 'Неоновый хвост за курсором',
    cursorDistortionHint: 'Анимированная неоновая полоса следует за курсором и меняет цвет по теме лаунчера.',
    cursorDistortionEnabled: 'Включено',
    cursorDistortionDisabled: 'Выключено',
    themeEditorTitle: 'Редактор оформления',
    themeEditorHint: 'Выбери стиль лаунчера: готовые темы или своя цветовая/градиентная тема.',
    backgroundFxTitle: 'Атмосфера фона',
    backgroundFxHint: 'Выбери небольшой анимированный эффект для фона лаунчера.',
    backgroundFxStars: 'Звезды',
    backgroundFxRain: 'Дождь',
    backgroundFxSnow: 'Снег',
    themeSectionSolid: 'Обычные цвета',
    themeSectionGradient: 'Градиенты',
    themeSectionCustom: 'Своя тема',
    customThemeHint: 'Выбери свои цвета и примени их как тему лаунчера.',
    customThemeSolid: 'Обычный цвет',
    customThemeGradient: 'Градиент',
    customThemePrimaryColor: 'Основной цвет',
    customThemeSecondaryColor: 'Второй цвет',
    customThemePickerTitle: 'Выбор цвета',
    customThemePickerHint: 'Перетаскивай в поле для тона и на слайдере для оттенка.',
    customThemeTargetPrimary: 'Основной',
    customThemeTargetSecondary: 'Второй',
    customThemeHex: 'Hex',
    customThemeApply: 'Применить свою тему',
    themeApplied: 'Применено',
    updateBannerTitle: 'Доступно обновление',
    updateBannerStatusAvailable: 'Обновление готово к установке.',
    updateBannerStatusDownloading: 'Скачивание обновления...',
    updateBannerStatusInstalling: 'Установка обновления и перезапуск лаунчера...',
    updateBannerStatusChecking: 'Проверка обновлений...',
    updateBannerStatusError: 'Не удалось проверить обновления: {message}',
    updateBannerChangesTitle: 'Что изменилось',
    updateBannerChangesFallback: 'Добавлен редактор своей темы, аккуратные цветовые карточки и плавный хвост курсора.',
    updateBannerAction: 'Обновить',
    updateBannerActionRetry: 'Повторить',
    updateBannerHide: 'Скрыть плашку обновления',
    latestUpdateLabel: 'Последнее обновление',
    latestUpdateTitle: 'Что изменилось',
    latestUpdateVersion: 'Установлена сборка: {version}',
    latestUpdateEmpty: 'Пока нет установленных обновлений.',
    failedStartUpdate: 'Не удалось запустить обновление.',
    installTargetTitle: 'Установка контента',
    installTargetHint: 'Выбери установленную сборку, совместимую с этим контентом.',
    installTargetLoading: 'Проверка совместимых сборок...',
    installTargetNone: 'Подходящие установленные сборки не найдены.',
    installTargetVersionLabel: 'Minecraft {version} • {loader}'
  }
};

const translateTemplate = (language, key, params = {}) => {
  const table = UI_STRINGS[language] || UI_STRINGS.en;
  const fallback = UI_STRINGS.en[key];
  const source = table[key] || fallback || key;

  return String(source).replace(/\{(\w+)\}/g, (_match, token) => {
    if (Object.prototype.hasOwnProperty.call(params, token)) {
      return String(params[token]);
    }
    return `{${token}}`;
  });
};

const normalizeUpdateNoteText = (rawValue) =>
  String(rawValue || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();

const splitUpdateNoteLines = (rawValue) =>
  normalizeUpdateNoteText(rawValue)
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-*•]+\s*/, '').trim())
    .filter((line) => {
      if (!line) return false;
      if (/^[.|\-_/\\\s]+\(v?\d+\.\d+\.\d+\)$/i.test(line)) return false;
      if (/^[.|\-_/\\\s]*\|{1,3}.*\(\d+\.\d+\.\d+\)$/i.test(line)) return false;
      return true;
    });

const localizeFallbackUpdateNote = (note, languageCode = 'en') => {
  const language = languageCode === 'ru' ? 'ru' : 'en';
  const source = String(note || '').trim();
  if (!source) return source;
  if (language !== 'ru') return source;
  if (/[А-Яа-яЁё]/.test(source)) return source;

  const normalized = source.toLowerCase();
  if (normalized.includes('custom theme') && normalized.includes('color picker') && normalized.includes('cursor')) {
    return 'Добавлен редактор своей темы, кастомный выбор цвета и плавный хвост курсора.';
  }
  if (normalized.includes('custom theme') && normalized.includes('smoother cursor')) {
    return 'Улучшена своя тема, добавлен кастомный выбор цвета и более плавный хвост курсора.';
  }
  if (normalized.includes('update reliability') && normalized.includes('bug fixes')) {
    return 'Повышена надежность обновлений и исправлены ошибки.';
  }
  return source;
};

const normalizeUpdateNotes = (rawValue, languageCode = 'en') => {
  const targetLanguage = languageCode === 'ru' ? 'ru' : 'en';
  const localized = { ru: [], en: [] };
  const fallback = [];

  const pushUnique = (list, value) => {
    const note = normalizeUpdateNoteText(value);
    if (!note) return;
    if (!list.includes(note)) list.push(note);
  };

  const parseLocalizedLine = (line) => {
    const matches = [...line.matchAll(/(?:^|\s)(ru|en)\s*:\s*(.+?)(?=(?:\s(?:ru|en)\s*:)|$)/gi)];
    if (!matches.length) return false;
    matches.forEach((match) => {
      pushUnique(localized[match[1].toLowerCase()], match[2]);
    });
    return true;
  };

  const appendFromValue = (value) => {
    const lines = splitUpdateNoteLines(value);
    lines.forEach((line) => {
      if (!parseLocalizedLine(line)) {
        pushUnique(fallback, line);
      }
    });
  };

  if (Array.isArray(rawValue)) {
    rawValue.forEach((entry) => {
      if (!entry) return;
      if (typeof entry === 'string') {
        appendFromValue(entry);
        return;
      }
      if (typeof entry === 'object') {
        appendFromValue(entry.note || entry.text || entry.description || entry.body || entry.message || '');
      }
    });
  } else if (rawValue && typeof rawValue === 'object') {
    appendFromValue(rawValue.note || rawValue.text || rawValue.description || rawValue.body || rawValue.message || '');
  } else {
    appendFromValue(rawValue);
  }

  const selected = localized[targetLanguage];
  const resolved = (selected.length ? selected : fallback).map((line) => localizeFallbackUpdateNote(line, targetLanguage));
  return resolved.slice(0, 4);
};

const FALLBACK_GAME_VERSIONS = [
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

const MODS_PER_PAGE = 12;
const CONTENT_TYPES = [
  { id: 'mod', labelKey: 'contentMods', projectType: 'mod', icon: Box },
  { id: 'resourcepack', labelKey: 'contentResourcePacks', projectType: 'resourcepack', icon: ComponentIcon },
  { id: 'shader', labelKey: 'contentShaders', projectType: 'shader', icon: Zap }
];

const IMPORT_LAUNCHER_OPTIONS = [
  { id: 'modrinth', labelKey: 'importLauncherModrinth' },
  { id: 'tlauncher', labelKey: 'importLauncherTLauncher' },
  { id: 'prism', labelKey: 'importLauncherPrism' },
  { id: 'multimc', labelKey: 'importLauncherMultiMC' },
  { id: 'official', labelKey: 'importLauncherOfficial' }
];

const normalizeContentType = (value) => {
  const normalized = String(value || 'mod').toLowerCase();
  if (normalized === 'resourcepack' || normalized === 'shader' || normalized === 'mod') {
    return normalized;
  }
  return 'mod';
};

const FILTER_TAG_LABELS = {
  fabric: { en: 'Fabric', ru: 'Fabric' },
  forge: { en: 'Forge', ru: 'Forge' },
  neoforge: { en: 'NeoForge', ru: 'NeoForge' },
  quilt: { en: 'Quilt', ru: 'Quilt' },
  babric: { en: 'Babric', ru: 'Babric' },
  'bta-babric': { en: 'BTA (Babric)', ru: 'BTA (Babric)' },
  'java-agent': { en: 'Java Agent', ru: 'Java Agent' },
  'legacy-fabric': { en: 'Legacy Fabric', ru: 'Legacy Fabric' },
  liteloader: { en: 'LiteLoader', ru: 'LiteLoader' },
  modloader: { en: "Risugami's ModLoader", ru: "Risugami's ModLoader" },
  nilloader: { en: 'NilLoader', ru: 'NilLoader' },
  ornithe: { en: 'Ornithe', ru: 'Ornithe' },
  rift: { en: 'Rift', ru: 'Rift' },
  iris: { en: 'Iris', ru: 'Iris' },
  optifine: { en: 'OptiFine', ru: 'OptiFine' },
  canvas: { en: 'Canvas', ru: 'Canvas' },
  'core-shaders': { en: 'Vanilla Shader', ru: 'Ванильный шейдер' },
  library: { en: 'Library', ru: 'Библиотеки' },
  worldgen: { en: 'World Generation', ru: 'Генерация мира' },
  food: { en: 'Food', ru: 'Еда' },
  'game-mechanics': { en: 'Game Mechanics', ru: 'Игровые механики' },
  magic: { en: 'Magic', ru: 'Магия' },
  minigame: { en: 'Minigame', ru: 'Мини-игры' },
  mobs: { en: 'Mobs', ru: 'Мобы' },
  optimization: { en: 'Optimization', ru: 'Оптимизация' },
  tweaks: { en: 'Tweaks', ru: 'Улучшение' },
  decoration: { en: 'Decoration', ru: 'Оформление' },
  transportation: { en: 'Transportation', ru: 'Передвижение' },
  adventure: { en: 'Adventure', ru: 'Приключения' },
  equipment: { en: 'Equipment', ru: 'Снаряжение' },
  social: { en: 'Social', ru: 'Социальные' },
  cursed: { en: 'Cursed', ru: 'Странные' },
  technology: { en: 'Technology', ru: 'Технологии' },
  management: { en: 'Management', ru: 'Управление' },
  utility: { en: 'Utility', ru: 'Утилиты' },
  storage: { en: 'Storage', ru: 'Хранение' },
  economy: { en: 'Economy', ru: 'Экономика' },
  combat: { en: 'Combat', ru: 'Бой' },
  'vanilla-like': { en: 'Vanilla-like', ru: 'Ванильный вид' },
  modded: { en: 'Modded', ru: 'Модифицированные' },
  simplistic: { en: 'Simple', ru: 'Простые' },
  realistic: { en: 'Realistic', ru: 'Реализм' },
  themed: { en: 'Themed', ru: 'Тематические' },
  blocks: { en: 'Blocks', ru: 'Блоки' },
  audio: { en: 'Audio', ru: 'Звуки' },
  gui: { en: 'Interface', ru: 'Интерфейс' },
  models: { en: 'Models', ru: 'Модели' },
  environment: { en: 'Environment', ru: 'Окружение' },
  items: { en: 'Items', ru: 'Предметы' },
  entities: { en: 'Entities', ru: 'Сущности' },
  shadows: { en: 'Shadows', ru: 'Тени' },
  fonts: { en: 'Fonts', ru: 'Шрифты' },
  locale: { en: 'Languages', ru: 'Языки' },
  cartoon: { en: 'Cartoon', ru: 'Мультяшные' },
  'semi-realistic': { en: 'Semi-realistic', ru: 'Полуреализм' },
  fantasy: { en: 'Fantasy', ru: 'Фэнтези' },
  atmosphere: { en: 'Atmosphere', ru: 'Атмосфера' },
  reflections: { en: 'Reflections', ru: 'Отражения' },
  pbr: { en: 'PBR Support', ru: 'Поддержка PBR' },
  foliage: { en: 'Foliage', ru: 'Растительность' },
  bloom: { en: 'Bloom', ru: 'Свечение' },
  'path-tracing': { en: 'Path Tracing', ru: 'Трассировка пути' },
  'colored-lighting': { en: 'Colored Lighting', ru: 'Цветное освещение' },
  potato: { en: 'Calculator', ru: 'Калькулятор' },
  low: { en: 'Low', ru: 'Низкие' },
  medium: { en: 'Medium', ru: 'Средние' },
  high: { en: 'High', ru: 'Высокие' },
  screenshot: { en: 'Supercomputer', ru: 'Суперкомпьютер' },
  '8x-': { en: '8x and lower', ru: '8x и ниже' },
  '16x': { en: '16x', ru: '16x' },
  '32x': { en: '32x', ru: '32x' },
  '48x': { en: '48x', ru: '48x' },
  '64x': { en: '64x', ru: '64x' },
  '128x': { en: '128x', ru: '128x' },
  '256x': { en: '256x', ru: '256x' },
  '512x+': { en: '512x and higher', ru: '512x и выше' }
};

const LOADER_TAG_IDS = new Set([
  'fabric',
  'forge',
  'neoforge',
  'quilt',
  'babric',
  'bta-babric',
  'java-agent',
  'legacy-fabric',
  'liteloader',
  'modloader',
  'nilloader',
  'ornithe',
  'rift',
  'iris',
  'optifine',
  'canvas',
  'core-shaders'
]);

const TAG_CHIP_CLASS_BY_LOADER = {
  fabric: 'border-[#dbb69b]/40 bg-[#dbb69b]/12 text-[#dbb69b]',
  forge: 'border-[#959eef]/40 bg-[#959eef]/12 text-[#959eef]',
  neoforge: 'border-[#f99e6b]/40 bg-[#f99e6b]/12 text-[#f99e6b]',
  quilt: 'border-[#c796f9]/40 bg-[#c796f9]/12 text-[#c796f9]',
  babric: 'border-[#96a2b0]/35 bg-[#96a2b0]/10 text-[#96a2b0]',
  'bta-babric': 'border-[#72cc4a]/40 bg-[#72cc4a]/12 text-[#72cc4a]',
  'java-agent': 'border-[#96a2b0]/35 bg-[#96a2b0]/10 text-[#96a2b0]',
  'legacy-fabric': 'border-[#96a2b0]/35 bg-[#96a2b0]/10 text-[#96a2b0]',
  liteloader: 'border-[#7ab0ee]/40 bg-[#7ab0ee]/12 text-[#7ab0ee]',
  modloader: 'border-[#96a2b0]/35 bg-[#96a2b0]/10 text-[#96a2b0]',
  nilloader: 'border-[#f45e9a]/40 bg-[#f45e9a]/12 text-[#f45e9a]',
  ornithe: 'border-[#87c7ff]/40 bg-[#87c7ff]/12 text-[#87c7ff]',
  rift: 'border-[#96a2b0]/35 bg-[#96a2b0]/10 text-[#96a2b0]',
  iris: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  optifine: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
  canvas: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  'core-shaders': 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300'
};

const LOADER_FILTER_TEXT_CLASS = {
  fabric: 'text-[#dbb69b]',
  forge: 'text-[#959eef]',
  neoforge: 'text-[#f99e6b]',
  quilt: 'text-[#c796f9]',
  babric: 'text-[#96a2b0]',
  'bta-babric': 'text-[#72cc4a]',
  'java-agent': 'text-[#96a2b0]',
  'legacy-fabric': 'text-[#96a2b0]',
  liteloader: 'text-[#7ab0ee]',
  modloader: 'text-[#96a2b0]',
  nilloader: 'text-[#f45e9a]',
  ornithe: 'text-[#87c7ff]',
  rift: 'text-[#96a2b0]'
};

const LOADER_VISUALS = {
  fabric: { icon: '◇', textClass: 'text-amber-300' },
  forge: { icon: '⛏', textClass: 'text-indigo-300' },
  neoforge: { icon: '🔥', textClass: 'text-orange-300' },
  babric: { icon: '◇', textClass: 'text-zinc-400' },
  'bta-babric': { icon: '◇', textClass: 'text-lime-400' },
  'java-agent': { icon: '⌁', textClass: 'text-zinc-400' },
  'legacy-fabric': { icon: '◇', textClass: 'text-zinc-400' },
  liteloader: { icon: '✧', textClass: 'text-sky-300' },
  modloader: { icon: 'ML', textClass: 'text-zinc-400' },
  nilloader: { icon: '∅', textClass: 'text-pink-400' },
  ornithe: { icon: '◌', textClass: 'text-cyan-300' },
  quilt: { icon: '▦', textClass: 'text-violet-300' },
  rift: { icon: '⬡', textClass: 'text-zinc-300' },
  iris: { icon: '◉', textClass: 'text-sky-300' },
  optifine: { icon: 'OF', textClass: 'text-zinc-300' },
  canvas: { icon: '◈', textClass: 'text-emerald-300' },
  'core-shaders': { icon: '◎', textClass: 'text-zinc-300' }
};

const LOADER_FILTER_OPTION_VISUALS = {
  fabric: { textClass: LOADER_FILTER_TEXT_CLASS.fabric },
  forge: { textClass: LOADER_FILTER_TEXT_CLASS.forge },
  neoforge: { textClass: LOADER_FILTER_TEXT_CLASS.neoforge },
  quilt: { textClass: LOADER_FILTER_TEXT_CLASS.quilt },
  babric: { textClass: LOADER_FILTER_TEXT_CLASS.babric },
  'bta-babric': { textClass: LOADER_FILTER_TEXT_CLASS['bta-babric'] },
  'java-agent': { textClass: LOADER_FILTER_TEXT_CLASS['java-agent'] },
  'legacy-fabric': { textClass: LOADER_FILTER_TEXT_CLASS['legacy-fabric'] },
  liteloader: { textClass: LOADER_FILTER_TEXT_CLASS.liteloader },
  modloader: { textClass: LOADER_FILTER_TEXT_CLASS.modloader },
  nilloader: { textClass: LOADER_FILTER_TEXT_CLASS.nilloader },
  ornithe: { textClass: LOADER_FILTER_TEXT_CLASS.ornithe },
  rift: { textClass: LOADER_FILTER_TEXT_CLASS.rift }
};

const BROWSE_FILTER_CONFIG = {
  mod: [
    {
      id: 'loaders',
      titleKey: 'filterLoader',
      options: [
        'fabric',
        'forge',
        'neoforge',
        'babric',
        'bta-babric',
        'java-agent',
        'legacy-fabric',
        'liteloader',
        'modloader',
        'nilloader',
        'ornithe',
        'quilt',
        'rift'
      ]
    },
    {
      id: 'categories',
      titleKey: 'filterCategory',
      options: [
        'library',
        'worldgen',
        'food',
        'game-mechanics',
        'magic',
        'minigame',
        'mobs',
        'optimization',
        'decoration',
        'transportation',
        'adventure',
        'equipment',
        'social',
        'cursed',
        'technology',
        'management',
        'utility',
        'storage',
        'economy'
      ]
    }
  ],
  resourcepack: [
    {
      id: 'resolution',
      titleKey: 'filterResolution',
      options: ['8x-', '16x', '32x', '48x', '64x', '128x', '256x', '512x+']
    },
    {
      id: 'categories',
      titleKey: 'filterCategory',
      options: ['combat', 'vanilla-like', 'modded', 'decoration', 'simplistic', 'realistic', 'cursed', 'themed', 'tweaks', 'utility']
    },
    {
      id: 'features',
      titleKey: 'filterFeatures',
      options: ['blocks', 'audio', 'gui', 'models', 'environment', 'items', 'equipment', 'entities', 'core-shaders', 'fonts', 'locale']
    }
  ],
  shader: [
    {
      id: 'loaders',
      titleKey: 'filterLoader',
      options: ['iris', 'optifine', 'core-shaders', 'canvas']
    },
    {
      id: 'categories',
      titleKey: 'filterCategory',
      options: ['vanilla-like', 'cartoon', 'semi-realistic', 'realistic', 'cursed', 'fantasy']
    },
    {
      id: 'features',
      titleKey: 'filterFeatures',
      options: ['atmosphere', 'reflections', 'pbr', 'foliage', 'bloom', 'shadows', 'path-tracing', 'colored-lighting']
    },
    {
      id: 'requirements',
      titleKey: 'filterRequirements',
      options: ['potato', 'low', 'medium', 'high', 'screenshot']
    }
  ]
};

const DEFAULT_BROWSE_FILTERS = {
  mod: { loaders: [], categories: [] },
  resourcepack: { resolution: [], categories: [], features: [] },
  shader: { loaders: [], categories: [], features: [], requirements: [] }
};

const DEFAULT_OPEN_FILTER_GROUPS = {
  mod: { loaders: true, categories: true },
  resourcepack: { resolution: true, categories: true, features: true },
  shader: { loaders: true, categories: true, features: true, requirements: true }
};

const uniqueStrings = (values) => [...new Set((Array.isArray(values) ? values : []).map((item) => String(item || '').trim()).filter(Boolean))];
const asObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});

const buildModSearchQueryFromJarName = (jarName) =>
  String(jarName || '')
    .replace(/\.jar$/i, '')
    .replace(/[_\-.]?(?:mc)?\d+(?:[._-]\d+)*(?:[a-z]+)?$/i, '')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const makeDisplayModName = (value) =>
  String(value || '')
    .replace(/\.jar$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

const toImageSrc = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^(https?:|data:|file:|blob:)/i.test(raw)) return raw;

  const normalized = raw.replace(/\\/g, '/');
  if (/^[a-z]:\//i.test(normalized)) {
    return `file:///${encodeURI(normalized)}`;
  }
  if (normalized.startsWith('/')) {
    return `file://${encodeURI(normalized)}`;
  }
  return raw;
};

const humanizeSlug = (slug) =>
  String(slug || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getTagLabel = (tag, languageCode = 'en') => {
  const mapped = FILTER_TAG_LABELS[tag];
  if (mapped) return languageCode === 'ru' ? mapped.ru : mapped.en;
  return humanizeSlug(tag);
};

const getFilterGroupsForType = (contentType, languageCode, t) => {
  const normalized = normalizeContentType(contentType);
  const groups = BROWSE_FILTER_CONFIG[normalized] || [];
  return groups.map((group) => ({
    id: group.id,
    title: t(group.titleKey),
    options: group.options.map((option) => {
      const optionId = typeof option === 'string' ? option : option.id;
      const facet = typeof option === 'string' ? option : option.facet || option.id;
      const loaderVisual = group.id === 'loaders' ? LOADER_FILTER_OPTION_VISUALS[optionId] || null : null;
      let contentIconSvg = null;
      if (group.id !== 'loaders') {
        if (normalized === 'mod') {
          contentIconSvg =
            MOD_CATEGORY_ICON_SVG_BY_ID?.[optionId] ||
            MOD_CATEGORY_ICON_SVG_BY_ID?.[facet] ||
            CONTENT_TAG_ICON_SVG_BY_ID?.[optionId] ||
            CONTENT_TAG_ICON_SVG_BY_ID?.[facet] ||
            null;
        } else {
          contentIconSvg = CONTENT_TAG_ICON_SVG_BY_ID?.[optionId] || CONTENT_TAG_ICON_SVG_BY_ID?.[facet] || null;
        }
      }
      return {
        id: optionId,
        facet,
        label: getTagLabel(optionId, languageCode),
        loaderVisual,
        contentIconSvg
      };
    })
  }));
};

const mapSelectedToFacetValues = (contentType, groupId, selectedIds) => {
  const normalized = normalizeContentType(contentType);
  const group = (BROWSE_FILTER_CONFIG[normalized] || []).find((item) => item.id === groupId);
  if (!group || !Array.isArray(selectedIds) || selectedIds.length === 0) return [];

  const facetById = new Map(
    group.options.map((option) => {
      if (typeof option === 'string') return [option, option];
      return [option.id, option.facet || option.id];
    })
  );

  return uniqueStrings(selectedIds.map((id) => facetById.get(id) || id));
};

const resolveSideChip = (hit, languageCode) => {
  const client = String(hit?.client_side || '').toLowerCase();
  const server = String(hit?.server_side || '').toLowerCase();
  const clientEnabled = client && client !== 'unsupported';
  const serverEnabled = server && server !== 'unsupported';

  if (clientEnabled && serverEnabled) {
    return languageCode === 'ru' ? 'Клиент или сервер' : 'Client or server';
  }
  if (clientEnabled) {
    return languageCode === 'ru' ? 'Клиент' : 'Client';
  }
  if (serverEnabled) {
    return languageCode === 'ru' ? 'Сервер' : 'Server';
  }
  return '';
};

const resolveCardTags = (hit, contentType, languageCode) => {
  const normalized = normalizeContentType(contentType);
  const rawTags = uniqueStrings(
    Array.isArray(hit?.display_categories) && hit.display_categories.length ? hit.display_categories : Array.isArray(hit?.categories) ? hit.categories : []
  );
  const loaderTags = rawTags.filter((tag) => LOADER_TAG_IDS.has(tag));
  const categoryTags = rawTags.filter((tag) => !LOADER_TAG_IDS.has(tag));
  const chips = [];

  if (normalized === 'mod') {
    const side = resolveSideChip(hit, languageCode);
    if (side) chips.push({ id: '__side', label: side, kind: 'meta' });
  }
  if (normalized === 'resourcepack') {
    chips.push({ id: '__resourcepack', label: languageCode === 'ru' ? 'Набор ресурсов' : 'Resource Pack', kind: 'meta' });
  }
  if (normalized === 'shader') {
    chips.push({ id: '__shaderpack', label: languageCode === 'ru' ? 'Шейдерпак' : 'Shader Pack', kind: 'meta' });
  }

  categoryTags.forEach((tag) => {
    chips.push({
      id: `tag-${tag}`,
      slug: tag,
      label: getTagLabel(tag, languageCode),
      kind: 'tag'
    });
  });

  loaderTags.forEach((tag) => {
    chips.push({
      id: `loader-${tag}`,
      slug: tag,
      label: getTagLabel(tag, languageCode),
      kind: 'loader'
    });
  });

  const seen = new Set();
  return chips.filter((chip) => {
    const key = `${chip.kind}:${chip.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getTagChipClassName = (chip, contentType = 'mod') => {
  const normalized = normalizeContentType(contentType);
  if (normalized === 'resourcepack' || normalized === 'shader') {
    return 'border-white/60 bg-transparent text-zinc-100/90';
  }

  if (chip.kind === 'loader') {
    return TAG_CHIP_CLASS_BY_LOADER[chip.slug] || 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';
  }
  if (chip.kind === 'meta') {
    return 'border-white/15 bg-white/5 text-zinc-200';
  }
  return 'border-white/12 bg-white/5 text-zinc-300';
};

const FALLBACK_ICON_40 =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="#111"/><rect x="9" y="9" width="22" height="22" rx="6" fill="#1a1a1a" stroke="#2a2a2a"/><path d="M14 18.5l6-4 6 4v7l-6 4-6-4v-7z" fill="#2b2b2b"/></svg>'
  );

const FALLBACK_ICON_80 =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="18" fill="#111"/><rect x="18" y="18" width="44" height="44" rx="12" fill="#1a1a1a" stroke="#2a2a2a"/><path d="M28 37l12-8 12 8v16l-12 8-12-8V37z" fill="#2b2b2b"/></svg>'
  );

const FALLBACK_HEADER_16_9 =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#293241"/><stop offset="1" stop-color="#1f2937"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><circle cx="516" cy="72" r="96" fill="#334155" opacity="0.22"/><circle cx="154" cy="286" r="116" fill="#1e293b" opacity="0.26"/><rect x="238" y="132" width="164" height="94" rx="14" fill="#0f172a" opacity="0.5" stroke="#475569"/><path d="M258 210l34-39 30 30 22-24 38 33" stroke="#94a3b8" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  );

const parseVersion = (version) => {
  const match = String(version || '')
    .trim()
    .match(/^(\d+)\.(\d+)(?:\.(\d+))?$/);
  if (!match) return null;
  return [Number.parseInt(match[1], 10), Number.parseInt(match[2], 10), Number.parseInt(match[3] || '0', 10)];
};

const compareVersion = (left, right) => {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) return 0;

  for (let i = 0; i < 3; i += 1) {
    if (a[i] > b[i]) return 1;
    if (a[i] < b[i]) return -1;
  }
  return 0;
};

const isLoaderSupported = (version, loaderId) => {
  if (!version) return true;
  if (loaderId === 'vanilla') return true;
  if (loaderId === 'forge') return compareVersion(version, '1.8') >= 0;
  if (loaderId === 'fabric') return compareVersion(version, '1.14') >= 0;
  if (loaderId === 'quilt') return compareVersion(version, '1.14') >= 0;
  if (loaderId === 'neoforge') return compareVersion(version, '1.20.1') >= 0;
  return false;
};

const formatLoaderName = (loader) => {
  if (!loader) return '';
  const normalized = String(loader).toLowerCase();
  if (normalized === 'neoforge') return 'NeoForge';
  return loader.charAt(0).toUpperCase() + loader.slice(1);
};

const toModrinthLoader = (loader) => {
  return String(loader || '').toLowerCase();
};

const resolveModrinthLoaders = (loader) => {
  const normalized = toModrinthLoader(loader);
  if (!normalized || normalized === 'vanilla') return [];
  if (normalized === 'quilt') return ['quilt', 'fabric'];
  if (normalized === 'neoforge') return ['neoforge', 'forge'];
  return [normalized];
};

const isModrinthVersionCompatible = (release, instance, contentType) => {
  const gameVersions = Array.isArray(release?.game_versions)
    ? release.game_versions.map((entry) => String(entry || '').trim()).filter(Boolean)
    : [];
  const instanceVersion = String(instance?.version || '').trim();
  if (!instanceVersion || !gameVersions.includes(instanceVersion)) return false;

  if (normalizeContentType(contentType) !== 'mod') {
    return true;
  }

  const loaders = Array.isArray(release?.loaders)
    ? release.loaders.map((entry) => String(entry || '').trim().toLowerCase()).filter(Boolean)
    : [];
  const expectedLoaders = resolveModrinthLoaders(instance?.loader);
  if (!expectedLoaders.length) return true;
  return expectedLoaders.some((loader) => loaders.includes(loader));
};

const normalizeNicknameValue = (value) => {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 16);
};

const normalizeNicknameList = (value, fallback = 'Player') => {
  const fallbackName = normalizeNicknameValue(fallback) || 'Player';
  const raw = Array.isArray(value) ? value : [];
  const used = new Set();
  const normalized = [];

  for (const item of raw) {
    const candidate = normalizeNicknameValue(item);
    if (!candidate) continue;
    const key = candidate.toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    normalized.push(candidate);
    if (normalized.length >= 24) break;
  }

  if (!normalized.some((item) => item.toLowerCase() === fallbackName.toLowerCase())) {
    normalized.unshift(fallbackName);
  }

  return normalized.slice(0, 24);
};

const formatDownloads = (value) => {
  const num = Number(value || 0);
  if (!Number.isFinite(num) || num <= 0) return '0';

  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return String(Math.round(num));
};

const resolveGalleryImageUrl = (entry) => {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object') {
    if (typeof entry.url === 'string' && entry.url) return entry.url;
    if (typeof entry.raw_url === 'string' && entry.raw_url) return entry.raw_url;
  }
  return '';
};

const resolveProjectHeaderImage = (project) => {
  const featuredUrl = resolveGalleryImageUrl(project?.featured_gallery);
  if (featuredUrl) return featuredUrl;

  if (Array.isArray(project?.gallery) && project.gallery.length > 0) {
    const featuredEntry = project.gallery.find((entry) => entry && typeof entry === 'object' && entry.featured);
    const featuredEntryUrl = resolveGalleryImageUrl(featuredEntry);
    if (featuredEntryUrl) return featuredEntryUrl;

    const firstUrl = resolveGalleryImageUrl(project.gallery[0]);
    if (firstUrl) return firstUrl;
  }

  return '';
};

const formatRelativeUpdatedAt = (rawDate, languageCode = 'en') => {
  const date = new Date(rawDate || '');
  const timestamp = date.getTime();
  if (!Number.isFinite(timestamp)) return '';

  const now = Date.now();
  const diffMs = timestamp - now;
  const absMs = Math.abs(diffMs);
  const locale = languageCode === 'ru' ? 'ru' : 'en';

  if (absMs < 45 * 1000) {
    return languageCode === 'ru' ? 'только что' : 'just now';
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (absMs < hour) return rtf.format(Math.round(diffMs / minute), 'minute');
  if (absMs < day) return rtf.format(Math.round(diffMs / hour), 'hour');
  if (absMs < week) return rtf.format(Math.round(diffMs / day), 'day');
  if (absMs < month * 3) return rtf.format(Math.round(diffMs / week), 'week');
  if (absMs < year) return rtf.format(Math.round(diffMs / month), 'month');
  return rtf.format(Math.round(diffMs / year), 'year');
};

const makeInstance = ({ id, name, version, loader, ram, installPath = '', importSource = null }) => ({
  id,
  name,
  version,
  loader,
  ram,
  playTime: '0 min',
  mods: [],
  resourcepacks: [],
  shaders: [],
  avatarPath: '',
  installPath,
  installState: 'not_installed',
  installProgress: 0,
  installStage: null,
  customVersionId: null,
  forgeJarPath: null,
  javaPath: null,
  isRunning: false,
  lastError: '',
  importSource: importSource ? String(importSource) : null
});

const normalizeInstanceData = (rawInstance) => {
  const source = rawInstance && typeof rawInstance === 'object' ? rawInstance : {};
  return {
    ...source,
    mods: Array.isArray(source.mods) ? source.mods : [],
    resourcepacks: Array.isArray(source.resourcepacks) ? source.resourcepacks : [],
    shaders: Array.isArray(source.shaders) ? source.shaders : [],
    importSource: source.importSource ? String(source.importSource) : null,
    // Reset running state on launcher restart to avoid stale "RUNNING" UI.
    isRunning: false
  };
};

const resolveContentListByType = (instance, contentType) => {
  if (!instance) return [];
  const normalized = normalizeContentType(contentType);
  if (normalized === 'resourcepack') return Array.isArray(instance.resourcepacks) ? instance.resourcepacks : [];
  if (normalized === 'shader') return Array.isArray(instance.shaders) ? instance.shaders : [];
  return Array.isArray(instance.mods) ? instance.mods : [];
};

const isLocalContentEntry = (entry) => {
  const projectId = String(entry?.projectId || entry?.id || '').trim().toLowerCase();
  return Boolean(entry?.localOnly) || projectId.startsWith('local:');
};

const moveArrayItem = (items, fromIndex, toIndex) => {
  const list = Array.isArray(items) ? [...items] : [];
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length || fromIndex === toIndex) {
    return list;
  }
  const [moved] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, moved);
  return list;
};

const DRAG_REORDER_DEADZONE_PX = 10;
const DRAG_REORDER_SWAP_LOCK_PX = 16;

const EMPTY_SKINS_STATE = {
  rootPath: '',
  activeSkinId: null,
  skins: [],
  defaultCapes: []
};

const EMPTY_OFFICIAL_PROFILE = {
  username: '',
  uuid: '',
  hasLicense: false,
  hasCape: false,
  model: 'wide',
  skinDataUrl: '',
  capeDataUrl: ''
};

const createInitialSkinDraft = (overrides = {}) => ({
  id: null,
  name: '',
  textureDataUrl: '',
  model: 'wide',
  capeMode: 'none',
  defaultCapeId: '',
  capeDataUrl: '',
  ...overrides
});

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });

const FlagBadge = ({ code }) => {
  if (!code) return null;
  return (
    <span className={`flag-badge ${code === 'us' ? 'flag-us' : ''} ${code === 'ru' ? 'flag-ru' : ''}`}>
      {code === 'us' ? <span className="flag-us-canton" /> : null}
    </span>
  );
};

const CustomSelect = ({ value, options, onChange, placeholder, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selected = options.find((opt) => (opt.id || opt) === value);
  const label = selected ? selected.name || selected : placeholder;
  const selectedFlag = selected && typeof selected === 'object' ? selected.flag : null;
  const selectedOptionIcon = selected && typeof selected === 'object' ? selected.icon : null;
  const leadingIcon = selectedOptionIcon || Icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-zinc-900/80 px-4 py-2.5 transition-all ${
          isOpen ? 'border-green-500/50 ring-2 ring-green-500/10' : 'border-white/5 hover:border-white/20'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {leadingIcon ? React.createElement(leadingIcon, { size: 14, className: 'shrink-0 text-zinc-500' }) : null}
          {selectedFlag ? <FlagBadge code={selectedFlag} /> : null}
          <span className="truncate whitespace-nowrap text-xs font-bold">{label}</span>
        </div>
        <ChevronDown size={14} className={`shrink-0 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[150] mt-2 w-full min-w-[160px] overflow-hidden rounded-xl border border-white/10 bg-[#121212] shadow-2xl">
          <div className="custom-scrollbar max-h-60 overflow-y-auto">
            {options.map((opt) => {
              const id = opt.id || opt;
              const name = opt.name || opt;
              const disabled = Boolean(opt.disabled);
              const flag = typeof opt === 'object' && opt ? opt.flag : null;
              const optionIcon = typeof opt === 'object' && opt ? opt.icon : null;

              return (
                <button
                  key={id}
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    onChange(id);
                    setIsOpen(false);
                  }}
                  className={`w-full border-b border-white/[0.03] px-4 py-3 text-left text-xs font-medium transition-colors last:border-0 ${
                    value === id
                      ? 'bg-green-600/10 text-green-400'
                      : disabled
                        ? 'cursor-not-allowed text-zinc-600'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {optionIcon ? React.createElement(optionIcon, { size: 14, className: 'shrink-0 text-zinc-500' }) : null}
                    {flag ? <FlagBadge code={flag} /> : null}
                    <span>{name}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const InlineSvgIcon = ({ svg, className = '' }) => {
  if (!svg) return null;
  return (
    <span
      className={`inline-flex items-center justify-center [&>svg]:h-full [&>svg]:w-full ${className}`.trim()}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

const LoaderFilterIcon = ({ loaderId, className = '' }) => {
  const svg = LOADER_ICON_SVG_BY_ID?.[loaderId];
  return <InlineSvgIcon svg={svg} className={className} />;
};

const getContentTagIconSvg = (contentType, tagId) => {
  const normalized = normalizeContentType(contentType);
  if (!tagId) return null;

  if (normalized === 'mod') {
    return MOD_CATEGORY_ICON_SVG_BY_ID?.[tagId] || CONTENT_TAG_ICON_SVG_BY_ID?.[tagId] || null;
  }

  return CONTENT_TAG_ICON_SVG_BY_ID?.[tagId] || null;
};

const renderLoaderPlatformIcon = (loaderId, className = '') => {
  return <LoaderFilterIcon loaderId={loaderId} className={className} />;
};

const renderContentTagIcon = (contentType, tagId, className = '') => {
  return <InlineSvgIcon svg={getContentTagIconSvg(contentType, tagId)} className={className} />;
};

const renderBrowseChipIcon = (chip, contentType, className = '') => {
  if (chip.kind === 'loader') return renderLoaderPlatformIcon(chip.slug, className);
  if (chip.kind === 'tag') return renderContentTagIcon(contentType, chip.slug, className);
  return null;
};

const getLoaderAvatarColorClass = (loaderId) => {
  return LOADER_FILTER_TEXT_CLASS[String(loaderId || '').toLowerCase()] || 'text-zinc-300';
};

const INSTANCE_LOADER_BADGE_CLASS_BY_ID = {
  vanilla: 'border-white/10 bg-white/5 text-zinc-400',
  fabric: 'border-[#dbb69b]/35 bg-[#dbb69b]/14 text-[#dbb69b]',
  forge: 'border-[#959eef]/35 bg-[#959eef]/14 text-[#959eef]',
  quilt: 'border-[#c796f9]/35 bg-[#c796f9]/14 text-[#c796f9]',
  neoforge: 'border-[#f99e6b]/35 bg-[#f99e6b]/14 text-[#f99e6b]'
};

const getInstanceLoaderBadgeClass = (loaderId) => {
  const normalized = String(loaderId || '').toLowerCase();
  return INSTANCE_LOADER_BADGE_CLASS_BY_ID[normalized] || 'border-white/10 bg-white/5 text-zinc-400';
};

const getLoaderShortDescription = (loaderId, languageCode = 'en') => {
  void loaderId;
  void languageCode;
  return '';
};

const InstanceAvatar = ({ instance, className = '', iconClassName = 'h-8 w-8', alt = 'instance avatar' }) => {
  const loaderId = String(instance?.loader || '').toLowerCase();
  const avatarSrc = toImageSrc(instance?.avatarPath || '');
  const [failedSrc, setFailedSrc] = useState('');
  const imageFailed = Boolean(avatarSrc) && failedSrc === avatarSrc;
  const wrapperClass = `flex items-center justify-center overflow-hidden border border-white/10 bg-zinc-800/60 shadow-inner ${className}`.trim();

  if (avatarSrc && !imageFailed) {
    return (
      <div className={wrapperClass}>
        <img src={avatarSrc} alt={alt} className="h-full w-full object-cover" onError={() => setFailedSrc(avatarSrc)} />
      </div>
    );
  }

  const loaderIcon = renderLoaderPlatformIcon(loaderId, `${iconClassName} shrink-0 ${getLoaderAvatarColorClass(loaderId)}`.trim());
  return <div className={wrapperClass}>{loaderIcon || <Box className="text-zinc-500" size={24} />}</div>;
};

const FilterGroupCard = ({ title, options, selectedValues, isOpen, onToggleOpen, onToggleOption }) => (
  <div className="rounded-3xl border border-white/5 bg-zinc-900/40">
    <button
      onClick={onToggleOpen}
      className="flex w-full items-center justify-between px-5 py-4 text-left text-[15px] font-black text-zinc-100 transition-colors hover:text-white"
    >
      <span>{title}</span>
      <ChevronDown size={16} className={`text-zinc-400 transition-transform duration-300 ${isOpen ? '' : '-rotate-90'}`} />
    </button>
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
        isOpen ? 'grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0'
      }`}
      aria-hidden={!isOpen}
    >
      <div className="overflow-hidden">
        <div className="custom-scrollbar max-h-72 space-y-2 overflow-y-auto px-5 pb-5">
          {options.map((option) => {
            const checked = selectedValues.includes(option.id);
            const loaderVisual = option.loaderVisual;
            const hasContentIcon = Boolean(option.contentIconSvg);
            const optionTextClass =
              loaderVisual?.textClass || (hasContentIcon ? (checked ? 'text-zinc-100' : 'text-zinc-300') : checked ? 'text-zinc-100' : 'text-zinc-400');
            const optionIcon = loaderVisual
              ? renderLoaderPlatformIcon(option.id, `h-4 w-4 shrink-0 ${loaderVisual.textClass || ''}`.trim())
              : hasContentIcon
                ? <InlineSvgIcon svg={option.contentIconSvg} className={`h-4 w-4 shrink-0 ${checked ? 'text-zinc-100' : 'text-zinc-400'}`} />
                : null;
            return (
              <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-lg py-1 text-sm">
                <input type="checkbox" className="launcher-checkbox" checked={checked} onChange={() => onToggleOption(option.id)} />
                {optionIcon}
                <span className={`font-semibold ${optionTextClass}`}>{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`group relative flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 transition-all ${
      active
        ? 'bg-gradient-to-r from-emerald-500/18 to-cyan-400/12 text-emerald-300 shadow-[0_0_0_1px_rgba(52,211,153,0.25)]'
        : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'
    }`}
  >
    <span className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>{icon}</span>
    <span className="text-sm font-black tracking-tight">{label}</span>
    {active && <div className="absolute right-4 h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" />}
  </button>
);

export default function App() {
  const [instances, setInstances] = useState([]);
  const [activeTab, setActiveTab] = useState('library');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingInstanceId, setEditingInstanceId] = useState(null);

  const [username, setUsername] = useState('Player');
  const [nicknamePresets, setNicknamePresets] = useState(['Player']);
  const [isNicknameMenuOpen, setIsNicknameMenuOpen] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [globalRam, setGlobalRam] = useState(4);
  const [launcherLanguage, setLauncherLanguage] = useState('en');
  const [cursorGlowEnabled, setCursorGlowEnabled] = useState(true);
  const [cursorDistortionEnabled, setCursorDistortionEnabled] = useState(false);
  const [visualThemeId, setVisualThemeId] = useState(DEFAULT_VISUAL_THEME_ID);
  const [customVisualTheme, setCustomVisualTheme] = useState(() => ({ ...DEFAULT_CUSTOM_VISUAL_THEME }));
  const [activeCustomColorTarget, setActiveCustomColorTarget] = useState('primary');
  const [customColorPickerHsv, setCustomColorPickerHsv] = useState({ h: 195, s: 0.86, v: 0.88 });
  const [customColorHexInput, setCustomColorHexInput] = useState(DEFAULT_CUSTOM_VISUAL_THEME.solidColor);
  const [ambientEffect, setAmbientEffect] = useState('stars');
  const [comets, setComets] = useState([]);
  const [rainWindDrift, setRainWindDrift] = useState(-18);
  const [maxRamGb, setMaxRamGb] = useState(32);

  const [gameVersions, setGameVersions] = useState(FALLBACK_GAME_VERSIONS);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const [mods, setMods] = useState([]);
  const [browseContentType, setBrowseContentType] = useState('mod');
  const [manageContentType, setManageContentType] = useState('mod');
  const [modSearch, setModSearch] = useState('');
  const [isLoadingMods, setIsLoadingMods] = useState(false);
  const [activeFilter, setActiveFilter] = useState({ version: '', loader: '' });
  const [browseFilters, setBrowseFilters] = useState(DEFAULT_BROWSE_FILTERS);
  const [openBrowseFilterGroups, setOpenBrowseFilterGroups] = useState(DEFAULT_OPEN_FILTER_GROUPS);
  const [showBrowseHeaderByType, setShowBrowseHeaderByType] = useState({ mod: true, resourcepack: true, shader: true });
  const [currentPage, setCurrentPage] = useState(0);
  const [totalMods, setTotalMods] = useState(0);

  const [modTransfer, setModTransfer] = useState(null);
  const [modActionBusyId, setModActionBusyId] = useState(null);

  const [newName, setNewName] = useState('');
  const [selectedVersion, setSelectedVersion] = useState(FALLBACK_GAME_VERSIONS[0]);
  const [selectedLoader, setSelectedLoader] = useState('vanilla');
  const [selectedImportLauncher, setSelectedImportLauncher] = useState('');
  const [showImportLauncherPicker, setShowImportLauncherPicker] = useState(false);
  const [isInstallTargetModalOpen, setIsInstallTargetModalOpen] = useState(false);
  const [installTargetEntry, setInstallTargetEntry] = useState(null);
  const [compatibleInstallTargets, setCompatibleInstallTargets] = useState([]);
  const [selectedInstallTargetId, setSelectedInstallTargetId] = useState('');
  const [installTargetLoading, setInstallTargetLoading] = useState(false);
  const [installTargetBusy, setInstallTargetBusy] = useState(false);

  const [selectedModIds, setSelectedModIds] = useState([]);
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  const [isWindowVisible, setIsWindowVisible] = useState(() => {
    if (typeof document === 'undefined') return true;
    return document.visibilityState !== 'hidden';
  });
  const [installBanner, setInstallBanner] = useState(null);
  const [installLogs, setInstallLogs] = useState([]);
  const [updaterBanner, setUpdaterBanner] = useState({
    state: 'idle',
    version: '',
    percent: 0,
    message: '',
    notes: []
  });
  const [latestInstalledUpdate, setLatestInstalledUpdate] = useState({
    version: '',
    notes: []
  });
  const [updateBannerDismissed, setUpdateBannerDismissed] = useState(false);
  const [updateActionBusy, setUpdateActionBusy] = useState(false);
  const [errorDialog, setErrorDialog] = useState(null);
  const [deleteConfirmInstance, setDeleteConfirmInstance] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [isInstanceSettingsOpen, setIsInstanceSettingsOpen] = useState(false);
  const [instanceSettingsName, setInstanceSettingsName] = useState('');
  const [instanceSettingsError, setInstanceSettingsError] = useState('');

  const [skinsState, setSkinsState] = useState(EMPTY_SKINS_STATE);
  const [officialProfile, setOfficialProfile] = useState(EMPTY_OFFICIAL_PROFILE);
  const [skinPreviewId, setSkinPreviewId] = useState(null);
  const [isSkinEditorOpen, setIsSkinEditorOpen] = useState(false);
  const [isSkinEditorVisible, setIsSkinEditorVisible] = useState(false);
  const [skinEditorMode, setSkinEditorMode] = useState('create');
  const [skinDraft, setSkinDraft] = useState(createInitialSkinDraft());
  const [skinEditorError, setSkinEditorError] = useState('');
  const [isSkinDropActive, setIsSkinDropActive] = useState(false);
  const [isSkinQuickDropActive, setIsSkinQuickDropActive] = useState(false);
  const [skinDragEnabledId, setSkinDragEnabledId] = useState(null);
  const [draggingSkinId, setDraggingSkinId] = useState(null);
  const [skinDragOverId, setSkinDragOverId] = useState(null);
  const [instanceDragEnabledId, setInstanceDragEnabledId] = useState(null);
  const [draggingInstanceId, setDraggingInstanceId] = useState(null);
  const [instanceDragOverId, setInstanceDragOverId] = useState(null);
  const [skinDragPointer, setSkinDragPointer] = useState({ startX: 0, startY: 0, x: 0, y: 0 });
  const [instanceDragPointer, setInstanceDragPointer] = useState({ startX: 0, startY: 0, x: 0, y: 0 });
  const [skinDragMetrics, setSkinDragMetrics] = useState({ offsetX: 0, offsetY: 0, width: 0, height: 0 });
  const [instanceDragMetrics, setInstanceDragMetrics] = useState({ offsetX: 0, offsetY: 0, width: 0, height: 0 });

  const persistedReadyRef = useRef(false);
  const instancesRef = useRef([]);
  const launchRunningSeenRef = useRef(new Set());
  const skinTextureInputRef = useRef(null);
  const skinEditorCloseTimerRef = useRef(null);
  const skinPressTimerRef = useRef(null);
  const instancePressTimerRef = useRef(null);
  const skinCardRefs = useRef(new Map());
  const instanceCardRefs = useRef(new Map());
  const skinsOrderRef = useRef([]);
  const skinOrderDirtyRef = useRef(false);
  const skinDragPointerIdRef = useRef(null);
  const instanceDragPointerIdRef = useRef(null);
  const skinDragStartRef = useRef({ x: 0, y: 0 });
  const instanceDragStartRef = useRef({ x: 0, y: 0 });
  const skinDragMetricsRef = useRef({ offsetX: 0, offsetY: 0, width: 0, height: 0 });
  const instanceDragMetricsRef = useRef({ offsetX: 0, offsetY: 0, width: 0, height: 0 });
  const skinDragLastSwapPointRef = useRef(null);
  const instanceDragLastSwapPointRef = useRef(null);
  const skinDragLastTargetRef = useRef(null);
  const instanceDragLastTargetRef = useRef(null);
  const launcherRootRef = useRef(null);
  const nicknameMenuRef = useRef(null);
  const installTargetRequestRef = useRef(0);
  const pointerGlowLoopRef = useRef(null);
  const neonTrailLoopRef = useRef(null);
  const pointerGlowLastFrameAtRef = useRef(0);
  const neonTrailLastFrameAtRef = useRef(0);
  const pointerGlowTargetRef = useRef({ x: 0, y: 0 });
  const pointerGlowCurrentRef = useRef({ x: 0, y: 0 });
  const pointerDistortVelocityRef = useRef({ x: 0, y: 0 });
  const neonTrailCanvasRef = useRef(null);
  const neonTrailPointsRef = useRef([]);
  const customColorPlaneRef = useRef(null);

  const hasDesktopWindowApi = typeof window !== 'undefined' && Boolean(window.launcherWindow);
  const hasMinecraftApi = typeof window !== 'undefined' && Boolean(window.launcherMinecraft);
  const hasUpdaterApi = typeof window !== 'undefined' && Boolean(window.launcherUpdater);
  const languageCode = launcherLanguage === 'ru' ? 'ru' : 'en';
  const t = useCallback((key, params = {}) => translateTemplate(languageCode, key, params), [languageCode]);
  const offlineUsername = useMemo(() => normalizeNicknameValue(username) || 'Player', [username]);
  const nicknameOptions = useMemo(() => normalizeNicknameList([offlineUsername, ...nicknamePresets], offlineUsername), [nicknamePresets, offlineUsername]);
  const activeMinecraftUsername = offlineUsername;
  const installedInstances = useMemo(
    () =>
      instances
        .filter((instance) => instance.installState === 'installed' && String(instance.installPath || '').trim())
        .sort((left, right) => compareVersion(String(right.version || ''), String(left.version || ''))),
    [instances]
  );
  const realtimeEffectsEnabled = isWindowVisible;
  const customVisualThemePreset = useMemo(() => buildCustomVisualThemePreset(customVisualTheme), [customVisualTheme]);
  const activeVisualTheme = useMemo(() => {
    if (visualThemeId === CUSTOM_VISUAL_THEME_ID) {
      return customVisualThemePreset;
    }
    return VISUAL_THEME_PRESETS.find((theme) => theme.id === visualThemeId) || VISUAL_THEME_PRESETS[0];
  }, [visualThemeId, customVisualThemePreset]);
  const neonTrailRgb = useMemo(() => parseRgbTriplet(activeVisualTheme.pointerRgb, [56, 189, 248]), [activeVisualTheme.pointerRgb]);
  const defaultThemePreset = useMemo(() => VISUAL_THEME_PRESETS.find((theme) => theme.kind === 'default') || VISUAL_THEME_PRESETS[0], []);
  const solidThemePresets = useMemo(() => VISUAL_THEME_PRESETS.filter((theme) => theme.kind === 'solid'), []);
  const gradientThemePresets = useMemo(() => VISUAL_THEME_PRESETS.filter((theme) => theme.kind === 'gradient'), []);
  const hasSecondaryCustomColor = customVisualTheme.mode === 'gradient';
  const customPrimaryColorHex = useMemo(
    () =>
      normalizeHexColor(
        customVisualTheme.mode === 'gradient' ? customVisualTheme.gradientFrom : customVisualTheme.solidColor,
        DEFAULT_CUSTOM_VISUAL_THEME.solidColor
      ),
    [customVisualTheme.gradientFrom, customVisualTheme.mode, customVisualTheme.solidColor]
  );
  const customSecondaryColorHex = useMemo(
    () => normalizeHexColor(customVisualTheme.gradientTo, DEFAULT_CUSTOM_VISUAL_THEME.gradientTo),
    [customVisualTheme.gradientTo]
  );
  const activeCustomColorHex = useMemo(() => {
    if (activeCustomColorTarget === 'secondary' && customVisualTheme.mode === 'gradient') {
      return normalizeHexColor(customVisualTheme.gradientTo, DEFAULT_CUSTOM_VISUAL_THEME.gradientTo);
    }
    if (customVisualTheme.mode === 'gradient') {
      return normalizeHexColor(customVisualTheme.gradientFrom, DEFAULT_CUSTOM_VISUAL_THEME.gradientFrom);
    }
    return normalizeHexColor(customVisualTheme.solidColor, DEFAULT_CUSTOM_VISUAL_THEME.solidColor);
  }, [activeCustomColorTarget, customVisualTheme.gradientFrom, customVisualTheme.gradientTo, customVisualTheme.mode, customVisualTheme.solidColor]);
  const customColorHueBackground = useMemo(() => rgbToHex(hsvToRgb(customColorPickerHsv.h, 1, 1)), [customColorPickerHsv.h]);
  const customColorPointerPosition = useMemo(
    () => ({
      left: `${(clampUnit(customColorPickerHsv.s) * 100).toFixed(3)}%`,
      top: `${((1 - clampUnit(customColorPickerHsv.v)) * 100).toFixed(3)}%`
    }),
    [customColorPickerHsv.s, customColorPickerHsv.v]
  );
  const setCustomThemeMode = useCallback((nextModeRaw) => {
    const nextMode = String(nextModeRaw || '').trim().toLowerCase();
    if (!CUSTOM_VISUAL_THEME_MODES.has(nextMode)) return;

    setCustomVisualTheme((prev) => {
      const current = normalizeCustomVisualTheme(prev);
      if (current.mode === nextMode) return current;
      if (nextMode === 'gradient') {
        return {
          ...current,
          mode: 'gradient',
          gradientFrom: normalizeHexColor(current.gradientFrom, current.solidColor),
          gradientTo: normalizeHexColor(current.gradientTo, DEFAULT_CUSTOM_VISUAL_THEME.gradientTo)
        };
      }
      return {
        ...current,
        mode: 'solid',
        solidColor: normalizeHexColor(current.solidColor, current.gradientFrom || DEFAULT_CUSTOM_VISUAL_THEME.solidColor)
      };
    });

    if (nextMode === 'solid') {
      setActiveCustomColorTarget('primary');
    }
  }, []);
  const setCustomThemeColorByTarget = useCallback((targetRaw, nextColorRaw) => {
    const target = String(targetRaw || '').trim().toLowerCase() === 'secondary' ? 'secondary' : 'primary';

    setCustomVisualTheme((prev) => {
      const current = normalizeCustomVisualTheme(prev);
      const fallbackColor =
        target === 'secondary' ? normalizeHexColor(current.gradientTo, DEFAULT_CUSTOM_VISUAL_THEME.gradientTo) : normalizeHexColor(
          current.mode === 'gradient' ? current.gradientFrom : current.solidColor,
          DEFAULT_CUSTOM_VISUAL_THEME.solidColor
        );
      const nextColor = normalizeHexColor(nextColorRaw, fallbackColor);

      if (current.mode === 'gradient') {
        if (target === 'secondary') {
          return { ...current, gradientTo: nextColor };
        }
        return { ...current, gradientFrom: nextColor };
      }

      return { ...current, solidColor: nextColor };
    });
  }, []);
  const applyCustomPickerHsv = useCallback(
    (patchOrFactory) => {
      setCustomColorPickerHsv((prev) => {
        const candidate = typeof patchOrFactory === 'function' ? patchOrFactory(prev) : { ...prev, ...patchOrFactory };
        const next = {
          h: ((Number(candidate.h) % 360) + 360) % 360,
          s: clampUnit(candidate.s),
          v: clampUnit(candidate.v)
        };
        const nextHex = rgbToHex(hsvToRgb(next.h, next.s, next.v));
        setCustomThemeColorByTarget(activeCustomColorTarget, nextHex);
        setCustomColorHexInput(nextHex);
        return next;
      });
    },
    [activeCustomColorTarget, setCustomThemeColorByTarget]
  );
  const updateCustomPickerByPointer = useCallback(
    (clientX, clientY) => {
      const planeNode = customColorPlaneRef.current;
      if (!planeNode) return;
      const rect = planeNode.getBoundingClientRect();
      const saturation = clampUnit((clientX - rect.left) / Math.max(1, rect.width));
      const value = 1 - clampUnit((clientY - rect.top) / Math.max(1, rect.height));
      applyCustomPickerHsv((prev) => ({ ...prev, s: saturation, v: value }));
    },
    [applyCustomPickerHsv]
  );
  const handleCustomColorPlanePointerDown = useCallback(
    (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      updateCustomPickerByPointer(event.clientX, event.clientY);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [updateCustomPickerByPointer]
  );
  const handleCustomColorPlanePointerMove = useCallback(
    (event) => {
      if ((event.buttons & 1) !== 1) return;
      updateCustomPickerByPointer(event.clientX, event.clientY);
    },
    [updateCustomPickerByPointer]
  );
  const handleCustomHueChange = useCallback(
    (event) => {
      const nextHue = Number(event.target.value || 0);
      applyCustomPickerHsv((prev) => ({ ...prev, h: nextHue }));
    },
    [applyCustomPickerHsv]
  );
  const commitCustomHexInput = useCallback(() => {
    const nextHex = normalizeHexColor(customColorHexInput, activeCustomColorHex);
    setCustomThemeColorByTarget(activeCustomColorTarget, nextHex);
    setCustomColorHexInput(nextHex);
    setCustomColorPickerHsv(hexToHsv(nextHex, customColorPickerHsv));
  }, [activeCustomColorHex, activeCustomColorTarget, customColorHexInput, customColorPickerHsv, setCustomThemeColorByTarget]);
  const handleCustomHexInputChange = useCallback((event) => {
    const rawValue = String(event.target.value || '')
      .replace(/[^#0-9a-fA-F]/g, '')
      .slice(0, 7);
    const prefixed = rawValue.startsWith('#') || !rawValue ? rawValue : `#${rawValue}`;
    setCustomColorHexInput(prefixed.toLowerCase());
  }, []);

  useEffect(() => {
    if (!hasSecondaryCustomColor && activeCustomColorTarget === 'secondary') {
      setActiveCustomColorTarget('primary');
    }
  }, [activeCustomColorTarget, hasSecondaryCustomColor]);

  useEffect(() => {
    setCustomColorHexInput(activeCustomColorHex);
    setCustomColorPickerHsv(hexToHsv(activeCustomColorHex));
  }, [activeCustomColorHex]);
  const getContentTypeLabel = useCallback(
    (contentType) => {
      const normalized = normalizeContentType(contentType);
      if (normalized === 'resourcepack') return t('contentResourcePacks');
      if (normalized === 'shader') return t('contentShaders');
      return t('contentMods');
    },
    [t]
  );
  const getImportLauncherLabel = useCallback(
    (sourceId) => {
      const normalized = String(sourceId || '').trim().toLowerCase();
      if (normalized === 'official') return t('importLauncherOfficial');
      if (normalized === 'tlauncher') return t('importLauncherTLauncher');
      if (normalized === 'modrinth') return t('importLauncherModrinth');
      if (normalized === 'prism') return t('importLauncherPrism');
      if (normalized === 'multimc') return t('importLauncherMultiMC');
      return sourceId || '';
    },
    [t]
  );
  const activeBrowseFilterGroups = useMemo(
    () => getFilterGroupsForType(browseContentType, languageCode, t),
    [browseContentType, languageCode, t]
  );
  const activeBrowseFilterValues = useMemo(
    () => browseFilters[normalizeContentType(browseContentType)] || {},
    [browseFilters, browseContentType]
  );
  const activeFilterCount = useMemo(
    () =>
      Object.values(activeBrowseFilterValues).reduce((sum, current) => {
        if (!Array.isArray(current)) return sum;
        return sum + current.length;
      }, 0),
    [activeBrowseFilterValues]
  );

  const editingInstance = useMemo(
    () => instances.find((item) => String(item.id) === String(editingInstanceId)) || null,
    [instances, editingInstanceId]
  );
  const activeSkin = useMemo(
    () => skinsState.skins.find((item) => String(item.id) === String(skinsState.activeSkinId || '')) || null,
    [skinsState]
  );
  const previewSkin = useMemo(() => {
    if (skinPreviewId) {
      const found = skinsState.skins.find((item) => String(item.id) === String(skinPreviewId));
      if (found) return found;
    }
    return activeSkin;
  }, [skinsState.skins, skinPreviewId, activeSkin]);
  const resolveSkinCapeDataUrl = useCallback(
    (skin) => {
      if (!skin || !officialProfile.hasLicense) return '';
      if (String(skin.capeMode || '').toLowerCase() !== 'default') return '';
      const matched = skinsState.defaultCapes.find((entry) => String(entry.id) === String(skin.defaultCapeId || ''));
      return matched?.dataUrl || '';
    },
    [officialProfile.hasLicense, skinsState.defaultCapes]
  );

  const getAvatarUrl = (name) => `https://minotar.net/helm/${name?.trim() || 'Steve'}/100.png`;

  const formatErrorDetailsText = useCallback((details) => {
    if (!details) return '';
    if (typeof details === 'string') return details;
    try {
      return JSON.stringify(details, null, 2);
    } catch {
      return String(details);
    }
  }, []);

  const localizeLaunchErrorMessage = useCallback((error, instance) => {
    const code = String(error?.code || '').toUpperCase();
    const details = asObject(error?.details);

    if (code === 'MOD_INCOMPATIBLE') {
      const mod = makeDisplayModName(details.modJar || 'Mod');
      const loaderName = formatLoaderName(String(details.loader || instance?.loader || 'forge').toLowerCase()) || 'Forge';
      const version = String(details.minecraftVersion || instance?.version || '').trim() || '?';
      const targetVersion = String(details.suggestedVersion || '1.8.9').trim() || '1.8.9';
      return t('errorModIncompatible', {
        mod,
        loader: loaderName,
        version,
        targetVersion
      });
    }

    if (code === 'MOD_DEPENDENCY_MISSING') {
      const requiredMods = uniqueStrings(details.requiredMods || []);
      if (requiredMods.length) {
        return t('errorMissingDependencies', { mods: requiredMods.join(', ') });
      }
    }

    if (code === 'GAME_CRASHED') {
      const rawReason = String(error?.message || '')
        .replace(/^minecraft\s+crashed:\s*/i, '')
        .trim();
      if (rawReason) return t('errorMinecraftCrashed', { reason: rawReason });
      return t('errorMinecraftExited');
    }

    return error?.message || t('failedLaunchMinecraft');
  }, [t]);

  const extractInstallCandidatesFromError = (error) => {
    const code = String(error?.code || '').toUpperCase();
    const details = asObject(error?.details);

    if (code === 'MOD_INCOMPATIBLE') {
      const currentVersion = String(details.minecraftVersion || '').trim();
      const suggestedVersion = String(details.suggestedVersion || '').trim();
      if (currentVersion && suggestedVersion && compareVersion(suggestedVersion, currentVersion) > 0) {
        return [];
      }
    }

    const rawCandidates = Array.isArray(details.installCandidates) ? details.installCandidates : [];

    const directCandidates = rawCandidates
      .map((entry) => {
        if (typeof entry === 'string') {
          return { query: entry };
        }
        const value = asObject(entry);
        return {
          query: String(value.query || '').trim(),
          projectId: String(value.projectId || '').trim()
        };
      })
      .filter((entry) => entry.projectId || entry.query);

    if (directCandidates.length) {
      const seen = new Set();
      return directCandidates.filter((entry) => {
        const key = `${entry.projectId || ''}|${String(entry.query || '').toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    if (code === 'MOD_INCOMPATIBLE') {
      const query = buildModSearchQueryFromJarName(details.modJar || '');
      if (query) return [{ query }];
    }

    if (code === 'MOD_DEPENDENCY_MISSING') {
      return uniqueStrings(details.requiredMods || []).map((modId) => ({ query: modId }));
    }

    return [];
  };

  const notifyError = useCallback((message, code = '', details = '', options = {}) => {
    if (!message) return;
    const safeOptions = asObject(options);
    const rawDetails = asObject(safeOptions.rawDetails || details);
    const candidates = Array.isArray(safeOptions.suggestedCandidates)
      ? safeOptions.suggestedCandidates.filter((candidate) => candidate && (candidate.query || candidate.projectId))
      : [];
    setErrorDialog({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      message,
      code: code || '',
      details: formatErrorDetailsText(details),
      rawDetails,
      instanceContext: safeOptions.instanceContext || null,
      suggestedCandidates: candidates,
      suggestedMods: [],
      suggestedModsStatus: candidates.length ? 'pending' : 'idle',
      suggestedInstallBusy: false
    });
  }, [formatErrorDetailsText]);

  const applySkinsStatePayload = useCallback((payload) => {
    const source = payload && typeof payload === 'object' ? payload : {};
    const nextState = {
      rootPath: typeof source.rootPath === 'string' ? source.rootPath : '',
      activeSkinId: source.activeSkinId ? String(source.activeSkinId) : null,
      skins: Array.isArray(source.skins) ? source.skins : [],
      defaultCapes: Array.isArray(source.defaultCapes) ? source.defaultCapes : []
    };
    setSkinsState(nextState);
    setSkinPreviewId((prev) => {
      if (prev && nextState.skins.some((entry) => String(entry.id) === String(prev))) {
        return prev;
      }
      return nextState.activeSkinId || nextState.skins[0]?.id || null;
    });
  }, []);

  const clearSkinPressTimer = useCallback(() => {
    if (skinPressTimerRef.current) {
      clearTimeout(skinPressTimerRef.current);
      skinPressTimerRef.current = null;
    }
  }, []);

  const clearInstancePressTimer = useCallback(() => {
    if (instancePressTimerRef.current) {
      clearTimeout(instancePressTimerRef.current);
      instancePressTimerRef.current = null;
    }
  }, []);

  const resolveReorderTargetId = useCallback(({ pointX, pointY, refMap, draggingId, dragStart, dragMetrics }) => {
    const sourceId = String(draggingId || '');
    if (!sourceId) return null;

    const deltaX = pointX - dragStart.x;
    const deltaY = pointY - dragStart.y;
    if (Math.abs(deltaX) < DRAG_REORDER_DEADZONE_PX && Math.abs(deltaY) < DRAG_REORDER_DEADZONE_PX) {
      return null;
    }

    const sourceNode = refMap.current.get(sourceId);
    if (!sourceNode) return null;
    const sourceRect = sourceNode.getBoundingClientRect();

    const dragWidth = dragMetrics.width || sourceRect.width || 0;
    const dragHeight = dragMetrics.height || sourceRect.height || 0;
    const dragLeft = pointX - dragMetrics.offsetX;
    const dragTop = pointY - dragMetrics.offsetY;
    const draggedCenterX = dragLeft + dragWidth / 2;
    const draggedCenterY = dragTop + dragHeight / 2;

    let nextTargetId = null;
    let minDistance = Number.POSITIVE_INFINITY;

    for (const [id, node] of refMap.current.entries()) {
      if (!node || String(id) === sourceId) continue;
      const rect = node.getBoundingClientRect();
      const centerInsideRect =
        draggedCenterX >= rect.left && draggedCenterX <= rect.right && draggedCenterY >= rect.top && draggedCenterY <= rect.bottom;
      if (!centerInsideRect) continue;

      const candidateCenterX = rect.left + rect.width / 2;
      const candidateCenterY = rect.top + rect.height / 2;
      const distance = Math.hypot(draggedCenterX - candidateCenterX, draggedCenterY - candidateCenterY);

      if (distance < minDistance) {
        minDistance = distance;
        nextTargetId = String(id);
      }
    }

    return nextTargetId;
  }, []);

  const startSkinCardDrag = useCallback((event, skinId) => {
    if (event.button !== 0) return;
    const id = String(skinId || '').trim();
    if (!id) return;
    const cardNode = skinCardRefs.current.get(id);
    const cardRect = cardNode ? cardNode.getBoundingClientRect() : null;
    event.preventDefault();
    event.stopPropagation();
    setSkinDragEnabledId(id);
    setDraggingSkinId(id);
    setSkinDragOverId(null);
    setSkinDragPointer({
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY
    });
    const nextMetrics = {
      offsetX: cardRect ? event.clientX - cardRect.left : 24,
      offsetY: cardRect ? event.clientY - cardRect.top : 24,
      width: cardRect ? cardRect.width : 0,
      height: cardRect ? cardRect.height : 0
    };
    setSkinDragMetrics(nextMetrics);
    skinDragStartRef.current = { x: event.clientX, y: event.clientY };
    skinDragMetricsRef.current = nextMetrics;
    skinDragLastSwapPointRef.current = null;
    skinDragLastTargetRef.current = null;
    skinDragPointerIdRef.current = event.pointerId;
  }, []);

  const startInstanceCardDrag = useCallback((event, instanceId) => {
    if (event.button !== 0) return;
    const id = String(instanceId || '').trim();
    if (!id) return;
    const cardNode = instanceCardRefs.current.get(id);
    const cardRect = cardNode ? cardNode.getBoundingClientRect() : null;
    event.preventDefault();
    event.stopPropagation();
    setInstanceDragEnabledId(id);
    setDraggingInstanceId(id);
    setInstanceDragOverId(null);
    setInstanceDragPointer({
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY
    });
    const nextMetrics = {
      offsetX: cardRect ? event.clientX - cardRect.left : 28,
      offsetY: cardRect ? event.clientY - cardRect.top : 28,
      width: cardRect ? cardRect.width : 0,
      height: cardRect ? cardRect.height : 0
    };
    setInstanceDragMetrics(nextMetrics);
    instanceDragStartRef.current = { x: event.clientX, y: event.clientY };
    instanceDragMetricsRef.current = nextMetrics;
    instanceDragLastSwapPointRef.current = null;
    instanceDragLastTargetRef.current = null;
    instanceDragPointerIdRef.current = event.pointerId;
  }, []);

  const refreshSkins = useCallback(async () => {
    if (!window.launcherSkins?.getState) return;
    const result = await window.launcherSkins.getState();
    if (!result?.ok) {
      notifyError(result?.error?.message || t('skinsFailedLoad'), result?.error?.code || '');
      return;
    }
    applySkinsStatePayload(result.data);
  }, [applySkinsStatePayload, notifyError, t]);

  const refreshOfficialProfile = useCallback(async () => {
    if (!window.launcherSkins?.getOfficialProfile) {
      setOfficialProfile(EMPTY_OFFICIAL_PROFILE);
      return;
    }

    const result = await window.launcherSkins.getOfficialProfile({
      username: activeMinecraftUsername
    });
    if (!result?.ok) {
      setOfficialProfile(EMPTY_OFFICIAL_PROFILE);
      return;
    }

    const source = result.data && typeof result.data === 'object' ? result.data : {};
    setOfficialProfile({
      username: typeof source.username === 'string' ? source.username : '',
      uuid: typeof source.uuid === 'string' ? source.uuid : '',
      hasLicense: Boolean(source.hasLicense),
      hasCape: Boolean(source.hasCape),
      model: source.model === 'slim' ? 'slim' : 'wide',
      skinDataUrl: typeof source.skinDataUrl === 'string' ? source.skinDataUrl : '',
      capeDataUrl: typeof source.capeDataUrl === 'string' ? source.capeDataUrl : ''
    });
  }, [activeMinecraftUsername]);

  const toggleBrowseFilterOption = useCallback((groupId, optionId) => {
    const contentType = normalizeContentType(browseContentType);
    setBrowseFilters((prev) => {
      const currentForType = prev[contentType] || {};
      const selected = Array.isArray(currentForType[groupId]) ? currentForType[groupId] : [];
      const nextValues = selected.includes(optionId) ? selected.filter((entry) => entry !== optionId) : [...selected, optionId];
      return {
        ...prev,
        [contentType]: {
          ...currentForType,
          [groupId]: nextValues
        }
      };
    });
    setCurrentPage(0);
  }, [browseContentType]);

  const toggleBrowseFilterGroupOpen = useCallback((groupId) => {
    const contentType = normalizeContentType(browseContentType);
    setOpenBrowseFilterGroups((prev) => ({
      ...prev,
      [contentType]: {
        ...(prev[contentType] || {}),
        [groupId]: !(prev[contentType] || {})[groupId]
      }
    }));
  }, [browseContentType]);

  const clearBrowseFiltersForType = useCallback(() => {
    const contentType = normalizeContentType(browseContentType);
    setBrowseFilters((prev) => ({
      ...prev,
      [contentType]: { ...(DEFAULT_BROWSE_FILTERS[contentType] || {}) }
    }));
    setCurrentPage(0);
  }, [browseContentType]);

  const applyNickname = useCallback((nextNickname) => {
    const normalized = normalizeNicknameValue(nextNickname);
    if (!normalized) return;
    setUsername(normalized);
    setNicknamePresets((prev) => normalizeNicknameList([normalized, ...prev], normalized));
  }, []);

  const addNicknamePreset = useCallback(() => {
    const normalized = normalizeNicknameValue(nicknameDraft);
    if (!normalized) {
      notifyError(t('nicknameEmpty'));
      return;
    }
    if (nicknameOptions.some((entry) => entry.toLowerCase() === normalized.toLowerCase())) {
      notifyError(t('nicknameAlreadyExists'));
      return;
    }
    applyNickname(normalized);
    setNicknameDraft('');
  }, [applyNickname, nicknameDraft, nicknameOptions, notifyError, t]);

  const removeNicknamePreset = useCallback(
    (targetNickname) => {
      const normalizedTarget = normalizeNicknameValue(targetNickname);
      if (!normalizedTarget) return;
      const next = nicknameOptions.filter((entry) => entry.toLowerCase() !== normalizedTarget.toLowerCase());
      const fallback = next[0] || 'Player';
      setNicknamePresets(normalizeNicknameList(next, fallback));
      if (offlineUsername.toLowerCase() === normalizedTarget.toLowerCase()) {
        setUsername(fallback);
      }
    },
    [nicknameOptions, offlineUsername]
  );

  useEffect(() => {
    if (!window.launcherWindow) return undefined;

    window.launcherWindow.isMaximized().then(setIsWindowMaximized).catch(() => {});
    const unsubscribe = window.launcherWindow.onMaximizedChange((nextState) => {
      setIsWindowMaximized(nextState);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    const updateVisibility = () => {
      setIsWindowVisible(document.visibilityState !== 'hidden');
    };

    const onWindowFocus = () => setIsWindowVisible(true);
    const onWindowBlur = () => {
      if (document.visibilityState === 'hidden') {
        setIsWindowVisible(false);
      }
    };

    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      document.removeEventListener('visibilitychange', updateVisibility);
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, []);

  useEffect(() => {
    if (!isNicknameMenuOpen) return undefined;
    const onPointerDown = (event) => {
      const node = nicknameMenuRef.current;
      if (!node) return;
      if (node.contains(event.target)) return;
      setIsNicknameMenuOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isNicknameMenuOpen]);

  useEffect(() => {
    const root = launcherRootRef.current;
    if (!root) return undefined;

    const centerX = Math.round(window.innerWidth / 2);
    const centerY = Math.round(window.innerHeight / 2);
    pointerGlowTargetRef.current = { x: centerX, y: centerY };
    pointerGlowCurrentRef.current = { x: centerX, y: centerY };
    pointerDistortVelocityRef.current = { x: 0, y: 0 };
    root.style.setProperty('--pointer-x', `${centerX}px`);
    root.style.setProperty('--pointer-y', `${centerY}px`);
    root.style.setProperty('--pointer-opacity', cursorGlowEnabled && realtimeEffectsEnabled ? '0.72' : '0');
    root.style.setProperty('--pointer-distort-opacity', cursorDistortionEnabled && realtimeEffectsEnabled ? '0.54' : '0');

    if ((!cursorGlowEnabled && !cursorDistortionEnabled) || !realtimeEffectsEnabled) {
      if (pointerGlowLoopRef.current) {
        cancelAnimationFrame(pointerGlowLoopRef.current);
        pointerGlowLoopRef.current = null;
      }
      return undefined;
    }

    let disposed = false;
    let isInside = true;

    const onPointerMove = (event) => {
      pointerGlowTargetRef.current = {
        x: event.clientX,
        y: event.clientY
      };
      isInside = true;
    };

    const onPointerLeave = () => {
      isInside = false;
    };

    const onPointerEnter = () => {
      isInside = true;
    };

    const onWindowBlur = () => {
      isInside = false;
    };

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      if (now - pointerGlowLastFrameAtRef.current < 24) {
        pointerGlowLoopRef.current = requestAnimationFrame(tick);
        return;
      }
      pointerGlowLastFrameAtRef.current = now;

      const current = pointerGlowCurrentRef.current;
      const target = pointerGlowTargetRef.current;
      const velocity = pointerDistortVelocityRef.current;
      const previousX = current.x;
      const previousY = current.y;

      current.x += (target.x - current.x) * 0.19;
      current.y += (target.y - current.y) * 0.19;

      const frameDx = current.x - previousX;
      const frameDy = current.y - previousY;
      velocity.x += (frameDx - velocity.x) * 0.22;
      velocity.y += (frameDy - velocity.y) * 0.22;

      root.style.setProperty('--pointer-x', `${current.x.toFixed(2)}px`);
      root.style.setProperty('--pointer-y', `${current.y.toFixed(2)}px`);

      const desiredGlowOpacity = cursorGlowEnabled ? (isInside ? 0.78 : 0.2) : 0;
      const previousGlowOpacityRaw = Number(root.style.getPropertyValue('--pointer-opacity') || desiredGlowOpacity);
      const nextGlowOpacity = previousGlowOpacityRaw + (desiredGlowOpacity - previousGlowOpacityRaw) * 0.1;
      root.style.setProperty('--pointer-opacity', `${nextGlowOpacity.toFixed(3)}`);

      const desiredDistortOpacity = cursorDistortionEnabled ? (isInside ? 0.54 : 0.08) : 0;
      const previousDistortOpacityRaw = Number(root.style.getPropertyValue('--pointer-distort-opacity') || desiredDistortOpacity);
      const nextDistortOpacity = previousDistortOpacityRaw + (desiredDistortOpacity - previousDistortOpacityRaw) * 0.12;
      root.style.setProperty('--pointer-distort-opacity', `${nextDistortOpacity.toFixed(3)}`);

      pointerGlowLoopRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('pointerenter', onPointerEnter);
    window.addEventListener('blur', onWindowBlur);
    pointerGlowLoopRef.current = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('pointerenter', onPointerEnter);
      window.removeEventListener('blur', onWindowBlur);
      if (pointerGlowLoopRef.current) {
        cancelAnimationFrame(pointerGlowLoopRef.current);
        pointerGlowLoopRef.current = null;
      }
    };
  }, [cursorGlowEnabled, cursorDistortionEnabled, realtimeEffectsEnabled]);

  useEffect(() => {
    const canvas = neonTrailCanvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return undefined;

    if (neonTrailLoopRef.current) {
      cancelAnimationFrame(neonTrailLoopRef.current);
      neonTrailLoopRef.current = null;
    }

    if (!cursorDistortionEnabled || !realtimeEffectsEnabled) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      neonTrailPointsRef.current = [];
      return undefined;
    }

    const [red, green, blue] = neonTrailRgb;
    let disposed = false;
    let canvasWidth = 0;
    let canvasHeight = 0;
    let dpr = 1;
    const pointCount = 16;

    const seedPoints = () => {
      const baseX = pointerGlowCurrentRef.current.x || window.innerWidth * 0.5;
      const baseY = pointerGlowCurrentRef.current.y || window.innerHeight * 0.5;
      neonTrailPointsRef.current = Array.from({ length: pointCount }, (_, index) => ({
        x: baseX,
        y: baseY,
        noiseSeed: (index + 1) * 0.75
      }));
    };

    const resizeCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasWidth = Math.max(1, Math.round(window.innerWidth));
      canvasHeight = Math.max(1, Math.round(window.innerHeight));
      canvas.width = Math.max(1, Math.round(canvasWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvasHeight * dpr));
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedPoints();
    };

    const drawTrail = () => {
      if (disposed) return;
      const now = performance.now();
      if (now - neonTrailLastFrameAtRef.current < 22) {
        neonTrailLoopRef.current = requestAnimationFrame(drawTrail);
        return;
      }
      neonTrailLastFrameAtRef.current = now;

      const points = neonTrailPointsRef.current;
      if (!points.length) seedPoints();

      const head = points[0];
      const target = pointerGlowCurrentRef.current;
      const velocity = pointerDistortVelocityRef.current;
      const speed = Math.min(1.35, Math.hypot(velocity.x, velocity.y) * 10);

      head.x += (target.x - head.x) * (0.34 + speed * 0.18);
      head.y += (target.y - head.y) * (0.34 + speed * 0.18);

      for (let index = 1; index < points.length; index += 1) {
        const previous = points[index - 1];
        const current = points[index];
        const followLerp = Math.max(0.12, 0.42 - index * 0.018);
        current.x += (previous.x - current.x) * followLerp;
        current.y += (previous.y - current.y) * followLerp;
      }

      context.clearRect(0, 0, canvasWidth, canvasHeight);
      context.save();
      context.globalCompositeOperation = 'screen';
      context.lineCap = 'round';
      context.lineJoin = 'round';

      if (points.length > 2) {
        // Draw a smooth tapered ribbon instead of segmented "snake" circles.
        for (let index = 1; index < points.length - 1; index += 1) {
          const previous = points[index - 1];
          const current = points[index];
          const next = points[index + 1];
          const ratio = 1 - index / (points.length - 1);
          const midX = (current.x + next.x) * 0.5;
          const midY = (current.y + next.y) * 0.5;
          const alpha = 0.045 + ratio * 0.24;
          const blur = 3 + ratio * 17 + speed * 10;

          context.beginPath();
          context.moveTo(previous.x, previous.y);
          context.quadraticCurveTo(current.x, current.y, midX, midY);
          context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(3)})`;
          context.lineWidth = 0.8 + ratio * (3.9 + speed * 4.4);
          context.shadowBlur = blur;
          context.shadowColor = `rgba(${red}, ${green}, ${blue}, ${(0.10 + ratio * 0.33).toFixed(3)})`;
          context.stroke();
        }

        const tip = points[0];
        const tipNext = points[1];
        context.beginPath();
        context.moveTo(tip.x, tip.y);
        context.quadraticCurveTo((tip.x + tipNext.x) * 0.5, (tip.y + tipNext.y) * 0.5, tipNext.x, tipNext.y);
        context.strokeStyle = `rgba(255, 255, 255, ${(0.3 + speed * 0.16).toFixed(3)})`;
        context.shadowBlur = 10 + speed * 10;
        context.shadowColor = `rgba(${red}, ${green}, ${blue}, ${(0.30 + speed * 0.18).toFixed(3)})`;
        context.lineWidth = 0.8 + speed * 1.05;
        context.stroke();
      }

      context.restore();
      neonTrailLoopRef.current = requestAnimationFrame(drawTrail);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    neonTrailLoopRef.current = requestAnimationFrame(drawTrail);

    return () => {
      disposed = true;
      window.removeEventListener('resize', resizeCanvas);
      if (neonTrailLoopRef.current) {
        cancelAnimationFrame(neonTrailLoopRef.current);
        neonTrailLoopRef.current = null;
      }
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [cursorDistortionEnabled, neonTrailRgb, realtimeEffectsEnabled]);

  useEffect(() => {
    const loadInitialState = async () => {
      if (!window.launcherData) {
        persistedReadyRef.current = true;
        return;
      }

      const result = await window.launcherData.loadState();
      if (result?.ok && result.data) {
        setInstances(Array.isArray(result.data.instances) ? result.data.instances.map(normalizeInstanceData) : []);
        const savedUsername = normalizeNicknameValue(result.data.username || 'Player') || 'Player';
        setUsername(savedUsername);
        setNicknamePresets(normalizeNicknameList(result.data.nicknamePresets, savedUsername));
        setGlobalRam(Number(result.data.globalRam || 4));
        setLauncherLanguage(result.data.language === 'ru' ? 'ru' : 'en');
        setCursorGlowEnabled(result.data.cursorGlowEnabled !== false);
        setCursorDistortionEnabled(result.data.cursorDistortionEnabled === true);
        setAmbientEffect(BACKGROUND_FX_OPTIONS.includes(result.data.ambientEffect) ? result.data.ambientEffect : 'stars');
        const persistedThemeId = String(result.data.visualThemeId || '').trim().toLowerCase();
        setVisualThemeId(ALLOWED_VISUAL_THEME_IDS.has(persistedThemeId) ? persistedThemeId : DEFAULT_VISUAL_THEME_ID);
        setCustomVisualTheme(normalizeCustomVisualTheme(result.data.customVisualTheme));
        const persistedLatestUpdate = result.data.latestInstalledUpdate && typeof result.data.latestInstalledUpdate === 'object' ? result.data.latestInstalledUpdate : {};
        const persistedLatestVersion = String(persistedLatestUpdate.version || '').trim();
        const persistedLatestNotes = Array.isArray(persistedLatestUpdate.notes)
          ? persistedLatestUpdate.notes
              .map((entry) => String(entry || '').trim())
              .filter(Boolean)
              .slice(0, 8)
          : [];
        setLatestInstalledUpdate({
          version: persistedLatestVersion,
          notes: persistedLatestNotes
        });
      }

      persistedReadyRef.current = true;
    };

    loadInitialState();
  }, []);

  useEffect(() => {
    if (ambientEffect !== 'stars' || !realtimeEffectsEnabled) {
      setComets([]);
      return undefined;
    }

    let disposed = false;
    let cometTimer = null;

    const scheduleNextComet = () => {
      const nextDelayMs = 9000;
      cometTimer = setTimeout(() => {
        if (disposed) return;
        const spawnCount = Math.floor(randomBetween(1, 3));
        const nextComets = Array.from({ length: spawnCount }, () => createCometParticle());
        setComets((prev) => {
          const recent = prev.slice(-6);
          return [...recent, ...nextComets];
        });
        scheduleNextComet();
      }, nextDelayMs);
    };

    scheduleNextComet();

    return () => {
      disposed = true;
      if (cometTimer) clearTimeout(cometTimer);
    };
  }, [ambientEffect, realtimeEffectsEnabled]);

  useEffect(() => {
    if (ambientEffect !== 'rain' || !realtimeEffectsEnabled) {
      setRainWindDrift(-18);
      return undefined;
    }

    let disposed = false;
    let calmTimer = null;
    let gustTimer = null;

    const scheduleWindCycle = () => {
      const calmDelayMs = randomBetween(4200, 8200);
      calmTimer = setTimeout(() => {
        if (disposed) return;
        const gustDrift = -randomBetween(46, 110);
        setRainWindDrift(gustDrift);

        const gustDurationMs = randomBetween(1800, 3600);
        gustTimer = setTimeout(() => {
          if (disposed) return;
          setRainWindDrift(-randomBetween(14, 28));
          scheduleWindCycle();
        }, gustDurationMs);
      }, calmDelayMs);
    };

    setRainWindDrift(-randomBetween(14, 24));
    scheduleWindCycle();

    return () => {
      disposed = true;
      if (calmTimer) clearTimeout(calmTimer);
      if (gustTimer) clearTimeout(gustTimer);
    };
  }, [ambientEffect, realtimeEffectsEnabled]);

  useEffect(() => {
    refreshSkins().catch(() => {});
  }, [refreshSkins]);

  useEffect(() => {
    refreshOfficialProfile().catch(() => {});
  }, [refreshOfficialProfile]);

  useEffect(() => {
    skinsOrderRef.current = Array.isArray(skinsState.skins) ? skinsState.skins : [];
  }, [skinsState.skins]);

  useEffect(() => {
    const resetDragArming = () => {
      clearSkinPressTimer();
      clearInstancePressTimer();
      setSkinDragEnabledId(null);
      setInstanceDragEnabledId(null);
    };

    window.addEventListener('mouseup', resetDragArming);
    window.addEventListener('dragend', resetDragArming);
    return () => {
      window.removeEventListener('mouseup', resetDragArming);
      window.removeEventListener('dragend', resetDragArming);
    };
  }, [clearInstancePressTimer, clearSkinPressTimer]);


  useEffect(() => {
    if (!window.launcherMinecraft) return;

    setVersionsLoading(true);
    window.launcherMinecraft
      .listGameVersions()
      .then((result) => {
        if (result?.ok && Array.isArray(result.data) && result.data.length) {
          setGameVersions(result.data);
          setSelectedVersion((prev) => (result.data.includes(prev) ? prev : result.data[0]));
        }
      })
      .catch(() => {})
      .finally(() => setVersionsLoading(false));
  }, []);

  useEffect(() => {
    if (!window.launcherSystem?.getMemoryInfo) return;

    window.launcherSystem
      .getMemoryInfo()
      .then((result) => {
        if (!result?.ok) return;
        const detectedMax = Math.max(1, Number(result.data?.totalGb || 16));
        setMaxRamGb(detectedMax);
      })
      .catch(() => {});
  }, []);

  const requestLauncherUpdateCheck = useCallback(async () => {
    if (!window.launcherUpdater?.check) {
      return { ok: false, skipped: true };
    }

    const result = await window.launcherUpdater.check();
    if (!result?.ok) {
      setUpdaterBanner((prev) => ({
        ...prev,
        state: 'idle',
        version: '',
        percent: 0,
        message: '',
        notes: []
      }));
      setUpdateActionBusy(false);
    }
    return result;
  }, []);

  useEffect(() => {
    if (!window.launcherUpdater?.onState || !window.launcherUpdater?.check) return undefined;

    const applyUpdaterPayload = (payload) => {
      const source = payload && typeof payload === 'object' ? payload : {};
      const nextState = String(source.state || '').trim().toLowerCase() || 'idle';
      const nextPercentRaw = Number(source.percent || 0);
      const nextPercent = Number.isFinite(nextPercentRaw) ? Math.max(0, Math.min(100, Math.round(nextPercentRaw))) : 0;
      const nextVersion = String(source.version || '').trim();
      const nextMessage = String(source.message || '').trim();
      const nextRawNotes = Array.isArray(source.notes)
        ? source.notes
            .map((entry) => String(entry || '').trim())
            .filter(Boolean)
            .slice(0, 8)
        : typeof source.notes === 'string' && source.notes.trim()
          ? [source.notes.trim()]
          : [];
      const nextNotes = normalizeUpdateNotes(nextRawNotes, languageCode);
      const isUpdateVisibleState = nextState === 'available' || nextState === 'downloading' || nextState === 'downloaded' || nextState === 'installing';
      const keepPreviousNotes = nextState === 'downloading' || nextState === 'downloaded' || nextState === 'installing';

      setUpdaterBanner((prev) => ({
        ...prev,
        state: nextState,
        version: isUpdateVisibleState ? nextVersion || prev.version : '',
        percent: nextState === 'downloading' ? nextPercent : nextState === 'downloaded' || nextState === 'installing' ? 100 : 0,
        message: nextState === 'error' ? nextMessage : '',
        notes: isUpdateVisibleState ? (nextNotes.length ? nextNotes : keepPreviousNotes ? prev.notes : []) : []
      }));

      if (nextState === 'available') {
        setUpdateBannerDismissed(false);
      }

      const shouldPersistLatestInstalled =
        nextState === 'downloaded' || nextState === 'installing' || nextState === 'idle';
      if (shouldPersistLatestInstalled && (nextVersion || nextRawNotes.length)) {
        setLatestInstalledUpdate((prev) => {
          const resolvedVersion = nextVersion || prev.version;
          const didVersionChange = Boolean(nextVersion) && nextVersion !== prev.version;
          return {
            version: resolvedVersion,
            notes: nextRawNotes.length ? nextRawNotes : didVersionChange ? [] : prev.notes
          };
        });
      }

      if (nextState === 'idle' || nextState === 'error') {
        setUpdateActionBusy(false);
      }
    };

    const unsubscribe = window.launcherUpdater.onState((payload) => {
      applyUpdaterPayload(payload);
    });

    requestLauncherUpdateCheck().catch(() => {});

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [languageCode, requestLauncherUpdateCheck]);

  useEffect(() => {
    setGlobalRam((prev) => Math.min(Math.max(1, prev), maxRamGb));
  }, [maxRamGb]);

  useEffect(() => {
    setInstances((prev) => {
      let changed = false;
      const next = prev.map((instance) => {
        if (Number(instance.ram || 0) === Number(globalRam)) return instance;
        changed = true;
        return { ...instance, ram: globalRam };
      });
      return changed ? next : prev;
    });
  }, [globalRam]);

  useEffect(() => {
    instancesRef.current = instances;
  }, [instances]);

  useEffect(() => {
    if (!persistedReadyRef.current || !window.launcherData) return undefined;

    const timer = setTimeout(() => {
      window.launcherData
        .saveState({
          instances,
          username,
          nicknamePresets,
          globalRam,
          language: launcherLanguage,
          cursorGlowEnabled,
          cursorDistortionEnabled,
          ambientEffect,
          visualThemeId,
          customVisualTheme,
          latestInstalledUpdate
        })
        .catch(() => {});
    }, 250);

    return () => clearTimeout(timer);
  }, [instances, username, nicknamePresets, globalRam, launcherLanguage, cursorGlowEnabled, cursorDistortionEnabled, ambientEffect, visualThemeId, customVisualTheme, latestInstalledUpdate]);

  useEffect(() => {
    if (!window.launcherMinecraft) return undefined;

    const unsubscribeInstall = window.launcherMinecraft.onInstallProgress((payload) => {
      if (!payload?.instanceId) return;
      const targetId = String(payload.instanceId);
      const exists = instancesRef.current.some((instance) => String(instance.id) === targetId);
      if (!exists) {
        setInstallBanner((current) => (current?.instanceId === targetId ? null : current));
        setInstallLogs([]);
        return;
      }
      const nextPercent = Number.isFinite(payload.percent) ? Math.max(0, Math.min(100, Math.round(payload.percent))) : 0;

      setInstances((prev) =>
        prev.map((instance) =>
          String(instance.id) === targetId
            ? {
                ...instance,
                installState: payload.stage === 'done' ? 'installed' : 'installing',
                installProgress: nextPercent,
                installStage: payload.stage || 'prepare',
                lastError: ''
              }
            : instance
        )
      );

      setInstallBanner({
        instanceId: targetId,
        instanceName: payload.instanceName || t('instanceLabel'),
        percent: nextPercent,
        stageLabel: payload.stageLabel || t('installing'),
        message: payload.message || t('preparingFiles')
      });

      if (payload.message) {
        setInstallLogs((prev) => {
          const nextEntry = `[${payload.stageLabel || payload.stage || t('preparing')}] ${payload.message}`;
          if (prev[prev.length - 1] === nextEntry) return prev;
          const next = [...prev, nextEntry];
          return next.slice(-5);
        });
      }

      if (payload.stage === 'done') {
        setTimeout(() => {
          setInstallBanner((current) => (current?.instanceId === targetId ? null : current));
          setInstallLogs([]);
        }, 1500);
      }
    });

    const unsubscribeLaunch = window.launcherMinecraft.onLaunchState((payload) => {
      if (!payload?.instanceId) return;
      const targetId = String(payload.instanceId);
      const exists = instancesRef.current.some((instance) => String(instance.id) === targetId);
      if (!exists) return;

      if (payload.state === 'running') {
        launchRunningSeenRef.current.add(targetId);
        setInstances((prev) =>
          prev.map((instance) =>
            String(instance.id) === targetId
              ? {
                  ...instance,
                  isRunning: true,
                  lastError: ''
                }
              : instance
          )
        );
      }

      if (payload.state === 'stopped') {
        const crashMessage = typeof payload.crashMessage === 'string' ? payload.crashMessage.trim() : '';
        const crashCode = typeof payload.crashCode === 'string' ? payload.crashCode : '';
        const crashDetails = asObject(payload.crashDetails);
        const wasRunningSession = launchRunningSeenRef.current.has(targetId);
        launchRunningSeenRef.current.delete(targetId);
        const targetInstance = instancesRef.current.find((instance) => String(instance.id) === targetId) || null;
        const localizedCrashMessage =
          crashMessage && targetInstance
            ? localizeLaunchErrorMessage(
                {
                  code: crashCode || 'GAME_CRASHED',
                  message: crashMessage,
                  details: crashDetails
                },
                targetInstance
              )
            : '';
        setInstances((prev) =>
          prev.map((instance) =>
            String(instance.id) === targetId
              ? {
                  ...instance,
                  isRunning: false,
                  lastError: localizedCrashMessage || ''
                }
              : instance
          )
        );

        if (localizedCrashMessage && wasRunningSession && targetInstance) {
          const crashError = {
            code: crashCode || 'GAME_CRASHED',
            message: crashMessage,
            details: crashDetails
          };
          notifyError(localizedCrashMessage, crashError.code, crashError.details || '', {
            rawDetails: asObject(crashError.details),
            instanceContext: {
              id: String(targetInstance.id),
              name: targetInstance.name,
              version: targetInstance.version,
              loader: targetInstance.loader,
              installPath: targetInstance.installPath
            },
            suggestedCandidates: extractInstallCandidatesFromError(crashError)
          });
        }
      }
    });

    const unsubscribeMod = window.launcherMinecraft.onModDownloadProgress((payload) => {
      const targetId = String(payload?.instanceId || '');
      if (targetId && !instancesRef.current.some((instance) => String(instance.id) === targetId)) {
        return;
      }
      setModTransfer(payload || null);
      if (payload?.status === 'done') {
        setTimeout(() => {
          setModTransfer((current) => {
            if (!current) return current;
            const sameProject = String(current.projectId || '') === String(payload.projectId || '');
            const sameType = normalizeContentType(current.contentType || 'mod') === normalizeContentType(payload.contentType || 'mod');
            return sameProject && sameType ? null : current;
          });
        }, 700);
      }
    });

    return () => {
      if (typeof unsubscribeInstall === 'function') unsubscribeInstall();
      if (typeof unsubscribeLaunch === 'function') unsubscribeLaunch();
      if (typeof unsubscribeMod === 'function') unsubscribeMod();
    };
  }, [t, localizeLaunchErrorMessage, notifyError]);

  const fetchMods = useCallback(async (query = '', versionFilter = '', loaderFilter = '', page = 0, contentType = 'mod', selectedFilters = {}) => {
    setIsLoadingMods(true);
    try {
      const normalizedType = normalizeContentType(contentType);
      const facets = [[`project_type:${normalizedType}`]];
      if (versionFilter) facets.push([`versions:${versionFilter}`]);

      if (normalizedType === 'mod') {
        const loaderFacets = uniqueStrings([
          ...(loaderFilter && loaderFilter !== 'vanilla' ? [loaderFilter] : []),
          ...mapSelectedToFacetValues('mod', 'loaders', selectedFilters?.loaders || [])
        ])
          .map((loader) => toModrinthLoader(loader))
          .filter((loader) => loader && loader !== 'vanilla');
        if (loaderFacets.length) facets.push(loaderFacets.map((loader) => `categories:${loader}`));

        const categoryFacets = mapSelectedToFacetValues('mod', 'categories', selectedFilters?.categories || []);
        if (categoryFacets.length) facets.push(categoryFacets.map((category) => `categories:${category}`));
      }

      if (normalizedType === 'resourcepack') {
        const resolutionFacets = mapSelectedToFacetValues('resourcepack', 'resolution', selectedFilters?.resolution || []);
        if (resolutionFacets.length) facets.push(resolutionFacets.map((resolution) => `categories:${resolution}`));

        const categoryFacets = mapSelectedToFacetValues('resourcepack', 'categories', selectedFilters?.categories || []);
        if (categoryFacets.length) facets.push(categoryFacets.map((category) => `categories:${category}`));

        const featureFacets = mapSelectedToFacetValues('resourcepack', 'features', selectedFilters?.features || []);
        if (featureFacets.length) facets.push(featureFacets.map((feature) => `categories:${feature}`));
      }

      if (normalizedType === 'shader') {
        const loaderFacets = mapSelectedToFacetValues('shader', 'loaders', selectedFilters?.loaders || []);
        if (loaderFacets.length) facets.push(loaderFacets.map((loader) => `categories:${loader}`));

        const categoryFacets = mapSelectedToFacetValues('shader', 'categories', selectedFilters?.categories || []);
        if (categoryFacets.length) facets.push(categoryFacets.map((category) => `categories:${category}`));

        const featureFacets = mapSelectedToFacetValues('shader', 'features', selectedFilters?.features || []);
        if (featureFacets.length) facets.push(featureFacets.map((feature) => `categories:${feature}`));

        const requirementFacets = mapSelectedToFacetValues('shader', 'requirements', selectedFilters?.requirements || []);
        if (requirementFacets.length) facets.push(requirementFacets.map((requirement) => `categories:${requirement}`));
      }

      const params = new URLSearchParams({
        query: query.trim(),
        limit: String(MODS_PER_PAGE),
        offset: String(page * MODS_PER_PAGE),
        index: 'relevance',
        facets: JSON.stringify(facets)
      });

      const response = await fetch(`https://api.modrinth.com/v2/search?${params}`);
      const data = await response.json();
      setMods(data?.hits || []);
      setTotalMods(data?.total_hits || 0);
    } catch (error) {
      console.error('Mods API Error:', error);
    } finally {
      setIsLoadingMods(false);
    }
  }, []);

  const resolveSuggestedProjectFromModrinth = useCallback(
    async (candidate, instanceContext) => {
      const safeCandidate = asObject(candidate);
      const safeInstance = asObject(instanceContext);
      const version = String(safeInstance.version || '').trim();
      const loader = String(safeInstance.loader || '').trim().toLowerCase();
      const modrinthLoader = toModrinthLoader(loader) || 'forge';
      if (!version) return null;

      const fallbackAuthor = t('creatorUnknown');
      const normalizeProject = (hit) => {
        if (!hit || typeof hit !== 'object') return null;
        const projectId = String(hit.project_id || hit.id || '').trim();
        if (!projectId) return null;
        return {
          projectId,
          title: hit.title || humanizeSlug(hit.slug || projectId),
          author: hit.author || fallbackAuthor,
          iconUrl: hit.icon_url || null
        };
      };

      const projectId = String(safeCandidate.projectId || '').trim();
      if (projectId) {
        try {
          const versionParams = new URLSearchParams({
            game_versions: JSON.stringify([version]),
            loaders: JSON.stringify([modrinthLoader])
          });
          const versionResponse = await fetch(`https://api.modrinth.com/v2/project/${encodeURIComponent(projectId)}/version?${versionParams}`);
          if (!versionResponse.ok) return null;
          const versions = await versionResponse.json();
          if (!Array.isArray(versions) || versions.length === 0) return null;

          const projectResponse = await fetch(`https://api.modrinth.com/v2/project/${encodeURIComponent(projectId)}`);
          if (!projectResponse.ok) return null;
          const projectData = await projectResponse.json();
          return normalizeProject(projectData);
        } catch {
          return null;
        }
      }

      const query = String(safeCandidate.query || '').trim();
      if (!query) return null;

      const facets = [[`project_type:mod`], [`versions:${version}`]];
      if (modrinthLoader && modrinthLoader !== 'vanilla') facets.push([`categories:${modrinthLoader}`]);

      try {
        const params = new URLSearchParams({
          query,
          limit: '8',
          index: 'relevance',
          facets: JSON.stringify(facets)
        });
        const response = await fetch(`https://api.modrinth.com/v2/search?${params}`);
        if (!response.ok) return null;
        const data = await response.json();
        const hits = Array.isArray(data?.hits) ? data.hits : [];
        const normalizedHits = hits.map(normalizeProject).filter(Boolean);
        if (!normalizedHits.length) return null;

        const loweredQuery = query.toLowerCase();
        const exact = normalizedHits.find((item) => {
          const title = String(item.title || '').toLowerCase();
          const pid = String(item.projectId || '').toLowerCase();
          return title === loweredQuery || pid === loweredQuery;
        });
        return exact || normalizedHits[0];
      } catch {
        return null;
      }
    },
    [t]
  );

  useEffect(() => {
    if (!errorDialog || errorDialog.suggestedModsStatus !== 'pending') return undefined;

    const dialogId = errorDialog.id;
    const instanceContext = asObject(errorDialog.instanceContext);
    const candidates = Array.isArray(errorDialog.suggestedCandidates) ? errorDialog.suggestedCandidates : [];
    if (!instanceContext.id || !candidates.length) {
      setErrorDialog((prev) => (prev?.id === dialogId ? { ...prev, suggestedModsStatus: 'idle' } : prev));
      return undefined;
    }

    setErrorDialog((prev) => (prev?.id === dialogId ? { ...prev, suggestedModsStatus: 'loading' } : prev));

    const resolve = async () => {
      const found = [];
      const seenProjects = new Set();

      for (const candidate of candidates) {
        const result = await resolveSuggestedProjectFromModrinth(candidate, instanceContext);
        if (!result) continue;
        const key = String(result.projectId || '').trim();
        if (!key || seenProjects.has(key)) continue;
        seenProjects.add(key);
        found.push(result);
      }

      setErrorDialog((prev) =>
        prev?.id === dialogId
          ? {
              ...prev,
              suggestedModsStatus: 'ready',
              suggestedMods: found
            }
          : prev
      );
    };

    resolve().catch(() => {
      setErrorDialog((prev) => (prev?.id === dialogId ? { ...prev, suggestedModsStatus: 'error', suggestedMods: [] } : prev));
    });

    return undefined;
  }, [errorDialog, resolveSuggestedProjectFromModrinth]);

  useEffect(() => {
    if (activeTab !== 'browse') return;
    const timer = setTimeout(() => {
      const selectedFilters = browseFilters[normalizeContentType(browseContentType)] || {};
      fetchMods(modSearch, activeFilter.version, activeFilter.loader, currentPage, browseContentType, selectedFilters);
    }, 350);
    return () => clearTimeout(timer);
  }, [activeTab, modSearch, activeFilter, currentPage, fetchMods, browseContentType, browseFilters]);

  useEffect(() => {
    const pages = Math.max(1, Math.ceil(totalMods / MODS_PER_PAGE));
    if (currentPage > pages - 1) {
      setCurrentPage(Math.max(0, pages - 1));
    }
  }, [totalMods, currentPage]);

  useEffect(() => {
    if (activeFilter.loader && !isLoaderSupported(activeFilter.version || selectedVersion, activeFilter.loader)) {
      setActiveFilter((prev) => ({ ...prev, loader: '' }));
    }
  }, [activeFilter.loader, activeFilter.version, selectedVersion]);

  useEffect(() => {
    if (browseContentType !== 'mod' && activeFilter.loader) {
      setActiveFilter((prev) => ({ ...prev, loader: '' }));
    }
  }, [browseContentType, activeFilter.loader]);

  useEffect(() => {
    if (isLoaderSupported(selectedVersion, selectedLoader)) return;
    const firstCompatibleVersion = gameVersions.find((version) => isLoaderSupported(version, selectedLoader));
    if (firstCompatibleVersion) {
      setSelectedVersion(firstCompatibleVersion);
    }
  }, [gameVersions, selectedLoader, selectedVersion]);

  const updateInstance = useCallback((id, fields) => {
    setInstances((prev) => prev.map((inst) => (String(inst.id) === String(id) ? { ...inst, ...fields } : inst)));
  }, []);

  const mergeInstanceContent = useCallback((instanceId, contentType, updater) => {
    const normalizedType = normalizeContentType(contentType);
    setInstances((prev) =>
      prev.map((inst) => {
        if (String(inst.id) !== String(instanceId)) return inst;
        if (normalizedType === 'resourcepack') {
          const next = updater(Array.isArray(inst.resourcepacks) ? inst.resourcepacks : []);
          return { ...inst, resourcepacks: next };
        }
        if (normalizedType === 'shader') {
          const next = updater(Array.isArray(inst.shaders) ? inst.shaders : []);
          return { ...inst, shaders: next };
        }
        const nextMods = updater(Array.isArray(inst.mods) ? inst.mods : []);
        return { ...inst, mods: nextMods };
      })
    );
  }, []);

  const syncInstanceContentFromDisk = useCallback(async (instanceId, contentType = null) => {
    if (!window.launcherMinecraft?.scanInstanceContent) return;
    const targetId = String(instanceId || '');
    if (!targetId) return;

    const typeList = contentType ? [normalizeContentType(contentType)] : CONTENT_TYPES.map((entry) => entry.id);

    for (const type of typeList) {
      const latestInstance = instancesRef.current.find((item) => String(item.id) === targetId);
      if (!latestInstance?.installPath) continue;

      const knownItems = resolveContentListByType(latestInstance, type);
      const result = await window.launcherMinecraft.scanInstanceContent({
        installPath: latestInstance.installPath,
        contentType: type,
        items: knownItems
      });

      if (!result?.ok) continue;
      const nextItems = Array.isArray(result.data?.items) ? result.data.items : [];
      mergeInstanceContent(targetId, type, () => nextItems);
    }
  }, [mergeInstanceContent]);

  useEffect(() => {
    setSelectedModIds([]);
    if (isManageModalOpen && editingInstanceId) {
      void syncInstanceContentFromDisk(editingInstanceId, manageContentType);
    }
  }, [editingInstanceId, isManageModalOpen, manageContentType, syncInstanceContentFromDisk]);

  const installSuggestedModsFromError = async () => {
    if (!window.launcherMinecraft || !errorDialog) return;
    if (errorDialog.suggestedInstallBusy) return;

    const dialogId = errorDialog.id;
    const suggestedMods = Array.isArray(errorDialog.suggestedMods) ? errorDialog.suggestedMods : [];
    const instanceContext = asObject(errorDialog.instanceContext);
    const targetInstance =
      instancesRef.current.find((item) => String(item.id) === String(instanceContext.id || '')) ||
      (instanceContext.id ? instanceContext : null);

    if (!targetInstance || !targetInstance.installPath) {
      notifyError(t('installFirstForMods'));
      return;
    }
    if (!suggestedMods.length) return;

    setErrorDialog((prev) => (prev?.id === dialogId ? { ...prev, suggestedInstallBusy: true } : prev));

    const existingIds = new Set(
      (Array.isArray(targetInstance.mods) ? targetInstance.mods : [])
        .map((item) => String(item.projectId || item.id || '').trim())
        .filter(Boolean)
    );

    const failed = [];
    for (const modEntry of suggestedMods) {
      const projectId = String(modEntry.projectId || '').trim();
      if (!projectId || existingIds.has(projectId)) continue;

      const result = await window.launcherMinecraft.installMod({
        instanceId: String(targetInstance.id),
        installPath: targetInstance.installPath,
        version: targetInstance.version,
      loader: targetInstance.loader,
      contentType: 'mod',
      projectId,
      title: modEntry.title,
      author: modEntry.author || '',
      creator: modEntry.author || '',
      iconUrl: modEntry.iconUrl || null
    });

      if (!result?.ok) {
        failed.push(`${modEntry.title || projectId}: ${result?.error?.message || 'unknown error'}`);
        continue;
      }

      mergeInstanceContent(targetInstance.id, 'mod', (prevList) => {
        const hasExisting = prevList.some((item) => String(item.projectId || item.id) === projectId);
        if (hasExisting) {
          return prevList.map((item) => (String(item.projectId || item.id) === projectId ? { ...item, ...result.data } : item));
        }
        return [...prevList, result.data];
      });
      existingIds.add(projectId);
    }

    if (failed.length) {
      notifyError(t('failedInstallSuggestedMods'), 'SUGGESTED_INSTALL_FAILED', failed.join('\n'));
      return;
    }

    setErrorDialog(null);
  };

  const ensureJavaPrompt = async (error) => {
    if (!error || error.code !== 'JAVA_REQUIRED') return;
    const required = error.requiredJavaMajor || 17;
    const javaUrl = error.javaDownloadUrl || (window.launcherMinecraft ? await window.launcherMinecraft.getJavaDownloadUrl(required) : null);
    if (!javaUrl) return;

    const shouldOpen = window.confirm(t('javaRequiredPrompt', { major: required }));
    if (shouldOpen) {
      window.launcherSystem?.openExternal(javaUrl);
    }
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewName('');
    setSelectedImportLauncher('');
    setShowImportLauncherPicker(false);
  };

  const addInstance = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    if (!isLoaderSupported(selectedVersion, selectedLoader)) {
      notifyError(t('loaderNotCompatible', { loader: formatLoaderName(selectedLoader), version: selectedVersion }));
      return;
    }

    const id = String(Date.now());
    let installPath = '';

    if (window.launcherMinecraft) {
      const pathResult = await window.launcherMinecraft.getDefaultInstallPath({ instanceId: id, instanceName: trimmedName });
      if (pathResult?.ok) {
        installPath = pathResult.data?.path || '';
      }
    }

    setInstances((prev) => [
      makeInstance({
        id,
        name: trimmedName,
        version: selectedVersion,
        loader: selectedLoader,
        ram: globalRam,
        installPath,
        importSource: selectedImportLauncher || null
      }),
      ...prev
    ]);

    closeCreateModal();
  };

  const installInstance = async (instance) => {
    if (!window.launcherMinecraft || !instance) return;
    if (instance.installState === 'installing') return;
    const pendingImportSourceId = String(instance.importSource || '').trim().toLowerCase();
    const installStartMessage = pendingImportSourceId
      ? t('importInstallMessage', { launcher: getImportLauncherLabel(pendingImportSourceId) })
      : t('startingInstallation');

    updateInstance(instance.id, {
      installState: 'installing',
      installProgress: 0,
      installStage: 'prepare',
      lastError: '',
      isRunning: false
    });

    setInstallBanner({
      instanceId: String(instance.id),
      instanceName: instance.name,
      percent: 0,
      stageLabel: t('preparing'),
      message: installStartMessage
    });
    setInstallLogs([`[${t('preparing')}] ${installStartMessage} (${instance.name})`]);

    const result = await window.launcherMinecraft.installInstance({
      instanceId: String(instance.id),
      instanceName: instance.name,
      version: instance.version,
      loader: instance.loader,
      installPath: instance.installPath || undefined,
      ramGb: globalRam,
      launcherLanguage
    });
    const stillExists = instancesRef.current.some((item) => String(item.id) === String(instance.id));
    if (!stillExists) {
      return;
    }

    if (result?.ok) {
      const resolvedInstallPath = result.data?.installPath || instance.installPath;
      let importedContent = null;

      if (pendingImportSourceId && window.launcherMinecraft?.importFromLauncher && resolvedInstallPath) {
        const launcherLabel = getImportLauncherLabel(pendingImportSourceId);
        const importStageMessage = t('importInProgressMessage', { launcher: launcherLabel });
        setInstallBanner({
          instanceId: String(instance.id),
          instanceName: instance.name,
          percent: 100,
          stageLabel: t('installing'),
          message: importStageMessage
        });
        setInstallLogs((prev) => [...prev, `[${t('installing')}] ${importStageMessage}`]);

        const importResult = await window.launcherMinecraft.importFromLauncher({
          sourceLauncher: pendingImportSourceId,
          targetInstallPath: resolvedInstallPath,
          version: instance.version,
          loader: instance.loader,
          existingContent: {
            mods: Array.isArray(instance.mods) ? instance.mods : [],
            resourcepacks: Array.isArray(instance.resourcepacks) ? instance.resourcepacks : [],
            shaders: Array.isArray(instance.shaders) ? instance.shaders : []
          }
        });

        if (importResult?.ok) {
          const contents = importResult.data?.contents || {};
          const mods = Array.isArray(contents.mods) ? contents.mods : [];
          const resourcepacks = Array.isArray(contents.resourcepacks) ? contents.resourcepacks : [];
          const shaders = Array.isArray(contents.shaders) ? contents.shaders : [];
          importedContent = { mods, resourcepacks, shaders };
          const copied = importResult.data?.copied || {};
          setInstallLogs((prev) => [
            ...prev,
            `[${t('installing')}] ${t('importDoneMessage', {
              launcher: launcherLabel,
              mods: Number(copied.mods || 0),
              resourcepacks: Number(copied.resourcepacks || 0),
              shaders: Number(copied.shaderpacks || 0),
              worlds: Number(copied.saves || 0)
            })}`
          ]);
        } else {
          const message = importResult?.error?.message || t('importFailedMessage', { launcher: launcherLabel });
          notifyError(message, importResult?.error?.code || '');
          setInstallLogs((prev) => [...prev, `[${t('stageError')}] ${message}`]);
        }
      }

      updateInstance(instance.id, {
        installPath: resolvedInstallPath,
        installState: 'installed',
        installProgress: 100,
        installStage: 'done',
        javaPath: result.data?.javaPath || null,
        customVersionId: result.data?.customVersionId || null,
        forgeJarPath: result.data?.forgeJarPath || null,
        mods: importedContent?.mods || instance.mods,
        resourcepacks: importedContent?.resourcepacks || instance.resourcepacks,
        shaders: importedContent?.shaders || instance.shaders,
        lastError: ''
      });
      return;
    }

    const error = result?.error || { message: t('failedInstallMinecraft'), code: 'INSTALL_FAILED' };
    updateInstance(instance.id, {
      installState: 'error',
      installProgress: 0,
      installStage: null,
      lastError: error.message || t('failedInstallMinecraft')
    });

    setInstallBanner({
      instanceId: String(instance.id),
      instanceName: instance.name,
      percent: 0,
      stageLabel: t('stageError'),
      message: error.message || t('installFailed')
    });
    notifyError(error.message || t('installFailed'), error.code || '');

    await ensureJavaPrompt(error);
  };

  const launchInstance = async (instance) => {
    if (!window.launcherMinecraft || !instance) return;
    if (instance.isRunning) return;

    updateInstance(instance.id, {
      isRunning: true,
      lastError: ''
    });

    const result = await window.launcherMinecraft.launchInstance({
      instanceId: String(instance.id),
      instanceName: instance.name,
      version: instance.version,
      loader: instance.loader,
      installPath: instance.installPath,
      customVersionId: instance.customVersionId || null,
      forgeJarPath: instance.forgeJarPath || null,
      ramGb: globalRam,
      username: offlineUsername
    });

    if (result?.ok) {
      updateInstance(instance.id, {
        javaPath: result.data?.javaPath || instance.javaPath || null,
        customVersionId: result.data?.customVersionId || instance.customVersionId || null,
        forgeJarPath: result.data?.forgeJarPath || instance.forgeJarPath || null,
        isRunning: true,
        lastError: ''
      });
      return;
    }

    const error = result?.error || { message: t('failedLaunchMinecraft'), code: 'LAUNCH_FAILED' };
    const localizedMessage = localizeLaunchErrorMessage(error, instance);
    const suggestedCandidates = extractInstallCandidatesFromError(error);
    updateInstance(instance.id, {
      isRunning: false,
      lastError: localizedMessage
    });
    notifyError(localizedMessage, error.code || '', error.details || '', {
      rawDetails: asObject(error.details),
      instanceContext: {
        id: String(instance.id),
        name: instance.name,
        version: instance.version,
        loader: instance.loader,
        installPath: instance.installPath
      },
      suggestedCandidates
    });

    await ensureJavaPrompt(error);
  };

  const stopInstance = async (instance) => {
    if (!window.launcherMinecraft || !instance) return;
    const result = await window.launcherMinecraft.stopInstance({
      instanceId: String(instance.id)
    });
    if (!result?.ok) {
      notifyError(result?.error?.message || t('failedStopMinecraft'), result?.error?.code || '');
      return;
    }

    updateInstance(instance.id, {
      isRunning: false
    });
  };

  const handleInstancePrimaryAction = async (instance) => {
    if (instance.installState === 'installed') {
      if (instance.isRunning) {
        await stopInstance(instance);
        return;
      }
      await launchInstance(instance);
      return;
    }

    await installInstance(instance);
  };

  const openManageModal = (instance) => {
    setSelectedModIds([]);
    setManageContentType('mod');
    setEditingInstanceId(instance.id);
    setIsManageModalOpen(true);
    void syncInstanceContentFromDisk(instance.id);
  };

  const requestDeleteInstance = (instance) => {
    if (!instance) return;
    setDeleteConfirmInstance(instance);
  };

  const deleteInstance = async (instance) => {
    if (!instance) return false;
    const targetId = String(instance.id);

    if (instance.installPath && window.launcherMinecraft?.deleteProfileFolder) {
      const result = await window.launcherMinecraft.deleteProfileFolder({
        instanceId: targetId,
        installPath: instance.installPath
      });

      if (!result?.ok) {
        notifyError(result?.error?.message || t('failedDeleteProfile'), result?.error?.code || '');
      }
    }

    setInstances((prev) => prev.filter((item) => String(item.id) !== targetId));
    setInstallBanner((current) => (current?.instanceId === targetId ? null : current));
    setInstallLogs([]);
    setModTransfer((current) => (String(current?.instanceId || '') === targetId ? null : current));

    if (String(editingInstanceId) === targetId) {
      setIsManageModalOpen(false);
      setEditingInstanceId(null);
      setIsInstanceSettingsOpen(false);
    }
    return true;
  };

  const confirmDeleteInstance = async () => {
    if (!deleteConfirmInstance || deleteBusy) return;
    setDeleteBusy(true);
    const success = await deleteInstance(deleteConfirmInstance);
    setDeleteBusy(false);
    if (success) setDeleteConfirmInstance(null);
  };

  const cancelDeleteInstance = () => {
    if (deleteBusy) return;
    setDeleteConfirmInstance(null);
  };

  const openInstanceSettings = () => {
    if (!editingInstance) return;
    setInstanceSettingsName(editingInstance.name);
    setInstanceSettingsError('');
    setIsInstanceSettingsOpen(true);
  };

  const saveInstanceSettings = async () => {
    if (!editingInstance) return;

    const trimmedName = instanceSettingsName.trim();
    if (!trimmedName) {
      setInstanceSettingsError(t('nameEmpty'));
      return;
    }

    const renameNeeded = trimmedName !== editingInstance.name;

    let nextInstallPath = editingInstance.installPath;
    if (renameNeeded && window.launcherMinecraft) {
      const renameResult = await window.launcherMinecraft.renameProfileFolder({
        instanceId: String(editingInstance.id),
        oldInstallPath: editingInstance.installPath || null,
        newName: trimmedName
      });

      if (!renameResult?.ok) {
        const message = renameResult?.error?.message || t('failedRenameProfile');
        setInstanceSettingsError(message);
        return;
      }

      nextInstallPath = renameResult.data?.installPath || editingInstance.installPath;
    }

    updateInstance(editingInstance.id, {
      name: trimmedName,
      installPath: nextInstallPath
    });

    setIsInstanceSettingsOpen(false);
  };

  const pickInstanceAvatar = async () => {
    if (!editingInstance || !window.launcherMinecraft) return;

    const result = await window.launcherMinecraft.pickInstanceAvatar({ instanceId: String(editingInstance.id) });
    if (!result?.ok) {
      setInstanceSettingsError(result?.error?.message || t('failedPickAvatar'));
      return;
    }

    if (result.data?.canceled) return;

    updateInstance(editingInstance.id, {
      avatarPath: result.data?.path || ''
    });
    setInstanceSettingsError('');
  };

  const resetInstanceAvatar = () => {
    if (!editingInstance) return;
    updateInstance(editingInstance.id, {
      avatarPath: ''
    });
    setInstanceSettingsError('');
  };

  const openSkinsFolder = async () => {
    if (!window.launcherSkins?.openFolder) {
      notifyError(t('openFolderApiMissing'));
      return;
    }
    const result = await window.launcherSkins.openFolder();
    if (!result?.ok) {
      notifyError(result?.error?.message || t('failedOpenFolder'), result?.error?.code || '');
    }
  };

  const openCreateSkinEditor = () => {
    if (skinEditorCloseTimerRef.current) {
      clearTimeout(skinEditorCloseTimerRef.current);
      skinEditorCloseTimerRef.current = null;
    }
    setSkinEditorMode('create');
    const defaultCapeId = officialProfile.hasLicense && skinsState.defaultCapes[0]?.id ? skinsState.defaultCapes[0].id : '';
    setSkinDraft(
      createInitialSkinDraft({
        capeMode: defaultCapeId ? 'default' : 'none',
        defaultCapeId,
        model: officialProfile.model === 'slim' ? 'slim' : 'wide'
      })
    );
    setSkinEditorError('');
    setIsSkinDropActive(false);
    setIsSkinQuickDropActive(false);
    setIsSkinEditorOpen(true);
    setIsSkinEditorVisible(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsSkinEditorVisible(true);
      });
    });
  };

  const openEditSkinEditor = (skin) => {
    if (!skin) return;
    if (skinEditorCloseTimerRef.current) {
      clearTimeout(skinEditorCloseTimerRef.current);
      skinEditorCloseTimerRef.current = null;
    }
    const normalizedCapeMode = String(skin.capeMode || '').toLowerCase() === 'default' ? 'default' : 'none';
    setSkinEditorMode('update');
    setSkinDraft(
      createInitialSkinDraft({
        id: skin.id,
        name: skin.name || '',
        textureDataUrl: skin.textureDataUrl || '',
        model: skin.model === 'slim' ? 'slim' : 'wide',
        capeMode: normalizedCapeMode,
        defaultCapeId: normalizedCapeMode === 'default' ? skin.defaultCapeId || '' : '',
        capeDataUrl: ''
      })
    );
    setSkinEditorError('');
    setIsSkinDropActive(false);
    setIsSkinQuickDropActive(false);
    setIsSkinEditorOpen(true);
    setIsSkinEditorVisible(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsSkinEditorVisible(true);
      });
    });
  };

  const closeSkinEditor = () => {
    if (skinEditorCloseTimerRef.current) {
      clearTimeout(skinEditorCloseTimerRef.current);
      skinEditorCloseTimerRef.current = null;
    }
    setIsSkinEditorVisible(false);
    setSkinEditorError('');
    setIsSkinDropActive(false);
    skinEditorCloseTimerRef.current = setTimeout(() => {
      setIsSkinEditorOpen(false);
      skinEditorCloseTimerRef.current = null;
    }, 220);
  };

  useEffect(
    () => () => {
      if (skinEditorCloseTimerRef.current) {
        clearTimeout(skinEditorCloseTimerRef.current);
        skinEditorCloseTimerRef.current = null;
      }
      clearSkinPressTimer();
      clearInstancePressTimer();
    },
    [clearInstancePressTimer, clearSkinPressTimer]
  );

  const applySkinTextureFile = async (file) => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    if (!dataUrl.startsWith('data:image/png;base64,')) {
      setSkinEditorError(t('skinsNeedTexture'));
      return;
    }
    setSkinDraft((prev) => ({
      ...prev,
      textureDataUrl: dataUrl
    }));
    setSkinEditorError('');
  };

  const onSkinTextureInputChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      await applySkinTextureFile(file);
    } catch {
      setSkinEditorError(t('skinsNeedTexture'));
    }
  };

  const openCreateSkinEditorWithTexture = async (file) => {
    if (!file) return;
    openCreateSkinEditor();
    try {
      await applySkinTextureFile(file);
    } catch {
      setSkinEditorError(t('skinsNeedTexture'));
    }
  };

  const saveSkinDraft = async () => {
    if (!window.launcherSkins) return;
    if (!skinDraft.textureDataUrl) {
      setSkinEditorError(t('skinsNeedTexture'));
      return;
    }

    const hasLicense = officialProfile.hasLicense;
    const capeMode = hasLicense && skinDraft.capeMode === 'default' && skinDraft.defaultCapeId ? 'default' : 'none';

    const payload = {
      id: skinEditorMode === 'update' ? skinDraft.id : undefined,
      name: skinDraft.name.trim() || (languageCode === 'ru' ? 'Скин' : 'Skin'),
      model: skinDraft.model === 'slim' ? 'slim' : 'wide',
      textureDataUrl: skinDraft.textureDataUrl,
      capeMode,
      defaultCapeId: capeMode === 'default' ? skinDraft.defaultCapeId : '',
      capeDataUrl: '',
      setActive: skinEditorMode === 'create'
    };

    const result =
      skinEditorMode === 'update' && payload.id
        ? await window.launcherSkins.update(payload)
        : await window.launcherSkins.save(payload);

    if (!result?.ok) {
      setSkinEditorError(result?.error?.message || (skinEditorMode === 'update' ? t('skinsFailedUpdate') : t('skinsFailedSave')));
      return;
    }

    applySkinsStatePayload(result.data);
    closeSkinEditor();
  };

  const setActiveSkinById = async (skinId) => {
    if (!window.launcherSkins?.setActive) return;
    const result = await window.launcherSkins.setActive({ id: skinId });
    if (!result?.ok) {
      notifyError(result?.error?.message || t('skinsFailedSetActive'), result?.error?.code || '');
      return;
    }
    applySkinsStatePayload(result.data);
  };

  const deleteSkinById = async (skinId) => {
    if (!window.launcherSkins?.delete) return;
    const target = skinsState.skins.find((entry) => String(entry.id) === String(skinId));
    if (!target) return;
    const confirmed = window.confirm(`${t('skinsDeleteAction')}: "${target.name}"?`);
    if (!confirmed) return;

    const result = await window.launcherSkins.delete({ id: skinId });
    if (!result?.ok) {
      notifyError(result?.error?.message || t('skinsFailedDelete'), result?.error?.code || '');
      return;
    }
    applySkinsStatePayload(result.data);
  };

  const reorderSkinsByIds = useCallback((draggedId, targetId) => {
    const sourceId = String(draggedId || '');
    const destinationId = String(targetId || '');
    if (!sourceId || !destinationId || sourceId === destinationId) return;

    setSkinsState((prev) => {
      const currentSkins = Array.isArray(prev.skins) ? prev.skins : [];
      const fromIndex = currentSkins.findIndex((entry) => String(entry.id) === sourceId);
      const toIndex = currentSkins.findIndex((entry) => String(entry.id) === destinationId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return prev;

      const nextSkins = moveArrayItem(currentSkins, fromIndex, toIndex);
      skinsOrderRef.current = nextSkins;
      skinOrderDirtyRef.current = true;
      return {
        ...prev,
        skins: nextSkins
      };
    });
  }, []);

  const persistSkinOrder = useCallback(async () => {
    if (!skinOrderDirtyRef.current) return;
    skinOrderDirtyRef.current = false;

    if (!window.launcherSkins?.reorder) return;
    const ids = skinsOrderRef.current.map((entry) => String(entry?.id || '')).filter(Boolean);
    if (!ids.length) return;

    const result = await window.launcherSkins.reorder({ ids });
    if (result?.ok) {
      applySkinsStatePayload(result.data);
      return;
    }

    notifyError(result?.error?.message || t('skinsFailedSave'), result?.error?.code || '');
    await refreshSkins();
  }, [applySkinsStatePayload, notifyError, refreshSkins, t]);

  const reorderInstancesByIds = useCallback((draggedId, targetId) => {
    const sourceId = String(draggedId || '');
    const destinationId = String(targetId || '');
    if (!sourceId || !destinationId || sourceId === destinationId) return;

    setInstances((prev) => {
      const fromIndex = prev.findIndex((entry) => String(entry.id) === sourceId);
      const toIndex = prev.findIndex((entry) => String(entry.id) === destinationId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return prev;
      const nextInstances = moveArrayItem(prev, fromIndex, toIndex);
      instancesRef.current = nextInstances;
      return nextInstances;
    });
  }, []);

  useEffect(() => {
    if (!draggingSkinId) return undefined;

    const onPointerMove = (event) => {
      if (skinDragPointerIdRef.current !== null && event.pointerId !== skinDragPointerIdRef.current) return;

      const pointX = event.clientX;
      const pointY = event.clientY;
      setSkinDragPointer((prev) => ({
        ...prev,
        x: pointX,
        y: pointY
      }));

      const targetId = resolveReorderTargetId({
        pointX,
        pointY,
        refMap: skinCardRefs,
        draggingId: draggingSkinId,
        dragStart: skinDragStartRef.current,
        dragMetrics: skinDragMetricsRef.current
      });
      setSkinDragOverId(targetId || null);
      if (!targetId) {
        skinDragLastTargetRef.current = null;
        return;
      }

      if (skinDragLastTargetRef.current === targetId) {
        return;
      }

      const lastSwapPoint = skinDragLastSwapPointRef.current;
      if (lastSwapPoint) {
        const distanceFromLastSwap = Math.hypot(pointX - lastSwapPoint.x, pointY - lastSwapPoint.y);
        if (distanceFromLastSwap < DRAG_REORDER_SWAP_LOCK_PX) {
          return;
        }
      }

      reorderSkinsByIds(draggingSkinId, targetId);
      skinDragLastSwapPointRef.current = { x: pointX, y: pointY };
      skinDragLastTargetRef.current = targetId;
    };

    const finishDrag = (event) => {
      if (skinDragPointerIdRef.current !== null && event.pointerId !== skinDragPointerIdRef.current) return;
      skinDragPointerIdRef.current = null;
      setDraggingSkinId(null);
      setSkinDragOverId(null);
      setSkinDragEnabledId(null);
      const resetMetrics = { offsetX: 0, offsetY: 0, width: 0, height: 0 };
      setSkinDragMetrics(resetMetrics);
      skinDragMetricsRef.current = resetMetrics;
      skinDragLastSwapPointRef.current = null;
      skinDragLastTargetRef.current = null;
      void persistSkinOrder();
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);
    };
  }, [draggingSkinId, persistSkinOrder, reorderSkinsByIds, resolveReorderTargetId]);

  useEffect(() => {
    if (!draggingInstanceId) return undefined;

    const onPointerMove = (event) => {
      if (instanceDragPointerIdRef.current !== null && event.pointerId !== instanceDragPointerIdRef.current) return;

      const pointX = event.clientX;
      const pointY = event.clientY;
      setInstanceDragPointer((prev) => ({
        ...prev,
        x: pointX,
        y: pointY
      }));

      const targetId = resolveReorderTargetId({
        pointX,
        pointY,
        refMap: instanceCardRefs,
        draggingId: draggingInstanceId,
        dragStart: instanceDragStartRef.current,
        dragMetrics: instanceDragMetricsRef.current
      });
      setInstanceDragOverId(targetId || null);
      if (!targetId) {
        instanceDragLastTargetRef.current = null;
        return;
      }

      if (instanceDragLastTargetRef.current === targetId) {
        return;
      }

      const lastSwapPoint = instanceDragLastSwapPointRef.current;
      if (lastSwapPoint) {
        const distanceFromLastSwap = Math.hypot(pointX - lastSwapPoint.x, pointY - lastSwapPoint.y);
        if (distanceFromLastSwap < DRAG_REORDER_SWAP_LOCK_PX) {
          return;
        }
      }

      reorderInstancesByIds(draggingInstanceId, targetId);
      instanceDragLastSwapPointRef.current = { x: pointX, y: pointY };
      instanceDragLastTargetRef.current = targetId;
    };

    const finishDrag = (event) => {
      if (instanceDragPointerIdRef.current !== null && event.pointerId !== instanceDragPointerIdRef.current) return;
      instanceDragPointerIdRef.current = null;
      setDraggingInstanceId(null);
      setInstanceDragOverId(null);
      setInstanceDragEnabledId(null);
      const resetMetrics = { offsetX: 0, offsetY: 0, width: 0, height: 0 };
      setInstanceDragMetrics(resetMetrics);
      instanceDragMetricsRef.current = resetMetrics;
      instanceDragLastSwapPointRef.current = null;
      instanceDragLastTargetRef.current = null;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);
    };
  }, [draggingInstanceId, reorderInstancesByIds, resolveReorderTargetId]);

  const closeInstallTargetModal = useCallback(() => {
    setIsInstallTargetModalOpen(false);
    setInstallTargetEntry(null);
    setCompatibleInstallTargets([]);
    setSelectedInstallTargetId('');
    setInstallTargetLoading(false);
    setInstallTargetBusy(false);
  }, []);

  const resolveCompatibleInstancesForEntry = useCallback(
    async (entry, contentType) => {
      const normalizedType = normalizeContentType(contentType);
      const projectId = String(entry?.project_id || '').trim();
      if (!projectId || !installedInstances.length) return [];

      const response = await fetch(`https://api.modrinth.com/v2/project/${encodeURIComponent(projectId)}/version`);
      if (!response.ok) {
        throw new Error(`Compatibility request failed (${response.status})`);
      }
      const releases = await response.json();
      const releaseList = Array.isArray(releases) ? releases : [];
      const compatible = installedInstances.filter((instance) =>
        releaseList.some((release) => isModrinthVersionCompatible(release, instance, normalizedType))
      );
      return compatible;
    },
    [installedInstances]
  );

  const openInstallTargetModal = useCallback(
    async (entry) => {
      if (!entry?.project_id) return;
      if (!installedInstances.length) {
        notifyError(t('installFirstForMods'));
        return;
      }

      const normalizedType = normalizeContentType(browseContentType);
      setInstallTargetEntry({
        ...entry,
        contentType: normalizedType
      });
      setIsInstallTargetModalOpen(true);
      setInstallTargetLoading(true);
      setInstallTargetBusy(false);
      setCompatibleInstallTargets([]);
      setSelectedInstallTargetId('');

      const requestId = Date.now();
      installTargetRequestRef.current = requestId;

      try {
        const compatible = await resolveCompatibleInstancesForEntry(entry, normalizedType);
        if (installTargetRequestRef.current !== requestId) return;
        setCompatibleInstallTargets(compatible);
        if (compatible.length > 0) {
          setSelectedInstallTargetId(String(compatible[0].id));
        }
      } catch (error) {
        if (installTargetRequestRef.current !== requestId) return;
        notifyError(error?.message || t('failedCheckUpdates'));
      } finally {
        if (installTargetRequestRef.current === requestId) {
          setInstallTargetLoading(false);
        }
      }
    },
    [browseContentType, installedInstances, notifyError, resolveCompatibleInstancesForEntry, t]
  );

  const installContentToInstance = async (entry, targetInstance = editingInstance, explicitContentType = browseContentType) => {
    if (!targetInstance || !window.launcherMinecraft) return false;
    if (targetInstance.installState !== 'installed') {
      notifyError(t('installFirstForMods'));
      return false;
    }

    const contentType = normalizeContentType(explicitContentType);
    const projectId = String(entry.project_id || '').trim();
    if (!projectId) return false;

    setModActionBusyId(projectId);
    const result = await window.launcherMinecraft.installMod({
      instanceId: String(targetInstance.id),
      installPath: targetInstance.installPath,
      version: targetInstance.version,
      loader: targetInstance.loader,
      contentType,
      projectId,
      title: entry.title,
      author: entry.author || '',
      creator: entry.author || '',
      organization:
        typeof entry.organization === 'string' ? entry.organization : entry.organization?.title || entry.organization?.name || null,
      iconUrl: entry.icon_url || null
    });

    setModActionBusyId(null);

    if (!result?.ok) {
      notifyError(result?.error?.message || t('failedInstallContent'));
      return false;
    }

    mergeInstanceContent(targetInstance.id, contentType, (prevList) => {
      const hasExisting = prevList.some((item) => String(item.projectId || item.id) === projectId);
      if (hasExisting) {
        return prevList.map((item) => (String(item.projectId || item.id) === projectId ? { ...item, ...result.data } : item));
      }
      return [...prevList, result.data];
    });
    setEditingInstanceId(String(targetInstance.id));
    return true;
  };

  const installToSelectedTarget = async () => {
    if (!installTargetEntry || !selectedInstallTargetId || installTargetBusy) return;
    const target = compatibleInstallTargets.find((instance) => String(instance.id) === String(selectedInstallTargetId));
    if (!target) return;

    setInstallTargetBusy(true);
    try {
      const installed = await installContentToInstance(installTargetEntry, target, installTargetEntry.contentType || browseContentType);
      if (installed) {
        closeInstallTargetModal();
      }
    } finally {
      setInstallTargetBusy(false);
    }
  };

  const toggleMod = async (instanceId, mod) => {
    if (!window.launcherMinecraft) return;

    const result = await window.launcherMinecraft.toggleMod({ mod });
    if (!result?.ok) {
      notifyError(result?.error?.message || t('failedToggleMod'));
      return;
    }

    mergeInstanceContent(instanceId, 'mod', (modsList) =>
      modsList.map((item) =>
        String(item.projectId || item.id) === String(mod.projectId || mod.id)
          ? {
              ...item,
              enabled: result.data.enabled,
              filename: result.data.filename,
              filePath: result.data.filePath
            }
          : item
      )
    );
  };

  const removeContentFromInstance = async (instanceId, contentType, item) => {
    if (!window.launcherMinecraft) return;

    const result = await window.launcherMinecraft.deleteMod({ mod: item });
    if (!result?.ok) {
      notifyError(result?.error?.message || t('failedDeleteContent'));
      return;
    }

    mergeInstanceContent(instanceId, contentType, (items) => items.filter((candidate) => String(candidate.projectId || candidate.id) !== String(item.projectId || item.id)));
  };

  const updateContentInInstance = async (instance, contentType, item) => {
    if (!window.launcherMinecraft) return;

    const result = await window.launcherMinecraft.updateMod({
      instanceId: String(instance.id),
      installPath: instance.installPath,
      version: instance.version,
      loader: instance.loader,
      contentType,
      mod: item
    });

    if (!result?.ok) {
      notifyError(result?.error?.message || t('failedUpdateContent', { name: item.title || item.id }));
      return;
    }

    mergeInstanceContent(instance.id, contentType, (items) =>
      items.map((candidate) =>
        String(candidate.projectId || candidate.id) === String(item.projectId || item.id)
          ? {
              ...candidate,
              ...result.data,
              hasUpdate: false
            }
          : candidate
      )
    );
  };

  const refreshContentUpdates = async () => {
    if (!editingInstance || !window.launcherMinecraft) return;
    const contentType = normalizeContentType(manageContentType);
    await syncInstanceContentFromDisk(editingInstance.id, contentType);
    const latestInstance = instancesRef.current.find((item) => String(item.id) === String(editingInstance.id)) || editingInstance;
    const items = resolveContentListByType(latestInstance, contentType);
    const remoteItems = items.filter((item) => !isLocalContentEntry(item));
    if (!remoteItems.length) return;

    const result = await window.launcherMinecraft.checkModUpdates({
      version: latestInstance.version,
      loader: latestInstance.loader,
      contentType,
      items: remoteItems
    });

    if (!result?.ok || !Array.isArray(result.data)) {
      notifyError(result?.error?.message || t('failedCheckUpdates'));
      return;
    }

    const byProject = new Map(result.data.map((item) => [String(item.projectId || item.id), item]));

    mergeInstanceContent(latestInstance.id, contentType, (currentItems) =>
      currentItems.map((item) => {
        if (isLocalContentEntry(item)) {
          return {
            ...item,
            hasUpdate: false,
            latestVersionId: null,
            latestVersion: null
          };
        }
        const status = byProject.get(String(item.projectId || item.id));
        if (!status) return item;
        return {
          ...item,
          hasUpdate: Boolean(status.hasUpdate),
          latestVersionId: status.latestVersionId || null,
          latestVersion: status.latestVersion || null
        };
      })
    );
  };

  const updateAllContent = async () => {
    if (!editingInstance) return;
    const contentType = normalizeContentType(manageContentType);
    await refreshContentUpdates();
    const latestInstance = instancesRef.current.find((item) => String(item.id) === String(editingInstance.id)) || editingInstance;
    const targets = resolveContentListByType(latestInstance, contentType).filter((item) => item.hasUpdate && !isLocalContentEntry(item));
    if (!targets.length) return;

    for (const item of targets) {
      const currentInstance = instancesRef.current.find((entry) => String(entry.id) === String(latestInstance.id)) || latestInstance;
      const currentItem = resolveContentListByType(currentInstance, contentType).find(
        (entry) => String(entry.projectId || entry.id) === String(item.projectId || item.id)
      );
      if (!currentItem) continue;
      await updateContentInInstance(currentInstance, contentType, currentItem);
    }
  };

  const openInstanceFolder = async (instance) => {
    if (!instance?.installPath) {
      notifyError(t('folderPathMissing'));
      return;
    }

    if (!window.launcherSystem?.openPath) {
      notifyError(t('openFolderApiMissing'));
      return;
    }

    const result = await window.launcherSystem.openPath(instance.installPath);
    if (!result?.ok) {
      notifyError(result?.error?.message || t('failedOpenFolder'), result?.error?.code || '');
    }
  };

  const toggleSelectAll = () => {
    const allIds = resolveContentListByType(editingInstance, manageContentType).map((item) => String(item.projectId || item.id));
    if (!allIds.length) return;
    setSelectedModIds((prev) => (prev.length === allIds.length ? [] : allIds));
  };

  const toggleSelectMod = (modId) => {
    const targetId = String(modId);
    setSelectedModIds((prev) => (prev.includes(targetId) ? prev.filter((id) => id !== targetId) : [...prev, targetId]));
  };

  const removeSelectedContents = async () => {
    if (!editingInstance || !selectedModIds.length) return;
    const contentType = normalizeContentType(manageContentType);

    for (const item of resolveContentListByType(editingInstance, contentType)) {
      const id = String(item.projectId || item.id);
      if (!selectedModIds.includes(id)) continue;
      await removeContentFromInstance(editingInstance.id, contentType, item);
    }

    setSelectedModIds([]);
  };

  const getPrimaryButtonLabel = (instance) => {
    if (instance.installState === 'installing') return t('primaryInstalling', { percent: Math.round(instance.installProgress || 0) });
    if (instance.installState === 'installed' && instance.isRunning) return t('primaryStop');
    if (instance.installState === 'installed') return t('primaryPlay');
    if (instance.installState === 'error') return t('primaryRetryInstall');
    return t('primaryInstall');
  };

  const getPrimaryButtonIcon = (instance) => {
    if (instance.installState === 'installing') return <Loader2 size={18} className="animate-spin" />;
    if (instance.installState === 'installed' && instance.isRunning) return <Square size={16} fill="currentColor" />;
    if (instance.installState === 'installed') return <Play size={18} fill="currentColor" />;
    return <Download size={18} />;
  };

  const getPrimaryButtonClassName = (instance) => {
    if (instance.installState === 'installed' && instance.isRunning) {
      return 'border border-red-400/40 bg-red-500/15 text-red-100 hover:bg-red-500/25';
    }

    if (instance.installState === 'installed') {
      return 'primary-installed-theme border border-white/15 bg-white text-black';
    }

    if (instance.installState === 'installing') {
      return 'border';
    }

    if (instance.installState === 'error') {
      return 'bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20';
    }

    return 'bg-white/10 text-white border hover:bg-white/15';
  };

  const dismissUpdateBanner = () => {
    if (updaterBanner.state === 'installing') return;
    setUpdateBannerDismissed(true);
  };

  const applyLauncherUpdate = async () => {
    if (!window.launcherUpdater?.download || !window.launcherUpdater?.install || !window.launcherUpdater?.check) return;
    if (updateActionBusy || updaterBanner.state === 'downloading' || updaterBanner.state === 'installing') return;

    const shouldRetryCheck =
      updaterBanner.state === 'idle' ||
      updaterBanner.state === 'checking' ||
      !updaterBanner.version;
    if (shouldRetryCheck) {
      setUpdateActionBusy(true);
      setUpdateBannerDismissed(false);
      setUpdaterBanner((prev) => ({
        ...prev,
        state: 'checking',
        message: ''
      }));
      try {
        await requestLauncherUpdateCheck();
      } finally {
        setUpdateActionBusy(false);
      }
      return;
    }

    setUpdateActionBusy(true);
    setUpdateBannerDismissed(false);
    setUpdaterBanner((prev) => ({
      ...prev,
      state: prev.state === 'downloaded' ? 'installing' : 'downloading',
      percent: prev.state === 'downloaded' ? 100 : prev.percent
    }));

    const downloadResult = await window.launcherUpdater.download();
    if (!downloadResult?.ok) {
      setUpdateActionBusy(false);
      setUpdaterBanner((prev) => ({
        ...prev,
        state: 'available'
      }));
      notifyError(downloadResult?.error?.message || t('failedStartUpdate'), downloadResult?.error?.code || '');
      return;
    }

    setUpdaterBanner((prev) => ({ ...prev, state: 'installing', percent: 100 }));
    const installResult = await window.launcherUpdater.install();
    if (!installResult?.ok) {
      setUpdateActionBusy(false);
      setUpdaterBanner((prev) => ({ ...prev, state: 'downloaded', percent: 100 }));
      notifyError(installResult?.error?.message || t('failedStartUpdate'), installResult?.error?.code || '');
      return;
    }
  };

  const handleWindowMinimize = () => {
    window.launcherWindow?.minimize();
  };

  const handleWindowToggleMaximize = () => {
    if (!window.launcherWindow) return;
    if (isWindowMaximized) {
      window.launcherWindow.unmaximize();
    } else {
      window.launcherWindow.maximize();
    }
  };

  const handleWindowClose = () => {
    window.launcherWindow?.close();
  };

  const loaderOptionsForCreate = LOADERS.map((loader) => ({
    ...loader,
    name: isLoaderSupported(selectedVersion, loader.id) ? loader.name : `${loader.name} (${t('unavailableSuffix')})`,
    disabled: !isLoaderSupported(selectedVersion, loader.id)
  }));

  const createVersionOptions = gameVersions.map((version) => ({
    id: version,
    name: version,
    disabled: !isLoaderSupported(version, selectedLoader)
  }));

  const browseVersionOptions = gameVersions.map((version) => ({
    id: version,
    name: version,
    disabled: browseContentType === 'mod' && activeFilter.loader ? !isLoaderSupported(version, activeFilter.loader) : false
  }));

  const browseTypeOptions = CONTENT_TYPES.map((item) => ({
    id: item.id,
    name: getContentTypeLabel(item.id),
    icon: item.icon
  }));
  const normalizedBrowseType = normalizeContentType(browseContentType);
  const supportsHeaderPreview = normalizedBrowseType === 'mod' || normalizedBrowseType === 'resourcepack' || normalizedBrowseType === 'shader';
  const canToggleBrowseHeader = supportsHeaderPreview;
  const showBrowseHeader = supportsHeaderPreview ? showBrowseHeaderByType[normalizedBrowseType] !== false : false;
  const browseHeaderToggleTitle = showBrowseHeader
    ? languageCode === 'ru'
      ? 'Скрыть шапку'
      : 'Hide header image'
    : languageCode === 'ru'
      ? 'Вернуть вид по умолчанию'
      : 'Restore default view';
  const cardGridClassName =
    showBrowseHeader ? 'grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-2' : 'grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3';
  const browseAnimationToken = useMemo(() => {
    const filtersToken = JSON.stringify(activeBrowseFilterValues || {});
    const idsToken = mods.map((entry) => String(entry?.project_id || '')).join(',');
    return [
      normalizedBrowseType,
      currentPage,
      activeFilter.version || '',
      activeFilter.loader || '',
      modSearch.trim().toLowerCase(),
      filtersToken,
      idsToken
    ].join('|');
  }, [activeBrowseFilterValues, activeFilter.loader, activeFilter.version, currentPage, modSearch, mods, normalizedBrowseType]);
  const browseContentLabel = getContentTypeLabel(browseContentType);
  const manageContentLabel = getContentTypeLabel(manageContentType);
  const browseSearchPlaceholder =
    normalizedBrowseType === 'resourcepack'
      ? t('searchResourcePacks')
      : normalizedBrowseType === 'shader'
        ? t('searchShaders')
        : t('searchMods');
  const latestInstalledNotes = useMemo(() => normalizeUpdateNotes(latestInstalledUpdate.notes, languageCode), [languageCode, latestInstalledUpdate.notes]);
  const latestUpdateDetails = useMemo(
    () =>
      latestInstalledNotes.length
        ? latestInstalledNotes
        : latestInstalledUpdate.version
          ? [t('updateBannerChangesFallback')]
          : [t('latestUpdateEmpty')],
    [latestInstalledNotes, latestInstalledUpdate.version, t]
  );
  const latestUpdateVersionLabel = latestInstalledUpdate.version ? t('latestUpdateVersion', { version: latestInstalledUpdate.version }) : '';
  const themeAccentRgb = useMemo(() => parseRgbTriplet(activeVisualTheme.pointerRgb, [34, 197, 94]), [activeVisualTheme.pointerRgb]);
  const themeAccentSoftRgb = useMemo(() => mixRgb(themeAccentRgb, [255, 255, 255], 0.16), [themeAccentRgb]);
  const themeAccentDeepRgb = useMemo(() => mixRgb(themeAccentRgb, [4, 11, 24], 0.56), [themeAccentRgb]);
  const themeAccentHex = useMemo(() => rgbToHex(themeAccentRgb), [themeAccentRgb]);
  const themeAccentSoftHex = useMemo(() => rgbToHex(themeAccentSoftRgb), [themeAccentSoftRgb]);
  const themeAccentDeepHex = useMemo(() => rgbToHex(themeAccentDeepRgb), [themeAccentDeepRgb]);
  const themeAccentRgba = useCallback((alpha = 0.28) => `rgba(${themeAccentRgb.join(',')}, ${Math.max(0, Math.min(1, Number(alpha) || 0))})`, [themeAccentRgb]);
  const themeBrandIconStyle = useMemo(
    () => ({
      background: `linear-gradient(135deg, ${themeAccentSoftHex} 0%, ${themeAccentHex} 52%, ${themeAccentDeepHex} 100%)`,
      boxShadow: `0 0 30px ${themeAccentRgba(0.34)}`
    }),
    [themeAccentDeepHex, themeAccentHex, themeAccentRgba, themeAccentSoftHex]
  );
  const themeCreateButtonStyle = useMemo(
    () => ({
      background: `linear-gradient(90deg, ${themeAccentSoftHex} 0%, ${themeAccentHex} 100%)`,
      color: '#04130a',
      boxShadow: `0 12px 26px ${themeAccentRgba(0.24)}`
    }),
    [themeAccentHex, themeAccentRgba, themeAccentSoftHex]
  );
  const getPrimaryButtonStyle = useCallback(
    (instance) => {
      if (instance.installState === 'installed' && instance.isRunning) {
        return {
          borderColor: 'rgba(248, 113, 113, 0.55)',
          background: 'linear-gradient(90deg, rgba(220, 38, 38, 0.26) 0%, rgba(248, 113, 113, 0.18) 100%)',
          color: '#fee2e2'
        };
      }
      if (instance.installState === 'installed') {
        return {
          '--play-hover-bg': `linear-gradient(90deg, ${themeAccentSoftHex} 0%, ${themeAccentHex} 100%)`,
          '--play-hover-fg': '#04130a'
        };
      }
      if (instance.installState === 'installing') {
        return {
          borderColor: themeAccentRgba(0.45),
          background: themeAccentRgba(0.18),
          color: themeAccentSoftHex
        };
      }
      return {
        borderColor: themeAccentRgba(0.34)
      };
    },
    [themeAccentHex, themeAccentRgba, themeAccentSoftHex]
  );

  const currentManageItems = resolveContentListByType(editingInstance, manageContentType);
  const allModsCount = currentManageItems.length;
  const allSelected = allModsCount > 0 && selectedModIds.length === allModsCount;
  const hasSelection = selectedModIds.length > 0;
  const totalModPages = Math.max(1, Math.ceil(totalMods / MODS_PER_PAGE));
  const canGoPrevPage = currentPage > 0;
  const canGoNextPage = currentPage < totalModPages - 1;

  const browsePageButtons = useMemo(() => {
    const current = currentPage + 1;
    const pages = [];
    for (let p = Math.max(1, current - 2); p <= Math.min(totalModPages, current + 2); p += 1) {
      pages.push(p);
    }
    return pages;
  }, [currentPage, totalModPages]);
  const editorDefaultCape = useMemo(
    () => skinsState.defaultCapes.find((entry) => String(entry.id) === String(skinDraft.defaultCapeId || '')) || null,
    [skinsState.defaultCapes, skinDraft.defaultCapeId]
  );
  const skinEditorPreviewSkin = skinDraft.textureDataUrl || previewSkin?.textureDataUrl || '';
  const skinEditorPreviewCape =
    officialProfile.hasLicense && skinDraft.capeMode === 'default' ? editorDefaultCape?.dataUrl || '' : '';
  const starParticles = useMemo(() => buildStarParticles(76), []);
  const rainDrops = useMemo(() => buildRainDrops(92), []);
  const snowFlakes = useMemo(() => buildSnowFlakes(78), []);
  const snowDustParticles = useMemo(() => buildSnowDustParticles(52), []);
  const pointerPrimaryBackground = `radial-gradient(circle, rgba(${activeVisualTheme.pointerRgb}, 0.24), rgba(${activeVisualTheme.pointerRgb}, 0.10) 40%, rgba(${activeVisualTheme.pointerRgb}, 0) 70%)`;
  const pointerSecondaryBackground = `radial-gradient(circle, rgba(${activeVisualTheme.pointerRgb}, 0.18), rgba(${activeVisualTheme.pointerRgb}, 0) 65%)`;
  const showUpdateBanner =
    hasUpdaterApi &&
    !updateBannerDismissed &&
    (updaterBanner.state === 'available' ||
      updaterBanner.state === 'downloading' ||
      updaterBanner.state === 'downloaded' ||
      updaterBanner.state === 'installing');
  const updateProgressPercent = Number.isFinite(Number(updaterBanner.percent)) ? Math.max(0, Math.min(100, Math.round(Number(updaterBanner.percent)))) : 0;
  const updateStatusText =
    updaterBanner.state === 'downloading'
      ? t('updateBannerStatusDownloading')
      : updaterBanner.state === 'installing'
        ? t('updateBannerStatusInstalling')
        : t('updateBannerStatusAvailable');
  const updateActionLabel = t('updateBannerAction');
  const updateActionDisabled =
    !hasUpdaterApi ||
    updateActionBusy ||
    updaterBanner.state === 'checking' ||
    updaterBanner.state === 'downloading' ||
    updaterBanner.state === 'installing';
  const updateNotes = updaterBanner.notes.length ? updaterBanner.notes : [t('updateBannerChangesFallback')];

  return (
    <div
      ref={launcherRootRef}
      style={{
        '--pointer-x': '50vw',
        '--pointer-y': '50vh',
        '--pointer-opacity': cursorGlowEnabled ? '0.72' : '0',
        '--pointer-distort-opacity': cursorDistortionEnabled ? '0.54' : '0'
      }}
      className={`relative flex h-screen w-screen select-none flex-col overflow-hidden bg-[#080808] font-sans text-white ${
        realtimeEffectsEnabled ? '' : 'effects-paused'
      }`}
    >
      <div className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${realtimeEffectsEnabled ? '' : 'ambient-effects--paused'}`}>
        <div className="absolute inset-0 bg-[#05070d]" />
        <div
          className="absolute inset-0 animate-[auroraPulse_18s_ease-in-out_infinite] transition-[background] duration-500"
          style={{ background: activeVisualTheme.overlay }}
        />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:120px_120px] animate-[gridShift_32s_linear_infinite]" />
        <div className="absolute left-[6%] top-[14%] h-28 w-28 animate-[floatGlow_8s_ease-in-out_infinite] rounded-full bg-emerald-400/12 blur-2xl" />
        <div className="absolute right-[10%] top-[22%] h-24 w-24 animate-[floatGlow_10s_ease-in-out_infinite] rounded-full bg-cyan-300/10 blur-2xl" />
        <div className="absolute bottom-[10%] left-[40%] h-20 w-20 animate-[floatGlow_12s_ease-in-out_infinite] rounded-full bg-green-300/11 blur-2xl" />
        {ambientEffect === 'stars' &&
          starParticles.map((star) => (
            <span
              key={star.id}
              className="star-particle"
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                opacity: star.opacity,
                animationDuration: `${star.durationSec}s`,
                animationDelay: `${star.delaySec}s`
              }}
            />
          ))}
        {ambientEffect === 'stars' &&
          comets.map((comet) => (
            <span
              key={comet.id}
              className="comet-particle"
              style={{
                width: `${comet.tailLengthPx.toFixed(2)}px`,
                height: `${comet.thicknessPx.toFixed(2)}px`,
                '--comet-start-x': `${comet.startX.toFixed(3)}vw`,
                '--comet-start-y': `${comet.startY.toFixed(3)}vh`,
                '--comet-dx': `${comet.dx.toFixed(3)}vw`,
                '--comet-dy': `${comet.dy.toFixed(3)}vh`,
                '--comet-angle': `${comet.angleDeg.toFixed(2)}deg`,
                '--comet-alpha': comet.opacity.toFixed(3),
                '--comet-head-size': `${comet.headSizePx.toFixed(2)}px`,
                animationDuration: `${comet.durationMs.toFixed(0)}ms`
              }}
              onAnimationEnd={() => {
                setComets((prev) => prev.filter((entry) => entry.id !== comet.id));
              }}
            />
          ))}
        {ambientEffect === 'rain' &&
          rainDrops.map((drop) => (
            <span
              key={drop.id}
              className="rain-drop"
              style={{
                left: drop.left,
                height: drop.length,
                opacity: drop.opacity,
                '--rain-wind': `${rainWindDrift.toFixed(2)}px`,
                animationDuration: `${drop.durationSec}s`,
                animationDelay: `${drop.delaySec}s`
              }}
            />
          ))}
        {ambientEffect === 'snow' &&
          snowFlakes.map((flake) => (
            <span
              key={flake.id}
              className="snow-flake"
              style={{
                left: flake.left,
                width: flake.size,
                height: flake.size,
                opacity: flake.opacity,
                '--snow-drift': flake.driftPx,
                animationDuration: `${flake.durationSec}s`,
                animationDelay: `${flake.delaySec}s`
              }}
            />
          ))}
        {ambientEffect === 'snow' &&
          snowDustParticles.map((dust) => (
            <span
              key={dust.id}
              className="snow-dust"
              style={{
                left: dust.left,
                width: dust.size,
                height: dust.size,
                opacity: dust.opacity,
                '--snow-dust-drift': dust.driftPx,
                animationDuration: `${dust.durationSec}s`,
                animationDelay: `${dust.delaySec}s`
              }}
            />
          ))}
        {cursorDistortionEnabled && (
          <div className="canvas-wrap cursor-distortion-wrap">
            <canvas ref={neonTrailCanvasRef} id="canvas" />
          </div>
        )}
        {cursorGlowEnabled && (
          <>
            <div
              className="absolute h-56 w-56 rounded-full blur-[48px] transition-opacity duration-300 will-change-transform"
              style={{
                background: pointerPrimaryBackground,
                transform: 'translate3d(var(--pointer-x), var(--pointer-y), 0) translate(-50%, -50%)',
                opacity: 'var(--pointer-opacity)'
              }}
            />
            <div
              className="absolute h-28 w-28 rounded-full border border-white/20 blur-[22px] transition-opacity duration-500 will-change-transform"
              style={{
                background: pointerSecondaryBackground,
                transform: 'translate3d(var(--pointer-x), var(--pointer-y), 0) translate(-50%, -50%)',
                opacity: 'calc(var(--pointer-opacity) * 0.72)'
              }}
            />
          </>
        )}
      </div>

      <div className="drag-region relative z-40 flex h-11 items-center border-b border-white/[0.05] bg-gradient-to-r from-[#0b111c]/95 via-[#0d121d]/95 to-[#0a1118]/95 pl-4 pr-2 backdrop-blur-xl animate-[slideDown_420ms_ease-out]">
        <div className="pointer-events-none flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md" style={themeBrandIconStyle}>
            <Cpu size={11} className="text-white" />
          </div>
          <p className="text-[11px] font-black tracking-wide text-zinc-100">KonLauncher</p>
        </div>

        <div className="no-drag ml-auto flex items-center gap-1">
          <button
            onClick={handleWindowMinimize}
            disabled={!hasDesktopWindowApi}
            className="flex h-8 w-10 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
            aria-label={t('windowMinimize')}
          >
            <Minus size={14} />
          </button>
          <button
            onClick={handleWindowToggleMaximize}
            disabled={!hasDesktopWindowApi}
            className="flex h-8 w-10 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
            aria-label={isWindowMaximized ? t('windowRestore') : t('windowMaximize')}
          >
            {isWindowMaximized ? <Copy size={13} /> : <Square size={12} />}
          </button>
          <button
            onClick={handleWindowClose}
            disabled={!hasDesktopWindowApi}
            className="flex h-8 w-10 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:opacity-40"
            aria-label={t('windowClose')}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {showUpdateBanner && (
        <div
          className="fixed right-5 top-14 z-[205] w-[min(440px,calc(100vw-24px))] rounded-3xl border bg-[#10141f]/96 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          style={{ borderColor: themeAccentRgba(0.24) }}
        >
          <button
            onClick={dismissUpdateBanner}
            disabled={updaterBanner.state === 'installing'}
            className="absolute right-3 top-3 rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t('updateBannerHide')}
            title={t('updateBannerHide')}
          >
            <X size={15} />
          </button>
          <div className="pr-8">
            <p className="text-sm font-black tracking-wide text-zinc-100">{t('updateBannerTitle')}</p>
            <p className="mt-1 text-xs font-semibold text-zinc-400">{updateStatusText}</p>
          </div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-[#0c1420]/75 px-3 py-2.5">
            <p className="text-[11px] font-black uppercase tracking-[0.08em]" style={{ color: themeAccentSoftHex }}>{t('updateBannerChangesTitle')}</p>
            <div className="mt-1.5 space-y-1">
              {updateNotes.map((note, index) => (
                <p key={`update-note-${index}`} className="text-[11px] font-semibold leading-relaxed text-zinc-300">
                  {note}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-800/90">
            <div
              className="h-full transition-all duration-200"
              style={{ background: `linear-gradient(90deg, ${themeAccentSoftHex} 0%, ${themeAccentHex} 100%)`, width: `${updateProgressPercent}%` }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs font-black" style={{ color: themeAccentSoftHex }}>{updateProgressPercent}%</span>
            <button
              onClick={applyLauncherUpdate}
              disabled={updateActionDisabled}
              className="flex min-w-[132px] items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-black tracking-wide text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
              style={{ background: `linear-gradient(90deg, #ffffff 0%, ${themeAccentSoftHex} 100%)` }}
            >
              {(updateActionBusy || updaterBanner.state === 'downloading' || updaterBanner.state === 'installing') && <Loader2 size={14} className="animate-spin" />}
              {updateActionLabel}
            </button>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <aside className="z-20 flex w-64 flex-col border-r border-white/10 bg-gradient-to-b from-[#0d111a]/94 via-[#0b1017]/94 to-[#0a0f15]/92 backdrop-blur-3xl animate-[slideInLeft_500ms_ease-out]">
          <div className="flex items-center gap-3 p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={themeBrandIconStyle}>
              <Cpu size={22} className="text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tighter">KonLauncher</h1>
          </div>

          <nav className="flex-1 space-y-1.5 px-4">
            <NavItem icon={<Library size={18} />} label={t('navLibrary')} active={activeTab === 'library'} onClick={() => setActiveTab('library')} />
            <NavItem icon={<Download size={18} />} label={t('navBrowseMods')} active={activeTab === 'browse'} onClick={() => setActiveTab('browse')} />
            <NavItem icon={<Shirt size={18} />} label={t('navSkins')} active={activeTab === 'skins'} onClick={() => setActiveTab('skins')} />
            <NavItem icon={<Settings size={18} />} label={t('navSettings')} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </nav>

          <div className="p-6">
            <div ref={nicknameMenuRef} className="relative">
              {isNicknameMenuOpen && (
                <div className="absolute bottom-[calc(100%+10px)] left-0 right-0 z-[220] rounded-2xl border border-white/15 bg-[#0c121b]/95 p-3 shadow-[0_20px_42px_rgba(0,0,0,0.58)] backdrop-blur-md">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.08em] text-zinc-400">{t('nicknameManagerTitle')}</p>
                  <div className="custom-scrollbar max-h-48 space-y-1.5 overflow-y-auto pr-1">
                    {nicknameOptions.map((nick) => {
                      const selected = nick.toLowerCase() === offlineUsername.toLowerCase();
                      return (
                        <div
                          key={nick}
                          className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${selected ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-white/10 bg-white/[0.03]'}`}
                        >
                          <button
                            onClick={() => {
                              applyNickname(nick);
                              setIsNicknameMenuOpen(false);
                            }}
                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          >
                            <span className={`truncate text-xs font-bold ${selected ? 'text-emerald-200' : 'text-zinc-200'}`}>{nick}</span>
                            {selected && <Check size={12} className="shrink-0 text-emerald-300" />}
                          </button>
                          <img src={getAvatarUrl(nick)} alt="" className="h-7 w-7 shrink-0 rounded-lg bg-zinc-900 p-0.5" />
                          <button
                            onClick={() => removeNicknamePreset(nick)}
                            className="rounded-md border border-white/10 p-1 text-zinc-400 transition-colors hover:border-red-400/40 hover:text-red-300"
                            title={t('nicknameDelete')}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={nicknameDraft}
                      onChange={(event) => setNicknameDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addNicknamePreset();
                        }
                      }}
                      placeholder={t('nicknamePlaceholder')}
                      className="h-9 min-w-0 flex-1 rounded-xl border border-zinc-700 bg-black/30 px-3 text-xs font-semibold outline-none focus:border-emerald-400/55"
                    />
                    <button
                      onClick={addNicknamePreset}
                      className="inline-flex h-9 items-center rounded-xl border border-emerald-400/35 bg-emerald-500/12 px-3 text-[11px] font-black text-emerald-200 transition-colors hover:bg-emerald-500/20"
                    >
                      {t('nicknameAdd')}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsNicknameMenuOpen((prev) => !prev)}
                className="flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.03] to-emerald-400/[0.03] p-3.5 text-left transition-colors hover:border-emerald-400/35"
              >
                <img src={getAvatarUrl(activeMinecraftUsername)} alt="avatar" className="h-10 w-10 rounded-xl bg-zinc-800 p-1" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">{offlineUsername}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-green-500">{t('statusOffline')}</p>
                </div>
              </button>
            </div>
          </div>
        </aside>

        <main className="relative z-10 flex flex-1 flex-col animate-[fadeRise_520ms_ease-out]">
          <header className="relative z-[140] flex h-20 items-center justify-between border-b border-white/[0.05] bg-gradient-to-r from-[#0e141f]/35 via-[#0c1118]/20 to-[#0e141f]/35 px-10 backdrop-blur-sm">
            <div className="flex-1">
              {activeTab === 'browse' && (
                <div className="group relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-green-500" size={18} />
                  <input
                    type="text"
                    value={modSearch}
                    onChange={(e) => {
                      setModSearch(e.target.value);
                      setCurrentPage(0);
                    }}
                    placeholder={browseSearchPlaceholder}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/40 py-2.5 pl-12 pr-6 text-sm outline-none transition-all focus:border-green-500/50"
                  />
                </div>
              )}
              {activeTab === 'library' && <h2 className="text-lg font-black uppercase tracking-widest text-zinc-500">{t('yourLibrary')}</h2>}
              {activeTab === 'skins' && <h2 className="text-lg font-black uppercase tracking-widest text-zinc-500">{t('skinsTitle')}</h2>}
            </div>
            <div className="flex items-center gap-3">
              <div className="group relative hidden md:block">
                <button className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/45 px-4 py-2 text-xs font-black tracking-wide text-zinc-200 transition-all hover:border-emerald-400/35 hover:text-emerald-200">
                  <History size={14} /> {t('latestUpdateLabel')}
                </button>
                <div className="pointer-events-none invisible absolute right-0 top-[calc(100%+10px)] z-[420] w-[min(380px,78vw)] translate-y-1 rounded-2xl border border-white/10 bg-[#0b1220] p-4 opacity-0 shadow-[0_18px_50px_rgba(0,0,0,0.62)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-[11px] font-black uppercase tracking-[0.08em]" style={{ color: themeAccentSoftHex }}>{t('latestUpdateTitle')}</p>
                  {latestUpdateVersionLabel ? <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-zinc-400">{latestUpdateVersionLabel}</p> : null}
                  <div className="mt-2 space-y-1.5">
                    {latestUpdateDetails.map((item, index) => (
                      <p key={`latest-update-${index}`} className="text-[11px] font-semibold leading-relaxed text-zinc-300">
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
              {activeTab === 'skins' ? (
                <button
                  onClick={openSkinsFolder}
                  className="group flex items-center gap-2 rounded-full border border-emerald-400/25 bg-gradient-to-r from-emerald-500/15 to-teal-400/10 px-5 py-2.5 text-xs font-black text-emerald-100 transition-all hover:-translate-y-0.5 hover:from-emerald-500/25 hover:to-teal-400/20"
                >
                  <FolderOpen size={16} /> {t('skinsOpenFolder')}
                </button>
              ) : (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="group flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-[#05130a] transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
                  style={themeCreateButtonStyle}
                >
                  <Plus size={18} className="transition-transform duration-500 group-hover:rotate-90" /> {t('createInstance')}
                </button>
              )}
            </div>
          </header>

          <div className="custom-scrollbar flex-1 overflow-y-auto p-10 pt-6">
            {activeTab === 'library' &&
              (instances.length === 0 ? (
                <div className="mx-auto mt-24 max-w-lg rounded-[2rem] border border-white/10 bg-zinc-900/30 p-8 text-center">
                  <p className="text-lg font-black text-zinc-100">{t('noInstancesYet')}</p>
                  <p className="mt-2 text-sm text-zinc-500">{t('noInstancesHint')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="group flex min-h-[318px] flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-white/25 bg-zinc-900/25 p-7 text-zinc-300 transition-all hover:-translate-y-0.5 hover:border-emerald-300/60 hover:text-emerald-200 hover:shadow-[0_16px_34px_rgba(16,185,129,0.12)]"
                  >
                    <Plus size={32} className="mb-4 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
                    <p className="text-lg font-black">{t('createInstance')}</p>
                  </button>

                  {instances.map((inst) => {
                    const instanceId = String(inst.id);
                    const dragEnabled = instanceDragEnabledId === instanceId;
                    const isDragging = draggingInstanceId === instanceId;
                    const isDragOver = Boolean(draggingInstanceId) && draggingInstanceId !== instanceId && instanceDragOverId === instanceId;
                    const dragLeft = isDragging ? instanceDragPointer.x - instanceDragMetrics.offsetX : 0;
                    const dragTop = isDragging ? instanceDragPointer.y - instanceDragMetrics.offsetY : 0;

                    return (
                      <div
                        key={inst.id}
                        ref={(node) => {
                          if (node) {
                            instanceCardRefs.current.set(instanceId, node);
                          } else {
                            instanceCardRefs.current.delete(instanceId);
                          }
                        }}
                        className={`group rounded-[2.5rem] border bg-zinc-900/30 p-7 transition-all ${
                          isDragging
                            ? 'cursor-grabbing border-emerald-300/55 shadow-[0_14px_26px_rgba(16,185,129,0.22)]'
                            : isDragOver
                              ? 'border-emerald-300/70 shadow-[0_0_0_1px_rgba(52,211,153,0.42)]'
                              : 'border-white/5 hover:border-green-500/30'
                        } ${dragEnabled ? 'cursor-grab' : ''}`}
                        style={
                          isDragging
                            ? {
                                position: 'fixed',
                                left: `${dragLeft}px`,
                                top: `${dragTop}px`,
                                width: instanceDragMetrics.width ? `${instanceDragMetrics.width}px` : undefined,
                                zIndex: 90,
                                transition: 'none',
                                pointerEvents: 'none'
                              }
                            : undefined
                        }
                      >
                        <div className="mb-6 flex items-start justify-between">
                          <InstanceAvatar instance={inst} className="h-14 w-14 rounded-2xl border-white/5 bg-zinc-800/50" iconClassName="h-8 w-8" />
                          <div className="ml-auto flex items-center gap-2">
                            <span
                              className={`rounded-xl p-2 text-zinc-500 transition-colors ${
                                dragEnabled || isDragging ? 'bg-emerald-500/15 text-emerald-200' : 'bg-transparent'
                              }`}
                              title={languageCode === 'ru' ? 'Зажми и перетащи, чтобы изменить порядок' : 'Hold and drag to reorder'}
                              onPointerDown={(event) => startInstanceCardDrag(event, instanceId)}
                            >
                              <GripVertical size={16} />
                            </span>
                            <button
                              onMouseDown={(event) => event.stopPropagation()}
                              onClick={() => openManageModal(inst)}
                              className="rounded-2xl p-2.5 text-zinc-500 transition-all hover:bg-white/5 hover:text-white"
                            >
                              <Sliders size={20} />
                            </button>
                            <button
                              onMouseDown={(event) => event.stopPropagation()}
                              onClick={() => requestDeleteInstance(inst)}
                              className="rounded-2xl p-2.5 text-zinc-500 transition-all hover:bg-red-500/10 hover:text-red-500"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>

                        <h3 className="mb-1 text-xl font-black transition-colors group-hover:text-green-400">{inst.name}</h3>
                        <div className="mb-3 flex items-center gap-2">
                          <span className="rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-[9px] font-black text-zinc-500">{inst.version}</span>
                          <span
                            className={`rounded-lg border px-2.5 py-1 text-[9px] font-black tracking-wider ${getInstanceLoaderBadgeClass(inst.loader)}`}
                          >
                            {formatLoaderName(inst.loader)}
                          </span>
                        </div>

                        {getLoaderShortDescription(inst.loader, languageCode) ? (
                          <p className="mb-3 line-clamp-2 text-[10px] font-semibold text-zinc-400">{getLoaderShortDescription(inst.loader, languageCode)}</p>
                        ) : null}

                        {inst.installPath ? (
                          <p className="mb-4 truncate text-[10px] font-bold text-zinc-500" title={inst.installPath}>
                            {inst.installPath}
                          </p>
                        ) : (
                          <p className="mb-4 text-[10px] font-bold text-zinc-600">{t('noInstallPath')}</p>
                        )}

                        {inst.lastError ? <p className="mb-4 text-[10px] font-bold text-red-400">{inst.lastError}</p> : <div className="mb-4 h-[14px]" />}

                        <button
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={() => handleInstancePrimaryAction(inst)}
                          disabled={inst.installState === 'installing' || !hasMinecraftApi}
                          className={`flex w-full items-center justify-center gap-3 rounded-2xl py-3.5 font-black transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ${getPrimaryButtonClassName(
                            inst
                          )}`}
                          style={getPrimaryButtonStyle(inst)}
                        >
                          {getPrimaryButtonIcon(inst)} {getPrimaryButtonLabel(inst)}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}

            {activeTab === 'browse' && (
              <div className="space-y-8">
                {editingInstance && (
                  <div className="flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-600/10 p-4">
                    <div className="rounded-lg bg-green-500 p-2">
                      <Download size={14} className="text-white" />
                    </div>
                    <p className="text-xs font-bold text-green-400">
                      {t('addContentToInstance', { type: browseContentLabel, name: editingInstance.name })}
                    </p>
                    <button onClick={() => setEditingInstanceId(null)} className="ml-auto text-green-500 hover:text-white">
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[290px_minmax(0,1fr)]">
                  <aside className="space-y-4">
                    {activeBrowseFilterGroups.map((group) => (
                      <FilterGroupCard
                        key={group.id}
                        title={group.title}
                        options={group.options}
                        selectedValues={Array.isArray(activeBrowseFilterValues[group.id]) ? activeBrowseFilterValues[group.id] : []}
                        isOpen={(openBrowseFilterGroups[normalizeContentType(browseContentType)] || {})[group.id] !== false}
                        onToggleOpen={() => toggleBrowseFilterGroupOpen(group.id)}
                        onToggleOption={(optionId) => toggleBrowseFilterOption(group.id, optionId)}
                      />
                    ))}
                    <button
                      onClick={clearBrowseFiltersForType}
                      disabled={activeFilterCount === 0}
                      className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-2.5 text-xs font-black text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      {t('clearFilters')} {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
                    </button>
                  </aside>

                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-44">
                        <CustomSelect
                          value={browseContentType}
                          options={browseTypeOptions}
                          onChange={(type) => {
                            setBrowseContentType(normalizeContentType(type));
                            setCurrentPage(0);
                          }}
                          placeholder={t('browseType')}
                        />
                      </div>
                      <div className="w-40">
                        <CustomSelect
                          value={activeFilter.version}
                          options={browseVersionOptions}
                          onChange={(version) => {
                            setActiveFilter((prev) => ({ ...prev, version }));
                            setCurrentPage(0);
                          }}
                          placeholder={t('allVersions')}
                          icon={Calendar}
                        />
                      </div>
                      {canToggleBrowseHeader && (
                        <div className="group relative">
                          <button
                            onClick={() =>
                              setShowBrowseHeaderByType((prev) => ({
                                ...prev,
                                [normalizedBrowseType]: !(prev[normalizedBrowseType] !== false)
                              }))
                            }
                            className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 text-zinc-300 transition-colors hover:border-white/20 hover:bg-zinc-800"
                            aria-label={browseHeaderToggleTitle}
                          >
                            {showBrowseHeader ? <ImageOff size={17} /> : <LayoutGrid size={17} />}
                          </button>
                          <div className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] z-[220] w-max -translate-x-1/2 translate-y-1 rounded-xl border border-white/10 bg-[#0f1522]/96 px-3 py-2 text-[10px] font-semibold text-zinc-200 opacity-0 shadow-[0_14px_30px_rgba(0,0,0,0.45)] transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/90" />
                              {browseHeaderToggleTitle}
                            </span>
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-zinc-500">{t('foundMods', { count: totalMods })}</p>
                    </div>

                    <div className={cardGridClassName}>
                      {isLoadingMods
                        ? [...Array(6)].map((_, index) => (
                            <div
                              key={index}
                              className={`${showBrowseHeader ? 'h-[340px]' : 'h-32'} animate-pulse rounded-3xl bg-zinc-900/30`}
                            />
                          ))
                        : mods.map((mod, index) => {
                            const instanceContent = resolveContentListByType(editingInstance, browseContentType);
                            const alreadyHas = instanceContent.some((item) => String(item.projectId || item.id) === String(mod.project_id));
                            const isBusy = modActionBusyId === mod.project_id;
                            const isDownloading =
                              modTransfer?.projectId === mod.project_id &&
                              normalizeContentType(modTransfer?.contentType || 'mod') === normalizeContentType(browseContentType) &&
                              modTransfer?.status !== 'done';
                            const progress = isDownloading ? modTransfer?.percent || 0 : 0;
                            const creatorValue =
                              mod.organization?.title ||
                              mod.organization?.name ||
                              mod.author ||
                              mod.owner ||
                              mod.author_name ||
                              t('creatorUnknown');
                            const cardTags = resolveCardTags(mod, browseContentType, languageCode);
                            const visibleTags = cardTags.slice(0, 4);
                            const hiddenTags = cardTags.slice(4);
                            const updatedAtLabel = formatRelativeUpdatedAt(mod.date_modified || mod.date_created, languageCode);
                            const headerImage = resolveProjectHeaderImage(mod) || FALLBACK_HEADER_16_9;
                            const isRichPreviewCard = showBrowseHeader;
                            const cardAnimationStyle = {
                              animationDelay: `${Math.min(index, 9) * 42}ms`,
                              animationFillMode: 'both'
                            };

                            if (isRichPreviewCard) {
                              return (
                                <div
                                  key={`${browseAnimationToken}-${mod.project_id}`}
                                  className="group overflow-hidden rounded-[1.6rem] border border-white/[0.08] bg-[#272c35]/90 transition-all hover:border-white/20 hover:bg-[#2d3340] animate-[browseCardIn_340ms_cubic-bezier(0.22,1,0.36,1)]"
                                  style={cardAnimationStyle}
                                >
                                  <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
                                    <img
                                      src={headerImage}
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = FALLBACK_HEADER_16_9;
                                      }}
                                      className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                      alt=""
                                    />
                                    {isDownloading && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                        <div className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all" style={{ width: `${progress}%` }} />
                                        <Loader2 className="animate-spin text-green-400" size={24} />
                                      </div>
                                    )}
                                  </div>

                                  <div className="relative px-4 pb-4 pt-3">
                                    <div className="absolute -top-7 left-4 h-14 w-14 overflow-hidden rounded-2xl border border-white/15 bg-zinc-900 shadow-lg">
                                      <img
                                        src={toImageSrc(mod.icon_url) || FALLBACK_ICON_80}
                                        onError={(e) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.src = FALLBACK_ICON_80;
                                        }}
                                        className="block h-full w-full object-cover"
                                        alt=""
                                      />
                                    </div>

                                    <div className="min-w-0 pl-[4.2rem]">
                                      <h3 className="truncate text-[16px] font-extrabold text-zinc-100 transition-colors group-hover:text-green-300">{mod.title}</h3>
                                      <p className="truncate text-[12px] text-zinc-400">
                                        {t('byAuthor', { author: creatorValue })}
                                      </p>
                                    </div>

                                    <p className="mt-2 line-clamp-2 text-[12px] text-zinc-300/85">{mod.description}</p>

                                    {(visibleTags.length > 0 || hiddenTags.length > 0) && (
                                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                        {visibleTags.map((chip) => (
                                          <span
                                            key={chip.id}
                                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold leading-none ${getTagChipClassName(chip, browseContentType)}`}
                                          >
                                            {renderBrowseChipIcon(chip, browseContentType, `h-3.5 w-3.5 shrink-0 ${chip.kind === 'tag' ? 'text-zinc-300' : ''}`.trim())}
                                            {chip.label}
                                          </span>
                                        ))}
                                        {hiddenTags.length > 0 && (
                                          <div className="group/tags relative">
                                            <span className="rounded-full border border-white/12 bg-white/5 px-2 py-1 text-[11px] font-semibold leading-none text-zinc-300">
                                              +{hiddenTags.length}
                                            </span>
                                            <div className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 min-w-[180px] rounded-xl border border-white/10 bg-[#101010] p-2 opacity-0 shadow-2xl transition-opacity group-hover/tags:opacity-100">
                                              {hiddenTags.map((chip) => (
                                                <div key={chip.id} className="flex items-center gap-1.5 truncate px-2 py-1 text-[11px] text-zinc-300">
                                                  {renderBrowseChipIcon(chip, browseContentType, `h-3.5 w-3.5 shrink-0 ${chip.kind === 'tag' ? 'text-zinc-400' : ''}`.trim())}
                                                  {chip.label}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <div className="mt-3 flex items-center justify-between gap-3">
                                      <div className="flex min-w-0 flex-wrap items-center gap-3 text-[12px] font-bold text-zinc-300">
                                        <span className="inline-flex items-center gap-1.5">
                                          <ArrowDownToLine size={13} className="text-zinc-300" />
                                          {formatDownloads(mod.downloads)}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                          <Heart size={13} className="text-zinc-300" />
                                          {formatDownloads(mod.follows)}
                                        </span>
                                        {updatedAtLabel ? (
                                          <span className="inline-flex items-center gap-1.5 text-zinc-300">
                                            <History size={13} className="text-zinc-300" />
                                            {updatedAtLabel}
                                          </span>
                                        ) : null}
                                      </div>
                                      <button
                                        disabled={isBusy || isDownloading || alreadyHas || installedInstances.length === 0}
                                        onClick={() => openInstallTargetModal(mod)}
                                        className={`rounded-xl p-2 transition-all active:scale-90 ${
                                          alreadyHas ? 'bg-green-500/20 text-green-500' : 'bg-white/5 hover:bg-green-600 disabled:opacity-20'
                                        }`}
                                      >
                                        {alreadyHas ? <Check size={16} /> : <Plus size={16} />}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={`${browseAnimationToken}-${mod.project_id}`}
                                className="group flex gap-5 rounded-[2rem] border border-white/[0.03] bg-zinc-900/30 p-5 transition-all hover:bg-zinc-900/60 animate-[browseCardIn_340ms_cubic-bezier(0.22,1,0.36,1)]"
                                style={cardAnimationStyle}
                              >
                                <div className="relative shrink-0">
                                  <img
                                    src={toImageSrc(mod.icon_url) || FALLBACK_ICON_80}
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = FALLBACK_ICON_80;
                                    }}
                                    className="block h-20 w-20 rounded-2xl bg-zinc-800 object-cover"
                                    alt=""
                                  />
                                  {isDownloading && (
                                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl bg-black/60">
                                      <div className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all" style={{ width: `${progress}%` }} />
                                      <Loader2 className="animate-spin text-green-500" size={24} />
                                    </div>
                                  )}
                                </div>

                                <div className="flex min-w-0 flex-1 flex-col justify-between">
                                  <div>
                                    {(visibleTags.length > 0 || hiddenTags.length > 0) && (
                                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                                        {visibleTags.map((chip) => (
                                          <span
                                            key={chip.id}
                                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold leading-none ${getTagChipClassName(chip, browseContentType)}`}
                                          >
                                            {renderBrowseChipIcon(chip, browseContentType, `h-3.5 w-3.5 shrink-0 ${chip.kind === 'tag' ? 'text-zinc-300' : ''}`.trim())}
                                            {chip.label}
                                          </span>
                                        ))}
                                        {hiddenTags.length > 0 && (
                                          <div className="group/tags relative">
                                            <span className="rounded-full border border-white/12 bg-white/5 px-2 py-1 text-[11px] font-semibold leading-none text-zinc-300">
                                              +{hiddenTags.length}
                                            </span>
                                            <div className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 min-w-[180px] rounded-xl border border-white/10 bg-[#101010] p-2 opacity-0 shadow-2xl transition-opacity group-hover/tags:opacity-100">
                                              {hiddenTags.map((chip) => (
                                                <div key={chip.id} className="flex items-center gap-1.5 truncate px-2 py-1 text-[11px] text-zinc-300">
                                                  {renderBrowseChipIcon(chip, browseContentType, `h-3.5 w-3.5 shrink-0 ${chip.kind === 'tag' ? 'text-zinc-400' : ''}`.trim())}
                                                  {chip.label}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    <h3 className="truncate text-[15px] font-bold transition-colors group-hover:text-green-400">{mod.title}</h3>
                                    <p className="mt-1 line-clamp-2 text-[10px] text-zinc-500">{mod.description}</p>
                                    <p className="mt-1 truncate text-[11px]">
                                      <span className="text-[10px] font-black uppercase tracking-wide text-zinc-500">{t('authorLabel')}:</span>{' '}
                                      <span className="font-semibold text-emerald-300">{creatorValue}</span>
                                    </p>
                                  </div>
                                  <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[11px] font-black text-zinc-400">
                                      <ArrowDownToLine size={12} className="text-green-500" />
                                      {formatDownloads(mod.downloads)}
                                    </div>
                                    <button
                                      disabled={isBusy || isDownloading || alreadyHas || installedInstances.length === 0}
                                      onClick={() => openInstallTargetModal(mod)}
                                      className={`rounded-xl p-2 transition-all active:scale-90 ${
                                        alreadyHas ? 'bg-green-500/20 text-green-500' : 'bg-white/5 hover:bg-green-600 disabled:opacity-20'
                                      }`}
                                    >
                                      {alreadyHas ? <Check size={16} /> : <Plus size={16} />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-2 pt-2">
                  <p className="text-[11px] font-bold text-zinc-500">{t('pageOf', { page: currentPage + 1, pages: totalModPages })}</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(0)}
                      disabled={!canGoPrevPage}
                      className="rounded-lg border border-white/10 bg-zinc-900/60 px-2 py-1.5 text-[10px] font-black text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-35"
                    >
                      {'<<'}
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                      disabled={!canGoPrevPage}
                      className="rounded-lg border border-white/10 bg-zinc-900/60 p-1.5 text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-35"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    {browsePageButtons.map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page - 1)}
                        className={`h-8 min-w-8 rounded-lg border px-2 text-[11px] font-black transition-colors ${
                          page - 1 === currentPage
                            ? 'border-green-500/30 bg-green-500/15 text-green-400'
                            : 'border-white/10 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalModPages - 1, prev + 1))}
                      disabled={!canGoNextPage}
                      className="rounded-lg border border-white/10 bg-zinc-900/60 p-1.5 text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-35"
                      aria-label="Next page"
                    >
                      <ChevronRight size={14} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.max(0, totalModPages - 1))}
                      disabled={!canGoNextPage}
                      className="rounded-lg border border-white/10 bg-zinc-900/60 px-2 py-1.5 text-[10px] font-black text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-35"
                    >
                      {'>>'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'skins' && (
              <SafeRenderBoundary
                fallback={
                  <div className="rounded-[2rem] border border-red-500/25 bg-red-500/5 p-6 text-sm font-semibold text-red-200">
                    {t('skinsFailedLoad')}
                  </div>
                }
              >
                <div className="grid grid-cols-1 gap-8 xl:grid-cols-[340px_minmax(0,1fr)]">
                  <aside className="space-y-5">
                    <div className="relative overflow-hidden rounded-[2rem] border border-emerald-300/20 bg-[linear-gradient(155deg,#121b2e_0%,#0f1628_45%,#0a101c_100%)] p-5 shadow-[0_24px_52px_rgba(0,0,0,0.42)]">
                      <div className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full bg-emerald-400/14 blur-3xl" />
                      <div className="pointer-events-none absolute -bottom-12 right-[-40px] h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-zinc-200">
                          <Shirt size={14} className="text-emerald-300" />
                          {t('skinsTitle')}
                        </div>
                        <span className="rounded-full border border-emerald-300/35 bg-emerald-400/12 px-3 py-1 text-[10px] font-black text-emerald-200">
                          {skinsState.skins.length}
                        </span>
                      </div>

                      <div className="relative z-10 mt-4 rounded-[1.4rem] border border-white/10 bg-[#090f1a]/70 p-3">
                        <div className="mb-3 flex justify-center">
                          <div className="inline-flex min-w-[180px] items-center justify-center rounded-xl border border-white/10 bg-black/35 px-4 py-1.5 text-base font-black uppercase tracking-[0.12em] text-zinc-100">
                            {activeMinecraftUsername}
                          </div>
                        </div>
                        <SkinPreview3D
                          skinDataUrl={previewSkin?.textureDataUrl || ''}
                          capeDataUrl={resolveSkinCapeDataUrl(previewSkin)}
                          model={previewSkin?.model || 'wide'}
                          className="h-[425px] w-full rounded-[1.2rem]"
                        />
                        <p className="mt-3 text-center text-[11px] font-semibold text-zinc-500">{t('skinsDragRotate')}</p>
                        <p className="mt-1 text-center text-[10px] font-black uppercase tracking-wider text-zinc-600">
                          {previewSkin ? (previewSkin.model === 'slim' ? t('skinsSlim') : t('skinsWide')) : t('skinsNoActive')}
                        </p>
                      </div>
                    </div>
                  </aside>

                  <section className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-white/10 bg-[linear-gradient(140deg,rgba(17,25,43,0.68),rgba(10,16,28,0.52))] px-5 py-4">
                      <div>
                        <p className="text-xl font-black text-zinc-100">{t('skinsSaved')}</p>
                        <p className="mt-1 text-[11px] font-semibold text-zinc-400">{t('skinsSetActive')}</p>
                      </div>
                      <button
                        onClick={openCreateSkinEditor}
                        className="group inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-400/14 px-4 py-2.5 text-xs font-black tracking-wide text-emerald-100 transition-all hover:-translate-y-0.5 hover:bg-emerald-400/22"
                      >
                        <Plus size={15} className="transition-transform duration-300 group-hover:rotate-90" />
                        {t('skinsAdd')}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <button
                        onClick={openCreateSkinEditor}
                        onDragEnter={(event) => {
                          event.preventDefault();
                          const hasFiles = Array.from(event.dataTransfer?.types || []).includes('Files');
                          if (!hasFiles) return;
                          setIsSkinQuickDropActive(true);
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          const hasFiles = Array.from(event.dataTransfer?.types || []).includes('Files');
                          if (!hasFiles) return;
                          setIsSkinQuickDropActive(true);
                        }}
                        onDragLeave={(event) => {
                          event.preventDefault();
                          if (event.currentTarget.contains(event.relatedTarget)) return;
                          setIsSkinQuickDropActive(false);
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          setIsSkinQuickDropActive(false);
                          const file = event.dataTransfer.files?.[0];
                          if (!file) return;
                          void openCreateSkinEditorWithTexture(file);
                        }}
                        className={`group relative flex min-h-[236px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed p-6 text-zinc-300 transition-all ${
                          isSkinQuickDropActive
                            ? 'border-emerald-300/80 bg-emerald-500/12 text-emerald-200 shadow-[0_18px_35px_rgba(16,185,129,0.22)]'
                            : 'border-white/25 bg-[linear-gradient(155deg,rgba(25,34,53,0.65),rgba(13,18,30,0.7))] hover:-translate-y-1 hover:border-emerald-300/60 hover:text-emerald-200 hover:shadow-[0_18px_35px_rgba(16,185,129,0.16)]'
                        }`}
                      >
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.16),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <Plus size={34} className="relative z-10 mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90" />
                        <p className="relative z-10 text-lg font-semibold">{t('skinsAdd')}</p>
                        <p className="relative z-10 mt-1 text-[10px] font-semibold text-zinc-500">{languageCode === 'ru' ? 'Или перетащи PNG сюда' : 'Or drop PNG here'}</p>
                      </button>

                      {skinsState.skins.map((skin) => {
                        const skinId = String(skin.id);
                        const isActive = String(skin.id) === String(skinsState.activeSkinId || '');
                        const isPreview = String(skin.id) === String(skinPreviewId || '');
                        const dragEnabled = skinDragEnabledId === skinId;
                        const isDragging = draggingSkinId === skinId;
                        const isDragOver = Boolean(draggingSkinId) && draggingSkinId !== skinId && skinDragOverId === skinId;
                        const dragLeft = isDragging ? skinDragPointer.x - skinDragMetrics.offsetX : 0;
                        const dragTop = isDragging ? skinDragPointer.y - skinDragMetrics.offsetY : 0;

                        return (
                          <div
                            key={skin.id}
                            ref={(node) => {
                              if (node) {
                                skinCardRefs.current.set(skinId, node);
                              } else {
                                skinCardRefs.current.delete(skinId);
                              }
                            }}
                            onClick={() => {
                              setSkinPreviewId(skin.id);
                              void setActiveSkinById(skin.id);
                            }}
                            className={`group relative min-h-[236px] cursor-pointer overflow-hidden rounded-3xl border bg-[linear-gradient(150deg,#152033_0%,#10192a_54%,#0d1422_100%)] p-3 transition-all ${
                              isDragging
                                ? 'cursor-grabbing border-emerald-300/80 shadow-[0_18px_36px_rgba(16,185,129,0.22)]'
                                : isDragOver
                                  ? 'border-emerald-300/80 shadow-[0_0_0_1px_rgba(52,211,153,0.45),0_18px_36px_rgba(16,185,129,0.2)]'
                                  : isActive || isPreview
                                    ? 'border-emerald-300/80 shadow-[0_0_0_1px_rgba(52,211,153,0.45),0_18px_36px_rgba(16,185,129,0.2)]'
                                    : 'border-white/15 hover:-translate-y-1 hover:border-white/30 hover:shadow-[0_18px_30px_rgba(0,0,0,0.34)]'
                            } ${dragEnabled ? 'cursor-grab' : ''}`}
                            style={
                              isDragging
                                ? {
                                    position: 'fixed',
                                    left: `${dragLeft}px`,
                                    top: `${dragTop}px`,
                                    width: skinDragMetrics.width ? `${skinDragMetrics.width}px` : undefined,
                                    zIndex: 95,
                                    transition: 'none',
                                    pointerEvents: 'none'
                                  }
                                : undefined
                            }
                          >
                            <span
                              className={`absolute left-2 top-2 z-20 rounded-lg p-1.5 text-zinc-400 transition-all ${
                                dragEnabled || isDragging ? 'bg-emerald-500/20 text-emerald-100' : 'bg-black/30'
                              }`}
                              title={languageCode === 'ru' ? 'Зажми и перетащи, чтобы изменить порядок' : 'Hold and drag to reorder'}
                              onPointerDown={(event) => startSkinCardDrag(event, skinId)}
                            >
                              <GripVertical size={13} />
                            </span>

                            <div className="pointer-events-none absolute inset-x-6 -top-8 h-20 rounded-full bg-emerald-300/0 blur-2xl transition-all duration-300 group-hover:bg-emerald-300/15" />
                            <div className="relative">
                              {skin.textureDataUrl ? (
                                <SkinCardPreview3D
                                  skinDataUrl={skin.textureDataUrl}
                                  capeDataUrl={resolveSkinCapeDataUrl(skin)}
                                  model={skin.model || 'wide'}
                                  className="h-[162px] w-full rounded-2xl"
                                />
                              ) : (
                                <div className="flex h-[162px] w-full items-center justify-center rounded-2xl bg-zinc-800 text-zinc-500">
                                  <ImageOff size={26} />
                                </div>
                              )}
                              {isActive && (
                                <span className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-emerald-300/70 bg-emerald-400/20 text-emerald-200">
                                  <Check size={14} />
                                </span>
                              )}
                            </div>

                            <div className="px-2 pb-1 pt-3">
                              <p className="truncate text-sm font-black text-zinc-100">{skin.name}</p>
                              <p className="mt-0.5 text-[10px] font-semibold text-zinc-500">{skin.model === 'slim' ? t('skinsSlim') : t('skinsWide')}</p>
                            </div>

                            <div
                              className={`pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-4 items-center gap-2 opacity-0 transition-all ${
                                isDragging ? 'pointer-events-none opacity-0' : 'group-hover:translate-y-0 group-hover:opacity-100'
                              }`}
                            >
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEditSkinEditor(skin);
                                }}
                                onMouseDown={(event) => event.stopPropagation()}
                                className="pointer-events-auto flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-black transition-colors hover:bg-emerald-400"
                              >
                                <PencilLine size={14} /> {t('skinsEditAction')}
                              </button>
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void deleteSkinById(skin.id);
                                }}
                                onMouseDown={(event) => event.stopPropagation()}
                                className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-black transition-colors hover:bg-red-400"
                                title={t('skinsDeleteAction')}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </SafeRenderBoundary>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-xl space-y-12">
                <div className="space-y-4">
                  <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('settingsRam')}</label>
                  <div className="space-y-6 rounded-[2rem] border border-white/5 bg-zinc-900/40 p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <HardDrive size={20} style={{ color: themeAccentHex }} />
                        <span className="font-bold">{t('allocatedMemory')}</span>
                      </div>
                      <span className="text-xl font-black" style={{ color: themeAccentHex }}>
                        {globalRam} GB <span className="text-sm text-zinc-500">/ {maxRamGb} GB</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max={maxRamGb}
                      step="1"
                      value={globalRam}
                      onChange={(e) => setGlobalRam(parseInt(e.target.value, 10))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800"
                      style={{ accentColor: themeAccentHex }}
                    />
                    <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-600">
                      <span>1 GB</span>
                      <span>{maxRamGb} GB</span>
                    </div>
                    <p className="text-[11px] font-medium text-zinc-500">{t('globalRamHint')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('offlineProfile')}</label>
                  <div className="flex items-center gap-6 rounded-[2rem] border border-white/5 bg-zinc-900/40 p-8">
                    <img src={getAvatarUrl(offlineUsername)} className="h-16 w-16 rounded-2xl border border-white/5 bg-zinc-950 p-1.5" alt="avatar" />
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onBlur={() => setUsername((prev) => normalizeNicknameValue(prev) || 'Player')}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-2 text-sm outline-none focus:border-green-500/50"
                      />
                      <p className="text-[11px] font-medium text-zinc-500">{t('offlineProfileHint')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('launcherLanguage')}</label>
                  <div className="rounded-[2rem] border border-white/5 bg-zinc-900/40 p-6">
                    <CustomSelect value={launcherLanguage} options={LANGUAGES} onChange={setLauncherLanguage} placeholder={t('launcherLanguage')} />
                    <p className="mt-3 text-[11px] font-medium text-zinc-500">
                      {t('launcherLanguageHint')}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('settingsVisualEffects')}</label>
                  <div className="space-y-5 rounded-[2rem] border border-white/5 bg-zinc-900/40 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-zinc-100">{t('cursorGlowTitle')}</p>
                        <p className="mt-1 text-[11px] font-medium text-zinc-500">{t('cursorGlowHint')}</p>
                      </div>
                      <button
                        onClick={() => setCursorGlowEnabled((prev) => !prev)}
                        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          cursorGlowEnabled ? 'border-emerald-400/55 bg-emerald-500/10' : 'border-white/20 bg-zinc-900/70'
                        }`}
                        title={cursorGlowEnabled ? t('cursorGlowEnabled') : t('cursorGlowDisabled')}
                        aria-label={cursorGlowEnabled ? t('cursorGlowEnabled') : t('cursorGlowDisabled')}
                      >
                        <span
                          className={`absolute inset-0 rounded-full transition-all ${
                            cursorGlowEnabled ? 'shadow-[0_0_22px_rgba(16,185,129,0.28)]' : ''
                          }`}
                        />
                        <span
                          className={`relative h-2.5 w-2.5 rounded-full transition-all ${
                            cursorGlowEnabled
                              ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.95)]'
                              : 'bg-zinc-500/70 shadow-[0_0_0_rgba(0,0,0,0)]'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="h-px bg-white/5" />

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-zinc-100">{t('cursorDistortionTitle')}</p>
                        <p className="mt-1 text-[11px] font-medium text-zinc-500">{t('cursorDistortionHint')}</p>
                      </div>
                      <button
                        onClick={() => setCursorDistortionEnabled((prev) => !prev)}
                        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          cursorDistortionEnabled ? 'border-cyan-400/55 bg-cyan-500/10' : 'border-white/20 bg-zinc-900/70'
                        }`}
                        title={cursorDistortionEnabled ? t('cursorDistortionEnabled') : t('cursorDistortionDisabled')}
                        aria-label={cursorDistortionEnabled ? t('cursorDistortionEnabled') : t('cursorDistortionDisabled')}
                      >
                        <span
                          className={`absolute inset-0 rounded-full transition-all ${
                            cursorDistortionEnabled ? 'shadow-[0_0_24px_rgba(56,189,248,0.3)]' : ''
                          }`}
                        />
                        <span
                          className={`relative h-2.5 w-2.5 rounded-full transition-all ${
                            cursorDistortionEnabled
                              ? 'bg-cyan-300 shadow-[0_0_11px_rgba(56,189,248,0.95)]'
                              : 'bg-zinc-500/70 shadow-[0_0_0_rgba(0,0,0,0)]'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="h-px bg-white/5" />

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-bold text-zinc-100">{t('backgroundFxTitle')}</p>
                        <p className="mt-1 text-[11px] font-medium text-zinc-500">{t('backgroundFxHint')}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setAmbientEffect('stars')}
                          className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-wide transition-colors ${
                            ambientEffect === 'stars'
                              ? 'border-emerald-400/55 bg-emerald-500/15 text-emerald-200'
                              : 'border-white/10 bg-zinc-900/70 text-zinc-300 hover:border-white/20'
                          }`}
                        >
                          {t('backgroundFxStars')}
                        </button>
                        <button
                          onClick={() => setAmbientEffect('rain')}
                          className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-wide transition-colors ${
                            ambientEffect === 'rain'
                              ? 'border-emerald-400/55 bg-emerald-500/15 text-emerald-200'
                              : 'border-white/10 bg-zinc-900/70 text-zinc-300 hover:border-white/20'
                          }`}
                        >
                          {t('backgroundFxRain')}
                        </button>
                        <button
                          onClick={() => setAmbientEffect('snow')}
                          className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-wide transition-colors ${
                            ambientEffect === 'snow'
                              ? 'border-emerald-400/55 bg-emerald-500/15 text-emerald-200'
                              : 'border-white/10 bg-zinc-900/70 text-zinc-300 hover:border-white/20'
                          }`}
                        >
                          {t('backgroundFxSnow')}
                        </button>
                      </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-bold text-zinc-100">{t('themeEditorTitle')}</p>
                        <p className="mt-1 text-[11px] font-medium text-zinc-500">{t('themeEditorHint')}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Default</p>
                        <button
                          onClick={() => setVisualThemeId(defaultThemePreset.id)}
                          className={`w-full rounded-2xl border p-2 text-left transition-all ${
                            activeVisualTheme.id === defaultThemePreset.id
                              ? 'border-emerald-400/55 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(52,211,153,0.4)]'
                              : 'border-white/10 bg-zinc-900/60 hover:border-white/20'
                          }`}
                        >
                          <div className="h-10 rounded-xl" style={{ background: defaultThemePreset.preview }} />
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <p className="truncate text-[11px] font-bold text-zinc-200">
                              {defaultThemePreset.labels[languageCode] || defaultThemePreset.labels.en}
                            </p>
                            <p className="text-[10px] text-zinc-500">
                              {activeVisualTheme.id === defaultThemePreset.id ? t('themeApplied') : '\u00a0'}
                            </p>
                          </div>
                        </button>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('themeSectionSolid')}</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {solidThemePresets.map((theme) => {
                            const isSelected = theme.id === activeVisualTheme.id;
                            return (
                              <button
                                key={theme.id}
                                onClick={() => setVisualThemeId(theme.id)}
                                className={`rounded-2xl border p-2 text-left transition-all ${
                                  isSelected
                                    ? 'border-emerald-400/55 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(52,211,153,0.4)]'
                                    : 'border-white/10 bg-zinc-900/60 hover:border-white/20'
                                }`}
                              >
                                <div className="h-9 rounded-xl" style={{ background: theme.preview }} />
                                <p className="mt-2 truncate text-[11px] font-bold text-zinc-200">{theme.labels[languageCode] || theme.labels.en}</p>
                                <p className="text-[10px] text-zinc-500">{isSelected ? t('themeApplied') : '\u00a0'}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('themeSectionGradient')}</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {gradientThemePresets.map((theme) => {
                            const isSelected = theme.id === activeVisualTheme.id;
                            return (
                              <button
                                key={theme.id}
                                onClick={() => setVisualThemeId(theme.id)}
                                className={`rounded-2xl border p-2 text-left transition-all ${
                                  isSelected
                                    ? 'border-emerald-400/55 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(52,211,153,0.4)]'
                                    : 'border-white/10 bg-zinc-900/60 hover:border-white/20'
                                }`}
                              >
                                <div className="h-9 rounded-xl" style={{ background: theme.preview }} />
                                <p className="mt-2 truncate text-[11px] font-bold text-zinc-200">{theme.labels[languageCode] || theme.labels.en}</p>
                                <p className="text-[10px] text-zinc-500">{isSelected ? t('themeApplied') : '\u00a0'}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('themeSectionCustom')}</p>
                        <div
                          className={`rounded-2xl border p-3 transition-all ${
                            visualThemeId === CUSTOM_VISUAL_THEME_ID
                              ? 'border-emerald-400/55 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(52,211,153,0.4)]'
                              : 'border-white/10 bg-zinc-900/60'
                          }`}
                        >
                          <div className="h-12 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                            <div className="h-full w-full" style={{ background: customVisualThemePreset.preview }} />
                          </div>
                          <p className="mt-2 text-[11px] font-medium text-zinc-400">{t('customThemeHint')}</p>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setCustomThemeMode('solid')}
                              className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-wide transition-colors ${
                                customVisualTheme.mode === 'solid'
                                  ? 'border-emerald-400/55 bg-emerald-500/15 text-emerald-200'
                                  : 'border-white/10 bg-zinc-900/70 text-zinc-300 hover:border-white/20'
                              }`}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <Palette size={13} />
                                {t('customThemeSolid')}
                              </span>
                            </button>
                            <button
                              onClick={() => setCustomThemeMode('gradient')}
                              className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-wide transition-colors ${
                                customVisualTheme.mode === 'gradient'
                                  ? 'border-emerald-400/55 bg-emerald-500/15 text-emerald-200'
                                  : 'border-white/10 bg-zinc-900/70 text-zinc-300 hover:border-white/20'
                              }`}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <Blend size={13} />
                                {t('customThemeGradient')}
                              </span>
                            </button>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <button
                              onClick={() => setActiveCustomColorTarget('primary')}
                              className={`rounded-xl border p-2 text-left transition-colors ${
                                activeCustomColorTarget === 'primary'
                                  ? 'border-emerald-400/55 bg-emerald-500/10'
                                  : 'border-white/10 bg-zinc-900/60 hover:border-white/20'
                              }`}
                            >
                              <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                <Pipette size={12} />
                                {t('customThemePrimaryColor')}
                              </p>
                              <div className="mt-2 h-9 overflow-hidden rounded-lg border border-black/35 bg-black/40">
                                <div className="h-full w-full rounded-[7px]" style={{ background: customPrimaryColorHex }} />
                              </div>
                            </button>
                            {hasSecondaryCustomColor ? (
                              <button
                                onClick={() => setActiveCustomColorTarget('secondary')}
                                className={`rounded-xl border p-2 text-left transition-colors ${
                                  activeCustomColorTarget === 'secondary'
                                    ? 'border-emerald-400/55 bg-emerald-500/10'
                                    : 'border-white/10 bg-zinc-900/60 hover:border-white/20'
                                }`}
                              >
                                <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                  <Pipette size={12} />
                                  {t('customThemeSecondaryColor')}
                                </p>
                                <div className="mt-2 h-9 overflow-hidden rounded-lg border border-black/35 bg-black/40">
                                  <div className="h-full w-full rounded-[7px]" style={{ background: customSecondaryColorHex }} />
                                </div>
                              </button>
                            ) : (
                              <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/40 p-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{t('customThemeSecondaryColor')}</p>
                                <p className="mt-2 text-[11px] font-semibold text-zinc-500">{t('customThemeSolid')}</p>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-zinc-200">
                                <Sparkles size={13} />
                                {t('customThemePickerTitle')}
                              </p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                {activeCustomColorTarget === 'secondary' ? t('customThemeTargetSecondary') : t('customThemeTargetPrimary')}
                              </p>
                            </div>
                            <p className="mt-1 text-[10px] font-medium text-zinc-500">{t('customThemePickerHint')}</p>

                            <div
                              ref={customColorPlaneRef}
                              onPointerDown={handleCustomColorPlanePointerDown}
                              onPointerMove={handleCustomColorPlanePointerMove}
                              className="relative mt-3 h-36 cursor-crosshair overflow-hidden rounded-xl border border-white/10 bg-zinc-950"
                            >
                              <div className="absolute inset-0" style={{ background: customColorHueBackground }} />
                              <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                              <span
                                className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.35)]"
                                style={customColorPointerPosition}
                              />
                            </div>

                            <input
                              type="range"
                              min="0"
                              max="359"
                              step="1"
                              value={Math.round(customColorPickerHsv.h)}
                              onChange={handleCustomHueChange}
                              className="hue-slider mt-3 h-3 w-full cursor-pointer appearance-none rounded-full"
                              style={{
                                background:
                                  'linear-gradient(90deg, #ff0000 0%, #ffff00 16.6%, #00ff00 33.2%, #00ffff 49.8%, #0000ff 66.4%, #ff00ff 83%, #ff0000 100%)'
                              }}
                            />

                            <div className="mt-3 flex items-center gap-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('customThemeHex')}</p>
                              <input
                                type="text"
                                value={customColorHexInput}
                                onChange={handleCustomHexInputChange}
                                onBlur={commitCustomHexInput}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault();
                                    commitCustomHexInput();
                                  }
                                }}
                                className="w-full rounded-lg border border-white/10 bg-zinc-950/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-zinc-200 outline-none transition-colors focus:border-emerald-400/45"
                                spellCheck={false}
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => setVisualThemeId(CUSTOM_VISUAL_THEME_ID)}
                            className="mt-3 w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-zinc-200 transition-colors hover:border-emerald-400/40 hover:text-emerald-200"
                          >
                            {visualThemeId === CUSTOM_VISUAL_THEME_ID ? t('themeApplied') : t('customThemeApply')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {installBanner && (
        <div className="fixed bottom-5 left-1/2 z-[210] w-[min(760px,calc(100vw-40px))] -translate-x-1/2 rounded-2xl border border-green-500/20 bg-[#0f0f0f]/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="truncate text-xs font-black text-zinc-200">
              {installBanner.instanceName}: <span className="text-green-400">{installBanner.stageLabel}</span>
            </p>
            <p className="text-xs font-black text-green-400">{installBanner.percent}%</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full bg-green-500 transition-all duration-150" style={{ width: `${installBanner.percent}%` }} />
          </div>
          <p className="mt-2 truncate text-[10px] font-bold text-zinc-500">{installBanner.message}</p>
          {installLogs.length > 0 && (
            <div className="mt-2 space-y-1 rounded-xl border border-white/5 bg-black/20 p-2">
              {installLogs.slice(-3).map((logLine, idx) => (
                <p key={`${logLine}-${idx}`} className="truncate text-[10px] font-medium text-zinc-400">
                  {logLine}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <input ref={skinTextureInputRef} type="file" accept=".png,image/png" className="hidden" onChange={onSkinTextureInputChange} />

      {isSkinEditorOpen && (
        <div
          className={`fixed inset-x-0 bottom-0 top-11 z-[240] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md transition-opacity duration-200 ${
            isSkinEditorVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <div
            className={`w-full max-w-4xl rounded-3xl border border-white/10 bg-[#151821] shadow-2xl transition-all duration-200 ${
              isSkinEditorVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-[0.985] opacity-0'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="text-2xl font-black">{skinEditorMode === 'update' ? t('skinsSaveAction') : t('skinsAdding')}</h3>
              <button onClick={closeSkinEditor} className="rounded-full bg-zinc-700/50 p-2 text-zinc-300 transition-colors hover:bg-zinc-600 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {!skinDraft.textureDataUrl ? (
              <div className="p-6">
                <p className="mb-4 text-lg font-bold">{t('skinsUploadTexture')}</p>
                <div
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsSkinDropActive(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsSkinDropActive(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    if (event.currentTarget.contains(event.relatedTarget)) return;
                    setIsSkinDropActive(false);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsSkinDropActive(false);
                    const file = event.dataTransfer.files?.[0];
                    if (!file) return;
                    void applySkinTextureFile(file);
                  }}
                  className={`rounded-3xl border-2 border-dashed p-10 text-center transition-colors ${
                    isSkinDropActive ? 'border-green-400 bg-green-500/10' : 'border-white/25 bg-zinc-900/40'
                  }`}
                >
                  <p className="text-xl font-black text-zinc-200">{t('skinsSelectTexture')}</p>
                  <p className="mt-2 text-sm text-zinc-500">{t('skinsSelectTextureHint')}</p>
                  <button
                    onClick={() => skinTextureInputRef.current?.click()}
                    className="mt-6 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-black transition-colors hover:bg-zinc-700"
                  >
                    {t('skinsReplaceTexture')}
                  </button>
                </div>
                {skinEditorError ? <p className="mt-4 text-sm font-bold text-red-400">{skinEditorError}</p> : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[260px_minmax(0,1fr)]">
                <div>
                  <SkinPreview3D
                    skinDataUrl={skinEditorPreviewSkin}
                    capeDataUrl={skinEditorPreviewCape}
                    model={skinDraft.model}
                    className="h-[380px] w-full"
                  />
                  <p className="mt-3 text-center text-xs text-zinc-500">{t('skinsDragRotate')}</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-400">{t('skinsNamePlaceholder')}</label>
                    <input
                      type="text"
                      value={skinDraft.name}
                      onChange={(event) => setSkinDraft((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder={t('skinsNamePlaceholder')}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-2.5 text-sm outline-none focus:border-green-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-wider text-zinc-400">{t('skinsTexture')}</p>
                    <button
                      onClick={() => skinTextureInputRef.current?.click()}
                      className="rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-sm font-black text-zinc-200 transition-colors hover:bg-zinc-800"
                    >
                      {t('skinsReplaceTexture')}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-wider text-zinc-400">{t('skinsArmStyle')}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSkinDraft((prev) => ({ ...prev, model: 'wide' }))}
                        className={`rounded-xl border px-4 py-2 text-sm font-black ${
                          skinDraft.model === 'wide'
                            ? 'border-green-500/40 bg-green-500/15 text-green-300'
                            : 'border-white/10 bg-zinc-900/60 text-zinc-300'
                        }`}
                      >
                        {t('skinsWide')}
                      </button>
                      <button
                        onClick={() => setSkinDraft((prev) => ({ ...prev, model: 'slim' }))}
                        className={`rounded-xl border px-4 py-2 text-sm font-black ${
                          skinDraft.model === 'slim'
                            ? 'border-green-500/40 bg-green-500/15 text-green-300'
                            : 'border-white/10 bg-zinc-900/60 text-zinc-300'
                        }`}
                      >
                        {t('skinsSlim')}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-wider text-zinc-400">{t('skinsCape')}</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <button
                        onClick={() =>
                          setSkinDraft((prev) => ({
                            ...prev,
                            capeMode: 'none',
                            defaultCapeId: '',
                            capeDataUrl: ''
                          }))
                        }
                        className={`group flex flex-col rounded-2xl border bg-zinc-900/60 p-3 text-left transition-all hover:-translate-y-1 hover:border-green-400/40 ${
                          skinDraft.capeMode === 'none' ? 'border-green-500/60 shadow-[0_0_0_1px_rgba(34,197,94,0.45)]' : 'border-white/10'
                        }`}
                      >
                        <div className="flex h-20 flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/20 px-2">
                          <p className="text-sm font-black text-zinc-200">{t('skinsNoCape')}</p>
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500">No cape</p>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-zinc-200">
                          <span
                            className={`h-3 w-3 rounded-full border ${skinDraft.capeMode === 'none' ? 'border-green-400 bg-green-400' : 'border-white/40'}`}
                          />
                          <span>{t('skinsNoCape')}</span>
                        </div>
                      </button>

                      {officialProfile.hasLicense &&
                        skinsState.defaultCapes.map((cape) => {
                          const selected = skinDraft.capeMode === 'default' && String(skinDraft.defaultCapeId) === String(cape.id);
                          return (
                            <button
                              key={cape.id}
                              onClick={() =>
                                setSkinDraft((prev) => ({
                                  ...prev,
                                  capeMode: 'default',
                                  defaultCapeId: cape.id,
                                  capeDataUrl: ''
                                }))
                              }
                              className={`group flex flex-col rounded-2xl border bg-gradient-to-b from-[#111827] to-[#0b101a] p-3 text-left transition-all hover:-translate-y-1 hover:border-green-400/40 ${
                                selected ? 'border-green-500/70 shadow-[0_0_0_1px_rgba(34,197,94,0.45)]' : 'border-white/10'
                              }`}
                              title={cape.name}
                            >
                              <div className="flex h-20 flex-col items-center justify-center rounded-xl border border-white/10 bg-[#0a0f18] px-2">
                                <p className="text-sm font-black text-zinc-100">{cape.name}</p>
                                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Official cape</p>
                              </div>
                              <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-zinc-200">
                                <span
                                  className={`h-3 w-3 rounded-full border ${
                                    selected ? 'border-green-400 bg-green-400' : 'border-white/40'
                                  }`}
                                />
                                <span className="truncate">{cape.name}</span>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                    {!officialProfile.hasLicense && (
                      <p className="text-[11px] font-semibold text-red-300/80">Плащи доступны только для лицензионного ника.</p>
                    )}
                  </div>

                  {skinEditorError ? <p className="text-sm font-bold text-red-400">{skinEditorError}</p> : null}

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={saveSkinDraft}
                      className="rounded-xl bg-green-500 px-5 py-2.5 text-sm font-black text-black transition-colors hover:bg-green-400"
                    >
                      {skinEditorMode === 'update' ? t('skinsSaveAction') : t('skinsAddAction')}
                    </button>
                    <button
                      onClick={closeSkinEditor}
                      className="rounded-xl border border-white/10 bg-zinc-900/60 px-5 py-2.5 text-sm font-black text-zinc-300 transition-colors hover:bg-zinc-800"
                    >
                      {t('skinsCancelAction')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-x-0 bottom-0 top-11 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl animate-[fadeInSoft_220ms_ease-out]">
          <div className="w-full max-w-md rounded-[3rem] border border-white/10 bg-[#0f0f0f] p-10 animate-[modalRise_260ms_cubic-bezier(0.22,1,0.36,1)]">
            <h2 className="mb-8 text-2xl font-black">{t('createInstanceTitle')}</h2>
            <div className="space-y-6">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('instanceNamePlaceholder')}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-4 outline-none focus:border-green-500/50"
              />

              <div className="grid grid-cols-2 gap-4">
                <CustomSelect value={selectedVersion} options={createVersionOptions} onChange={setSelectedVersion} placeholder={t('version')} />
                <CustomSelect value={selectedLoader} options={loaderOptionsForCreate} onChange={setSelectedLoader} placeholder={t('loader')} />
              </div>

              <div className="rounded-xl border border-white/5 bg-zinc-900/40 px-4 py-3 text-[11px] text-zinc-400">
                {versionsLoading
                  ? t('loadingVersions')
                  : t('installPathPreview', { name: newName.trim() || t('installPathNamePlaceholder') })}
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setShowImportLauncherPicker((prev) => !prev)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-colors ${
                    showImportLauncherPicker || selectedImportLauncher
                      ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2">
                      <Copy size={16} />
                      {t('importFromLauncher')}
                    </span>
                    <ChevronDown size={16} className={`transition-transform ${showImportLauncherPicker ? 'rotate-180' : ''}`} />
                  </span>
                  <span className="mt-1 block text-[11px] font-semibold text-zinc-400">
                    {selectedImportLauncher ? t('importSourceSelected', { launcher: getImportLauncherLabel(selectedImportLauncher) }) : t('importSourceNotSelected')}
                  </span>
                </button>

                {showImportLauncherPicker && (
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-3">
                    <p className="text-[11px] font-black uppercase tracking-wide text-zinc-300">{t('importLauncherChooseTitle')}</p>
                    <p className="mt-1 text-[10px] font-semibold text-zinc-500">{t('importLauncherChooseHint')}</p>
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {IMPORT_LAUNCHER_OPTIONS.map((option) => {
                        const active = selectedImportLauncher === option.id;
                        return (
                          <button
                            key={option.id}
                            onClick={() => {
                              setSelectedImportLauncher(option.id);
                              setShowImportLauncherPicker(false);
                            }}
                            className={`rounded-xl border px-3 py-2 text-left text-sm font-bold transition-colors ${
                              active
                                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
                                : 'border-white/10 bg-zinc-950/70 text-zinc-300 hover:border-white/20'
                            }`}
                          >
                            {t(option.labelKey)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={addInstance}
                className="w-full rounded-2xl bg-green-600 py-4 font-black shadow-xl shadow-green-900/20 transition-all active:scale-95"
              >
                {t('create')}
              </button>
              <button onClick={closeCreateModal} className="w-full py-2 font-bold text-zinc-500 transition-colors hover:text-white">
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isInstallTargetModalOpen && (
        <div className="fixed inset-x-0 bottom-0 top-11 z-[180] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-[fadeInSoft_220ms_ease-out]">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#10151f] p-6 shadow-2xl animate-[modalRise_260ms_cubic-bezier(0.22,1,0.36,1)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-black text-zinc-100">{t('installTargetTitle')}</p>
                <p className="mt-1 text-[11px] font-medium text-zinc-400">{t('installTargetHint')}</p>
              </div>
              <button
                onClick={closeInstallTargetModal}
                className="rounded-lg border border-white/10 bg-zinc-900/70 p-2 text-zinc-400 transition-colors hover:text-zinc-200"
              >
                <X size={16} />
              </button>
            </div>

            {installTargetEntry && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                <img
                  src={toImageSrc(installTargetEntry.icon_url) || FALLBACK_ICON_80}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = FALLBACK_ICON_80;
                  }}
                  className="h-12 w-12 rounded-xl bg-zinc-900 object-cover"
                  alt=""
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-zinc-100">{installTargetEntry.title}</p>
                  <p className="text-[11px] font-semibold text-zinc-500">{getContentTypeLabel(installTargetEntry.contentType || browseContentType)}</p>
                </div>
              </div>
            )}

            {installTargetLoading ? (
              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-zinc-300">
                <Loader2 size={14} className="animate-spin" />
                {t('installTargetLoading')}
              </div>
            ) : compatibleInstallTargets.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-zinc-400">{t('installTargetNone')}</div>
            ) : (
              <div className="custom-scrollbar mt-5 max-h-72 space-y-2 overflow-y-auto pr-1">
                {compatibleInstallTargets.map((instance) => {
                  const selected = String(instance.id) === String(selectedInstallTargetId);
                  return (
                    <button
                      key={instance.id}
                      onClick={() => setSelectedInstallTargetId(String(instance.id))}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors ${
                        selected
                          ? 'border-emerald-400/45 bg-emerald-500/12'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                      }`}
                    >
                      <InstanceAvatar instance={instance} className="h-11 w-11 rounded-xl border-white/10 bg-zinc-900" iconClassName="h-6 w-6" alt="instance" />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-black ${selected ? 'text-emerald-200' : 'text-zinc-100'}`}>{instance.name}</p>
                        <p className="text-[10px] font-semibold text-zinc-500">
                          {t('installTargetVersionLabel', {
                            version: instance.version,
                            loader: formatLoaderName(instance.loader)
                          })}
                        </p>
                      </div>
                      {selected ? <Check size={14} className="text-emerald-300" /> : null}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={closeInstallTargetModal}
                className="rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-xs font-black text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                {t('cancel')}
              </button>
              <button
                onClick={installToSelectedTarget}
                disabled={!selectedInstallTargetId || installTargetLoading || compatibleInstallTargets.length === 0 || installTargetBusy}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-4 py-2 text-xs font-black text-emerald-200 transition-colors hover:bg-emerald-500/22 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {installTargetBusy ? <Loader2 size={13} className="animate-spin" /> : <ArrowDownToLine size={13} />}
                {t('installContent')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isManageModalOpen && editingInstance && (
        <div className="fixed inset-x-0 bottom-0 top-11 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-[fadeInSoft_220ms_ease-out]">
          <div className="flex h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#141414] animate-[modalRise_260ms_cubic-bezier(0.22,1,0.36,1)]">
            <div className="flex items-center justify-between border-b border-white/5 bg-[#1a1a1a]/50 p-6">
              <div className="flex items-center gap-6">
                <InstanceAvatar instance={editingInstance} className="h-16 w-16 rounded-2xl border-white/5 bg-zinc-800" iconClassName="h-9 w-9" alt="instance" />
                <div>
                  <h2 className="text-2xl font-black">{editingInstance.name}</h2>
                  <div className="mt-1 flex items-center gap-4 text-sm font-bold text-zinc-500">
                    <span>
                      {formatLoaderName(editingInstance.loader)} {editingInstance.version}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock size={14} /> {editingInstance.playTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleInstancePrimaryAction(editingInstance)}
                  disabled={editingInstance.installState === 'installing' || !hasMinecraftApi}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-black transition-all disabled:cursor-not-allowed disabled:opacity-60 ${getPrimaryButtonClassName(
                    editingInstance
                  )}`}
                  style={getPrimaryButtonStyle(editingInstance)}
                >
                  {getPrimaryButtonIcon(editingInstance)} {getPrimaryButtonLabel(editingInstance)}
                </button>
                <button onClick={openInstanceSettings} className="rounded-xl bg-zinc-800/50 p-2.5 transition-colors hover:bg-zinc-800">
                  <Settings size={20} />
                </button>
                <button
                  onClick={() => openInstanceFolder(editingInstance)}
                  className="rounded-xl bg-zinc-800/50 p-2.5 transition-colors hover:bg-zinc-800"
                  title={t('openFolder')}
                >
                  <FolderOpen size={20} />
                </button>
                <button
                  onClick={() => setIsManageModalOpen(false)}
                  className="rounded-xl bg-zinc-800/50 p-2.5 transition-colors hover:bg-red-500/20 hover:text-red-500"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-white/5 p-4">
              <p className="text-xs font-bold text-zinc-400">{t('installedContent', { type: manageContentLabel, count: currentManageItems.length })}</p>
              <div className="flex items-center gap-2">
                {hasSelection && (
                  <>
                    <button onClick={() => setSelectedModIds([])} className="rounded-xl border border-white/5 bg-zinc-800/60 px-3 py-2 text-[10px] font-black text-zinc-300">
                      {t('clear')} ({selectedModIds.length})
                    </button>
                    <button
                      onClick={removeSelectedContents}
                      className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] font-black text-red-400"
                    >
                      <Trash2 size={14} /> {t('delete')}
                    </button>
                  </>
                )}
                <button onClick={refreshContentUpdates} className="flex items-center gap-2 rounded-xl border border-white/5 bg-zinc-800/60 px-3 py-2 text-[10px] font-black text-zinc-300">
                  <RefreshCw size={14} /> {t('refresh')}
                </button>
                <button
                  onClick={() => openInstanceFolder(editingInstance)}
                  className="flex items-center gap-2 rounded-xl border border-white/5 bg-zinc-800/60 px-3 py-2 text-[10px] font-black text-zinc-300"
                >
                  <FolderOpen size={14} /> {t('folder')}
                </button>
                <button onClick={updateAllContent} className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-[10px] font-black text-green-400">
                  <ArrowDownToLine size={14} /> {t('updateAll')}
                </button>
                <button
                  onClick={() => {
                    setActiveFilter({ version: '', loader: '' });
                    setBrowseContentType(manageContentType);
                    setActiveTab('browse');
                    setIsManageModalOpen(false);
                    setEditingInstanceId(null);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-white/5 bg-zinc-800/80 px-3 py-2 text-[10px] font-black"
                >
                  <Plus size={14} /> {t('installContent')}
                </button>
              </div>
            </div>

            <div className="mx-6 grid grid-cols-[40px_1fr_220px_220px] gap-4 border-b border-white/5 py-3 text-[10px] font-black uppercase text-zinc-600">
              <div className="col-span-4 mb-2 flex items-center gap-2">
                {CONTENT_TYPES.map((typeOption) => {
                  const active = normalizeContentType(manageContentType) === typeOption.id;
                  return (
                    <button
                      key={typeOption.id}
                      onClick={() => setManageContentType(typeOption.id)}
                      className={`rounded-xl border px-3 py-1.5 text-[10px] font-black normal-case transition-colors ${
                        active
                          ? 'border-green-500/30 bg-green-500/15 text-green-400'
                          : 'border-white/10 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {getContentTypeLabel(typeOption.id)}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-center">
                <input type="checkbox" className="launcher-checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all" />
              </div>
              <div>{t('columnName')}</div>
              <div>{t('version')}</div>
              <div className="text-right">{t('columnActions')}</div>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto">
              {currentManageItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-zinc-600 opacity-50">
                  <Box size={48} className="mb-4" />
                  <p className="font-bold">{t('noContentInstalled', { type: manageContentLabel })}</p>
                </div>
              ) : (
                currentManageItems.map((mod) => {
                  const contentType = normalizeContentType(mod.contentType || manageContentType);
                  const modId = String(mod.projectId || mod.id);
                  const checked = selectedModIds.includes(modId);
                  const authorValue = String(mod.creator || mod.author || mod.organization || '').trim();
                  const isUpdating =
                    modTransfer?.projectId === modId &&
                    normalizeContentType(modTransfer?.contentType || manageContentType) === contentType &&
                    modTransfer?.operation === 'update' &&
                    modTransfer?.status !== 'done';

                  return (
                    <div
                      key={modId}
                      className={`mx-6 grid grid-cols-[40px_1fr_220px_220px] items-center gap-4 border-b border-white/[0.03] py-4 transition-all hover:bg-white/[0.02] ${
                        !mod.enabled ? 'opacity-40' : ''
                      } ${checked ? 'bg-green-500/[0.04]' : ''}`}
                    >
                      <div className="flex justify-center">
                        <input type="checkbox" className="launcher-checkbox" checked={checked} onChange={() => toggleSelectMod(modId)} aria-label={`Select ${mod.title}`} />
                      </div>

                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={toImageSrc(mod.icon_url) || FALLBACK_ICON_40}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = FALLBACK_ICON_40;
                          }}
                          className="block h-10 w-10 rounded-lg bg-zinc-800 object-cover"
                          alt=""
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{mod.title || mod.filename || modId}</p>
                          {authorValue ? (
                            <p className="text-[10px]">
                              <span className="font-black uppercase tracking-wide text-zinc-500">{t('authorLabel')}:</span>{' '}
                              <span className="font-semibold text-emerald-300">{authorValue}</span>
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-400">{mod.version}</p>
                        <p className="truncate text-[9px] text-zinc-600">{mod.filename}</p>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        {mod.hasUpdate && (
                          <button
                            disabled={isUpdating}
                            onClick={() => updateContentInInstance(editingInstance, contentType, mod)}
                            className="rounded-full bg-zinc-800/80 p-2 text-green-500 transition-all hover:bg-zinc-700 disabled:opacity-40"
                            title={t('updateMod')}
                          >
                            {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
                          </button>
                        )}
                        {contentType === 'mod' && (
                          <button
                            onClick={() => toggleMod(editingInstance.id, mod)}
                            className={`relative h-6 w-12 rounded-full transition-all ${mod.enabled ? 'bg-green-500' : 'bg-zinc-800'}`}
                          >
                            <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-black transition-transform ${mod.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                        )}
                        <button
                          onClick={() => removeContentFromInstance(editingInstance.id, contentType, mod)}
                          className="p-2 text-zinc-600 transition-colors hover:text-red-500"
                          title={t('delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                        <button className="p-1 text-zinc-700 transition-colors hover:text-white" title={t('more')}>
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {isInstanceSettingsOpen && editingInstance && (
        <div className="fixed inset-x-0 bottom-0 top-11 z-[220] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-[fadeInSoft_220ms_ease-out]">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#101010] p-8 animate-[modalRise_260ms_cubic-bezier(0.22,1,0.36,1)]">
            <h3 className="mb-5 text-xl font-black">{t('instanceSettings')}</h3>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400">{t('instanceName')}</label>
                <input
                  type="text"
                  value={instanceSettingsName}
                  onChange={(e) => setInstanceSettingsName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-2 text-sm outline-none focus:border-green-500/50"
                />
                <p className="text-[11px] text-zinc-500">{t('renameFolderHint')}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400">{t('instanceAvatar')}</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={pickInstanceAvatar}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-2 text-sm font-bold text-zinc-200 transition-colors hover:bg-zinc-800"
                  >
                    <ImagePlus size={16} /> {t('pickImage')}
                  </button>
                  <button
                    onClick={resetInstanceAvatar}
                    className="rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-xs font-black text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    {t('resetAvatar')}
                  </button>
                </div>
              </div>

              {instanceSettingsError && <p className="text-xs font-bold text-red-400">{instanceSettingsError}</p>}

              <div className="flex items-center gap-2 pt-2">
                <button onClick={saveInstanceSettings} className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-black transition-colors hover:bg-green-500">
                  {t('save')}
                </button>
                <button
                  onClick={() => setIsInstanceSettingsOpen(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-2.5 text-sm font-black text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmInstance && (
        <div className="fixed inset-x-0 bottom-0 top-11 z-[228] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-[fadeInSoft_220ms_ease-out]">
          <div className="w-full max-w-md rounded-2xl border border-red-500/15 bg-[#121212] p-6 shadow-2xl animate-[modalRise_260ms_cubic-bezier(0.22,1,0.36,1)]">
            <p className="text-lg font-black text-zinc-100">{t('confirmDeleteTitle')}</p>
            <p className="mt-3 text-sm font-medium text-zinc-300">{t('deleteInstanceConfirm', { name: deleteConfirmInstance.name })}</p>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={cancelDeleteInstance}
                disabled={deleteBusy}
                className="rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-xs font-black text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-40"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmDeleteInstance}
                disabled={deleteBusy}
                className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-40"
              >
                {deleteBusy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {errorDialog && (
        <div className="fixed inset-x-0 bottom-0 top-11 z-[230] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-[fadeInSoft_220ms_ease-out]">
          <div className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-[#121212] p-6 shadow-2xl animate-[modalRise_260ms_cubic-bezier(0.22,1,0.36,1)]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-red-500/15 p-2 text-red-400">
                <AlertCircle size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-red-300">{t('operationFailed')}</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{errorDialog.message}</p>
                {errorDialog.code ? <p className="mt-2 text-[11px] font-bold text-zinc-500">{t('code')}: {errorDialog.code}</p> : null}
                {errorDialog.details ? (
                  <div className="mt-2 rounded-lg border border-white/5 bg-black/20 p-2">
                    <p className="text-[11px] font-medium text-zinc-500">{t('details')}:</p>
                    <p className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap text-[11px] text-zinc-400">{String(errorDialog.details)}</p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <div className="text-[11px] font-medium text-zinc-500">
                {errorDialog.suggestedModsStatus === 'loading' ? t('checkingSuggestedMods') : ''}
                {errorDialog.suggestedInstallBusy ? t('installingSuggestedMods') : ''}
                {errorDialog.suggestedModsStatus === 'error' ? t('failedFindSuggestedMods') : ''}
              </div>
              <div className="flex items-center gap-2">
                {errorDialog.suggestedModsStatus === 'ready' && Array.isArray(errorDialog.suggestedMods) && errorDialog.suggestedMods.length > 0 ? (
                  <button
                    onClick={installSuggestedModsFromError}
                    disabled={errorDialog.suggestedInstallBusy}
                    className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs font-black text-green-300 transition-colors hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {errorDialog.suggestedInstallBusy ? <Loader2 size={14} className="animate-spin" /> : <ArrowDownToLine size={14} />}
                    {errorDialog.suggestedInstallBusy ? t('installingSuggestedMods') : t('installSuggestedMods')}
                  </button>
                ) : null}
                <button
                  onClick={() => setErrorDialog(null)}
                  className="rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-xs font-black text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .drag-region {
          -webkit-app-region: drag;
        }

        .no-drag {
          -webkit-app-region: no-drag;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.16); }

        .ambient-effects--paused *,
        .effects-paused .star-particle,
        .effects-paused .comet-particle,
        .effects-paused .rain-drop,
        .effects-paused .snow-flake,
        .effects-paused .snow-dust {
          animation-play-state: paused !important;
        }

        .star-particle {
          position: absolute;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(220,255,245,0.66) 44%, rgba(220,255,245,0) 100%);
          box-shadow: 0 0 8px rgba(180, 255, 230, 0.24);
          animation-name: starPulse;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        .comet-particle {
          position: absolute;
          left: 0;
          top: 0;
          border-radius: 999px;
          transform-origin: 0 50%;
          background: linear-gradient(
            90deg,
            rgba(180, 235, 255, 0) 0%,
            rgba(180, 235, 255, 0.14) 22%,
            rgba(223, 248, 255, 0.52) 58%,
            rgba(246, 254, 255, 0.9) 100%
          );
          filter: drop-shadow(0 0 8px rgba(170, 230, 255, 0.35));
          animation-name: cometFly;
          animation-timing-function: cubic-bezier(0.21, 0.76, 0.32, 1);
          animation-fill-mode: forwards;
        }

        .comet-particle::after {
          content: '';
          position: absolute;
          right: -1px;
          top: 50%;
          width: var(--comet-head-size, 5px);
          height: var(--comet-head-size, 5px);
          transform: translate(52%, -50%);
          border-radius: 999px;
          background: rgba(248, 255, 255, 0.96);
          box-shadow:
            0 0 10px rgba(202, 242, 255, 0.8),
            0 0 24px rgba(202, 242, 255, 0.45);
        }

        .rain-drop {
          position: absolute;
          top: -42px;
          width: 1.2px;
          border-radius: 999px;
          background: linear-gradient(to bottom, rgba(180,220,255,0), rgba(180,220,255,0.85));
          box-shadow: 0 0 8px rgba(125, 180, 255, 0.2);
          animation-name: rainFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .snow-flake {
          position: absolute;
          top: -18px;
          border-radius: 999px;
          background: rgba(255,255,255,0.96);
          box-shadow: 0 0 10px rgba(255,255,255,0.25);
          animation-name: snowFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .snow-dust {
          position: absolute;
          top: -14px;
          border-radius: 999px;
          background: rgba(245, 252, 255, 0.92);
          box-shadow: 0 0 6px rgba(240, 250, 255, 0.18);
          animation-name: snowDustFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .canvas-wrap {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        #canvas {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
        }

        .cursor-distortion-wrap {
          overflow: hidden;
        }

        .cursor-distortion-wrap #canvas {
          width: 100%;
          height: 100%;
          display: block;
          opacity: calc(var(--pointer-distort-opacity, 0) * 0.95);
          transition: opacity 180ms ease-out;
          filter: saturate(1.2) contrast(1.04);
          mix-blend-mode: screen;
          will-change: opacity;
        }

        .hue-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 999px;
          border: 2px solid #ffffff;
          background: #0b0f16;
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.25);
        }

        .hue-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          border: 2px solid #ffffff;
          background: #0b0f16;
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.25);
        }

        .primary-installed-theme:hover {
          background: var(--play-hover-bg, #22c55e) !important;
          color: var(--play-hover-fg, #04130a) !important;
          border-color: transparent !important;
        }

        @keyframes starPulse {
          0%,
          100% {
            transform: scale(0.8);
            opacity: 0.35;
          }
          50% {
            transform: scale(1.25);
            opacity: 1;
          }
        }

        @keyframes cometFly {
          0% {
            transform: translate3d(var(--comet-start-x), var(--comet-start-y), 0) rotate(var(--comet-angle));
            opacity: 0;
          }
          12% {
            opacity: var(--comet-alpha, 0.82);
          }
          100% {
            transform: translate3d(
              calc(var(--comet-start-x) + var(--comet-dx)),
              calc(var(--comet-start-y) + var(--comet-dy)),
              0
            ) rotate(var(--comet-angle));
            opacity: 0;
          }
        }

        @keyframes rainFall {
          0% {
            transform: translate3d(0, -20vh, 0);
          }
          100% {
            transform: translate3d(var(--rain-wind, -18px), 120vh, 0);
          }
        }

        @keyframes snowFall {
          0% {
            transform: translate3d(0, -14vh, 0);
          }
          100% {
            transform: translate3d(var(--snow-drift, 0px), 115vh, 0);
          }
        }

        @keyframes snowDustFall {
          0% {
            transform: translate3d(0, -12vh, 0);
          }
          100% {
            transform: translate3d(var(--snow-dust-drift, 0px), 112vh, 0);
          }
        }

        .flag-badge {
          position: relative;
          width: 18px;
          height: 12px;
          border-radius: 3px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
          flex: 0 0 auto;
        }

        .flag-ru {
          background: linear-gradient(to bottom, #ffffff 0%, #ffffff 33.33%, #1d4ed8 33.33%, #1d4ed8 66.66%, #dc2626 66.66%, #dc2626 100%);
        }

        .flag-us {
          background: repeating-linear-gradient(
            to bottom,
            #dc2626 0px,
            #dc2626 2px,
            #f8fafc 2px,
            #f8fafc 4px
          );
        }

        .flag-us-canton {
          position: absolute;
          left: 0;
          top: 0;
          width: 8px;
          height: 7px;
          background: #1e3a8a;
        }

        input[type=range]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #22c55e;
          cursor: pointer;
          border: 3px solid #0f0f0f;
          box-shadow: 0 0 15px rgba(34, 197, 94, 0.4);
        }

        .launcher-checkbox {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 4px;
          background: #121212;
          border: 1px solid #2f2f2f;
          cursor: pointer;
          position: relative;
          transition: all 120ms ease;
        }

        .launcher-checkbox:hover {
          border-color: #4a4a4a;
        }

        .launcher-checkbox:checked {
          background: #22c55e;
          border-color: #22c55e;
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
        }

        .launcher-checkbox:checked::after {
          content: '';
          position: absolute;
          left: 4px;
          top: 1px;
          width: 5px;
          height: 9px;
          border-right: 2px solid #000;
          border-bottom: 2px solid #000;
          transform: rotate(40deg);
        }
      `}</style>
    </div>
  );
}

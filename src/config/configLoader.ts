import type {
  DashboardConfig,
  MenuItem,
  TileConfig,
  LegacyMenuItem,
  RssFeedItem,
  JsonConfig,
  StoredSettings,
} from './configTypes';
import { defaultConfig } from './defaultConfig';
import { replaceDatePlaceholders } from '../utils/dateHelpers';

// ====================================================================
// BREADCRUMB NAVIGATION SYSTEM
// ====================================================================

export function getCurrentBreadcrumb(): string[] {
  const urlParams = new URLSearchParams(window.location.search);
  const breadcrumbParam = urlParams.get('breadcrumb');
  if (!breadcrumbParam) return [];

  const configs = breadcrumbParam
    .split('+')
    .map((c) => c.trim())
    .filter((c) => c);

  return configs.filter((config) => {
    const valid =
      config.toLowerCase().endsWith('.js') ||
      config.toLowerCase().endsWith('.json');
    if (!valid) {
      console.warn(`Breadcrumb: Skipping invalid config entry: ${config}`);
    }
    return valid;
  });
}

export function buildNavigationUrl(targetConfig: string): string {
  const urlParams = new URLSearchParams(window.location.search);
  const currentConfig = urlParams.get('config') || 'config.js';

  let breadcrumb = getCurrentBreadcrumb();

  const isCurrentRoot =
    currentConfig === 'config.js' || currentConfig === 'config.json';
  const isTargetRoot =
    targetConfig === 'config.js' || targetConfig === 'config.json';

  if (isTargetRoot) {
    return (
      window.location.pathname +
      '?config=' +
      encodeURIComponent(targetConfig)
    );
  }

  if (!isCurrentRoot) {
    if (!breadcrumb.includes(currentConfig)) {
      breadcrumb.push(currentConfig);
    }
  } else {
    breadcrumb = [currentConfig];
  }

  if (breadcrumb.length > 10) {
    breadcrumb = breadcrumb.slice(-10);
  }

  const breadcrumbStr = breadcrumb.join('+');
  return (
    window.location.pathname +
    '?breadcrumb=' +
    encodeURIComponent(breadcrumbStr) +
    '&config=' +
    encodeURIComponent(targetConfig)
  );
}

export function buildPreviousUrl(): string {
  const breadcrumb = getCurrentBreadcrumb();

  if (breadcrumb.length === 0) {
    return window.location.pathname + '?config=config.js';
  }

  const previousConfig = breadcrumb[breadcrumb.length - 1];
  const truncatedBreadcrumb = breadcrumb.slice(0, -1);

  if (truncatedBreadcrumb.length === 0) {
    return (
      window.location.pathname +
      '?config=' +
      encodeURIComponent(previousConfig)
    );
  }

  const breadcrumbStr = truncatedBreadcrumb.join('+');
  return (
    window.location.pathname +
    '?breadcrumb=' +
    encodeURIComponent(breadcrumbStr) +
    '&config=' +
    encodeURIComponent(previousConfig)
  );
}

// ====================================================================
// CONFIG PARSING
// ====================================================================

const coreMenuNames = [
  'back',
  'refresh',
  'load cfg',
  'help',
  'setup',
  'sources',
  'update',
  'previous',
  'prev',
];

function parseMenuItem(item: LegacyMenuItem): MenuItem {
  const text = String(item[1] || '').trim();
  const link = String(item[2] || '').trim();
  const titleLower = text.toLowerCase();
  const linkLower = link.toLowerCase();

  let type: 'core' | 'config' | 'user' = 'user';
  if (coreMenuNames.includes(titleLower)) {
    type = 'core';
  } else if (titleLower.includes('.js') || linkLower.includes('.js')) {
    type = 'config';
  }

  return {
    color: String(item[0] || '2196F3').replace('#', ''),
    text,
    url: link,
    scale: item[3] ? parseFloat(item[3]) : 1,
    side: item[4] === 'R' ? 'R' : 'L',
    type,
  };
}

function parseTilesFromLegacy(
  aIMG: Array<[string | string[], ...string[]]>,
  tileDelay?: number[]
): TileConfig[] {
  return aIMG.map((item, index) => {
    const titleRaw = item[0];
    const titles = Array.isArray(titleRaw) ? titleRaw : [titleRaw];
    const sources = item.slice(1) as string[];
    const interval =
      tileDelay && tileDelay[index] ? tileDelay[index] : 30000;
    return { titles, sources, rotationInterval: interval };
  });
}

function parseTilesFromJson(
  aIMG: Array<[string | string[], string[] | string, number?]>
): TileConfig[] {
  return aIMG.map((subArray) => {
    const titleRaw = subArray[0];
    const titles = Array.isArray(titleRaw) ? titleRaw : [titleRaw];

    let sources: string[];
    if (Array.isArray(subArray[1])) {
      sources = subArray[1];
    } else {
      sources = [subArray[1]];
    }

    const delay = subArray.length >= 3 && subArray[2] ? subArray[2] : 30000;
    return { titles, sources, rotationInterval: delay };
  });
}

function ensureBackMenuItem(menuItems: LegacyMenuItem[]): LegacyMenuItem[] {
  const breadcrumb = getCurrentBreadcrumb();
  if (breadcrumb.length === 0) return menuItems;

  const hasPrevious = menuItems.some((item) => {
    if (!Array.isArray(item)) return false;
    const title = String(item[1] || '').toLowerCase();
    return title === 'previous' || title === 'prev';
  });

  if (hasPrevious) return menuItems;

  const previousConfig = breadcrumb[breadcrumb.length - 1];
  console.log(
    `Adding PREVIOUS menu item for breadcrumb navigation (back to: ${previousConfig})`
  );
  return [
    ['212ff3', 'PREVIOUS', previousConfig, '1', 'R'] as LegacyMenuItem,
    ...menuItems,
  ];
}

/**
 * Process raw config data (from JS, JSON, or JSONP) into a DashboardConfig.
 */
export function processRawConfig(raw: JsonConfig): DashboardConfig {
  const processed = replaceDatePlaceholders(raw);

  const aURL = processed.aURL ? ensureBackMenuItem(processed.aURL) : [];

  const menuItems = aURL.map((item) => parseMenuItem(item));

  let tiles: TileConfig[];
  if (processed.aIMG) {
    // Detect format: if third element is a number, it's JSON format
    const firstItem = processed.aIMG[0];
    if (
      firstItem &&
      firstItem.length >= 3 &&
      typeof firstItem[firstItem.length - 1] === 'number'
    ) {
      tiles = parseTilesFromJson(
        processed.aIMG as Array<[string | string[], string[] | string, number?]>
      );
    } else {
      // Legacy format: [title, url1, url2, ...]
      tiles = parseTilesFromLegacy(
        processed.aIMG as unknown as Array<[string | string[], ...string[]]>,
        (processed as unknown as { tileDelay?: number[] }).tileDelay
      );
    }
  } else if (processed.aImages) {
    tiles = parseTilesFromJson(processed.aImages);
  } else {
    tiles = defaultConfig.tiles;
  }

  return {
    disableSetup: processed.disableSetup ?? false,
    disableLdCfg: processed.disableLdCfg ?? false,
    topBarCenterText:
      processed.topBarCenterText || defaultConfig.topBarCenterText,
    layoutCols: processed.layout_cols || 4,
    layoutRows: processed.layout_rows || 3,
    menuItems,
    tiles,
    rssFeeds: processed.aRSS || defaultConfig.rssFeeds,
    settingsSource:
      (processed.settingsSource as 'localStorage' | 'file') || 'file',
  };
}

// ====================================================================
// CONFIG LOADERS
// ====================================================================

declare global {
  interface Window {
    hamdashConfig?: JsonConfig;
    configReady?: Promise<void>;
    // Legacy globals set by config.js
    disableSetup?: boolean;
    disableLdCfg?: boolean;
    topBarCenterText?: string;
    layout_cols?: number;
    layout_rows?: number;
    aURL?: LegacyMenuItem[];
    aIMG?: Array<[string | string[], ...string[]]>;
    tileDelay?: number[];
    aRSS?: RssFeedItem[];
  }
}

function loadScriptConfig(
  url: string,
  fallback: () => void
): Promise<DashboardConfig> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = async () => {
      console.log(`${url} loaded successfully (script)`);

      // Check for JSONP-style config
      if (window.hamdashConfig) {
        console.log('Found window.hamdashConfig (JSONP)');
        const rawConfig = window.hamdashConfig;
        window.hamdashConfig = undefined;
        resolve(processRawConfig(rawConfig));
        return;
      }

      // Wait for async config
      if (
        window.configReady &&
        typeof window.configReady.then === 'function'
      ) {
        try {
          await window.configReady;
        } catch (e) {
          console.warn('configReady rejected:', e);
        }
      }

      // Legacy: config.js set window variables directly
      const rawConfig: JsonConfig = {
        disableSetup: window.disableSetup,
        disableLdCfg: window.disableLdCfg,
        topBarCenterText: window.topBarCenterText,
        layout_cols: window.layout_cols,
        layout_rows: window.layout_rows,
        aURL: window.aURL,
        aRSS: window.aRSS,
      };

      // For legacy JS, construct aIMG with tileDelay embedded
      if (window.aIMG && window.tileDelay) {
        rawConfig.aIMG = window.aIMG.map((item, i) => {
          const [title, ...urls] = item;
          return [title, urls, window.tileDelay![i] || 30000] as [
            string | string[],
            string[],
            number,
          ];
        });
      } else if (window.aIMG) {
        rawConfig.aIMG = window.aIMG.map((item) => {
          const [title, ...urls] = item;
          return [title, urls, 30000] as [string | string[], string[], number];
        });
      }

      resolve(processRawConfig(rawConfig));
    };
    script.onerror = () => {
      console.error(`Failed to load ${url}`);
      fallback();
    };
    document.head.appendChild(script);
  });
}

async function loadJsonConfig(
  url: string,
  fallback: () => void
): Promise<DashboardConfig> {
  try {
    const response = await fetch(url + '?_=' + Date.now());
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    const settings: JsonConfig = await response.json();
    console.log(`${url} loaded successfully`);
    return processRawConfig(settings);
  } catch (e) {
    console.error(`Failed to load ${url}:`, e);
    fallback();
    return defaultConfig;
  }
}

/**
 * Main config loader. Follows the chain:
 * localStorage → URL param → config.js → config.json → minimal fallback
 */
export async function loadConfig(): Promise<DashboardConfig> {
  // Check localStorage first
  try {
    const stored = localStorage.getItem('hamdash_config');
    if (stored) {
      console.log('Settings found in localStorage');
      const parsed: StoredSettings = JSON.parse(stored);
      if (parsed.settingsSource === 'localStorage') {
        console.log('Loading settings from localStorage');
        return processRawConfig(parsed);
      }
      console.log(
        'Settings found in localStorage but loading from file'
      );
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }

  // Check URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  let configParam = urlParams.get('config');

  if (configParam) {
    // Handle double encoding
    if (configParam.includes('%25')) {
      try {
        configParam = decodeURIComponent(configParam);
      } catch {
        // ignore
      }
    }
    // Extract filename if it contains URL parameters
    if (configParam.includes('?')) {
      configParam = configParam.split('?')[0];
    }

    const isJson = configParam.toLowerCase().endsWith('.json');
    if (isJson) {
      return loadJsonConfig(configParam, () => {});
    } else {
      return loadScriptConfig(configParam, () => {});
    }
  }

  // Default loading chain: config.js → config.json → minimal
  console.log(
    'No config specified, attempting default chain: config.js -> config.json'
  );

  try {
    return await loadScriptConfig('config.js', () => {
      throw new Error('config.js failed');
    });
  } catch {
    try {
      return await loadJsonConfig('config.json', () => {
        throw new Error('config.json failed');
      });
    } catch {
      console.log('All config sources failed, using minimal configuration');
      return defaultConfig;
    }
  }
}

/**
 * Export the current config to config.js format string
 */
export function exportToConfigJs(config: DashboardConfig): string {
  const aURL = config.menuItems
    .filter((m) => m.type !== 'core')
    .map((m) => [m.color, m.text, m.url, String(m.scale), m.side]);

  const aIMG = config.tiles.map((t) => {
    const title = t.titles.length === 1 ? t.titles[0] : t.titles;
    return [title, ...t.sources];
  });

  const tileDelay = config.tiles.map((t) => t.rotationInterval);

  return `// CUT START
var disableSetup = ${config.disableSetup};
var topBarCenterText = "${config.topBarCenterText}";

// Grid layout desired
var layout_cols = ${config.layoutCols};
var layout_rows = ${config.layoutRows};

// Menu items
var aURL = ${JSON.stringify(aURL, null, 2)};

// Feed items
var aRSS = ${JSON.stringify(config.rssFeeds, null, 2)};

// Dashboard Tiles items
var aIMG = ${JSON.stringify(aIMG, null, 2)};

// Image rotation intervals in milliseconds per tile
var tileDelay = ${JSON.stringify(tileDelay, null, 2)};

// CUT END`;
}

/**
 * Convert DashboardConfig back to StoredSettings for localStorage
 */
export function configToStoredSettings(config: DashboardConfig): StoredSettings {
  const aURL = config.menuItems
    .filter((m) => m.type !== 'core')
    .map(
      (m) =>
        [m.color, m.text, m.url, String(m.scale), m.side] as [
          string,
          string,
          string,
          string,
          string,
        ]
    );

  const aImages = config.tiles.map(
    (t) =>
      [
        t.titles.length === 1 ? t.titles[0] : t.titles,
        t.sources,
        t.rotationInterval,
      ] as [string | string[], string[], number]
  );

  return {
    settingsSource: config.settingsSource,
    topBarCenterText: config.topBarCenterText,
    layout_cols: config.layoutCols,
    layout_rows: config.layoutRows,
    aURL,
    aImages,
    aRSS: config.rssFeeds,
    disableSetup: config.disableSetup,
    disableLdCfg: config.disableLdCfg,
  };
}

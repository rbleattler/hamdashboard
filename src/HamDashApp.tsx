import { useState, useEffect, useCallback, useMemo } from 'react';
import { TopBar } from './components/TopBar/TopBar';
import { DashboardGrid } from './components/Dashboard/DashboardGrid';
import { SideMenu } from './components/Menu/SideMenu';
import { MenuOverlay } from './components/Menu/MenuOverlay';
import { RssTicker } from './components/RssTicker/RssTicker';
import { FullScreenView } from './components/FullScreenView/FullScreenView';
import { SettingsPage } from './components/Settings/SettingsPage';
import { SourcesOverlay } from './components/Settings/SourcesOverlay';
import { loadConfig, buildNavigationUrl, buildPreviousUrl } from './config/configLoader';
import { defaultConfig } from './config/defaultConfig';
import { parseSource, getImgURL } from './utils/sourceHelpers';
import type { DashboardConfig, MenuItem } from './config/configTypes';

const currentVersion = 'v2026.01.30';

const helpText = `Double click on an image to expand to full screen.
Double click again to close full screen view.
Right click on an image to display the next one.
Images rotate every 30 seconds automatically by default.`;

function App() {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [fullScreenIndex, setFullScreenIndex] = useState<number | null>(null);
  const [menuOverlayItem, setMenuOverlayItem] = useState<MenuItem | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Load config on mount
  useEffect(() => {
    loadConfig()
      .then((cfg) => {
        setConfig(cfg);
        setLoading(false);
      })
      .catch(() => {
        setConfig(defaultConfig);
        setLoading(false);
      });
  }, []);

  // Check for updates
  useEffect(() => {
    async function checkUpdates() {
      try {
        const response = await fetch(
          'https://api.github.com/repos/VA3HDL/hamdashboard/releases/latest'
        );
        const data = await response.json();
        if (data.tag_name && data.tag_name !== currentVersion) {
          setUpdateAvailable(true);
        }
      } catch {
        // ignore
      }
    }
    checkUpdates();
  }, []);

  // Build complete menu items list including core items
  const allMenuItems: MenuItem[] = useMemo(() => {
    if (!config) return [];

    const items: MenuItem[] = [];

    // Left side core items
    items.push({
      color: 'add10d',
      text: 'BACK',
      url: '',
      scale: 1,
      side: 'L',
      type: 'core',
    });
    items.push({
      color: '0dd1a7',
      text: 'Help',
      url: '',
      scale: 1,
      side: 'L',
      type: 'core',
    });

    // Right side core items
    items.push({
      color: 'add10d',
      text: 'BACK',
      url: '',
      scale: 1,
      side: 'R',
      type: 'core',
    });
    items.push({
      color: 'ff9100',
      text: 'Refresh',
      url: '',
      scale: 1,
      side: 'R',
      type: 'core',
    });

    // Load Cfg
    if (!config.disableLdCfg) {
      items.push({
        color: 'FF0000',
        text: 'Load Cfg',
        url: '',
        scale: 1,
        side: 'R',
        type: 'core',
      });
    }

    // User menu items
    items.push(...config.menuItems);

    // Setup
    if (!config.disableSetup) {
      items.push({
        color: 'ff9100',
        text: 'Setup',
        url: '',
        scale: 1,
        side: 'R',
        type: 'core',
      });
    }

    // Sources
    items.push({
      color: '0dd1a7',
      text: 'Sources',
      url: '',
      scale: 1,
      side: 'R',
      type: 'core',
    });

    // Update
    if (updateAvailable) {
      items.push({
        color: 'FF0000',
        text: 'Update',
        url: '',
        scale: 1,
        side: 'R',
        type: 'core',
      });
    }

    return items;
  }, [config, updateAvailable]);

  // Config file dialog
  const openConfigFileDialog = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.js,text/javascript,.json,application/json';
    input.addEventListener('change', (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const newUrl = buildNavigationUrl(file.name);
      window.location.href = newUrl;
    });
    input.click();
  }, []);

  // Handle menu actions
  const handleMenuAction = useCallback(
    (item: MenuItem) => {
      const text = item.text.toLowerCase();
      const link = item.url;

      // Special handling for PREVIOUS
      if (text === 'previous' || text === 'prev') {
        window.location.href = buildPreviousUrl();
        return;
      }

      // Config file navigation
      const isConfigFile =
        item.text.toLowerCase().endsWith('.js') ||
        item.text.toLowerCase().endsWith('.json') ||
        link.toLowerCase().endsWith('.js') ||
        link.toLowerCase().endsWith('.json');

      if (isConfigFile) {
        const filename =
          link.toLowerCase().endsWith('.js') ||
          link.toLowerCase().endsWith('.json')
            ? link
            : item.text;
        window.location.href = buildNavigationUrl(filename);
        return;
      }

      // Core menu actions
      switch (text) {
        case 'back': {
          // If any overlay/popover is open, close it first
          const hasOverlay =
            menuOverlayItem !== null ||
            showSettings ||
            showSources ||
            fullScreenIndex !== null;
          if (hasOverlay) {
            setMenuOverlayItem(null);
            setShowSettings(false);
            setShowSources(false);
            setFullScreenIndex(null);
          } else {
            // No overlay open — navigate back via breadcrumb
            window.location.href = buildPreviousUrl();
          }
          break;
        }
        case 'refresh':
          window.location.reload();
          break;
        case 'load cfg':
          openConfigFileDialog();
          break;
        case 'help':
          alert(helpText);
          break;
        case 'setup':
          setShowSettings(true);
          setMenuOverlayItem(null);
          break;
        case 'sources':
          setShowSources(true);
          break;
        case 'update':
          window.open(
            'https://github.com/VA3HDL/hamdashboard/releases/',
            '_blank'
          );
          break;
        default:
          // Open external content via menu overlay
          if (link) {
            setMenuOverlayItem(item);
            setShowSettings(false);
          }
          break;
      }
    },
    [openConfigFileDialog, menuOverlayItem, showSettings, showSources, fullScreenIndex]
  );

  // Handle full-screen view
  const handleFullScreen = useCallback((index: number) => {
    if (!config) return;
    const tile = config.tiles[index];
    if (!tile) return;
    const source = tile.sources[0];
    const parsed = parseSource(source);
    if (parsed.type === 'weather') {
      // Open the weather module as a full overlay (same as menu click)
      setMenuOverlayItem({
        color: '2196F3',
        text: tile.titles[0] || 'Weather',
        url: source,
        scale: 1,
        side: 'L',
        type: 'user',
      });
    } else if (parsed.type === 'trafficcam') {
      // Open the traffic cam module as a full overlay
      setMenuOverlayItem({
        color: '2196F3',
        text: tile.titles[0] || 'Traffic Camera',
        url: source,
        scale: 1,
        side: 'L',
        type: 'user',
      });
    } else {
      setFullScreenIndex(index);
    }
  }, [config]);

  const handleCloseFullScreen = useCallback(() => {
    setFullScreenIndex(null);
  }, []);

  const handleRotateFullScreen = useCallback(() => {
    // This will trigger re-render which advances the tile rotation
    if (fullScreenIndex !== null && config) {
      // Force a re-render
      setFullScreenIndex((prev) => prev);
    }
  }, [fullScreenIndex, config]);

  // Get current full-screen image source
  const fullScreenSrc = useMemo(() => {
    if (fullScreenIndex === null || !config) return null;
    const tile = config.tiles[fullScreenIndex];
    if (!tile) return null;
    const source = tile.sources[0]; // Current source
    const parsed = parseSource(source);
    if (parsed.type === 'image') {
      return getImgURL(parsed.url);
    }
    return null;
  }, [fullScreenIndex, config]);

  // Determine if tile rotation should be paused
  const paused =
    fullScreenIndex !== null ||
    menuOverlayItem !== null ||
    showSettings;

  if (loading || !config) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl" style={{ fontFamily: '"Victor Mono", sans-serif' }}>
          Loading Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
      {/* Menu Overlay (replaces full-screen iframe) */}
      <MenuOverlay
        visible={menuOverlayItem !== null}
        menuItem={menuOverlayItem}
        onClose={() => setMenuOverlayItem(null)}
      />

      {/* Settings Page */}
      <SettingsPage
        visible={showSettings}
        config={config}
        onConfigChange={(newConfig) => {
          setConfig(newConfig);
          setShowSettings(false);
        }}
        onClose={() => setShowSettings(false)}
      />

      {/* Full Screen Image View */}
      <FullScreenView
        visible={fullScreenIndex !== null}
        imageSrc={fullScreenSrc}
        onClose={handleCloseFullScreen}
        onRotate={handleRotateFullScreen}
      />

      {/* Sources Overlay */}
      <SourcesOverlay
        visible={showSources}
        config={config}
        currentVersion={currentVersion}
        onClose={() => setShowSources(false)}
      />

      {/* Main Content */}
      <div className="fixed inset-0 overflow-hidden flex flex-col">
        {/* Top Bar Row: Left Menu + TopBar + Right Menu */}
        <div className="flex items-stretch bg-[#333] shrink-0">
          <SideMenu
            items={allMenuItems}
            side="L"
            onMenuAction={handleMenuAction}
          />
          <TopBar centerText={config.topBarCenterText} />
          <SideMenu
            items={allMenuItems}
            side="R"
            onMenuAction={handleMenuAction}
          />
        </div>

        {/* Dashboard Grid */}
        <DashboardGrid
          tiles={config.tiles}
          layoutCols={config.layoutCols}
          layoutRows={config.layoutRows}
          paused={paused}
          onFullScreen={handleFullScreen}
        />

        {/* RSS Ticker */}
        {config.rssFeeds.length > 0 && (
          <RssTicker feeds={config.rssFeeds} />
        )}
      </div>
    </div>
  );
}

export default App;

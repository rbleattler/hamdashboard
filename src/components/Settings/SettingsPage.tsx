import { useState } from 'react';
import type { DashboardConfig, TitleStyle, TitlePosition } from '../../config/configTypes';
import { exportToConfigJs, configToStoredSettings } from '../../config/configLoader';
import { MENU_WIDTH } from '../../utils/layoutConstants';

interface SettingsPageProps {
  visible: boolean;
  config: DashboardConfig;
  onConfigChange: (config: DashboardConfig) => void;
  onClose: () => void;
}

export function SettingsPage({
  visible,
  config,
  onConfigChange,
  onClose,
}: SettingsPageProps) {
  const [localConfig, setLocalConfig] = useState<DashboardConfig>({ ...config });

  if (!visible) return null;

  const updateConfig = (updates: Partial<DashboardConfig>) => {
    setLocalConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    const stored = configToStoredSettings(localConfig);
    stored.settingsSource = localConfig.settingsSource;
    localStorage.setItem('hamdash_config', JSON.stringify(stored));
    onConfigChange(localConfig);
    alert('Settings saved!');
  };

  const handleReset = () => {
    localStorage.removeItem('hamdash_config');
    alert('Settings deleted from local storage!');
  };

  const handleBackupJson = () => {
    const stored = configToStoredSettings(localConfig);
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(stored, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'hamdash_config_backup.json';
    a.click();
  };

  const handleRestoreJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          localStorage.setItem('hamdash_config', JSON.stringify(parsed));
          alert(
            'Settings restored from backup!\n\nRemember to Save Settings to Local Storage if you want to make changes permanent.'
          );
          window.location.reload();
        } catch {
          alert('Failed to parse config file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportJs = () => {
    const content = exportToConfigJs(localConfig);
    const dataStr =
      'data:text/javascript;charset=utf-8,' + encodeURIComponent(content);
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'config.js';
    a.click();
  };

  const handleImportJs = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.js';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const configScript = `(function() {
            ${e.target?.result}
            return {
              topBarCenterText,
              layout_cols,
              layout_rows,
              aURL,
              aIMG,
              aRSS,
              tileDelay,
              tileStyles: typeof tileStyles !== 'undefined' ? tileStyles : undefined
            };
          })()`;
          const indirectEval = globalThis.eval;
          const imported = indirectEval(configScript);

          const filteredAURL = (imported.aURL || []).filter(
            (item: string[]) =>
              !item.some(
                (subItem: string) =>
                  typeof subItem === 'string' &&
                  ['BACK', 'Back', 'Refresh', 'Sources', 'Update', 'Help'].some(
                    (w) => subItem.includes(w)
                  )
              )
          );

          const stored = {
            topBarCenterText: imported.topBarCenterText,
            layout_cols: imported.layout_cols,
            layout_rows: imported.layout_rows,
            aURL: filteredAURL,
            aImages: (imported.aIMG || []).map(
              (item: (string | string[])[], index: number) => {
                const [first, ...rest] = item;
                const style = imported.tileStyles?.[index];
                const base = [first, rest, imported.tileDelay?.[index] || 30000];
                if (style) base.push(style);
                return base;
              }
            ),
            aRSS: imported.aRSS || [],
            settingsSource: 'localStorage',
          };
          localStorage.setItem('hamdash_config', JSON.stringify(stored));
          alert(
            'Settings imported from config.js!\n\nRemember to Save Settings if you want to make changes permanent.'
          );
          window.location.reload();
        } catch (err) {
          alert('Failed to import config.js: ' + err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Menu item management
  const addMenuItem = () => {
    updateConfig({
      menuItems: [
        ...localConfig.menuItems,
        {
          color: '2196F3',
          text: '',
          url: '',
          scale: 1,
          side: 'L',
          type: 'user' as const,
        },
      ],
    });
  };

  const removeMenuItem = (index: number) => {
    const items = [...localConfig.menuItems];
    items.splice(index, 1);
    updateConfig({ menuItems: items });
  };

  // Tile management
  const updateTile = (
    index: number,
    field: string,
    value: string | number | string[] | TitleStyle
  ) => {
    const tiles = [...localConfig.tiles];
    const tile = { ...tiles[index] };
    if (field === 'title') tile.titles = [value as string];
    if (field === 'sources') tile.sources = value as string[];
    if (field === 'rotationInterval') tile.rotationInterval = value as number;
    if (field === 'titleStyle') tile.titleStyle = value as TitleStyle;
    tiles[index] = tile;
    updateConfig({ tiles });
  };

  // Feed management
  const addFeed = () => {
    updateConfig({
      rssFeeds: [...localConfig.rssFeeds, ['', 60]],
    });
  };

  const removeFeed = (index: number) => {
    const feeds = [...localConfig.rssFeeds];
    feeds.splice(index, 1);
    updateConfig({ rssFeeds: feeds });
  };

  return (
    <div
      className="fixed inset-0 z-[1] overflow-y-auto"
      style={{
        backgroundColor: 'hsl(210deg 15% 12%)',
        fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
        left: MENU_WIDTH,
        right: MENU_WIDTH,
        color: '#e2e8f0',
      }}
    >
      {/* Fixed header */}
      <div
        className="fixed top-0 z-[2] flex items-center justify-between px-6 py-3"
        style={{
          backgroundColor: 'hsl(210deg 15% 16%)',
          borderBottom: '1px solid hsl(210deg 10% 22%)',
          left: MENU_WIDTH,
          right: MENU_WIDTH,
        }}
      >
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '18px', fontWeight: 600 }}>⚙ Dashboard Setup</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleSave} className="settings-btn settings-btn-primary">
            💾 Save to Storage
          </button>
          <button onClick={handleReset} className="settings-btn settings-btn-danger">
            🗑 Delete Storage
          </button>
          <button onClick={handleBackupJson} className="settings-btn">
            📦 Backup JSON
          </button>
          <button onClick={handleRestoreJson} className="settings-btn">
            📂 Restore JSON
          </button>
          <button onClick={handleImportJs} className="settings-btn">
            📥 Import .js
          </button>
          <button onClick={handleExportJs} className="settings-btn">
            📤 Export .js
          </button>
          <button onClick={onClose} className="settings-btn settings-btn-danger">
            ✕ Close
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pt-16 p-6" style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* General Settings Card */}
        <div
          className="mb-6 rounded-lg p-5"
          style={{ backgroundColor: 'hsl(210deg 15% 16%)', border: '1px solid hsl(210deg 10% 22%)' }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: 'hsl(200deg 80% 65%)' }}>
            General Settings
          </h2>

          {/* Settings Source */}
          <div className="mb-4 flex items-center gap-6">
            <label className="text-sm font-medium" style={{ color: 'hsl(210deg 10% 65%)' }}>
              Settings Source:
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="settingsSource"
                value="localStorage"
                checked={localConfig.settingsSource === 'localStorage'}
                onChange={() => updateConfig({ settingsSource: 'localStorage' })}
                style={{ accentColor: 'hsl(200deg 80% 50%)' }}
              />
              Browser Local Storage
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="settingsSource"
                value="file"
                checked={localConfig.settingsSource === 'file'}
                onChange={() => updateConfig({ settingsSource: 'file' })}
                style={{ accentColor: 'hsl(200deg 80% 50%)' }}
              />
              config.js file
            </label>
          </div>

          {/* Top Bar Text */}
          <div className="mb-4">
            <label className="text-sm font-medium block mb-1" style={{ color: 'hsl(210deg 10% 65%)' }}>
              Top Bar Center Text:
            </label>
            <input
              type="text"
              className="settings-input w-full"
              value={localConfig.topBarCenterText}
              onChange={(e) =>
                updateConfig({ topBarCenterText: e.target.value })
              }
            />
          </div>

          {/* Grid Layout */}
          <div className="flex items-center gap-6">
            <label className="text-sm font-medium" style={{ color: 'hsl(210deg 10% 65%)' }}>
              Grid Layout:
            </label>
            <label className="flex items-center gap-2 text-sm">
              Columns
              <input
                type="number"
                className="settings-input w-20"
                min={1}
                value={localConfig.layoutCols}
                onChange={(e) =>
                  updateConfig({ layoutCols: parseInt(e.target.value, 10) || 1 })
                }
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              Rows
              <input
                type="number"
                className="settings-input w-20"
                min={1}
                value={localConfig.layoutRows}
                onChange={(e) =>
                  updateConfig({ layoutRows: parseInt(e.target.value, 10) || 1 })
                }
              />
            </label>
          </div>
        </div>

        {/* Menu Items Card */}
        <div
          className="mb-6 rounded-lg p-5"
          style={{ backgroundColor: 'hsl(210deg 15% 16%)', border: '1px solid hsl(210deg 10% 22%)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: 'hsl(200deg 80% 65%)' }}>
              Menu Items
            </h2>
            <button onClick={addMenuItem} className="settings-btn settings-btn-primary">
              + Add Item
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: '0 2px' }}>
              <thead>
                <tr>
                  {['Color', 'Text', 'URL', 'Scale', 'Side', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium px-3 py-2"
                      style={{ color: 'hsl(210deg 10% 50%)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {localConfig.menuItems
                  .filter((m) => m.type !== 'core')
                  .map((item, i) => {
                    const globalIdx = localConfig.menuItems.indexOf(item);
                    return (
                      <tr
                        key={i}
                        style={{
                          backgroundColor: 'hsl(210deg 15% 19%)',
                          borderRadius: 6,
                        }}
                      >
                        <td className="px-3 py-2 rounded-l-md">
                          <input
                            type="color"
                            value={`#${item.color}`}
                            className="w-8 h-8 rounded cursor-pointer border-0"
                            style={{ backgroundColor: 'transparent' }}
                            onChange={(e) => {
                              const items = [...localConfig.menuItems];
                              items[globalIdx] = {
                                ...items[globalIdx],
                                color: e.target.value.replace('#', ''),
                              };
                              updateConfig({ menuItems: items });
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            className="settings-input w-full"
                            placeholder="Menu text"
                            value={item.text}
                            onChange={(e) => {
                              const items = [...localConfig.menuItems];
                              items[globalIdx] = {
                                ...items[globalIdx],
                                text: e.target.value,
                              };
                              updateConfig({ menuItems: items });
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            className="settings-input w-full"
                            placeholder="https://..."
                            value={item.url}
                            onChange={(e) => {
                              const items = [...localConfig.menuItems];
                              items[globalIdx] = {
                                ...items[globalIdx],
                                url: e.target.value,
                              };
                              updateConfig({ menuItems: items });
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            className="settings-input w-16"
                            value={item.scale}
                            onChange={(e) => {
                              const items = [...localConfig.menuItems];
                              items[globalIdx] = {
                                ...items[globalIdx],
                                scale: parseFloat(e.target.value) || 1,
                              };
                              updateConfig({ menuItems: items });
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="settings-input"
                            value={item.side}
                            onChange={(e) => {
                              const items = [...localConfig.menuItems];
                              items[globalIdx] = {
                                ...items[globalIdx],
                                side: e.target.value as 'L' | 'R',
                              };
                              updateConfig({ menuItems: items });
                            }}
                          >
                            <option value="L">Left</option>
                            <option value="R">Right</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 rounded-r-md">
                          <button
                            onClick={() => removeMenuItem(globalIdx)}
                            className="settings-btn settings-btn-danger"
                            title="Delete"
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dashboard Items Card */}
        <div
          className="mb-6 rounded-lg p-5"
          style={{ backgroundColor: 'hsl(210deg 15% 16%)', border: '1px solid hsl(210deg 10% 22%)' }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: 'hsl(200deg 80% 65%)' }}>
            Dashboard Tiles
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: '0 2px' }}>
              <thead>
                <tr>
                  {['Title', 'URLs', 'Rotation (ms)', 'Title Style'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium px-3 py-2"
                      style={{ color: 'hsl(210deg 10% 50%)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {localConfig.tiles.map((tile, i) => {
                  const ts: TitleStyle = tile.titleStyle || {};
                  const updateStyle = (patch: Partial<TitleStyle>) =>
                    updateTile(i, 'titleStyle', { ...ts, ...patch });
                  return (
                  <tr
                    key={i}
                    style={{ backgroundColor: 'hsl(210deg 15% 19%)' }}
                  >
                    <td className="px-3 py-2 rounded-l-md align-top">
                      <input
                        type="text"
                        className="settings-input w-full"
                        placeholder="Tile title"
                        value={tile.titles.join(', ')}
                        onChange={(e) =>
                          updateTile(i, 'title', e.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      {tile.sources.map((src, j) => (
                        <div key={j} className="flex items-center gap-2 mb-1">
                          <input
                            type="text"
                            className="settings-input flex-1"
                            placeholder="https://..."
                            value={src}
                            onChange={(e) => {
                              const sources = [...tile.sources];
                              sources[j] = e.target.value;
                              updateTile(i, 'sources', sources);
                            }}
                          />
                          <button
                            onClick={() => {
                              const sources = tile.sources.filter(
                                (_, k) => k !== j
                              );
                              updateTile(i, 'sources', sources);
                            }}
                            className="settings-btn settings-btn-danger"
                            style={{ padding: '4px 8px', fontSize: 11 }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const sources = [...tile.sources, ''];
                          updateTile(i, 'sources', sources);
                        }}
                        className="settings-btn"
                        style={{ fontSize: 11, marginTop: 2 }}
                      >
                        + Add URL
                      </button>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="number"
                        className="settings-input w-24"
                        value={tile.rotationInterval}
                        onChange={(e) =>
                          updateTile(
                            i,
                            'rotationInterval',
                            parseInt(e.target.value, 10) || 30000
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2 rounded-r-md align-top">
                      <div className="flex flex-col gap-1" style={{ minWidth: 160 }}>
                        <label className="text-xs" style={{ color: 'hsl(210deg 10% 55%)' }}>Position</label>
                        <select
                          className="settings-input"
                          value={ts.position || 'bottom-center'}
                          onChange={(e) =>
                            updateStyle({ position: e.target.value as TitlePosition })
                          }
                        >
                          <option value="top-left">Top Left</option>
                          <option value="top-center">Top Center</option>
                          <option value="top-right">Top Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="bottom-center">Bottom Center</option>
                          <option value="bottom-right">Bottom Right</option>
                          <option value="none">Hidden</option>
                        </select>
                        <label className="text-xs" style={{ color: 'hsl(210deg 10% 55%)' }}>Opacity</label>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={ts.opacity ?? 1}
                          onChange={(e) =>
                            updateStyle({ opacity: parseFloat(e.target.value) })
                          }
                          style={{ accentColor: 'hsl(200deg 80% 50%)' }}
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-xs" style={{ color: 'hsl(210deg 10% 55%)' }}>Font</label>
                          <input
                            type="color"
                            className="w-6 h-6 rounded cursor-pointer border-0"
                            style={{ backgroundColor: 'transparent' }}
                            value={ts.fontColor || '#ffffff'}
                            onChange={(e) =>
                              updateStyle({ fontColor: e.target.value })
                            }
                          />
                          <label className="text-xs" style={{ color: 'hsl(210deg 10% 55%)' }}>Bg</label>
                          <input
                            type="color"
                            className="w-6 h-6 rounded cursor-pointer border-0"
                            style={{ backgroundColor: 'transparent' }}
                            value={ts.bgColor || '#000000'}
                            onChange={(e) =>
                              updateStyle({ bgColor: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feed Items Card */}
        <div
          className="mb-6 rounded-lg p-5"
          style={{ backgroundColor: 'hsl(210deg 15% 16%)', border: '1px solid hsl(210deg 10% 22%)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: 'hsl(200deg 80% 65%)' }}>
              RSS Feeds
            </h2>
            <button onClick={addFeed} className="settings-btn settings-btn-primary">
              + Add Feed
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: '0 2px' }}>
              <thead>
                <tr>
                  {['Feed URL', 'Refresh (min)', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium px-3 py-2"
                      style={{ color: 'hsl(210deg 10% 50%)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {localConfig.rssFeeds.map((feed, i) => (
                  <tr
                    key={i}
                    style={{ backgroundColor: 'hsl(210deg 15% 19%)' }}
                  >
                    <td className="px-3 py-2 rounded-l-md">
                      <input
                        type="text"
                        className="settings-input w-full"
                        placeholder="https://..."
                        value={feed[0]}
                        onChange={(e) => {
                          const feeds = [...localConfig.rssFeeds];
                          feeds[i] = [e.target.value, feeds[i][1]];
                          updateConfig({ rssFeeds: feeds });
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="settings-input w-24"
                        value={feed[1]}
                        onChange={(e) => {
                          const feeds = [...localConfig.rssFeeds];
                          feeds[i] = [
                            feeds[i][0],
                            parseInt(e.target.value, 10) || 60,
                          ];
                          updateConfig({ rssFeeds: feeds });
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 rounded-r-md">
                      <button
                        onClick={() => removeFeed(i)}
                        className="settings-btn settings-btn-danger"
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

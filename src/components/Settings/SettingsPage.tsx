import { useState } from 'react';
import type { DashboardConfig } from '../../config/configTypes';
import { exportToConfigJs, configToStoredSettings } from '../../config/configLoader';

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
              tileDelay
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
                return [first, rest, imported.tileDelay?.[index] || 30000];
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
    value: string | number | string[]
  ) => {
    const tiles = [...localConfig.tiles];
    const tile = { ...tiles[index] };
    if (field === 'title') tile.titles = [value as string];
    if (field === 'sources') tile.sources = value as string[];
    if (field === 'rotationInterval') tile.rotationInterval = value as number;
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
        backgroundColor: 'aliceblue',
        fontFamily: 'Arial, sans-serif',
        left: '7vw',
        right: '7vw',
      }}
    >
      {/* Fixed header */}
      <div
        className="fixed top-0 text-center p-2 z-[2]"
        style={{
          backgroundColor: 'cadetblue',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
          left: '7vw',
          right: '7vw',
        }}
      >
        <button onClick={handleSave} className="settings-btn">
          Save Settings to Local Storage
        </button>
        <button onClick={handleReset} className="settings-btn">
          Delete Settings from Local Storage
        </button>
        <button onClick={handleBackupJson} className="settings-btn">
          Backup Settings to JSON file
        </button>
        <button onClick={handleRestoreJson} className="settings-btn">
          Restore Settings from JSON file
        </button>
        <button onClick={handleImportJs} className="settings-btn">
          Import from config.js file
        </button>
        <button onClick={handleExportJs} className="settings-btn">
          Export to config.js file
        </button>
        <button onClick={onClose} className="settings-btn bg-red-200">
          Close Settings
        </button>
      </div>

      {/* Content */}
      <div className="mt-14 p-4 text-black">
        <h1 className="text-2xl font-bold mb-4">Dashboard Setup</h1>

        {/* Settings Source */}
        <div className="mb-4 flex items-center gap-4">
          <label className="font-bold">Select Settings Source:</label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="settingsSource"
              value="localStorage"
              checked={localConfig.settingsSource === 'localStorage'}
              onChange={() => updateConfig({ settingsSource: 'localStorage' })}
            />
            Browser Local Storage
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="settingsSource"
              value="file"
              checked={localConfig.settingsSource === 'file'}
              onChange={() => updateConfig({ settingsSource: 'file' })}
            />
            config.js file
          </label>
        </div>

        {/* Top Bar Text */}
        <div className="mb-4">
          <label className="font-bold block mb-1">Top Bar Center Text:</label>
          <input
            type="text"
            className="w-[90%] p-1 border border-gray-300"
            value={localConfig.topBarCenterText}
            onChange={(e) =>
              updateConfig({ topBarCenterText: e.target.value })
            }
          />
        </div>

        {/* Grid Layout */}
        <div className="mb-4 flex items-center gap-4">
          <label className="font-bold">Grid Layout:</label>
          <label>
            Columns:
            <input
              type="number"
              className="w-20 p-1 ml-1 border border-gray-300"
              min={1}
              value={localConfig.layoutCols}
              onChange={(e) =>
                updateConfig({ layoutCols: parseInt(e.target.value, 10) || 1 })
              }
            />
          </label>
          <label>
            Rows:
            <input
              type="number"
              className="w-20 p-1 ml-1 border border-gray-300"
              min={1}
              value={localConfig.layoutRows}
              onChange={(e) =>
                updateConfig({ layoutRows: parseInt(e.target.value, 10) || 1 })
              }
            />
          </label>
        </div>

        {/* Menu Items */}
        <div className="mb-4">
          <label className="font-bold block mb-2">Menu Items:</label>
          <table className="w-full border-collapse mb-2">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2 bg-gray-100">Color</th>
                <th className="border border-gray-300 p-2 bg-gray-100">Text</th>
                <th className="border border-gray-300 p-2 bg-gray-100">URL</th>
                <th className="border border-gray-300 p-2 bg-gray-100">Scale</th>
                <th className="border border-gray-300 p-2 bg-gray-100">Side</th>
                <th className="border border-gray-300 p-2 bg-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody>
              {localConfig.menuItems
                .filter((m) => m.type !== 'core')
                .map((item, i) => {
                  const globalIdx = localConfig.menuItems.indexOf(item);
                  return (
                    <tr key={i}>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="color"
                          value={`#${item.color}`}
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
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          className="w-full p-1"
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
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          className="w-full p-1"
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
                      <td className="border border-gray-300 p-1">
                        <input
                          type="number"
                          className="w-16 p-1"
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
                      <td className="border border-gray-300 p-1">
                        <select
                          className="p-1"
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
                      <td className="border border-gray-300 p-1">
                        <button
                          onClick={() => removeMenuItem(globalIdx)}
                          className="settings-btn"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          <button onClick={addMenuItem} className="settings-btn">
            Add Menu Item
          </button>
        </div>

        {/* Dashboard Items */}
        <div className="mb-4">
          <label className="font-bold block mb-2">Dashboard Items:</label>
          <table className="w-full border-collapse mb-2">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2 bg-gray-100">
                  Tile Title
                </th>
                <th className="border border-gray-300 p-2 bg-gray-100">
                  Tile URLs
                </th>
                <th className="border border-gray-300 p-2 bg-gray-100">
                  URL Rotation Interval (ms)
                </th>
              </tr>
            </thead>
            <tbody>
              {localConfig.tiles.map((tile, i) => (
                <tr key={i}>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="text"
                      className="w-full p-1"
                      value={tile.titles.join(', ')}
                      onChange={(e) =>
                        updateTile(
                          i,
                          'title',
                          e.target.value
                        )
                      }
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    {tile.sources.map((src, j) => (
                      <div key={j} className="flex items-center gap-1 mb-1">
                        <input
                          type="text"
                          className="flex-1 p-1"
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
                          className="settings-btn text-xs"
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
                      className="settings-btn text-xs"
                    >
                      Add URL
                    </button>
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="number"
                      className="w-24 p-1"
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Feed Items */}
        <div className="mb-4">
          <label className="font-bold block mb-2">Feed Items:</label>
          <table className="w-full border-collapse mb-2">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2 bg-gray-100">
                  Feed URL
                </th>
                <th className="border border-gray-300 p-2 bg-gray-100">
                  Refresh Interval (minutes)
                </th>
                <th className="border border-gray-300 p-2 bg-gray-100">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {localConfig.rssFeeds.map((feed, i) => (
                <tr key={i}>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="text"
                      className="w-full p-1"
                      value={feed[0]}
                      onChange={(e) => {
                        const feeds = [...localConfig.rssFeeds];
                        feeds[i] = [e.target.value, feeds[i][1]];
                        updateConfig({ rssFeeds: feeds });
                      }}
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="number"
                      className="w-24 p-1"
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
                  <td className="border border-gray-300 p-1">
                    <button
                      onClick={() => removeFeed(i)}
                      className="settings-btn"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addFeed} className="settings-btn">
            Add Feed Item
          </button>
        </div>
      </div>
    </div>
  );
}

import type { DashboardConfig } from '../../config/configTypes';

interface SourcesOverlayProps {
  visible: boolean;
  config: DashboardConfig;
  currentVersion: string;
  onClose: () => void;
}

export function SourcesOverlay({
  visible,
  config,
  currentVersion,
  onClose,
}: SourcesOverlayProps) {
  if (!visible) return null;

  const menuItems = config.menuItems
    .filter((m) => m.type !== 'core')
    .map((m) => `"${m.color}", "${m.text}", "${m.url}", "${m.scale}", "${m.side}"`);

  const tiles = config.tiles.map(
    (t) =>
      `"${t.titles.join('/')}", ${t.sources.map((s) => `"${s}"`).join(', ')}`
  );

  const feeds = config.rssFeeds.map(
    (f) => `"${f[0]}", ${f[1]}`
  );

  return (
    <div
      className="fixed inset-0 flex items-start justify-center z-[3]"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '50px',
        boxSizing: 'border-box',
        fontFamily: '"Roboto Condensed", sans-serif',
        color: 'white',
      }}
    >
      <div
        className="bg-[#333] p-5 rounded-[10px] max-h-[80vh] overflow-y-auto w-full"
      >
        <span
          className="cursor-pointer text-white float-right text-[20px]"
          onClick={onClose}
        >
          ✖
        </span>

        <div className="mb-4">
          <b>Menu Options:</b>
          <div className="mt-2">
            {menuItems.map((item, i) => (
              <div key={i} className="text-sm text-gray-300">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <b>Image Sources:</b>
          <div className="mt-2">
            {tiles.map((item, i) => (
              <div key={i} className="text-sm text-gray-300">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <b>Feed Sources:</b>
          <div className="mt-2">
            {feeds.map((item, i) => (
              <div key={i} className="text-sm text-gray-300">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div>
          <b>Development by:</b>
          <div className="mt-2 text-sm text-gray-300">
            Copyright (c) 2026 Pablo Sabbag, VA3HDL | Open Source License: MIT
            <br />
            Dashboard codebase version: {currentVersion}
          </div>
        </div>
      </div>
    </div>
  );
}

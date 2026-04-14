import type { MenuItem } from '../../config/configTypes';
import { isDark } from '../../utils/sourceHelpers';

interface MenuOverlayProps {
  visible: boolean;
  menuItem: MenuItem | null;
  onClose: () => void;
}

/**
 * Full-screen overlay for menu items that open external content.
 * Instead of using an iframe, opens content in a new tab or
 * shows it in a styled container. For external websites, opens
 * in a new tab for better UX and security.
 */
export function MenuOverlay({
  visible,
  menuItem,
  onClose,
}: MenuOverlayProps) {
  if (!visible || !menuItem) return null;

  const dark = isDark(menuItem.url);
  const url = dark ? menuItem.url.replace('dark|', '') : menuItem.url;

  // Open the URL in a new tab instead of embedding in an iframe
  // This is the modern replacement for the full-screen iframe overlay
  return (
    <div className="fixed inset-0 bg-black z-[1]" style={{ left: '7vw', right: '7vw' }}>
      <div className="flex flex-col h-full w-full">
        <div className="flex items-center justify-between p-2 bg-[#333]">
          <span
            className="text-white font-bold"
            style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.2vw' }}
          >
            {menuItem.text}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
              className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              Open in New Tab ↗
            </button>
            <button
              onClick={onClose}
              className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
            >
              ✕ Close
            </button>
          </div>
        </div>
        <div className="flex-1 relative">
          <iframe
            src={url}
            className="absolute inset-0 h-full w-full border-0"
            style={{
              filter: dark ? 'invert(1) hue-rotate(180deg)' : 'none',
              transform: `scale(${menuItem.scale})`,
              transformOrigin: '0 0',
            }}
            title={menuItem.text}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      </div>
    </div>
  );
}

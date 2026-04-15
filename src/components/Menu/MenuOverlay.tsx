import type { MenuItem } from '../../config/configTypes';
import { isDark, isWeather, is511PA, parseSource } from '../../utils/sourceHelpers';
import { WeatherModule, TrafficCamModule } from '../../modules';
import { MENU_WIDTH } from '../../utils/layoutConstants';

interface MenuOverlayProps {
  visible: boolean;
  menuItem: MenuItem | null;
  onClose: () => void;
}

/**
 * Full-screen overlay for menu items that open external content.
 * Handles weather| URLs by rendering the WeatherModule inline.
 * Other URLs are rendered in an iframe with an option to open in a new tab.
 */
export function MenuOverlay({
  visible,
  menuItem,
  onClose,
}: MenuOverlayProps) {
  if (!visible || !menuItem) return null;

  const isWeatherUrl = isWeather(menuItem.url);
  const isTrafficCam = is511PA(menuItem.url);
  const dark = !isWeatherUrl && !isTrafficCam && isDark(menuItem.url);
  const url = dark ? menuItem.url.replace('dark|', '') : menuItem.url;

  // Parse weather source if applicable
  const weatherParsed = isWeatherUrl ? parseSource(menuItem.url) : null;
  // Parse traffic cam source if applicable
  const trafficCamParsed = isTrafficCam ? parseSource(menuItem.url) : null;

  return (
    <div className="fixed inset-0 bg-black z-[1]" style={{ left: MENU_WIDTH, right: MENU_WIDTH }}>
      <div className="flex flex-col h-full w-full">
        <div className="flex items-center justify-between p-2 bg-[#333]">
          <span
            className="text-white font-bold"
            style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.2vw' }}
          >
            {menuItem.text}
          </span>
          <div className="flex gap-2">
            {!isWeatherUrl && !isTrafficCam && (
              <button
                onClick={() => {
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
              >
                Open in New Tab ↗
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
            >
              ✕ Close
            </button>
          </div>
        </div>
        <div className="flex-1 relative">
          {isWeatherUrl && weatherParsed?.stationId && weatherParsed?.apiKey ? (
            <WeatherModule
              stationId={weatherParsed.stationId}
              apiKey={weatherParsed.apiKey}
              units={weatherParsed.units}
            />
          ) : isTrafficCam && trafficCamParsed?.url ? (
            <TrafficCamModule
              streamUrl={trafficCamParsed.url}
            />
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}

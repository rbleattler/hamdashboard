import { useState, useEffect, useRef, useCallback } from 'react';
import { useWheelZoom } from '../hooks/useWheelZoom';

interface TrafficCamModuleProps {
  /** Direct URL to the camera image (e.g. from dot35.state.pa.us) */
  imageUrl: string;
  /** Refresh interval in seconds (default 30) */
  refreshSeconds?: number;
  /** When true, renders a compact tile-sized view */
  compact?: boolean;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

/**
 * Traffic camera module for displaying live camera feeds from 511PA / PennDOT.
 * Auto-refreshes the camera image at the configured interval by appending
 * a cache-busting parameter.
 */
export function TrafficCamModule({
  imageUrl,
  refreshSeconds = 30,
  compact = false,
  onDoubleClick,
  onContextMenu,
}: TrafficCamModuleProps) {
  const [imgSrc, setImgSrc] = useState(() => bustCache(imageUrl));
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useWheelZoom(imgRef);

  const refresh = useCallback(() => {
    setImgSrc(bustCache(imageUrl));
    setLastRefresh(new Date());
    setHasError(false);
  }, [imageUrl]);

  // Auto-refresh at configured interval
  useEffect(() => {
    if (refreshSeconds <= 0) return;
    intervalRef.current = setInterval(refresh, refreshSeconds * 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refreshSeconds, refresh]);

  if (compact) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {hasError ? (
          <div className="flex flex-col items-center gap-1 text-yellow-400 text-center px-2">
            <span style={{ fontSize: '1.2vw' }}>⚠ Camera Unavailable</span>
            <span style={{ fontSize: '0.7vw' }} className="text-gray-400">
              Retrying every {refreshSeconds}s
            </span>
          </div>
        ) : (
          <img
            ref={imgRef}
            src={imgSrc}
            alt="Traffic Camera"
            className="h-full w-full object-contain"
            onError={() => setHasError(true)}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
          />
        )}
        {/* Timestamp overlay */}
        <div
          className="absolute top-1 right-1 text-white bg-black/60 px-1 rounded"
          style={{ fontSize: '0.6vw', fontFamily: '"Roboto Condensed", sans-serif' }}
        >
          {formatTime(lastRefresh)}
        </div>
      </div>
    );
  }

  // Full view (overlay / full-screen)
  return (
    <div className="w-full h-full flex flex-col bg-black text-white">
      <div className="flex-1 relative flex items-center justify-center min-h-0">
        {hasError ? (
          <div className="flex flex-col items-center gap-2 text-yellow-400">
            <span className="text-2xl">⚠ Camera Unavailable</span>
            <span className="text-sm text-gray-400">
              Auto-retrying every {refreshSeconds} seconds
            </span>
            <button
              onClick={refresh}
              className="mt-2 px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              Retry Now
            </button>
          </div>
        ) : (
          <img
            ref={imgRef}
            src={imgSrc}
            alt="Traffic Camera"
            className="max-h-full max-w-full object-contain"
            onError={() => setHasError(true)}
          />
        )}
      </div>
      <div
        className="shrink-0 flex items-center justify-between px-4 py-2"
        style={{ background: 'hsl(210deg 15% 15%)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Last refresh: {formatTime(lastRefresh)}
          </span>
          <span className="text-xs text-gray-500">
            Auto-refresh: {refreshSeconds}s
          </span>
        </div>
        <button
          onClick={refresh}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
        >
          ⟳ Refresh
        </button>
      </div>
    </div>
  );
}

function bustCache(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_cb=${Date.now()}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface TrafficCamModuleProps {
  /** PennDOT camera ID (e.g. "171_003"). Used to construct the HLS stream URL. */
  cameraId: string;
  /** When true, renders a compact tile-sized view */
  compact?: boolean;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

/** Base URL for PennDOT 511PA HLS camera streams */
const STREAM_BASE = 'https://cwwp2.dot.pa.gov/rtplive';

/** Whether hls.js polyfill is supported in this browser (static, won't change) */
const HLS_JS_SUPPORTED = Hls.isSupported();

/**
 * Traffic camera module for displaying live HLS video feeds from 511PA / PennDOT.
 * Streams live video using hls.js with automatic reconnection on failure.
 */
export function TrafficCamModule({
  cameraId,
  compact = false,
  onDoubleClick,
  onContextMenu,
}: TrafficCamModuleProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const streamUrl = `${STREAM_BASE}/${encodeURIComponent(cameraId)}/playlist.m3u8`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    // Safari supports HLS natively
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      const onLoaded = () => { if (!cancelled) setIsLoading(false); };
      const onError = () => {
        if (!cancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      };
      video.addEventListener('loadeddata', onLoaded);
      video.addEventListener('error', onError);
      video.play().catch(() => { /* autoplay may be blocked */ });
      return () => {
        cancelled = true;
        video.removeEventListener('loadeddata', onLoaded);
        video.removeEventListener('error', onError);
        video.src = '';
        video.load();
      };
    }

    // hls.js not supported — nothing we can do
    if (!HLS_JS_SUPPORTED) return;

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 30,
    });
    hlsRef.current = hls;

    hls.loadSource(streamUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (!cancelled) setIsLoading(false);
      video.play().catch(() => { /* autoplay may be blocked */ });
    });

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal && !cancelled) {
        setIsLoading(false);
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            // Try to recover from network errors
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            setHasError(true);
            hls.destroy();
            break;
        }
      }
    });

    return () => {
      cancelled = true;
      hls.destroy();
      hlsRef.current = null;
    };
  }, [streamUrl]);

  if (compact) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {hasError ? (
          <div className="flex flex-col items-center gap-1 text-yellow-400 text-center px-2">
            <span style={{ fontSize: '1.2vw' }}>⚠ Camera Unavailable</span>
            <span style={{ fontSize: '0.7vw' }} className="text-gray-400">
              {cameraId}
            </span>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-[1]">
                <span className="text-white/60" style={{ fontSize: '0.9vw' }}>Loading…</span>
              </div>
            )}
            <video
              ref={videoRef}
              className="h-full w-full object-contain"
              muted
              autoPlay
              playsInline
              onDoubleClick={onDoubleClick}
              onContextMenu={onContextMenu}
            />
          </>
        )}
        {/* Camera ID overlay */}
        <div
          className="absolute top-1 right-1 text-white bg-black/60 px-1 rounded"
          style={{ fontSize: '0.6vw', fontFamily: '"Roboto Condensed", sans-serif' }}
        >
          LIVE
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
              Camera ID: {cameraId}
            </span>
            <span className="text-xs text-gray-500">
              Stream: {streamUrl}
            </span>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-[1]">
                <span className="text-white/60 text-lg">Loading stream…</span>
              </div>
            )}
            <video
              ref={videoRef}
              className="max-h-full max-w-full object-contain"
              muted
              autoPlay
              playsInline
              controls
            />
          </>
        )}
      </div>
      <div
        className="shrink-0 flex items-center justify-between px-4 py-2"
        style={{ background: 'hsl(210deg 15% 15%)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Camera: {cameraId}
          </span>
          <span className="text-xs text-red-400 font-bold">
            ● LIVE
          </span>
        </div>
      </div>
    </div>
  );
}

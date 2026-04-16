import { useCallback, useMemo, useState } from 'react';
import { useTileRotation } from '../../hooks/useTileRotation';
import { ImageModule, VideoModule, WebContentModule, WeatherModule } from '../../modules';
import { parseSource } from '../../utils/sourceHelpers';
import type { TileConfig, TitlePosition, TitleStyle } from '../../config/configTypes';

interface TileProps {
  config: TileConfig;
  index: number;
  paused: boolean;
  onFullScreen: (index: number) => void;
}

/** Map a TitlePosition to CSS positioning classes */
function getTitlePositionStyle(position: TitlePosition): React.CSSProperties {
  switch (position) {
    case 'top-left':
      return { top: '6%', left: '4%', transform: 'none' };
    case 'top-center':
      return { top: '6%', left: '50%', transform: 'translateX(-50%)' };
    case 'top-right':
      return { top: '6%', right: '4%', transform: 'none' };
    case 'bottom-left':
      return { bottom: '6%', left: '4%', transform: 'none' };
    case 'bottom-right':
      return { bottom: '6%', right: '4%', transform: 'none' };
    case 'bottom-center':
    default:
      return { bottom: '6%', left: '50%', transform: 'translateX(-50%)' };
  }
}

/** Resolve effective title style with defaults */
function resolveStyle(style?: TitleStyle) {
  return {
    position: style?.position ?? 'bottom-center',
    opacity: style?.opacity ?? 1,
    fontColor: style?.fontColor ?? '#ffffff',
    bgColor: style?.bgColor ?? '#000000',
  };
}

export function Tile({ config, index, paused, onFullScreen }: TileProps) {
  const { currentIndex, advance } = useTileRotation(
    config.sources.length,
    config.rotationInterval,
    paused
  );
  const [overlayVisible, setOverlayVisible] = useState(true);

  const currentSource = config.sources[currentIndex] || config.sources[0];
  const parsed = parseSource(currentSource);

  // Current title based on rotation
  const currentTitle =
    config.titles.length > 1
      ? config.titles[currentIndex % config.titles.length] || ''
      : config.titles[0] || '';

  const titleStyle = useMemo(() => resolveStyle(config.titleStyle), [config.titleStyle]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      advance();
    },
    [advance]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (parsed.type === 'video' || parsed.type === 'iframe') {
        // Unlock overlay for interaction
        setOverlayVisible(false);
      } else {
        onFullScreen(index);
      }
    },
    [parsed.type, index, onFullScreen]
  );

  const showOverlay = overlayVisible && (parsed.type === 'video' || parsed.type === 'iframe');
  const showTitle = currentTitle && titleStyle.position !== 'none';

  return (
    <div
      className="relative overflow-hidden flex justify-center items-center rounded-[5px] w-full h-full"
      style={{ border: '1px solid hsl(210deg 8% 50%)' }}
    >
      {/* Content based on type */}
      {parsed.type === 'image' && (
        <ImageModule
          src={parsed.url}
          invert={parsed.invert}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
        />
      )}

      {parsed.type === 'video' && <VideoModule src={parsed.url} />}

      {parsed.type === 'iframe' && (
        <WebContentModule
          src={parsed.url}
          darkFrame={parsed.darkFrame}
          scale={parsed.scale}
        />
      )}

      {parsed.type === 'weather' && parsed.stationId && parsed.apiKey && (
        <WeatherModule
          stationId={parsed.stationId}
          apiKey={parsed.apiKey}
          units={parsed.units}
          compact
        />
      )}

      {/* Click overlay for weather tiles — enables double-click to open full view */}
      {parsed.type === 'weather' && (
        <div
          className="absolute inset-0 bg-transparent cursor-pointer z-[1]"
          onContextMenu={handleContextMenu}
          onDoubleClick={handleDoubleClick}
        />
      )}

      {/* Click overlay for video/iframe tiles */}
      {showOverlay && (
        <div
          className="absolute inset-0 bg-transparent cursor-pointer z-[1]"
          onContextMenu={handleContextMenu}
          onDoubleClick={handleDoubleClick}
        />
      )}

      {/* Title overlay */}
      {showTitle && (
        <div
          className="absolute px-[0.25vw] z-[2]"
          style={{
            ...getTitlePositionStyle(titleStyle.position as TitlePosition),
            color: titleStyle.fontColor,
            backgroundColor: titleStyle.bgColor,
            opacity: titleStyle.opacity,
            fontSize: '1vw',
            fontFamily: '"Roboto Condensed", sans-serif',
            fontWeight: 300,
            paddingTop: '1px',
          }}
        >
          {currentTitle}
        </div>
      )}
    </div>
  );
}

import ReactPlayer from 'react-player';

interface WebContentModuleProps {
  src: string;
  darkFrame: boolean;
  scale?: number;
}

/**
 * WebContentModule handles embedded external content.
 * - YouTube/Vimeo/Soundcloud URLs: rendered via react-player (no raw iframe)
 * - Other URLs: rendered via a wrapped, isolated iframe as a last resort
 */
export function WebContentModule({
  src,
  darkFrame,
  scale,
}: WebContentModuleProps) {
  const isPlayable = ReactPlayer.canPlay?.(src) ?? false;

  if (isPlayable) {
    return (
      <div
        className="relative h-full w-full"
        style={{
          filter: darkFrame ? 'invert(1) hue-rotate(180deg)' : 'none',
        }}
      >
        <ReactPlayer
          src={src}
          playing
          muted
          loop
          width="100%"
          height="100%"
        />
      </div>
    );
  }

  // Fallback: isolated iframe for content that can't be rendered natively
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        filter: darkFrame ? 'invert(1) hue-rotate(180deg)' : 'none',
      }}
    >
      <iframe
        src={src}
        className="absolute inset-0 h-full w-full border-0 rounded-[5px]"
        style={{
          transform: scale ? `scale(${scale})` : undefined,
          transformOrigin: '0 0',
        }}
        title="Embedded content"
        sandbox="allow-scripts allow-same-origin allow-popups"
        loading="lazy"
      />
    </div>
  );
}

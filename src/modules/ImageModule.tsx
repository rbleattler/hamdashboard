import { useRef } from 'react';
import { useWheelZoom } from '../hooks/useWheelZoom';
import { getImgURL } from '../utils/sourceHelpers';

interface ImageModuleProps {
  src: string;
  invert: boolean;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function ImageModule({
  src,
  invert,
  onDoubleClick,
  onContextMenu,
}: ImageModuleProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  useWheelZoom(imgRef);

  return (
    <img
      ref={imgRef}
      src={getImgURL(src)}
      alt=""
      className="h-full w-full object-contain"
      style={{ filter: invert ? 'invert(1)' : 'none' }}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onError={(e) => {
        const target = e.currentTarget;
        const currentSrc = target.src;
        if (currentSrc.includes('?')) {
          // Retry without cache-busting
          target.src = currentSrc.split('?')[0];
        } else {
          // Show error SVG
          const el = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="330">
            <g>
              <text style="font-size:34px; line-height:1.25; white-space:pre; fill:#ffaa00; fill-opacity:1; stroke:#ffaa00; stroke-opacity:1;">
                <tspan x="100" y="150">Failed to load image</tspan>
              </text>
            </g>
          </svg>`;
          target.src = 'data:image/svg+xml;base64,' + window.btoa(el);
        }
      }}
    />
  );
}

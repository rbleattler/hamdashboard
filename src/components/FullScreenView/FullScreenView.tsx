import { useCallback } from 'react';
import { ImageModule } from '../../modules';

interface FullScreenViewProps {
  visible: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onRotate: () => void;
}

/**
 * Full-screen image view, triggered by double-clicking an image tile.
 */
export function FullScreenView({
  visible,
  imageSrc,
  onClose,
  onRotate,
}: FullScreenViewProps) {
  const handleDoubleClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onRotate();
    },
    [onRotate]
  );

  if (!visible || !imageSrc) return null;

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden z-[3]"
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      <ImageModule
        src={imageSrc}
        invert={false}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
}

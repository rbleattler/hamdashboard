import { Tile } from '../Tile/Tile';
import type { TileConfig } from '../../config/configTypes';

interface DashboardGridProps {
  tiles: TileConfig[];
  layoutCols: number;
  layoutRows: number;
  paused: boolean;
  onFullScreen: (index: number) => void;
}

export function DashboardGrid({
  tiles,
  layoutCols,
  layoutRows,
  paused,
  onFullScreen,
}: DashboardGridProps) {
  const tileWidth = `${99.6 / layoutCols}vw`;
  const tileHeight = `${93 / layoutRows}vh`;

  return (
    <div
      className="grid gap-0 border-0 mb-0 overflow-hidden relative w-full"
      style={{
        gridTemplateColumns: `repeat(${layoutCols}, auto)`,
      }}
    >
      {tiles.map((tile, index) => (
        <div
          key={index}
          style={{ width: tileWidth, height: tileHeight }}
        >
          <Tile
            config={tile}
            index={index}
            paused={paused}
            onFullScreen={onFullScreen}
          />
        </div>
      ))}
    </div>
  );
}

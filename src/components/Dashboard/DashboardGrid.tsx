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
  return (
    <div
      className="grid gap-0 border-0 mb-0 overflow-hidden relative w-full flex-1"
      style={{
        gridTemplateColumns: `repeat(${layoutCols}, 1fr)`,
        gridTemplateRows: `repeat(${layoutRows}, 1fr)`,
        minHeight: 0,
      }}
    >
      {tiles.map((tile, index) => (
        <div
          key={index}
          className="w-full h-full overflow-hidden"
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

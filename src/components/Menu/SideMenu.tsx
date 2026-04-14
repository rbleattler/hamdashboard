import type { MenuItem } from '../../config/configTypes';
import { MENU_WIDTH } from '../../utils/layoutConstants';

/** Fixed-pixel width of the visible tab when the menu is collapsed. */
const TAB_WIDTH = 25;

interface SideMenuProps {
  items: MenuItem[];
  side: 'L' | 'R';
  onMenuAction: (item: MenuItem, index: number) => void;
}

export function SideMenu({ items, side, onMenuAction }: SideMenuProps) {
  const filteredItems = items.filter((item) => item.side === side);

  if (filteredItems.length === 0) return null;

  const isLeft = side === 'L';
  const menuId = isLeft ? 'myMenuL' : 'myMenuR';

  return (
    <div
      id={menuId}
      className="grid gap-[3px] fixed h-auto z-[5]"
      style={{
        top: '10vh',
        transition: 'transform 0.3s',
        width: 'fit-content',
        ...(isLeft
          ? { left: 0, transform: `translateX(calc(-100% + ${TAB_WIDTH}px))` }
          : { right: 0, transform: `translateX(calc(100% - ${TAB_WIDTH}px))` }),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateX(0)';
      }}
      onMouseLeave={(e) => {
        if (isLeft) {
          e.currentTarget.style.transform = `translateX(calc(-100% + ${TAB_WIDTH}px))`;
        } else {
          e.currentTarget.style.transform = `translateX(calc(100% - ${TAB_WIDTH}px))`;
        }
      }}
    >
      {filteredItems.map((item, i) => {
        const globalIndex = items.indexOf(item);
        const iconClass =
          item.type === 'core'
            ? 'menu-core'
            : item.type === 'config'
              ? 'menu-config'
              : 'menu-user';

        return (
          <div key={`${side}-${i}`} className={isLeft ? 'sidenav' : 'sidenavR'}>
            <a
              href="#"
              className={`menu-link ${iconClass}`}
              style={{
                display: 'block',
                backgroundColor: `#${item.color}`,
                boxSizing: 'content-box',
                transition: '0.3s',
                paddingLeft: '15px',
                paddingRight: '15px',
                paddingTop: '12px',
                paddingBottom: '8px',
                width: MENU_WIDTH,
                textDecoration: 'none',
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 'clamp(12px, 1.2vw, 20px)',
                fontWeight: 300,
                textAlign: isLeft ? 'right' : 'left',
                color: 'white',
                borderRadius: isLeft ? '0 5px 5px 0' : '5px 0 0 5px',
                boxShadow: '4px 4px 12px rgba(0, 0, 0, 0.5)',
              }}
              onClick={(e) => {
                e.preventDefault();
                onMenuAction(item, globalIndex);
              }}
            >
              {item.text}
            </a>
          </div>
        );
      })}
    </div>
  );
}

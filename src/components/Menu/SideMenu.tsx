import type { MenuItem } from '../../config/configTypes';

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
      className="grid gap-[3px] absolute h-auto z-[5]"
      style={{
        marginTop: '10vh',
        transition: '0.3s',
        ...(isLeft
          ? { left: 'calc(-5.2vw - 0px)', width: 'auto' }
          : { right: '-5px', width: '30px' }),
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        if (isLeft) {
          el.style.width = '7vw';
          el.style.left = '0px';
        } else {
          el.style.width = '7vw';
          el.style.right = '0px';
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        if (isLeft) {
          el.style.width = 'auto';
          el.style.left = 'calc(-5.2vw - 0px)';
        } else {
          el.style.width = '30px';
          el.style.right = '-5px';
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
                backgroundColor: `#${item.color}`,
                position: 'relative',
                float: 'inline-start',
                transition: '0.3s',
                paddingLeft: '15px',
                paddingRight: '15px',
                paddingTop: '12px',
                paddingBottom: '8px',
                width: isLeft ? '5vw' : '7vw',
                textDecoration: 'none',
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: '1.2vw',
                fontWeight: 300,
                textAlign: isLeft ? 'right' : 'left',
                color: 'white',
                borderRadius: isLeft ? '0 5px 5px 0' : '5px 0 0 5px',
                boxShadow: '4px 4px 12px rgba(0, 0, 0, 0.5)',
                ...(isLeft
                  ? { left: 'calc(-0.2vw - 10px)' }
                  : { right: 'calc(-0.2vw - 10px)' }),
              }}
              onMouseEnter={(e) => {
                if (isLeft) {
                  e.currentTarget.style.left = '0';
                } else {
                  e.currentTarget.style.right = '0';
                  e.currentTarget.style.width = '7vw';
                }
              }}
              onMouseLeave={(e) => {
                if (isLeft) {
                  e.currentTarget.style.left = 'calc(-0.2vw - 10px)';
                } else {
                  e.currentTarget.style.right = 'calc(-0.2vw - 10px)';
                }
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

import { useEffect, useRef } from 'react';
import { useRssFeed } from '../../hooks/useRssFeed';
import type { RssFeedItem } from '../../config/configTypes';

interface RssTickerProps {
  feeds: RssFeedItem[];
}

export function RssTicker({ feeds }: RssTickerProps) {
  const { feedResults } = useRssFeed(feeds);
  const contentRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Update ticker speed based on content width
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const contentWidth = content.scrollWidth;
    const containerWidth = content.parentElement?.offsetWidth || 0;
    const baseSpeed = 180; // px/s
    const duration = (contentWidth + containerWidth) / baseSpeed;
    content.style.setProperty('--ticker-duration', `${duration}s`);
  }, [feedResults]);

  if (!feeds || feeds.length === 0) return null;

  return (
    <div
      ref={tickerRef}
      className="w-full overflow-hidden whitespace-nowrap box-border shrink-0"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '4.5px 0',
        fontFamily: '"Victor Mono", sans-serif',
        fontSize: '2.1vh',
        fontWeight: 'bold',
      }}
    >
      <div
        ref={contentRef}
        className="inline-block"
        style={{
          paddingLeft: '100%',
          animation: 'ticker var(--ticker-duration, 90s) linear infinite',
          animationPlayState: 'running',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.animationPlayState = 'paused';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.animationPlayState = 'running';
        }}
      >
        {feedResults.map((result, i) => {
          if (!result) {
            return (
              <span key={i} style={{ color: '#aaa', marginRight: '50px' }}>
                Loading feed...
              </span>
            );
          }
          if (result.error) {
            return (
              <span key={i} style={{ color: '#f88', marginRight: '50px' }}>
                ⚠️ {result.error}
              </span>
            );
          }
          return (
            <span key={i}>
              <span style={{ fontSize: '0.9em', color: '#aaa' }}>
                {' '}
                {result.feedTitle} - Last Updated: {result.lastUpdated}{' '}
              </span>
              {' - '}
              {result.items.map((item, j) => (
                <a
                  key={j}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: 'none',
                    color: '#e77600',
                    marginRight: '50px',
                  }}
                >
                  {item.title}
                </a>
              ))}
            </span>
          );
        })}
      </div>
    </div>
  );
}

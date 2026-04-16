/**
 * Type definitions for HAM Dashboard configuration.
 * Supports both legacy config.js/config.json formats and the new structured format.
 */

/** A single menu item: [color, text, url, scale, side] */
export type LegacyMenuItem = [string, string, string, string?, string?];

/**
 * A single dashboard tile in legacy format:
 * [title, url1, url2, ...] where title can be string or string[]
 */
export type LegacyTileItem = [string | string[], ...string[]];

/**
 * A single dashboard tile in JSON format:
 * [title, urls | url, delay?, titleStyle?] where urls can be string[] or string
 */
export type JsonTileItem = [string | string[], string[] | string, number?, TitleStyle?];

/** A single RSS feed: [url, refreshIntervalMinutes] */
export type RssFeedItem = [string, number];

/** Parsed menu item for use in components */
export interface MenuItem {
  color: string;
  text: string;
  url: string;
  scale: number;
  side: 'L' | 'R';
  type: 'core' | 'config' | 'user';
}

/** Valid positions for the title overlay on a tile */
export type TitlePosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'none';

/** Styling options for the title overlay on a tile */
export interface TitleStyle {
  /** Where to display the title; 'none' hides it entirely (default: 'bottom-center') */
  position?: TitlePosition;
  /** Background opacity from 0 (transparent) to 1 (opaque) (default: 1) */
  opacity?: number;
  /** CSS color for the title text (default: '#ffffff') */
  fontColor?: string;
  /** CSS color for the title background (default: '#000000') */
  bgColor?: string;
}

/** Parsed tile for use in components */
export interface TileConfig {
  titles: string[];
  sources: string[];
  rotationInterval: number;
  titleStyle?: TitleStyle;
}

/** The full dashboard configuration */
export interface DashboardConfig {
  disableSetup: boolean;
  disableLdCfg: boolean;
  topBarCenterText: string;
  layoutCols: number;
  layoutRows: number;
  menuItems: MenuItem[];
  tiles: TileConfig[];
  rssFeeds: RssFeedItem[];
  settingsSource: 'localStorage' | 'file';
}

/** Raw legacy JS config (as set by config.js on window) */
export interface LegacyJsConfig {
  disableSetup?: boolean;
  disableLdCfg?: boolean;
  topBarCenterText?: string;
  layout_cols?: number;
  layout_rows?: number;
  aURL?: LegacyMenuItem[];
  aIMG?: LegacyTileItem[];
  tileDelay?: number[];
  tileStyles?: TitleStyle[];
  aRSS?: RssFeedItem[];
}

/** Raw JSON config format */
export interface JsonConfig {
  disableSetup?: boolean;
  disableLdCfg?: boolean;
  topBarCenterText?: string;
  layout_cols?: number;
  layout_rows?: number;
  aURL?: LegacyMenuItem[];
  aIMG?: JsonTileItem[];
  aImages?: JsonTileItem[];
  aRSS?: RssFeedItem[];
  settingsSource?: string;
}

/** Settings format stored in localStorage */
export interface StoredSettings extends JsonConfig {
  settingsSource?: string;
}

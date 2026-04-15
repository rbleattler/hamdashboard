import { useState, useEffect, useCallback } from 'react';

interface WeatherModuleProps {
  stationId: string;
  apiKey: string;
  units?: string;
  /** When true, renders a compact tile-sized view with only key readings */
  compact?: boolean;
}

interface WeatherData {
  stationID: string;
  obsTimeLocal: string;
  neighborhood: string;
  temp: number | null;
  heatIndex: number | null;
  dewpt: number | null;
  windChill: number | null;
  windSpeed: number;
  windGust: number;
  pressure: number | null;
  precipRate: number;
  precipTotal: number;
  humidity: number | null;
  winddir: number;
  uv: number;
  solarRadiation: number | null;
}

const UNIT_LABELS: Record<string, { temp: string; speed: string; pressure: string; precip: string }> = {
  e: { temp: '°F', speed: 'mph', pressure: 'inHg', precip: 'in' },
  m: { temp: '°C', speed: 'km/h', pressure: 'mb', precip: 'mm' },
  h: { temp: '°C', speed: 'mph', pressure: 'mb', precip: 'mm' },
};

const REFRESH_MS = 5 * 60 * 1000; // 5 minutes
const MAX_PRECIP_DISPLAY = 2; // Maximum precipitation (inches/mm) for full gauge

function windDirection(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

/**
 * Compute a point on a circle given center, radius, and angle in degrees.
 * Angle 0 = 3-o'clock, positive = clockwise (SVG convention).
 */
function polarToCart(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Build an SVG arc path descriptor */
function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polarToCart(cx, cy, r, startDeg);
  const end = polarToCart(cx, cy, r, endDeg);
  let sweep = endDeg - startDeg;
  if (sweep < 0) sweep += 360;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

// --- SVG Gauge Components ---

/**
 * Temperature arc gauge: 180° sweep from left (cold) to right (hot).
 * Uses standard screen coordinates (angle 180° = left, 0° = right).
 */
function TemperatureGauge({ temp, units, mini = false }: { temp: number | null; units: string; mini?: boolean }) {
  const isMetric = units === 'm' || units === 'h';
  const min = isMetric ? -30 : -20;
  const max = isMetric ? 50 : 120;
  const t = temp ?? 0;
  const fraction = Math.max(0, Math.min(1, (t - min) / (max - min)));

  const cx = 100, cy = 95, r = mini ? 55 : 70;
  // Arc from 180° (left) clockwise through 270° (top) to 360°/0° (right) — top half of circle
  const arcStartDeg = 180;
  const arcEndDeg = 360;
  // Position along arc: 180° → fraction → 360° (clockwise through top)
  const currentDeg = 180 + fraction * 180;
  const dot = polarToCart(cx, cy, r, currentDeg);
  const sw = mini ? 6 : 10;

  const uid = mini ? 'tgMini' : 'tgFull';

  return (
    <svg viewBox={mini ? '10 15 180 90' : '0 0 200 115'} style={{ width: '100%', height: 'auto', maxHeight: mini ? 55 : 100 }}>
      <defs>
        <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="25%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="75%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      {/* Background arc */}
      <path d={describeArc(cx, cy, r, arcStartDeg, arcEndDeg)}
        fill="none" stroke="#334155" strokeWidth={sw} strokeLinecap="round" />
      {/* Color arc up to current temp */}
      {fraction > 0.01 && (
        <path d={describeArc(cx, cy, r, arcStartDeg, currentDeg)}
          fill="none" stroke={`url(#${uid})`} strokeWidth={sw} strokeLinecap="round" />
      )}
      {/* Indicator dot */}
      <circle cx={dot.x} cy={dot.y} r={mini ? 4 : 6} fill="white" stroke="#1e293b" strokeWidth="2" />
    </svg>
  );
}

/** Wind compass rose with direction arrow. */
function WindCompass({ deg, mini = false }: { deg: number; mini?: boolean }) {
  const cx = 100, cy = 100, r = mini ? 40 : 70;
  const cardinals = [
    { label: 'N', angle: 270 },
    { label: 'E', angle: 0 },
    { label: 'S', angle: 90 },
    { label: 'W', angle: 180 },
  ];

  // Arrow: deg is the direction wind blows FROM. Arrow shows "from".
  // In compass terms: 0=N (top), 90=E (right). Convert to SVG angles.
  const svgAngle = deg - 90; // compass-to-svg
  const arrowRad = (svgAngle * Math.PI) / 180;
  const arrowLen = mini ? 24 : 40;
  // From end (where wind comes from)
  const fromX = cx + arrowLen * Math.cos(arrowRad);
  const fromY = cy + arrowLen * Math.sin(arrowRad);
  // To end (where wind blows toward)
  const toX = cx - arrowLen * Math.cos(arrowRad);
  const toY = cy - arrowLen * Math.sin(arrowRad);

  const tickCount = mini ? 16 : 72;
  const tickStep = 360 / tickCount;
  const ticks = [];
  for (let i = 0; i < tickCount; i++) {
    const a = i * tickStep;
    const isMajor = !mini && (i % 9 === 0);
    const tickInnerR = isMajor ? r - 10 : r - (mini ? 3 : 5);
    const s = polarToCart(cx, cy, tickInnerR, a);
    const e = polarToCart(cx, cy, r, a);
    ticks.push(
      <line key={i} x1={s.x} y1={s.y} x2={e.x} y2={e.y}
        stroke={isMajor ? '#94a3b8' : '#475569'}
        strokeWidth={isMajor ? 1.5 : 0.5} />
    );
  }

  const labelR = r + (mini ? 10 : 14);
  const fontSize = mini ? 9 : 12;

  return (
    <svg viewBox={mini ? '40 40 120 120' : '0 0 200 200'} style={{ width: '100%', height: 'auto', maxHeight: mini ? 70 : 130 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#475569" strokeWidth="1" />
      {ticks}
      {cardinals.map(({ label, angle }) => {
        const p = polarToCart(cx, cy, labelR, angle);
        return (
          <text key={label} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
            fill="#94a3b8" fontSize={fontSize} fontWeight="bold">{label}</text>
        );
      })}
      {/* Wind arrow */}
      <line x1={fromX} y1={fromY} x2={toX} y2={toY} stroke="#e2e8f0" strokeWidth={mini ? 1.5 : 2.5} />
      {/* Arrowhead */}
      {(() => {
        const headSize = mini ? 5 : 8;
        const p1 = `${toX + headSize * Math.cos(arrowRad - 0.4)},${toY + headSize * Math.sin(arrowRad - 0.4)}`;
        const p2 = `${toX + headSize * Math.cos(arrowRad + 0.4)},${toY + headSize * Math.sin(arrowRad + 0.4)}`;
        return <polygon points={`${toX},${toY} ${p1} ${p2}`} fill="#e2e8f0" />;
      })()}
      <circle cx={cx} cy={cy} r={mini ? 2 : 4} fill="#475569" />
    </svg>
  );
}

/** Precipitation tube gauge */
function PrecipitationGauge({ total }: { total: number }) {
  const fillFraction = MAX_PRECIP_DISPLAY > 0 ? Math.min(1, total / MAX_PRECIP_DISPLAY) : 0;
  const tubeH = 80, tubeW = 30, tubeX = 85, tubeY = 20;
  const fillH = tubeH * fillFraction;

  return (
    <svg viewBox="0 0 200 120" style={{ width: '100%', height: 'auto', maxHeight: 100 }}>
      <rect x={tubeX} y={tubeY} width={tubeW} height={tubeH} rx="4" ry="4"
        fill="none" stroke="#64748b" strokeWidth="1.5" />
      {fillH > 0 && (
        <rect x={tubeX + 2} y={tubeY + tubeH - fillH} width={tubeW - 4} height={fillH}
          rx="2" ry="2" fill="#3b82f6" opacity="0.7" />
      )}
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f}
          x1={tubeX} y1={tubeY + tubeH * (1 - f)}
          x2={tubeX + 6} y2={tubeY + tubeH * (1 - f)}
          stroke="#64748b" strokeWidth="1" />
      ))}
      <ellipse cx={tubeX + tubeW / 2} cy={tubeY} rx={tubeW / 2 + 4} ry="4"
        fill="none" stroke="#64748b" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Pressure dial gauge: 270° sweep.
 * Arc goes clockwise from 135° (bottom-left) to 45° (bottom-right) passing through top.
 */
function PressureGauge({ pressure, units }: { pressure: number | null; units: string }) {
  const isMetric = units === 'm' || units === 'h';
  const min = isMetric ? 960 : 28;
  const max = isMetric ? 1060 : 31;
  const p = pressure ?? (isMetric ? 1013 : 29.92);
  const fraction = Math.max(0, Math.min(1, (p - min) / (max - min)));
  const cx = 100, cy = 100, r = 70;

  // Arc: clockwise from 135° (bottom-left) to 45° (bottom-right) — 270° sweep
  const arcStartDeg = 135;
  const arcEndDeg = 45;
  // Needle position along the arc
  const needleDeg = arcStartDeg + fraction * 270;
  const needlePt = polarToCart(cx, cy, r - 15, needleDeg);

  // Tick marks
  const ticks = [];
  const numTicks = isMetric ? 10 : 12;
  for (let i = 0; i <= numTicks; i++) {
    const f = i / numTicks;
    const tickDeg = arcStartDeg + f * 270;
    const isMajor = i % (isMetric ? 2 : 3) === 0;
    const innerR = isMajor ? r - 12 : r - 6;
    const inner = polarToCart(cx, cy, innerR, tickDeg);
    const outer = polarToCart(cx, cy, r, tickDeg);
    ticks.push(
      <line key={i}
        x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
        stroke={isMajor ? '#94a3b8' : '#475569'}
        strokeWidth={isMajor ? 1.5 : 0.5} />
    );
    if (isMajor) {
      const tickVal = min + f * (max - min);
      const lp = polarToCart(cx, cy, r + 12, tickDeg);
      ticks.push(
        <text key={`l${i}`} x={lp.x} y={lp.y}
          textAnchor="middle" dominantBaseline="central"
          fill="#64748b" fontSize="8">
          {isMetric ? tickVal.toFixed(0) : tickVal.toFixed(1)}
        </text>
      );
    }
  }

  return (
    <svg viewBox="0 0 200 140" style={{ width: '100%', height: 'auto', maxHeight: 120 }}>
      {/* Background arc */}
      <path d={describeArc(cx, cy, r, arcStartDeg, arcEndDeg)} fill="none" stroke="#475569" strokeWidth="2" />
      {ticks}
      {/* Needle */}
      <line x1={cx} y1={cy} x2={needlePt.x} y2={needlePt.y}
        stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="#ef4444" />
    </svg>
  );
}

// --- Main Component ---

export function WeatherModule({ stationId, apiKey, units = 'e', compact = false }: WeatherModuleProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const unitKey = units === 'm' ? 'metric' : units === 'h' ? 'metric' : 'imperial';
  const labels = UNIT_LABELS[units] || UNIT_LABELS['e'];

  const fetchWeather = useCallback(async () => {
    if (!stationId || !apiKey) {
      setError('Missing station ID or API key');
      setLoading(false);
      return;
    }

    try {
      const url = `https://api.weather.com/v2/pws/observations/current?stationId=${encodeURIComponent(stationId)}&format=json&units=${encodeURIComponent(units)}&apiKey=${encodeURIComponent(apiKey)}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`API error: ${resp.status}`);
      }
      const data = await resp.json();
      const obs = data?.observations?.[0];
      if (!obs) {
        throw new Error('No observation data');
      }

      const measurements = obs[unitKey] || obs['imperial'] || {};
      setWeather({
        stationID: obs.stationID || stationId,
        obsTimeLocal: obs.obsTimeLocal || '',
        neighborhood: obs.neighborhood || '',
        temp: measurements.temp ?? null,
        heatIndex: measurements.heatIndex ?? null,
        dewpt: measurements.dewpt ?? null,
        windChill: measurements.windChill ?? null,
        windSpeed: measurements.windSpeed ?? 0,
        windGust: measurements.windGust ?? 0,
        pressure: measurements.pressure ?? null,
        precipRate: measurements.precipRate ?? 0,
        precipTotal: measurements.precipTotal ?? 0,
        humidity: obs.humidity ?? null,
        winddir: obs.winddir ?? 0,
        uv: obs.uv ?? 0,
        solarRadiation: obs.solarRadiation ?? null,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  }, [stationId, apiKey, units, unitKey]);

  useEffect(() => {
    fetchWeather();
    const id = setInterval(fetchWeather, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchWeather]);

  if (loading) {
    return (
      <div style={compact ? compactContainerStyle : fullContainerStyle}>
        <span style={loadingStyle}>Loading weather…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={compact ? compactContainerStyle : fullContainerStyle}>
        <span style={errorStyle}>⚠ {error}</span>
        <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
          Station: {stationId}
        </span>
      </div>
    );
  }

  if (!weather) return null;

  // --- COMPACT TILE VIEW ---
  if (compact) {
    return (
      <div style={compactContainerStyle}>
        {/* Station name */}
        <div style={compactStationRow}>
          <span style={compactStationText}>{weather.neighborhood || weather.stationID}</span>
        </div>

        {/* Main row: temp gauge + wind compass side by side */}
        <div style={compactMainRow}>
          {/* Left: temperature arc + value */}
          <div style={compactGaugeCol}>
            <TemperatureGauge temp={weather.temp} units={units} mini />
            <span style={compactTempText}>{weather.temp ?? '--'}{labels.temp}</span>
          </div>
          {/* Right: mini wind compass + value */}
          <div style={compactGaugeCol}>
            <WindCompass deg={weather.winddir} mini />
            <span style={compactWindText}>{weather.windSpeed}{labels.speed} {windDirection(weather.winddir)}</span>
          </div>
        </div>

        {/* Bottom readings strip */}
        <div style={compactReadingsRow}>
          <span style={compactReading}>💧 {weather.humidity ?? '--'}%</span>
          <span style={compactReading}>📊 {weather.pressure ?? '--'}{labels.pressure}</span>
          <span style={compactReading}>🌧️ {weather.precipTotal}{labels.precip}</span>
        </div>
      </div>
    );
  }

  // --- FULL DETAIL VIEW (WU-style gauges + summary table) ---
  const summaryRows = [
    { label: 'Temperature', value: weather.temp != null ? `${weather.temp}${labels.temp}` : '--' },
    { label: 'Dew Point', value: weather.dewpt != null ? `${weather.dewpt}${labels.temp}` : '--' },
    { label: 'Humidity', value: weather.humidity != null ? `${weather.humidity}%` : '--' },
    { label: 'Precipitation', value: `${weather.precipTotal}${labels.precip}` },
    { label: 'Wind Speed', value: `${weather.windSpeed}${labels.speed}` },
    { label: 'Wind Gust', value: `${weather.windGust}${labels.speed}` },
    { label: 'Wind Direction', value: `${windDirection(weather.winddir)}` },
    { label: 'Pressure', value: weather.pressure != null ? `${weather.pressure}${labels.pressure}` : '--' },
    { label: 'UV Index', value: `${weather.uv}` },
  ];

  if (weather.solarRadiation !== null) {
    summaryRows.push({ label: 'Solar Radiation', value: `${weather.solarRadiation} W/m²` });
  }

  return (
    <div style={fullContainerStyle}>
      {/* Station header */}
      <div style={fullHeaderStyle}>
        <span style={fullStationName}>{weather.neighborhood || weather.stationID}</span>
        <span style={fullTimeText}>{weather.obsTimeLocal}</span>
      </div>

      {/* Gauge cards row */}
      <div style={gaugeRow}>
        {/* TEMPERATURE */}
        <div style={gaugeCard}>
          <span style={gaugeTitle}>TEMPERATURE</span>
          <TemperatureGauge temp={weather.temp} units={units} />
          <div style={gaugeValueRow}>
            <span style={gaugeValueLarge}>{weather.temp ?? '--'}</span>
            <span style={gaugeValueUnit}>{labels.temp}</span>
          </div>
          <span style={gaugeSubText}>
            {weather.dewpt ?? '--'}° DP · {weather.humidity ?? '--'}% RH
          </span>
        </div>

        {/* WIND */}
        <div style={gaugeCard}>
          <span style={gaugeTitle}>WIND</span>
          <WindCompass deg={weather.winddir} />
          <div style={gaugeValueRow}>
            <span style={gaugeValueLarge}>{weather.windSpeed}</span>
            <span style={gaugeValueUnit}>{labels.speed}</span>
          </div>
          {weather.windGust > 0 && (
            <span style={gaugeSubText}>GUSTS {weather.windGust} {labels.speed.toUpperCase()}</span>
          )}
          <span style={gaugeSubText}>{weather.winddir}° {windDirection(weather.winddir)}</span>
        </div>

        {/* PRECIPITATION */}
        <div style={gaugeCard}>
          <span style={gaugeTitle}>PRECIPITATION</span>
          <PrecipitationGauge total={weather.precipTotal} />
          <div style={gaugeValueRow}>
            <span style={gaugeValueLarge}>{weather.precipTotal}</span>
            <span style={gaugeValueUnit}>{labels.precip}</span>
          </div>
          <span style={gaugeSubText}>{weather.precipRate} {labels.precip.toUpperCase()}/HR</span>
        </div>

        {/* PRESSURE */}
        <div style={gaugeCard}>
          <span style={gaugeTitle}>PRESSURE</span>
          <PressureGauge pressure={weather.pressure} units={units} />
          <div style={gaugeValueRow}>
            <span style={gaugeValueLarge}>{weather.pressure ?? '--'}</span>
            <span style={gaugeValueUnit}>{labels.pressure}</span>
          </div>
        </div>
      </div>

      {/* Summary table */}
      <div style={summarySection}>
        <table style={summaryTable}>
          <thead>
            <tr>
              <th style={{ ...summaryTh, textAlign: 'left' }}>SUMMARY</th>
              <th style={summaryTh}>CURRENT</th>
            </tr>
          </thead>
          <tbody>
            {summaryRows.map((row, i) => (
              <tr key={row.label} style={{
                background: i % 2 === 0 ? 'hsla(210, 15%, 20%, 0.5)' : 'transparent',
              }}>
                <td style={summaryTdLabel}>{row.label}</td>
                <td style={summaryTdValue}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ======== STYLES ========

// --- Full detail view ---

const fullContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  padding: '24px 32px',
  boxSizing: 'border-box',
  background: '#1a1f2e',
  color: '#e2e8f0',
  fontFamily: '"Roboto Condensed", "Segoe UI", sans-serif',
  overflow: 'auto',
};

const fullHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 24,
  flexShrink: 0,
};

const fullStationName: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

const fullTimeText: React.CSSProperties = {
  fontSize: 13,
  color: '#64748b',
};

const gaugeRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 16,
  marginBottom: 32,
  flexShrink: 0,
};

const gaugeCard: React.CSSProperties = {
  background: '#232a3b',
  border: '1px solid #334155',
  borderRadius: 12,
  padding: '16px 12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
};

const gaugeTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#64b5f6',
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  marginBottom: 4,
};

const gaugeValueRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 4,
  marginTop: 2,
};

const gaugeValueLarge: React.CSSProperties = {
  fontSize: 36,
  fontWeight: 300,
  color: '#f1f5f9',
  lineHeight: 1,
};

const gaugeValueUnit: React.CSSProperties = {
  fontSize: 16,
  color: '#94a3b8',
  fontWeight: 400,
};

const gaugeSubText: React.CSSProperties = {
  fontSize: 11,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const summarySection: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
};

const summaryTable: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
};

const summaryTh: React.CSSProperties = {
  padding: '10px 16px',
  color: '#94a3b8',
  fontWeight: 700,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  borderBottom: '2px solid #334155',
  textAlign: 'center',
};

const summaryTdLabel: React.CSSProperties = {
  padding: '8px 16px',
  color: '#cbd5e1',
  fontWeight: 500,
};

const summaryTdValue: React.CSSProperties = {
  padding: '8px 16px',
  color: '#e2e8f0',
  textAlign: 'center',
};

// --- Loading / error ---

const loadingStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#94a3b8',
  margin: 'auto',
};

const errorStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#f59e0b',
  margin: 'auto',
  textAlign: 'center',
};

// --- Compact tile styles ---

const compactContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  padding: '6px 8px',
  boxSizing: 'border-box',
  background: 'linear-gradient(135deg, hsl(210 20% 12%), hsl(210 15% 8%))',
  color: '#e2e8f0',
  fontFamily: '"Roboto Condensed", "Segoe UI", sans-serif',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '2px',
};

const compactStationRow: React.CSSProperties = {
  textAlign: 'center',
  flexShrink: 0,
};

const compactStationText: React.CSSProperties = {
  fontSize: 'clamp(8px, 0.9vw, 12px)',
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const compactMainRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 'clamp(4px, 1vw, 16px)',
  width: '100%',
  flex: 1,
  minHeight: 0,
};

const compactGaugeCol: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 0,
  flex: '0 1 auto',
  maxWidth: '48%',
};

const compactTempText: React.CSSProperties = {
  fontSize: 'clamp(18px, 3vw, 40px)',
  fontWeight: 300,
  lineHeight: 1,
  color: '#f1f5f9',
};

const compactWindText: React.CSSProperties = {
  fontSize: 'clamp(10px, 1vw, 14px)',
  fontWeight: 400,
  lineHeight: 1.2,
  color: '#cbd5e1',
  textAlign: 'center',
};

const compactReadingsRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 'clamp(6px, 1vw, 16px)',
  flexWrap: 'wrap',
  flexShrink: 0,
};

const compactReading: React.CSSProperties = {
  fontSize: 'clamp(9px, 0.85vw, 13px)',
  color: '#94a3b8',
  whiteSpace: 'nowrap',
};

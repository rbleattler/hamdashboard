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

function windDirection(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

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
      <div style={compact ? compactContainerStyle : containerStyle}>
        <span style={loadingStyle}>Loading weather…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={compact ? compactContainerStyle : containerStyle}>
        <span style={errorStyle}>⚠ {error}</span>
        <span style={{ ...smallText, marginTop: 8 }}>
          Station: {stationId}
        </span>
      </div>
    );
  }

  if (!weather) return null;

  if (compact) {
    return (
      <div style={compactContainerStyle}>
        {/* Compact: large temp centered with key readings below */}
        <div style={compactStationRow}>
          <span style={compactStationText}>{weather.neighborhood || weather.stationID}</span>
        </div>
        <div style={compactTempRow}>
          <span style={compactTempText}>{weather.temp ?? '--'}{labels.temp}</span>
        </div>
        <div style={compactReadingsRow}>
          <span style={compactReading}>💧 {weather.humidity ?? '--'}%</span>
          <span style={compactReading}>🌬️ {windDirection(weather.winddir)} {weather.windSpeed}{labels.speed}</span>
          <span style={compactReading}>📊 {weather.pressure ?? '--'}{labels.pressure}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={stationStyle}>{weather.neighborhood || weather.stationID}</span>
        <span style={timeStyle}>{weather.obsTimeLocal}</span>
      </div>

      {/* Temperature section */}
      <div style={tempSection}>
        <span style={tempStyle}>{weather.temp ?? '--'}{labels.temp}</span>
        <div style={tempDetails}>
          <span style={smallText}>Feels like {weather.heatIndex ?? '--'}{labels.temp}</span>
          <span style={smallText}>Dew point {weather.dewpt ?? '--'}{labels.temp}</span>
        </div>
      </div>

      {/* Grid of readings */}
      <div style={gridStyle}>
        <ReadingCard
          icon="💧"
          label="Humidity"
          value={weather.humidity != null ? `${weather.humidity}%` : '--'}
        />
        <ReadingCard
          icon="🌬️"
          label="Wind"
          value={`${windDirection(weather.winddir)} ${weather.windSpeed} ${labels.speed}`}
          sub={weather.windGust > 0 ? `Gust ${weather.windGust} ${labels.speed}` : undefined}
        />
        <ReadingCard
          icon="📊"
          label="Pressure"
          value={weather.pressure != null ? `${weather.pressure} ${labels.pressure}` : '--'}
        />
        <ReadingCard
          icon="🌧️"
          label="Precip"
          value={`${weather.precipRate} ${labels.precip}/hr`}
          sub={`Total: ${weather.precipTotal} ${labels.precip}`}
        />
        <ReadingCard
          icon="☀️"
          label="UV Index"
          value={`${weather.uv}`}
        />
        {weather.solarRadiation !== null && (
          <ReadingCard
            icon="🔆"
            label="Solar"
            value={`${weather.solarRadiation} W/m²`}
          />
        )}
      </div>
    </div>
  );
}

function ReadingCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div style={cardStyle}>
      <div style={cardHeader}>
        <span>{icon}</span>
        <span style={cardLabel}>{label}</span>
      </div>
      <span style={cardValue}>{value}</span>
      {sub && <span style={cardSub}>{sub}</span>}
    </div>
  );
}

// --- Styles ---

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  padding: '12px',
  boxSizing: 'border-box',
  background: 'linear-gradient(135deg, hsl(210 20% 12%), hsl(210 15% 8%))',
  color: '#e2e8f0',
  fontFamily: '"Roboto Condensed", "Segoe UI", sans-serif',
  overflow: 'auto',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
  flexShrink: 0,
};

const stationStyle: React.CSSProperties = {
  fontSize: 'clamp(11px, 1.2vw, 16px)',
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

const timeStyle: React.CSSProperties = {
  fontSize: 'clamp(9px, 0.9vw, 12px)',
  color: '#64748b',
};

const tempSection: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  marginBottom: 10,
  flexShrink: 0,
};

const tempStyle: React.CSSProperties = {
  fontSize: 'clamp(28px, 4vw, 56px)',
  fontWeight: 300,
  lineHeight: 1,
  color: '#f1f5f9',
};

const tempDetails: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const smallText: React.CSSProperties = {
  fontSize: 'clamp(9px, 0.85vw, 12px)',
  color: '#94a3b8',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
  gap: 6,
  flex: 1,
  minHeight: 0,
  alignContent: 'start',
};

const cardStyle: React.CSSProperties = {
  background: 'hsla(210 15% 18% / 0.7)',
  borderRadius: 8,
  padding: '8px 10px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const cardHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 'clamp(9px, 0.8vw, 11px)',
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const cardLabel: React.CSSProperties = {
  fontSize: 'inherit',
};

const cardValue: React.CSSProperties = {
  fontSize: 'clamp(13px, 1.3vw, 20px)',
  fontWeight: 500,
  color: '#e2e8f0',
};

const cardSub: React.CSSProperties = {
  fontSize: 'clamp(8px, 0.7vw, 10px)',
  color: '#64748b',
};

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
  padding: '8px',
  boxSizing: 'border-box',
  background: 'linear-gradient(135deg, hsl(210 20% 12%), hsl(210 15% 8%))',
  color: '#e2e8f0',
  fontFamily: '"Roboto Condensed", "Segoe UI", sans-serif',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 4,
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

const compactTempRow: React.CSSProperties = {
  textAlign: 'center',
  flexShrink: 0,
};

const compactTempText: React.CSSProperties = {
  fontSize: 'clamp(32px, 5vw, 64px)',
  fontWeight: 300,
  lineHeight: 1.1,
  color: '#f1f5f9',
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

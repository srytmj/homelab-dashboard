import React, { useEffect, useState } from 'react';
import { CloudSun, MapPin } from 'lucide-react';

type WeatherState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'denied' }
  | { status: 'error' }
  | { status: 'ready'; tempC: number; label: string };

const WEATHER_REFRESH_MS = 15 * 60 * 1000;

// A small subset of WMO weather codes (Open-Meteo's convention), grouped into
// the labels this widget actually shows — not a full lookup table.
function describeWeatherCode(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 67) return 'Rainy';
  if (code <= 77) return 'Snowy';
  if (code <= 82) return 'Showers';
  if (code <= 99) return 'Storming';
  return 'Unknown';
}

export const ClockWeatherWidget: React.FC = () => {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<WeatherState>({ status: 'idle' });

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadWeather = () => {
    if (!navigator.geolocation) {
      setWeather({ status: 'error' });
      return;
    }
    setWeather({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
        )
          .then((res) => res.json())
          .then((data) => {
            setWeather({
              status: 'ready',
              tempC: Math.round(data.current.temperature_2m),
              label: describeWeatherCode(data.current.weather_code),
            });
          })
          .catch(() => setWeather({ status: 'error' }));
      },
      () => setWeather({ status: 'denied' }),
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    if (weather.status !== 'ready') return;
    const interval = setInterval(loadWeather, WEATHER_REFRESH_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather.status]);

  return (
    <div className="hidden items-center gap-3 rounded-lg border border-cockpit-border bg-cockpit-bg px-3 py-1.5 font-mono text-[12px] text-cockpit-text lg:flex">
      <div className="flex flex-col leading-tight">
        <span className="tabular-nums">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <span className="text-[10px] text-cockpit-muted">
          {now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <span className="h-6 w-px bg-cockpit-border" />

      {weather.status === 'idle' && (
        <button
          onClick={loadWeather}
          title="Uses your browser's location, sent directly to Open-Meteo — never through this dashboard's own server"
          className="flex items-center gap-1.5 text-cockpit-muted transition-colors hover:text-cockpit-text"
        >
          <MapPin className="h-3.5 w-3.5" />
          Weather
        </button>
      )}
      {weather.status === 'loading' && <span className="text-cockpit-muted">Locating…</span>}
      {weather.status === 'denied' && <span className="text-cockpit-muted">Location denied</span>}
      {weather.status === 'error' && <span className="text-cockpit-muted">Weather unavailable</span>}
      {weather.status === 'ready' && (
        <span className="flex items-center gap-1.5 tabular-nums">
          <CloudSun className="h-3.5 w-3.5 text-cockpit-accent" />
          {weather.tempC}°C
          <span className="text-[10px] text-cockpit-muted">{weather.label}</span>
        </span>
      )}
    </div>
  );
};

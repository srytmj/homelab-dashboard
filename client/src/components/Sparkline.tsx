import React from 'react';

type SparkTone = 'accent' | 'warn' | 'bad' | 'muted';

interface SparklineProps {
  data: number[];
  tone?: SparkTone;
  height?: number;
  width?: number;
}

const TONES: Record<SparkTone, string> = {
  accent: '#7c9cff',
  warn: '#f2a93c',
  bad: '#f2554d',
  muted: '#84899a',
};

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  tone = 'accent',
  height = 20,
  width = 64,
}) => {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="rounded bg-cockpit-border/50" />;
  }

  const stroke = TONES[tone];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  const paddingY = 3;
  const usableHeight = height - paddingY * 2;
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  const pathD = `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`;
  const last = points[points.length - 1];

  return (
    <svg width={width} height={height} className="inline-block align-middle" aria-hidden="true">
      <path d={fillD} fill={stroke} fillOpacity="0.12" />
      <path d={pathD} fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x.toFixed(1)} cy={last.y.toFixed(1)} r="1.8" fill={stroke} />
    </svg>
  );
};

import React from 'react';

interface SparklineProps {
  data: number[];
  color?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo';
  height?: number;
  width?: number;
  showPoints?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = 'cyan',
  height = 24,
  width = 70,
}) => {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="bg-slate-800/40 rounded animate-pulse" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  // Generate SVG path
  const paddingY = 3;
  const usableHeight = height - paddingY * 2;
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const colorMap = {
    cyan: {
      stroke: '#06B6D4',
      fill: 'rgba(6, 182, 212, 0.18)',
    },
    emerald: {
      stroke: '#10B981',
      fill: 'rgba(16, 185, 129, 0.18)',
    },
    amber: {
      stroke: '#F59E0B',
      fill: 'rgba(245, 158, 11, 0.18)',
    },
    rose: {
      stroke: '#F43F5E',
      fill: 'rgba(244, 63, 94, 0.18)',
    },
    indigo: {
      stroke: '#6366F1',
      fill: 'rgba(99, 102, 241, 0.18)',
    },
  };

  const selectedColor = colorMap[color] || colorMap.cyan;

  return (
    <svg width={width} height={height} className="overflow-visible inline-block">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={selectedColor.stroke} stopOpacity="0.3" />
          <stop offset="100%" stopColor={selectedColor.stroke} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#grad-${color})`} />
      <path
        d={pathD}
        fill="none"
        stroke={selectedColor.stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current point */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].split(',')[0]}
          cy={points[points.length - 1].split(',')[1]}
          r="2"
          fill={selectedColor.stroke}
        />
      )}
    </svg>
  );
};

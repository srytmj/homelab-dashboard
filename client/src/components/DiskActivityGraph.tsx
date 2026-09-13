import React from 'react';

interface DiskActivityGraphProps {
  data: number[];
  width?: number;
  height?: number;
}

export const DiskActivityGraph: React.FC<DiskActivityGraphProps> = ({
  data,
  width = 640,
  height = 220,
}) => {
  const paddingLeft = 36;
  const paddingBottom = 20;
  const paddingTop = 12;
  const plotWidth = width - paddingLeft;
  const plotHeight = height - paddingTop - paddingBottom;

  const gridLines = [0, 25, 50, 75, 100];

  if (!data || data.length < 2) {
    return (
      <div
        style={{ height }}
        className="flex w-full items-center justify-center rounded border border-cockpit-border/50 text-[12px] text-cockpit-muted"
      >
        Not enough activity yet
      </div>
    );
  }

  const points = data.map((val, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * plotWidth;
    const y = paddingTop + plotHeight - (Math.min(100, Math.max(0, val)) / 100) * plotHeight;
    return { x, y };
  });

  const pathD = `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
  const fillD = `${pathD} L ${points[points.length - 1].x.toFixed(1)},${paddingTop + plotHeight} L ${paddingLeft},${paddingTop + plotHeight} Z`;
  const current = data[data.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      className="block"
      role="img"
      aria-label="Disk active time history"
      preserveAspectRatio="none"
    >
      {gridLines.map((pct) => {
        const y = paddingTop + plotHeight - (pct / 100) * plotHeight;
        return (
          <g key={pct}>
            <line
              x1={paddingLeft}
              y1={y}
              x2={width}
              y2={y}
              className="stroke-cockpit-border"
              strokeWidth="1"
            />
            <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="fill-cockpit-muted text-[10px] tabular-nums">
              {pct}%
            </text>
          </g>
        );
      })}
      <path d={fillD} className="fill-cockpit-accent" fillOpacity="0.12" />
      <path d={pathD} fill="none" className="stroke-cockpit-accent" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={points[points.length - 1].x.toFixed(1)}
        cy={points[points.length - 1].y.toFixed(1)}
        r="2.6"
        className="fill-cockpit-accent"
      />
      <text x={width - 4} y={paddingTop + 4} textAnchor="end" className="fill-cockpit-text text-[12px] font-medium tabular-nums">
        {current.toFixed(0)}%
      </text>
    </svg>
  );
};

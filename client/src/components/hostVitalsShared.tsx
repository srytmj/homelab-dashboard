import React from 'react';

export const Tile: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="panel px-4 py-3.5">
    <p className="label">{label}</p>
    <div className="mt-3">{children}</div>
  </div>
);

export const Bar: React.FC<{ percent: number; tone: string }> = ({ percent, tone }) => (
  <div className="track mt-3">
    <span className={`track-fill ${tone}`} style={{ width: `${Math.min(100, Math.max(2, percent))}%` }} />
  </div>
);

export const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="data-row">
    <span className="text-cockpit-muted">{label}</span>
    <span className="metric text-[12.5px]">{children}</span>
  </div>
);

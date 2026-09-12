import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { TailscaleStatus } from '../types.js';
import { redactText } from '../utils/formatters.js';

interface TailscaleMatrixSectionProps {
  tailscale: TailscaleStatus | undefined;
  isPrivacyMode?: boolean;
}

export const TailscaleMatrixSection: React.FC<TailscaleMatrixSectionProps> = ({
  tailscale,
  isPrivacyMode = false,
}) => {
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  if (!tailscale) {
    return <div className="panel h-64 animate-pulse" />;
  }

  const { devices = [], tailnetName, totalOnline, totalDevices } = tailscale;

  const copyToClipboard = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  return (
    <section className="panel flex flex-col">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Tailscale mesh</h2>
          <p className="panel-sub">{redactText(tailnetName, isPrivacyMode)}</p>
        </div>
        <span className="pill pill-neutral tabular-nums">
          {totalOnline}/{totalDevices} online
        </span>
      </div>

      <div className="max-h-[24rem] flex-1 overflow-y-auto px-5 py-1">
        {devices.map((device) => {
          const isCopied = copiedIp === device.ipv4;

          return (
            <div
              key={device.id}
              className={`group -mx-2 flex items-center justify-between gap-3 rounded-md border-b border-cockpit-border px-2 py-3 transition-colors duration-150 last:border-b-0 hover:bg-cockpit-panelHover ${
                device.online ? '' : 'opacity-55'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${device.online ? 'bg-state-good' : 'bg-cockpit-muted'}`}
                  />
                  <span className="truncate text-[13px] font-semibold text-cockpit-text">{device.name}</span>
                  {device.isCurrentDevice && <span className="pill pill-accent">this host</span>}
                  {device.isExitNode && <span className="pill pill-warn">exit</span>}
                </div>
                <div className="mt-0.5 truncate pl-3 font-mono text-[10.5px] text-cockpit-muted">
                  {device.subnetRoutes.length > 0
                    ? `routes ${isPrivacyMode ? '192.168.•••.0/24' : device.subnetRoutes.join(', ')}`
                    : redactText(device.dnsName, isPrivacyMode)}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="text-right">
                  <div className="metric text-[12px]">{redactText(device.ipv4, isPrivacyMode)}</div>
                  <div className="font-mono text-[10.5px] text-cockpit-muted">{device.lastSeen}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(device.ipv4)}
                  title="Copy Tailscale IP"
                  className="icon-btn p-1 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                >
                  {isCopied ? <Check className="h-3 w-3 animate-popIn text-state-good" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

import React from 'react';
import { SslCertificate } from '../types.js';
import { redactText } from '../utils/formatters.js';

interface SslTrackerSectionProps {
  certificates: SslCertificate[] | undefined;
  isPrivacyMode?: boolean;
}

export const SslTrackerSection: React.FC<SslTrackerSectionProps> = ({ certificates = [], isPrivacyMode = false }) => {
  if (certificates.length === 0) return null;

  const soonest = Math.min(...certificates.map((c) => c.daysRemaining));

  return (
    <section className="panel flex flex-col">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">SSL certificates</h2>
          <p className="panel-sub">Let's Encrypt via Nginx Proxy Manager</p>
        </div>
        <span className={`pill ${soonest <= 14 ? 'pill-bad' : soonest <= 30 ? 'pill-warn' : 'pill-neutral'}`}>
          next in {soonest}d
        </span>
      </div>

      <div className="max-h-[24rem] flex-1 overflow-y-auto px-5 py-1">
        {certificates.map((cert) => {
          const isCritical = cert.daysRemaining <= 14;
          const isWarning = cert.daysRemaining > 14 && cert.daysRemaining <= 30;

          return (
            <div
              key={cert.id}
              className="flex items-center justify-between gap-3 border-b border-cockpit-border py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-cockpit-text">
                  {redactText(cert.domain, isPrivacyMode)}
                </div>
                <div className="mt-0.5 font-mono text-[10.5px] text-cockpit-muted">
                  {cert.service} · {cert.autoRenewEnabled ? 'auto-renew' : 'manual renew'}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span
                  className={`metric text-[12.5px] ${
                    isCritical ? 'text-state-bad' : isWarning ? 'text-state-warn' : 'text-cockpit-text'
                  }`}
                >
                  {cert.daysRemaining}d
                </span>
                <div className="font-mono text-[10.5px] text-cockpit-muted">{cert.validTo}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

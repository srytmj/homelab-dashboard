import { ShieldCheck, Lock } from 'lucide-react';
import { SslCertificate } from '../types.js';
import { redactText } from '../utils/formatters.js';

interface SslTrackerSectionProps {
  certificates: SslCertificate[] | undefined;
  isPrivacyMode?: boolean;
}

export const SslTrackerSection: React.FC<SslTrackerSectionProps> = ({ certificates = [], isPrivacyMode = false }) => {
  if (certificates.length === 0) return null;

  return (
    <section className="rounded-xl bg-[#0d1424] border border-slate-800/90 p-4 lg:p-5 shadow-md">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-slate-800/70">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
                SSL Certificate & Domain Vitals
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 border border-slate-700">
                NPM Companion
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Let's Encrypt TLS certificate expiration countdowns & renewal telemetry
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Certificates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {certificates.map((cert) => {
          const isWarning = cert.daysRemaining <= 30 && cert.daysRemaining > 14;
          const isCritical = cert.daysRemaining <= 14;

          let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
          let textColor = 'text-emerald-400';

          if (isCritical) {
            badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
            textColor = 'text-rose-400';
          } else if (isWarning) {
            badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
            textColor = 'text-amber-400';
          }

          return (
            <div
              key={cert.id}
              className="rounded-lg bg-slate-900/80 border border-slate-800 p-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-mono text-xs font-bold text-slate-100 truncate max-w-[150px]">
                      {redactText(cert.domain, isPrivacyMode)}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeColor}`}>
                    {cert.daysRemaining}d left
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-400 mb-1">
                  {cert.service}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Expires: <strong className={textColor}>{cert.validTo}</strong></span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Auto-Renew
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

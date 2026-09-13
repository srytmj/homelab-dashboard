import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpCircle,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  GitBranch,
  RefreshCw,
  Sparkles,
  Terminal,
  X,
  AlertTriangle,
} from 'lucide-react';
import { AppUpdateStatus, AppUpdateState } from '../types.js';
import { authFetch } from '../utils/api.js';

export const AppUpdateBanner: React.FC = () => {
  const [status, setStatus] = useState<AppUpdateStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateState, setUpdateState] = useState<AppUpdateState | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [showCommits, setShowCommits] = useState(false);
  const [reloadCountdown, setReloadCountdown] = useState<number | null>(null);

  const logBottomRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<any>(null);

  const fetchStatus = async () => {
    try {
      const res = await authFetch('/api/app-update/status');
      if (res.ok) {
        const data: AppUpdateStatus = await res.json();
        setStatus(data);
        if (data.updateState) {
          setUpdateState(data.updateState);
          if (data.updateState.status === 'updating') {
            setIsUpdating(true);
            setShowLogModal(true);
          }
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Poll update progress when update is running
  useEffect(() => {
    if (!isUpdating) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    const poll = async () => {
      try {
        const res = await authFetch('/api/app-update/update-status');
        if (res.ok) {
          const state: AppUpdateState = await res.json();
          setUpdateState(state);

          if (state.status === 'success') {
            setIsUpdating(false);
            setReloadCountdown(3);
            fetchStatus();
          } else if (state.status === 'failed') {
            setIsUpdating(false);
            fetchStatus();
          }
        }
      } catch {
        // ignore
      }
    };

    pollTimerRef.current = setInterval(poll, 1000);
    return () => clearInterval(pollTimerRef.current);
  }, [isUpdating]);

  // Scroll terminal logs to bottom when updated
  useEffect(() => {
    if (showLogModal && logBottomRef.current) {
      logBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [updateState?.log, showLogModal]);

  // Auto reload countdown when update finishes successfully
  useEffect(() => {
    if (reloadCountdown === null) return;
    if (reloadCountdown <= 0) {
      window.location.reload();
      return;
    }

    const timer = setTimeout(() => {
      setReloadCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [reloadCountdown]);

  const handleCheckUpdates = async () => {
    setIsChecking(true);
    try {
      const res = await authFetch('/api/app-update/check', { method: 'POST' });
      if (res.ok) {
        const data: AppUpdateStatus = await res.json();
        setStatus(data);
        if (data.updateState) {
          setUpdateState(data.updateState);
        }
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleStartUpdate = async () => {
    setIsUpdating(true);
    setShowLogModal(true);
    try {
      const res = await authFetch('/api/app-update/update', { method: 'POST' });
      if (!res.ok) {
        setIsUpdating(false);
      }
    } catch {
      setIsUpdating(false);
    }
  };

  if (!status) {
    return null;
  }

  const {
    hasUpdate,
    behindBy,
    announcement,
    currentSha,
    latestSha,
    branch,
    repoUrl,
    recentCommits,
  } = status;

  return (
    <div className="space-y-3">
      {/* UPDATE AVAILABLE BANNER */}
      {hasUpdate ? (
        <section className="relative overflow-hidden rounded-panel animate-fade-in-up stagger-1 border border-cockpit-accent/40 bg-gradient-to-br from-cockpit-panel via-cockpit-panel to-cockpit-accent/10 p-5 shadow-lg shadow-black/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-cockpit-accent/50 bg-cockpit-accent/20 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-cockpit-accent">
                  <Sparkles className="h-3 w-3 animate-pulse" />
                  UPDATE TERSEDIA
                </span>
                {announcement?.version && (
                  <span className="pill pill-neutral font-mono text-[10.5px]">v{announcement.version}</span>
                )}
                <span className="font-mono text-[11px] text-cockpit-muted">
                  {behindBy > 0 ? `${behindBy} commit baru di ` : 'Update di '}
                  <span className="text-cockpit-text">{branch}</span>
                  {latestSha ? ` (${latestSha.slice(0, 7)})` : ''}
                </span>
              </div>

              <h2 className="text-[17px] font-bold tracking-tight text-cockpit-text">
                {announcement?.title || 'Pembaruan Homelab Dashboard Tersedia'}
              </h2>

              {announcement?.description && (
                <p className="max-w-2xl text-[13px] leading-relaxed text-cockpit-muted">
                  {announcement.description}
                </p>
              )}

              {announcement?.highlights && announcement.highlights.length > 0 && (
                <div className="mt-3 rounded-lg border border-cockpit-border/60 bg-cockpit-bg/60 p-3">
                  <p className="text-[11.5px] font-semibold uppercase tracking-wider text-cockpit-muted">
                    Apa yang baru di versi ini:
                  </p>
                  <ul className="mt-2 space-y-1.5 text-[12.5px] text-cockpit-text">
                    {announcement.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-state-good" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Toggleable recent commits list */}
              {recentCommits && recentCommits.length > 0 && (
                <div className="pt-1">
                  <button
                    onClick={() => setShowCommits(!showCommits)}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-cockpit-muted hover:text-cockpit-text"
                  >
                    <span>{showCommits ? 'Sembunyikan commit log' : 'Lihat commit log'}</span>
                    {showCommits ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {showCommits && (
                    <div className="mt-2 max-h-40 overflow-y-auto rounded border border-cockpit-border bg-cockpit-bg p-2 font-mono text-[11px]">
                      {recentCommits.map((c) => (
                        <div key={c.sha} className="flex items-center gap-2 py-0.5">
                          <span className="shrink-0 text-cockpit-accent">{c.sha}</span>
                          <span className="truncate text-cockpit-text">{c.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex shrink-0 flex-row flex-wrap items-center gap-2.5 sm:flex-col sm:items-end">
              <button
                onClick={handleStartUpdate}
                disabled={isUpdating}
                className="btn-primary flex items-center gap-2 px-4 py-2 text-[13px] shadow-lg shadow-cockpit-accent/20"
              >
                <ArrowUpCircle className="h-4 w-4" />
                <span>{isUpdating ? 'Sedang Update...' : 'Update Sekarang'}</span>
              </button>

              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost flex items-center gap-1.5 text-[12px]"
                title="Buka Repository di GitHub"
              >
                <GitBranch className="h-3.5 w-3.5" />
                <span>GitHub Repo</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>

              <button
                onClick={handleCheckUpdates}
                disabled={isChecking || isUpdating}
                className="btn-ghost flex items-center gap-1.5 text-[11.5px]"
                title="Periksa commit terbaru di GitHub"
              >
                <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Memeriksa...' : 'Cek Ulang'}</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        /* UP TO DATE BAR */
        <section className="panel flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 animate-fade-in-up stagger-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-state-good" />
            <span className="text-[12.5px] font-semibold text-cockpit-text">Homelab Dashboard</span>
            <span className="pill pill-neutral font-mono text-[10.5px]">
              {branch} · {currentSha.slice(0, 7)}
            </span>
            <span className="font-mono text-[11px] text-state-good">Versi terbaru</span>
          </div>

          <div className="flex items-center gap-2">
            {announcement && (
              <button
                onClick={() => setShowReleaseNotes(!showReleaseNotes)}
                className="btn-ghost text-[11.5px]"
              >
                <Sparkles className="h-3 w-3 text-cockpit-accent" />
                <span>{showReleaseNotes ? 'Tutup Catatan Rilis' : 'Catatan Rilis'}</span>
              </button>
            )}

            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost text-[11.5px]"
              title="Buka Repository di GitHub"
            >
              <GitBranch className="h-3 w-3" />
              <span>GitHub Repo</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>

            <button
              onClick={handleCheckUpdates}
              disabled={isChecking}
              className="btn-ghost text-[11.5px]"
              title="Periksa pembaruan sekarang"
            >
              <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Memeriksa...' : 'Periksa Update'}</span>
            </button>
          </div>

          {/* Release Notes Expandable Box */}
          {showReleaseNotes && announcement && (
            <div className="mt-2 w-full rounded-lg border border-cockpit-border bg-cockpit-bg p-4 text-[12.5px]">
              <div className="flex items-center justify-between border-b border-cockpit-border/60 pb-2">
                <div>
                  <h4 className="font-bold text-cockpit-text">{announcement.title}</h4>
                  <p className="font-mono text-[11px] text-cockpit-muted">
                    {announcement.version ? `Versi ${announcement.version} · ` : ''}
                    {announcement.date}
                  </p>
                </div>
                <button onClick={() => setShowReleaseNotes(false)} className="icon-btn">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-2 text-cockpit-muted">{announcement.description}</p>
              {announcement.highlights && announcement.highlights.length > 0 && (
                <ul className="mt-2.5 space-y-1">
                  {announcement.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-cockpit-text">
                      <Check className="mt-0.5 h-3.5 w-3.5 text-state-good" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      {/* UPDATE LIVE PROGRESS MODAL */}
      {showLogModal && (
        <div className="overlay">
          <div className="panel modal-panel w-full max-w-2xl">
            <div className="panel-head flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-cockpit-accent" />
                <h3 className="panel-title">Update Homelab Dashboard</h3>
              </div>
              {!isUpdating && (
                <button onClick={() => setShowLogModal(false)} className="icon-btn" title="Tutup">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="p-5">
              <p className="text-[12.5px] text-cockpit-muted">
                {isUpdating
                  ? 'Menjalankan git pull, npm install, dan membangun bundle web terbaru...'
                  : updateState?.status === 'success'
                  ? 'Pembaruan berhasil diselesaikan!'
                  : 'Proses pembaruan selesai dengan pesan di bawah.'}
              </p>

              {/* Terminal View */}
              <div className="mt-3.5 max-h-72 min-h-48 overflow-y-auto rounded-lg border border-cockpit-border bg-black/80 p-3 font-mono text-[11.5px] leading-relaxed text-cockpit-text">
                {updateState?.log && updateState.log.length > 0 ? (
                  updateState.log.map((line, idx) => (
                    <div
                      key={idx}
                      className={`break-all py-0.5 ${
                        line.startsWith('✓')
                          ? 'text-state-good font-semibold'
                          : line.startsWith('✕') || line.includes('Error')
                          ? 'text-state-bad font-semibold'
                          : line.startsWith('$')
                          ? 'text-cockpit-accent'
                          : 'text-cockpit-text/80'
                      }`}
                    >
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-cockpit-muted">Menyiapkan update...</div>
                )}
                <div ref={logBottomRef} />
              </div>

              {/* Status footer */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-cockpit-border/60 pt-3">
                {isUpdating ? (
                  <div className="flex items-center gap-2 text-[12.5px] text-cockpit-accent">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Sedang memperbarui dashboard... Mohon tunggu.</span>
                  </div>
                ) : updateState?.status === 'success' ? (
                  <div className="flex items-center gap-2 text-[12.5px] text-state-good">
                    <Check className="h-4 w-4" />
                    <span>
                      {reloadCountdown !== null
                        ? `Memuat ulang dashboard dalam ${reloadCountdown} detik...`
                        : 'Update selesai! Silakan refresh.'}
                    </span>
                  </div>
                ) : updateState?.status === 'failed' ? (
                  <div className="flex items-center gap-2 text-[12.5px] text-state-bad">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Gagal: {updateState.message || 'Terjadi kesalahan pada proses build.'}</span>
                  </div>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  {updateState?.status === 'success' && (
                    <button
                      onClick={() => window.location.reload()}
                      className="btn-primary text-[12px]"
                    >
                      Muat Ulang Sekarang
                    </button>
                  )}
                  {!isUpdating && (
                    <button
                      onClick={() => setShowLogModal(false)}
                      className="btn-ghost text-[12px]"
                    >
                      Tutup
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Database, Download, Upload } from 'lucide-react';
import { CockpitSnapshot, BackupStatus } from '../types.js';
import { HostDetailPanels } from '../components/HostDetailPanels.js';
import { StorageMatrixSection } from '../components/StorageMatrixSection.js';
import { DiskPerformancePanel } from '../components/DiskPerformancePanel.js';
import { TailscaleMatrixSection } from '../components/TailscaleMatrixSection.js';
import { SslTrackerSection } from '../components/SslTrackerSection.js';
import { BackupRestoreModal } from '../components/BackupRestoreModal.js';
import { ImportConfigModal } from '../components/ImportConfigModal.js';
import { authFetch } from '../utils/api.js';

interface InfraPageProps {
  snapshot: CockpitSnapshot | null;
  isPrivacyMode: boolean;
  onOpenPruneModal: () => void;
}

const DockerHostsPanel: React.FC<{ snapshot: CockpitSnapshot | null }> = ({ snapshot }) => {
  const hosts = snapshot?.dockerHosts ?? [];
  if (hosts.length <= 1) return null;

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h3 className="panel-title">Docker hosts</h3>
          <p className="panel-sub">Each entry is a separate daemon this dashboard reaches</p>
        </div>
      </div>
      <div className="px-5 py-1.5">
        {hosts.map((host) => (
          <div key={host.name} className="data-row">
            <span className="flex items-center gap-2 text-cockpit-text">
              <span className={`h-1.5 w-1.5 rounded-full ${host.connected ? 'bg-state-good' : 'bg-state-warn'}`} />
              {host.name}
            </span>
            <span className="flex items-center gap-2">
              <span className="pill pill-neutral tabular-nums">{host.containerCount} containers</span>
              <span className={`pill ${host.connected ? 'pill-good' : 'pill-warn'}`}>
                {host.connected ? 'Connected' : 'Simulated'}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

const BackupPanel: React.FC = () => {
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const loadStatus = () => {
    authFetch('/api/backup/status')
      .then((res) => res.json())
      .then(setStatus)
      .catch(() => {});
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRunBackup = async () => {
    setIsRunning(true);
    try {
      await authFetch('/api/backup/run', { method: 'POST' });
      loadStatus();
    } finally {
      setIsRunning(false);
    }
  };

  const lastBackup = status?.backup;

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h3 className="panel-title">Backup</h3>
          <p className="panel-sub">
            {status?.configured ? 'rclone remote configured' : 'No rclone remote configured'}
          </p>
        </div>
        <span className={`pill ${lastBackup?.lastResult === 'success' ? 'pill-good' : 'pill-neutral'}`}>
          {lastBackup ? (lastBackup.lastResult === 'success' ? 'Last run OK' : 'Last run failed') : 'Never run'}
        </span>
      </div>

      <div className="space-y-3 px-5 py-4">
        {lastBackup && (
          <p className="font-mono text-[11px] text-cockpit-muted">
            {new Date(lastBackup.lastRunAt).toLocaleString()} · {(lastBackup.lastDurationMs / 1000).toFixed(1)}s
            {lastBackup.lastError && <span className="text-state-bad"> · {lastBackup.lastError}</span>}
          </p>
        )}

        {!status?.configured && (
          <p className="text-[12px] text-cockpit-muted">
            Set <code className="font-mono text-cockpit-text">BACKUP_RCLONE_REMOTE</code> to enable backup and
            restore. Config import works either way.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunBackup}
            disabled={!status?.configured || isRunning}
            className="btn-ghost disabled:opacity-40"
          >
            <Database className={`h-3.5 w-3.5 ${isRunning ? 'animate-pulse' : ''}`} />
            {isRunning ? 'Running…' : 'Run backup now'}
          </button>
          <button
            onClick={() => setIsRestoreOpen(true)}
            disabled={!status?.configured}
            className="btn-ghost hover:border-state-bad/40 hover:text-state-bad disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Restore from backup
          </button>
          <button onClick={() => setIsImportOpen(true)} className="btn-ghost">
            <Upload className="h-3.5 w-3.5" />
            Import config from link
          </button>
        </div>
      </div>

      {isRestoreOpen && (
        <BackupRestoreModal
          sourcePaths={status?.sourcePaths ?? []}
          onClose={() => setIsRestoreOpen(false)}
          onSuccess={loadStatus}
        />
      )}

      {isImportOpen && <ImportConfigModal onClose={() => setIsImportOpen(false)} onSuccess={loadStatus} />}
    </section>
  );
};

export const InfraPage: React.FC<InfraPageProps> = ({ snapshot, isPrivacyMode, onOpenPruneModal }) => {
  const [view, setView] = useState<'overview' | 'performance'>('overview');

  return (
    <div className="space-y-4">
      <div className="seg">
        <button
          onClick={() => setView('overview')}
          className={`seg-btn ${view === 'overview' ? 'seg-btn-on' : ''}`}        >
          Overview
        </button>
        <button
          onClick={() => setView('performance')}
          className={`seg-btn ${view === 'performance' ? 'seg-btn-on' : ''}`}        >
          Performance
        </button>
      </div>

      {view === 'overview' ? (
        <div className="space-y-4">
          <DockerHostsPanel snapshot={snapshot} />

          {/* Dedicated Full-Width Storage & DAS Watchdog Section */}
          <StorageMatrixSection
            storage={snapshot?.storage}
            hygiene={snapshot?.dockerHygiene}
            onOpenPruneModal={onOpenPruneModal}
          />

          <div className="grid items-start gap-4 lg:grid-cols-2">
            <TailscaleMatrixSection tailscale={snapshot?.tailscale} isPrivacyMode={isPrivacyMode} />
            <SslTrackerSection certificates={snapshot?.sslCertificates} isPrivacyMode={isPrivacyMode} />
          </div>

          <BackupPanel />
        </div>
      ) : (
        <div className="space-y-4">
          <HostDetailPanels host={snapshot?.host} isPrivacyMode={isPrivacyMode} />
          <DiskPerformancePanel storage={snapshot?.storage} />
        </div>
      )}
    </div>
  );
};

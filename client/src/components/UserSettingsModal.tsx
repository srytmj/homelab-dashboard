import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  CheckCircle2,
  Key,
  Moon,
  RotateCcw,
  Save,
  Server,
  ShieldAlert,
  Sun,
  X,
} from 'lucide-react';
import { authFetch } from '../utils/api.js';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPveNode?: string;
  onSettingsUpdated?: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  currentPveNode,
  onSettingsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'node' | 'password'>('node');

  // Appearance states
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() =>
    document.documentElement.classList.contains('dark')
  );

  // Primary Node Name states
  const [primaryNodeName, setPrimaryNodeName] = useState<string>(() => {
    return localStorage.getItem('cockpit_primary_node_name') || '';
  });
  const [isSavingNode, setIsSavingNode] = useState<boolean>(false);
  const [nodeSuccess, setNodeSuccess] = useState<string | null>(null);
  const [nodeError, setNodeError] = useState<string | null>(null);

  // Password states
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch current settings from backend
    authFetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.primaryNodeName) {
          setPrimaryNodeName(data.primaryNodeName);
          localStorage.setItem('cockpit_primary_node_name', data.primaryNodeName);
        } else if (currentPveNode) {
          setPrimaryNodeName(currentPveNode);
        }
      })
      .catch(() => {});

    setIsDarkMode(document.documentElement.classList.contains('dark'));
    setNodeSuccess(null);
    setNodeError(null);
    setPasswordSuccess(null);
    setPasswordError(null);
  }, [isOpen, currentPveNode]);

  if (!isOpen) return null;

  const handleToggleTheme = (dark: boolean) => {
    setIsDarkMode(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cockpit_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cockpit_theme', 'light');
    }
  };

  const handleSaveNodeName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingNode(true);
    setNodeSuccess(null);
    setNodeError(null);

    const trimmed = primaryNodeName.trim();

    try {
      // 1. Immediately update localStorage & dispatch local event
      if (trimmed) {
        localStorage.setItem('cockpit_primary_node_name', trimmed);
      } else {
        localStorage.removeItem('cockpit_primary_node_name');
      }
      window.dispatchEvent(new CustomEvent('cockpit_settings_updated', { detail: { primaryNodeName: trimmed } }));

      // 2. Persist to backend
      const res = await authFetch('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({ primaryNodeName: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setNodeSuccess('Primary Node name updated successfully. Broadcasted to telemetry!');
        onSettingsUpdated?.();
        setTimeout(() => setNodeSuccess(null), 4000);
      } else {
        setNodeError(data?.error || 'Failed to update Primary Node name on server.');
      }
    } catch {
      setNodeError('Network error while saving settings.');
    } finally {
      setIsSavingNode(false);
    }
  };

  const handleResetNodeName = async () => {
    setIsSavingNode(true);
    setNodeSuccess(null);
    setNodeError(null);

    try {
      localStorage.removeItem('cockpit_primary_node_name');
      window.dispatchEvent(new CustomEvent('cockpit_settings_updated', { detail: { primaryNodeName: '' } }));

      const res = await authFetch('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({ primaryNodeName: '' }),
      });
      if (res.ok) {
        setPrimaryNodeName(currentPveNode || '');
        setNodeSuccess('Reset to default node configuration.');
        onSettingsUpdated?.();
        setTimeout(() => setNodeSuccess(null), 4000);
      }
    } catch {
      setNodeError('Failed to reset node name.');
    } finally {
      setIsSavingNode(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordSuccess('Password updated successfully! Next login will require your new password.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 5000);
      } else {
        setPasswordError(data?.message || 'Failed to change password. Check your current password.');
      }
    } catch {
      setPasswordError('Network error while changing password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-cockpit-border bg-cockpit-panel shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cockpit-border px-5 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-cockpit-text">Cockpit Settings</h2>
            <p className="text-[11.5px] text-cockpit-muted">Customize your node name, theme, and owner credentials</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-cockpit-muted hover:bg-cockpit-panelHover hover:text-cockpit-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-cockpit-border bg-cockpit-panelHover/30 px-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('node')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-[12.5px] font-semibold transition-colors ${
              activeTab === 'node'
                ? 'border-cockpit-accent text-cockpit-accent'
                : 'border-transparent text-cockpit-muted hover:text-cockpit-text'
            }`}
          >
            <Server className="h-4 w-4" />
            Node & Appearance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-[12.5px] font-semibold transition-colors ${
              activeTab === 'password'
                ? 'border-cockpit-accent text-cockpit-accent'
                : 'border-transparent text-cockpit-muted hover:text-cockpit-text'
            }`}
          >
            <Key className="h-4 w-4" />
            Account Security
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-6">
          {/* TAB: Node & Appearance */}
          {activeTab === 'node' && (
            <div className="space-y-6">
              {/* Primary Node Name Section */}
              <form onSubmit={handleSaveNodeName} className="space-y-3">
                <div>
                  <label className="block text-[12.5px] font-bold text-cockpit-text mb-1">
                    Primary Node Custom Name
                  </label>
                  <p className="text-[11.5px] text-cockpit-muted mb-2">
                    Rename your primary hypervisor node from default &ldquo;pve&rdquo; to your customized label (e.g. &ldquo;homelab-server&rdquo;, &ldquo;proxmox-01&rdquo;). Broadcasts dynamically to all dashboard telemetry views.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={primaryNodeName}
                      onChange={(e) => setPrimaryNodeName(e.target.value)}
                      placeholder={currentPveNode || 'e.g. homelab-server'}
                      className="input flex-1 font-mono text-[13px]"
                    />
                    <button
                      type="submit"
                      disabled={isSavingNode}
                      className="btn-primary flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold shrink-0"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleResetNodeName}
                      disabled={isSavingNode}
                      title="Reset to default hypervisor node name"
                      className="btn-ghost flex items-center gap-1 px-2.5 py-2 text-[12px] shrink-0"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </button>
                  </div>
                </div>

                {nodeSuccess && (
                  <div className="flex items-center gap-2 rounded-lg border border-state-good/30 bg-state-good/10 p-2.5 text-[12px] text-state-good">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{nodeSuccess}</span>
                  </div>
                )}

                {nodeError && (
                  <div className="flex items-center gap-2 rounded-lg border border-state-bad/30 bg-state-bad/10 p-2.5 text-[12px] text-state-bad">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{nodeError}</span>
                  </div>
                )}
              </form>

              {/* Theme Toggle Section */}
              <div className="border-t border-cockpit-border pt-4">
                <label className="block text-[12.5px] font-bold text-cockpit-text mb-1">
                  Color Theme
                </label>
                <p className="text-[11.5px] text-cockpit-muted mb-3">
                  Toggle between high-contrast Dark Mode and crisp Light Mode.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleTheme(true)}
                    className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                      isDarkMode
                        ? 'border-cockpit-accent bg-cockpit-accent/10 shadow-sm'
                        : 'border-cockpit-border bg-cockpit-panel hover:border-cockpit-border/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-zinc-100 border border-zinc-700">
                        <Moon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[12.5px] font-bold text-cockpit-text">Dark Mode</p>
                        <p className="text-[10.5px] text-cockpit-muted">OLED contrast</p>
                      </div>
                    </div>
                    {isDarkMode && <Check className="h-4 w-4 text-cockpit-accent" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleTheme(false)}
                    className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                      !isDarkMode
                        ? 'border-cockpit-accent bg-cockpit-accent/10 shadow-sm'
                        : 'border-cockpit-border bg-cockpit-panel hover:border-cockpit-border/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                        <Sun className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[12.5px] font-bold text-cockpit-text">Light Mode</p>
                        <p className="text-[10.5px] text-cockpit-muted">Daylight reading</p>
                      </div>
                    </div>
                    {!isDarkMode && <Check className="h-4 w-4 text-cockpit-accent" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Password */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <p className="text-[11.5px] text-cockpit-muted">
                Update the master administrator password used for cockpit login sessions.
              </p>

              <div>
                <label className="block text-[12px] font-semibold text-cockpit-text mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="input w-full font-mono text-[12.5px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-cockpit-text mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="input w-full font-mono text-[12.5px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-cockpit-text mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="input w-full font-mono text-[12.5px]"
                />
              </div>

              {passwordSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-state-good/30 bg-state-good/10 p-2.5 text-[12px] text-state-good">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="flex items-center gap-2 rounded-lg border border-state-bad/30 bg-state-bad/10 p-2.5 text-[12px] text-state-bad">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="btn-primary w-full flex items-center justify-center gap-1.5 py-2 text-[12.5px] font-bold"
                >
                  <Key className="h-3.5 w-3.5" />
                  {isChangingPassword ? 'Updating Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-cockpit-border bg-cockpit-panelHover/20 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost px-4 py-1.5 text-[12px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

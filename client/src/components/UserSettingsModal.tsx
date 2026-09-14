import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Check,
  CheckCircle2,
  Key,
  LayoutGrid,
  Monitor,
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
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  currentPveNode,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isBeta = location.pathname.startsWith('/beta');
  const [activeTab, setActiveTab] = useState<'ui' | 'node' | 'password'>('ui');

  // Theme & UI Style states
  const [uiStyle, setUiStyle] = useState<'classic' | 'brutalism'>(
    (localStorage.getItem('cockpit_preferred_ui') as 'classic' | 'brutalism') || (isBeta ? 'brutalism' : 'classic')
  );
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() =>
    document.documentElement.classList.contains('dark')
  );

  // Primary Node Name states
  const [primaryNodeName, setPrimaryNodeName] = useState<string>('');
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

    // Fetch current settings
    authFetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.primaryNodeName) {
          setPrimaryNodeName(data.primaryNodeName);
        } else if (currentPveNode) {
          setPrimaryNodeName(currentPveNode);
        }
      })
      .catch(() => {});

    // Sync UI style state
    const pref = localStorage.getItem('cockpit_preferred_ui') as 'classic' | 'brutalism' | null;
    if (pref) {
      setUiStyle(pref);
    } else {
      setUiStyle(isBeta ? 'brutalism' : 'classic');
    }

    setIsDarkMode(document.documentElement.classList.contains('dark'));
    setNodeSuccess(null);
    setNodeError(null);
    setPasswordSuccess(null);
    setPasswordError(null);
  }, [isOpen, isBeta, currentPveNode]);

  if (!isOpen) return null;

  const handleSelectUiStyle = (style: 'classic' | 'brutalism') => {
    setUiStyle(style);
    localStorage.setItem('cockpit_preferred_ui', style);

    if (style === 'brutalism' && !location.pathname.startsWith('/beta')) {
      const newPath = location.pathname === '/' ? '/beta' : `/beta${location.pathname}`;
      navigate(newPath);
    } else if (style === 'classic' && location.pathname.startsWith('/beta')) {
      const newPath = location.pathname === '/beta' ? '/' : location.pathname.replace(/^\/beta/, '');
      navigate(newPath || '/');
    }
  };

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

    try {
      const res = await authFetch('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({ primaryNodeName }),
      });
      const data = await res.json();
      if (res.ok) {
        setNodeSuccess('Primary Node name updated successfully. Broadcasted to telemetry!');
        setTimeout(() => setNodeSuccess(null), 4000);
      } else {
        setNodeError(data?.error || 'Failed to update Primary Node name.');
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
      const res = await authFetch('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({ primaryNodeName: '' }),
      });
      if (res.ok) {
        setPrimaryNodeName('');
        setNodeSuccess('Reset to default node configuration.');
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

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
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
        setPasswordSuccess('Password successfully changed! Your new password is now active.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 5000);
      } else {
        setPasswordError(data?.message || data?.error || 'Failed to update password.');
      }
    } catch {
      setPasswordError('Network error while updating password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return createPortal(
    <div className="overlay animate-fadeIn" onClick={onClose}>
      <div
        className="modal-panel w-full max-w-xl overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cockpit-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cockpit-accent/10 text-cockpit-accent">
              <Monitor className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-cockpit-text">User Settings</h2>
              <p className="text-[11.5px] text-cockpit-muted">Personalize cockpit UI, node identity & authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="icon-btn rounded-lg p-1.5 hover:bg-cockpit-border/40"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-cockpit-border bg-cockpit-panel/40 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('ui')}
            className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-[12.5px] font-medium transition-colors ${
              activeTab === 'ui'
                ? 'border-cockpit-accent text-cockpit-accent'
                : 'border-transparent text-cockpit-muted hover:text-cockpit-text'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Theme & UI Style
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('node')}
            className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-[12.5px] font-medium transition-colors ${
              activeTab === 'node'
                ? 'border-cockpit-accent text-cockpit-accent'
                : 'border-transparent text-cockpit-muted hover:text-cockpit-text'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            Primary Node
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-[12.5px] font-medium transition-colors ${
              activeTab === 'password'
                ? 'border-cockpit-accent text-cockpit-accent'
                : 'border-transparent text-cockpit-muted hover:text-cockpit-text'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            Login Password
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* TAB 1: Theme & UI Style */}
          {activeTab === 'ui' && (
            <div className="space-y-6">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-cockpit-muted">
                  UI Style Preference
                </label>
                <p className="mt-0.5 text-[12px] text-cockpit-muted">
                  Select your preferred interface visual architecture and layout flavor.
                </p>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Classic Glassmorphism */}
                  <div
                    onClick={() => handleSelectUiStyle('classic')}
                    className={`group relative cursor-pointer rounded-xl border p-4 transition-all ${
                      uiStyle === 'classic'
                        ? 'border-cockpit-accent bg-cockpit-accent/5 ring-1 ring-cockpit-accent'
                        : 'border-cockpit-border bg-cockpit-panel/30 hover:border-cockpit-border/80 hover:bg-cockpit-panel/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                        <span className="text-[13px] font-semibold text-cockpit-text">Classic Glassmorphism</span>
                      </div>
                      {uiStyle === 'classic' && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cockpit-accent text-white">
                          <Check className="h-3 w-3 stroke-[2.5]" />
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[11.5px] leading-relaxed text-cockpit-muted">
                      Sleek translucent glass panels, subtle gradients, rounded corners, and soft depth shadows.
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-cockpit-accent">
                      <span>Route: /</span>
                    </div>
                  </div>

                  {/* Neo-Brutalism */}
                  <div
                    onClick={() => handleSelectUiStyle('brutalism')}
                    className={`group relative cursor-pointer rounded-xl border p-4 transition-all ${
                      uiStyle === 'brutalism'
                        ? 'border-cockpit-accent bg-cockpit-accent/5 ring-1 ring-cockpit-accent'
                        : 'border-cockpit-border bg-cockpit-panel/30 hover:border-cockpit-border/80 hover:bg-cockpit-panel/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 border border-black bg-amber-400 dark:border-white shadow-sm" />
                        <span className="text-[13px] font-semibold text-cockpit-text">Neo-Brutalism (Beta)</span>
                      </div>
                      {uiStyle === 'brutalism' && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cockpit-accent text-white">
                          <Check className="h-3 w-3 stroke-[2.5]" />
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[11.5px] leading-relaxed text-cockpit-muted">
                      High-contrast stark borders, solid drop shadows, square edges, monospace telemetry, and raw utility.
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-cockpit-accent">
                      <span>Route: /beta</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Mode */}
              <div className="border-t border-cockpit-border pt-5">
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-cockpit-muted">
                  Color Theme Mode
                </label>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleTheme(true)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-[12.5px] font-medium transition-all ${
                      isDarkMode
                        ? 'border-cockpit-accent bg-cockpit-accent/10 text-cockpit-accent'
                        : 'border-cockpit-border bg-cockpit-panel/40 text-cockpit-muted hover:text-cockpit-text'
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                    Dark Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleTheme(false)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-[12.5px] font-medium transition-all ${
                      !isDarkMode
                        ? 'border-cockpit-accent bg-cockpit-accent/10 text-cockpit-accent'
                        : 'border-cockpit-border bg-cockpit-panel/40 text-cockpit-muted hover:text-cockpit-text'
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                    Light Mode
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Primary Node Name */}
          {activeTab === 'node' && (
            <form onSubmit={handleSaveNodeName} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-cockpit-muted">
                  Custom Primary Node Name
                </label>
                <p className="mt-0.5 text-[12px] text-cockpit-muted">
                  Customize the Proxmox / Host node label shown on the top bar and overview vitals cards.
                </p>
                <div className="mt-3">
                  <input
                    type="text"
                    value={primaryNodeName}
                    onChange={(e) => setPrimaryNodeName(e.target.value)}
                    placeholder={currentPveNode || 'e.g. pve, PROXMOX-ALPHA, MAIN-NODE'}
                    className="field w-full font-mono text-[13px]"
                  />
                </div>
              </div>

              {nodeSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-state-good/30 bg-state-good/10 p-3 text-[12px] text-state-good">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{nodeSuccess}</span>
                </div>
              )}

              {nodeError && (
                <div className="flex items-center gap-2 rounded-lg border border-state-bad/30 bg-state-bad/10 p-3 text-[12px] text-state-bad">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{nodeError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-cockpit-border">
                <button
                  type="button"
                  onClick={handleResetNodeName}
                  disabled={isSavingNode}
                  className="btn-ghost flex items-center gap-1.5 text-[12px]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset to Default
                </button>
                <button
                  type="submit"
                  disabled={isSavingNode}
                  className="btn-primary flex items-center gap-1.5 text-[12px]"
                >
                  <Save className="h-3.5 w-3.5" />
                  {isSavingNode ? 'Saving…' : 'Save Node Name'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Change Password */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-cockpit-muted">
                  Current Owner Password
                </label>
                <p className="mt-0.5 text-[12px] text-cockpit-muted">
                  Enter your current initial setup or one-time login password to authorize this change.
                </p>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="field mt-2 w-full text-[13px]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[12px] font-medium text-cockpit-text">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="field mt-1.5 w-full text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-cockpit-text">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    required
                    minLength={6}
                    className="field mt-1.5 w-full text-[13px]"
                  />
                </div>
              </div>

              {passwordSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-state-good/30 bg-state-good/10 p-3 text-[12px] text-state-good">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="flex items-center gap-2 rounded-lg border border-state-bad/30 bg-state-bad/10 p-3 text-[12px] text-state-bad">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="flex items-center justify-end pt-2 border-t border-cockpit-border">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="btn-primary flex items-center gap-1.5 text-[12px]"
                >
                  <Key className="h-3.5 w-3.5" />
                  {isChangingPassword ? 'Updating Password…' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

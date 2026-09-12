import React, { useState } from 'react';
import { Server, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const AuthScreen: React.FC = () => {
  const { isRegistered, login, register } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSetupMode = isRegistered === false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Enter a username.');
      return;
    }

    if (!password) {
      setError('Enter a password.');
      return;
    }

    if (isSetupMode) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);
    const res = isSetupMode
      ? await register(username.trim(), password)
      : await login(username.trim(), password, rememberMe);
    setIsLoading(false);

    if (!res.success) {
      setError(res.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cockpit-bg px-4">
      <div className="panel modal-panel w-full max-w-sm">
        <div className="panel-head">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cockpit-border bg-cockpit-bg text-cockpit-accent">
              <Server className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h1 className="panel-title">{isSetupMode ? 'Set up owner access' : 'Cockpit'}</h1>
              <p className="panel-sub">
                {isSetupMode ? 'First run, one account only' : 'Sign in to continue'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {isSetupMode && (
            <p className="text-[12.5px] leading-relaxed text-cockpit-muted">
              Create the owner account now. Registration closes permanently once it exists, so anyone
              reaching this dashboard afterwards has to sign in.
            </p>
          )}

          {error && (
            <div className="flex animate-fadeIn items-center gap-2 rounded-lg bg-state-bad/10 px-3 py-2.5 text-[12.5px] text-state-bad">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="cockpit-username" className="label block">
              Username
            </label>
            <input
              id="cockpit-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="field w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cockpit-password" className="label block">
              Password
            </label>
            <input
              id="cockpit-password"
              type="password"
              autoComplete={isSetupMode ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="field w-full"
            />
          </div>

          {isSetupMode && (
            <div className="space-y-1.5">
              <label htmlFor="cockpit-confirm" className="label block">
                Confirm password
              </label>
              <input
                id="cockpit-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="field w-full"
              />
            </div>
          )}

          {!isSetupMode && (
            <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-cockpit-muted transition-colors hover:text-cockpit-text">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-cockpit-border bg-cockpit-bg accent-cockpit-accent"
              />
              Stay signed in for 30 days
            </label>
          )}

          <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center">
            {isLoading ? 'Working…' : isSetupMode ? 'Create owner account' : 'Sign in'}
            {!isLoading && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </form>
      </div>

      <p className="mt-4 font-mono text-[11px] text-cockpit-muted">
        Lenovo M710q Tiny · Proxmox VE · Docker runner
      </p>
    </div>
  );
};

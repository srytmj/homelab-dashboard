import React, { useState } from 'react';
import { Shield, KeyRound, User, Lock, AlertCircle, ArrowRight } from 'lucide-react';
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
      setError('Please enter a username.');
      return;
    }

    if (!password) {
      setError('Please enter a password.');
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

      setIsLoading(true);
      const res = await register(username.trim(), password);
      setIsLoading(false);
      if (!res.success) {
        setError(res.message);
      }
    } else {
      setIsLoading(true);
      const res = await login(username.trim(), password, rememberMe);
      setIsLoading(false);
      if (!res.success) {
        setError(res.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center items-center px-4 font-mono select-none">
      {/* Container Box */}
      <div className="w-full max-w-sm rounded-xl bg-[#0d1424] border border-slate-800 p-6 sm:p-8 shadow-2xl">
        
        {/* Minimal Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
            {isSetupMode ? <KeyRound className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide uppercase text-slate-100">
              {isSetupMode ? 'Owner Onboarding' : 'Homelab Cockpit'}
            </h1>
            <p className="text-[11px] text-slate-400">
              {isSetupMode ? '1x Initial Setup (Lockdown)' : 'Owner Authentication'}
            </p>
          </div>
        </div>

        {/* Security Notice for First-Time Setup */}
        {isSetupMode && (
          <div className="mb-5 p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-300 leading-relaxed">
            <span className="font-bold">First-Time Setup:</span> Set your owner credentials. Once created, public registration is locked forever.
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1.5 uppercase tracking-wider text-[10px] font-bold">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1.5 uppercase tracking-wider text-[10px] font-bold">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                autoComplete={isSetupMode ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {isSetupMode && (
            <div>
              <label className="block text-slate-400 mb-1.5 uppercase tracking-wider text-[10px] font-bold">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
          )}

          {!isSetupMode && (
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-[11px]">Remember 30 Days</span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <span>{isLoading ? 'Authenticating...' : isSetupMode ? 'Initialize Owner' : 'Sign In'}</span>
            {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-[10px] text-slate-500">
          Lenovo M710q Tiny • Proxmox & Docker Runner
        </div>
      </div>
    </div>
  );
};

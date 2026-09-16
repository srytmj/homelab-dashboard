import { createPortal } from 'react-dom';
import React, { useState } from 'react';
import { ExternalLink, Pin, PinOff, X } from 'lucide-react';
import { ContainerMetric } from '../types.js';
import { authFetch } from '../utils/api.js';

interface PinDomainModalProps {
  container: ContainerMetric | null;
  onClose: () => void;
  onSaved: () => void;
}

export const PinDomainModal: React.FC<PinDomainModalProps> = ({ container, onClose, onSaved }) => {
  const [publicUrl, setPublicUrl] = useState(container?.publicUrl ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!container) return null;

  const handlePin = async () => {
    setIsSubmitting(true);
    try {
      await authFetch(`/api/pins/${encodeURIComponent(container.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicUrl: publicUrl.trim() || undefined }),
      });
      onSaved();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnpin = async () => {
    setIsSubmitting(true);
    try {
      await authFetch(`/api/pins/${encodeURIComponent(container.name)}`, { method: 'DELETE' });
      onSaved();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="overlay">
      <div className="panel modal-panel w-full max-w-md shadow-2xl shadow-black/50">
        <div className="panel-head">
          <div>
            <h3 className="panel-title">
              {container.isPinned ? 'Edit pin' : 'Pin'} · {container.name}
            </h3>
            <p className="panel-sub">Shows up in the command palette (Ctrl+K)</p>
          </div>
          <button onClick={onClose} className="icon-btn" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="space-y-1.5">
            <label htmlFor="public-url" className="label block">
              Public domain (optional)
            </label>
            <input
              id="public-url"
              type="url"
              placeholder="https://jellyfin.example.com"
              value={publicUrl}
              onChange={(e) => setPublicUrl(e.target.value)}
              disabled={isSubmitting}
              className="field w-full"
            />
            <p className="text-[11.5px] text-cockpit-muted">
              If this container is exposed through a Cloudflare tunnel, the palette links here instead of the LAN
              or Tailscale address.
            </p>
          </div>

          <a
            href="https://dash.cloudflare.com"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost w-full justify-center"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Manage this tunnel on Cloudflare
          </a>

          <div className="flex items-center justify-between gap-2.5 pt-1">
            {container.isPinned ? (
              <button onClick={handleUnpin} disabled={isSubmitting} className="btn-ghost">
                <PinOff className="h-3.5 w-3.5" />
                Unpin
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2.5">
              <button onClick={onClose} disabled={isSubmitting} className="btn-ghost">
                Cancel
              </button>
              <button onClick={handlePin} disabled={isSubmitting} className="btn-primary">
                <Pin className="h-3.5 w-3.5" />
                {container.isPinned ? 'Update' : 'Pin'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

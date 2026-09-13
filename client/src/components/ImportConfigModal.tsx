import React, { useState } from 'react';
import { AlertTriangle, Check, Upload, X } from 'lucide-react';
import { authFetch } from '../utils/api.js';

interface ImportConfigModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportResult {
  success: boolean;
  message: string;
  imported: string[];
}

export const ImportConfigModal: React.FC<ImportConfigModalProps> = ({ onClose, onSuccess }) => {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    setIsSubmitting(true);
    setResult(null);
    try {
      const res = await authFetch('/api/backup/import-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data: ImportResult = await res.json();
      setResult(data);
      if (data.success) {
        onSuccess();
        setTimeout(onClose, 1800);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overlay">
      <div className="panel modal-panel w-full max-w-md shadow-2xl shadow-black/50">
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Import config from a link</h3>
            <p className="panel-sub">Replaces pinned containers and tracked git projects</p>
          </div>
          <button onClick={onClose} className="icon-btn" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-[12.5px] leading-relaxed text-cockpit-muted">
            Paste a link to a small zip containing <code className="font-mono text-cockpit-text">pins.json</code>{' '}
            and/or <code className="font-mono text-cockpit-text">git-projects.json</code> — a "Anyone with the
            link" Google Drive share link works, or any other direct-download URL. This never touches your login.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="import-url" className="label block">
              Link
            </label>
            <input
              id="import-url"
              type="url"
              placeholder="https://drive.google.com/file/d/…/view"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isSubmitting}
              className="field w-full"
            />
          </div>

          {result && (
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12.5px] ${
                result.success ? 'bg-state-good/10 text-state-good' : 'bg-state-bad/10 text-state-bad'
              }`}
            >
              {result.success ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <span>{result.message}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5">
            <button onClick={onClose} disabled={isSubmitting} className="btn-ghost">
              Cancel
            </button>
            <button onClick={handleImport} disabled={isSubmitting || !url.trim()} className="btn-primary">
              <Upload className="h-3.5 w-3.5" />
              {isSubmitting ? 'Importing…' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

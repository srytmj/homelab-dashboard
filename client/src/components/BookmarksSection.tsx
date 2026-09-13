import React, { useEffect, useState } from 'react';
import { ExternalLink, Pencil, Plus, Trash2, X } from 'lucide-react';
import { authFetch } from '../utils/api.js';

interface Bookmark {
  id: string;
  name: string;
  url: string;
}

const faviconFor = (url: string): string | null => {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=64&domain=${host}`;
  } catch {
    return null;
  }
};

const BookmarkModal: React.FC<{
  editing: Bookmark | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ editing, onClose, onSaved }) => {
  const [name, setName] = useState(editing?.name ?? '');
  const [url, setUrl] = useState(editing?.url ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !url.trim()) return;
    setIsSubmitting(true);
    try {
      if (editing) {
        await authFetch(`/api/bookmarks/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, url }),
        });
      } else {
        await authFetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, url }),
        });
      }
      onSaved();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    setIsSubmitting(true);
    try {
      await authFetch(`/api/bookmarks/${editing.id}`, { method: 'DELETE' });
      onSaved();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overlay">
      <div className="panel modal-panel w-full max-w-sm shadow-2xl shadow-black/50">
        <div className="panel-head">
          <h3 className="panel-title">{editing ? 'Edit shortcut' : 'Add shortcut'}</h3>
          <button onClick={onClose} className="icon-btn" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="space-y-1.5">
            <label className="label block">Name</label>
            <input
              type="text"
              placeholder="YouTube"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className="field w-full"
            />
          </div>
          <div className="space-y-1.5">
            <label className="label block">URL</label>
            <input
              type="text"
              placeholder="youtube.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isSubmitting}
              className="field w-full"
            />
          </div>
          <div className="flex items-center justify-between gap-2.5 pt-1">
            {editing ? (
              <button onClick={handleDelete} disabled={isSubmitting} className="btn-ghost">
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2.5">
              <button onClick={onClose} disabled={isSubmitting} className="btn-ghost">
                Cancel
              </button>
              <button onClick={handleSave} disabled={isSubmitting} className="btn-primary">
                {editing ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BookmarksSection: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<Bookmark | null>(null);

  const load = () => {
    authFetch('/api/bookmarks')
      .then((res) => res.json())
      .then(setBookmarks)
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Shortcuts</h2>
          <p className="panel-sub">Personal links, opened in a new tab</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="btn-ghost">
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {bookmarks.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13px] text-cockpit-muted">
          No shortcuts yet — add the links you reach for every day.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {bookmarks.map((b) => {
            const favicon = faviconFor(b.url);
            return (
              <div
                key={b.id}
                className="group relative flex flex-col items-center gap-1.5 rounded-lg border border-cockpit-border bg-cockpit-bg p-3 transition-colors hover:border-cockpit-accent/40"
              >
                <button
                  onClick={() => setEditing(b)}
                  title="Edit"
                  className="absolute right-1 top-1 rounded p-1 text-cockpit-muted opacity-0 transition-opacity hover:text-cockpit-text group-hover:opacity-100"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <a href={b.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5">
                  {favicon ? (
                    <img src={favicon} alt="" className="h-6 w-6 rounded" />
                  ) : (
                    <ExternalLink className="h-6 w-6 text-cockpit-muted" />
                  )}
                  <span className="max-w-full truncate text-[11.5px] text-cockpit-text">{b.name}</span>
                </a>
              </div>
            );
          })}
        </div>
      )}

      {(isAdding || editing) && (
        <BookmarkModal
          editing={editing}
          onClose={() => {
            setIsAdding(false);
            setEditing(null);
          }}
          onSaved={load}
        />
      )}
    </section>
  );
};

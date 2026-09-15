import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, GitBranch, GripVertical, Pencil, Plus, Trash2, X, ArrowUpDown } from 'lucide-react';
import { authFetch } from '../utils/api.js';

interface Bookmark {
  id: string;
  name: string;
  url: string;
  group?: string;
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
  existingGroups: string[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ editing, existingGroups, onClose, onSaved }) => {
  const [name, setName] = useState(editing?.name ?? '');
  const [url, setUrl] = useState(editing?.url ?? '');
  const [group, setGroup] = useState(editing?.group ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !url.trim()) return;
    setIsSubmitting(true);
    try {
      if (editing) {
        await authFetch(`/api/bookmarks/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, url, group }),
        });
      } else {
        await authFetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, url, group }),
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
          <div className="space-y-1.5">
            <label className="label block">Group (optional)</label>
            <input
              type="text"
              list="bookmark-groups"
              placeholder="Media, Admin, …"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              disabled={isSubmitting}
              className="field w-full"
            />
            <datalist id="bookmark-groups">
              {existingGroups.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
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

const UNGROUPED = 'Shortcuts';

export const BookmarksSection: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [originalBookmarks, setOriginalBookmarks] = useState<Bookmark[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const load = () => {
    authFetch('/api/bookmarks')
      .then((res) => res.json())
      .then((data: Bookmark[]) => {
        setBookmarks(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleStartReorder = () => {
    setOriginalBookmarks([...bookmarks]);
    setIsReordering(true);
  };

  const handleCancelReorder = () => {
    setBookmarks(originalBookmarks);
    setIsReordering(false);
    setDraggedIndex(null);
  };

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      const res = await authFetch('/api/bookmarks/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: bookmarks.map((b) => b.id) }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bookmarks) {
          setBookmarks(data.bookmarks);
        }
      }
      setIsReordering(false);
      setDraggedIndex(null);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...bookmarks];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setBookmarks(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const existingGroups = Array.from(new Set(bookmarks.map((b) => b.group).filter((g): g is string => Boolean(g)))).sort();

  const groupedEntries: [string, Bookmark[]][] = (() => {
    const map = new Map<string, Bookmark[]>();
    for (const b of bookmarks) {
      const key = b.group?.trim() || UNGROUPED;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    const entries = Array.from(map.entries());
    entries.sort(([a], [b]) => (a === UNGROUPED ? -1 : b === UNGROUPED ? 1 : a.localeCompare(b)));
    return entries;
  })();

  return (
    <section className="panel animate-fade-in-up stagger-2">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Shortcuts</h2>
          <p className="panel-sub">
            {isReordering
              ? 'Drag & drop kotak shortcut untuk mengatur urutan, lalu klik Save'
              : 'Personal links, opened in a new tab'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick link shortcut to GitHub Repo */}
          <a
            href="https://github.com/srytmj/homelab-dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            title="Open GitHub Repository"
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Repo</span>
          </a>

          {isReordering ? (
            <>
              <button
                onClick={handleCancelReorder}
                disabled={isSavingOrder}
                className="btn-ghost"
                title="Cancel reordering"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
              <button
                onClick={handleSaveOrder}
                disabled={isSavingOrder}
                className="btn-primary"
                title="Save new order"
              >
                <Check className="h-3.5 w-3.5" />
                {isSavingOrder ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <>
              {bookmarks.length > 1 && (
                <button
                  onClick={handleStartReorder}
                  className="btn-ghost"
                  title="Edit urutan shortcut (drag & drop)"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Edit Order</span>
                </button>
              )}
              <button onClick={() => setIsAdding(true)} className="btn-ghost">
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </>
          )}
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="px-5 py-8 text-center flex flex-col items-center justify-center gap-3">
          <p className="text-[13px] text-cockpit-muted">
            Belum ada shortcut tersimpan — tambahkan link yang sering kamu gunakan.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="btn-primary flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Shortcut Pertama</span>
          </button>
        </div>
      ) : isReordering ? (
        <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {bookmarks.map((b, index) => {
            const favicon = faviconFor(b.url);
            return (
              <div
                key={b.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`shortcut-card group relative flex flex-col items-center justify-center gap-2 rounded-lg border p-3.5 text-center select-none transition-all cursor-grab active:cursor-grabbing ${
                  draggedIndex === index
                    ? 'border-cockpit-accent bg-cockpit-accent/15 opacity-40 scale-95 shadow-inner'
                    : 'border-cockpit-accent/40 bg-cockpit-accent/5 hover:border-cockpit-accent hover:bg-cockpit-panel'
                }`}
                title="Drag untuk memindahkan urutan"
              >
                <div className="absolute left-1.5 top-1.5 text-cockpit-accent/70">
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
                {favicon ? (
                  <img src={favicon} alt="" className="pointer-events-none h-7 w-7 rounded object-contain" />
                ) : (
                  <ExternalLink className="pointer-events-none h-7 w-7 text-cockpit-accent" />
                )}
                <span className="pointer-events-none w-full truncate text-[11.5px] font-medium text-cockpit-text">
                  {b.name}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4 p-4">
          {groupedEntries.map(([groupName, items]) => (
            <div key={groupName}>
              {groupName !== UNGROUPED && (
                <p className="label mb-2 !normal-case !tracking-normal text-cockpit-muted">{groupName}</p>
              )}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {items.map((b) => {
                  const favicon = faviconFor(b.url);
                  return (
                    <a
                      key={b.id}
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open ${b.name} (${b.url}) in new tab`}
                      className="shortcut-card group relative flex flex-col items-center justify-center gap-2 rounded-lg border border-cockpit-border bg-cockpit-bg p-3.5 text-center transition-all hover:border-cockpit-accent/50 hover:bg-cockpit-panel/60 active:scale-[0.98] cursor-pointer"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditing(b);
                        }}
                        title="Edit shortcut"
                        className="absolute right-1.5 top-1.5 z-10 rounded p-1 text-cockpit-muted opacity-0 transition-opacity hover:bg-cockpit-panel hover:text-cockpit-text group-hover:opacity-100"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      {favicon ? (
                        <img src={favicon} alt="" className="h-7 w-7 rounded object-contain" />
                      ) : (
                        <ExternalLink className="h-7 w-7 text-cockpit-muted" />
                      )}
                      <span className="w-full truncate text-[11.5px] font-medium text-cockpit-text">
                        {b.name}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {(isAdding || editing) && (
        <BookmarkModal
          editing={editing}
          existingGroups={existingGroups}
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

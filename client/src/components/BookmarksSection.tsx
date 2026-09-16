import React, { useEffect, useState } from 'react';
import { ExternalLink, FolderCog, Pencil, Plus, Trash2, X } from 'lucide-react';
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
  initialGroup?: string;
  existingGroups: string[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ editing, initialGroup, existingGroups, onClose, onSaved }) => {
  const [name, setName] = useState(editing?.name ?? '');
  const [url, setUrl] = useState(editing?.url ?? '');
  const [group, setGroup] = useState(editing?.group ?? initialGroup ?? '');
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
              <button onClick={handleDelete} disabled={isSubmitting} className="btn-ghost text-state-bad hover:bg-state-bad/10">
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

const GroupManageModal: React.FC<{
  groupName: string;
  count: number;
  onClose: () => void;
  onSaved: () => void;
}> = ({ groupName, count, onClose, onSaved }) => {
  const [newName, setNewName] = useState(groupName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRename = async () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === groupName) {
      onClose();
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await authFetch('/api/bookmarks/groups/rename', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName: groupName, newName: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to rename group');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to rename group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (deleteShortcuts: boolean) => {
    const msg = deleteShortcuts
      ? `Delete group "${groupName}" AND remove its ${count} shortcuts?`
      : `Delete group "${groupName}" and move its ${count} shortcuts to Ungrouped?`;
    if (!window.confirm(msg)) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await authFetch(
        `/api/bookmarks/groups/${encodeURIComponent(groupName)}?deleteShortcuts=${deleteShortcuts}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete group');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overlay">
      <div className="panel modal-panel w-full max-w-sm shadow-2xl shadow-black/50">
        <div className="panel-head">
          <h3 className="panel-title">Manage Group</h3>
          <button onClick={onClose} className="icon-btn" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="space-y-1.5">
            <label className="label block">Group Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={isSubmitting}
              className="field w-full"
              placeholder="Group name"
              autoFocus
            />
            <p className="font-mono text-[11px] text-cockpit-muted">
              Contains {count} shortcut{count === 1 ? '' : 's'}.
            </p>
          </div>

          {error && <p className="text-[12px] font-medium text-state-bad">{error}</p>}

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button onClick={onClose} disabled={isSubmitting} className="btn-ghost">
              Cancel
            </button>
            <button onClick={handleRename} disabled={isSubmitting || !newName.trim()} className="btn-primary">
              Rename
            </button>
          </div>

          <div className="border-t border-cockpit-border/60 pt-3 space-y-2">
            <p className="label !normal-case !tracking-normal text-cockpit-muted">Delete options</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleDelete(false)}
                disabled={isSubmitting}
                className="btn-ghost justify-start text-[12px] text-cockpit-text hover:bg-cockpit-panel"
              >
                <Trash2 className="h-3.5 w-3.5 text-cockpit-muted" />
                <span>Ungroup shortcuts (keep links)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(true)}
                disabled={isSubmitting}
                className="btn-ghost justify-start text-[12px] text-state-bad hover:bg-state-bad/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete group and all {count} shortcuts</span>
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
  const [isAdding, setIsAdding] = useState(false);
  const [initialGroup, setInitialGroup] = useState<string | undefined>(undefined);
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [managingGroup, setManagingGroup] = useState<{ name: string; count: number } | null>(null);

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

  const handleOpenAdd = (group?: string) => {
    setInitialGroup(group);
    setIsAdding(true);
  };

  return (
    <section className="panel animate-fade-in-up stagger-2">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Shortcuts</h2>
          <p className="panel-sub">Personal links, opened in a new tab</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleOpenAdd()} className="btn-ghost">
            <Plus className="h-3.5 w-3.5" />
            Add Shortcut
          </button>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="px-5 py-8 text-center flex flex-col items-center justify-center gap-3">
          <p className="text-[13px] text-cockpit-muted">
            No shortcuts saved yet — add your frequently visited links here.
          </p>
          <button
            onClick={() => handleOpenAdd()}
            className="btn-primary flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add First Shortcut</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4 p-4">
          {groupedEntries.map(([groupName, items]) => (
            <div key={groupName} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="label !normal-case !tracking-normal font-semibold text-cockpit-muted">
                    {groupName}
                  </p>
                  <span className="font-mono text-[10.5px] text-cockpit-muted/70">
                    ({items.length})
                  </span>
                </div>
                {groupName !== UNGROUPED && (
                  <button
                    type="button"
                    onClick={() => setManagingGroup({ name: groupName, count: items.length })}
                    className="icon-btn h-6 px-1.5 flex items-center gap-1 text-[11px] text-cockpit-muted hover:text-cockpit-text"
                    title={`Manage group "${groupName}"`}
                  >
                    <FolderCog className="h-3 w-3" />
                    <span className="hidden sm:inline">Manage Group</span>
                  </button>
                )}
              </div>

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
          initialGroup={initialGroup}
          existingGroups={existingGroups}
          onClose={() => {
            setIsAdding(false);
            setEditing(null);
            setInitialGroup(undefined);
          }}
          onSaved={load}
        />
      )}

      {managingGroup && (
        <GroupManageModal
          groupName={managingGroup.name}
          count={managingGroup.count}
          onClose={() => setManagingGroup(null)}
          onSaved={load}
        />
      )}
    </section>
  );
};

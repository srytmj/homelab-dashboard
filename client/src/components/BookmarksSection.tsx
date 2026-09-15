import React, { useEffect, useState, useMemo } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FolderPlus,
  GitBranch,
  GripVertical,
  Layers,
  Pencil,
  Plus,
  Trash2,
  X,
  ArrowUpDown,
} from 'lucide-react';
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

const UNGROUPED = 'Shortcuts';

/** Modal for managing groups (create, view, delete) */
const ManageGroupsModal: React.FC<{
  groups: string[];
  bookmarks: Bookmark[];
  onClose: () => void;
  onGroupAdded: (name: string) => Promise<void>;
  onGroupDeleted: (name: string) => Promise<void>;
}> = ({ groups, bookmarks, onClose, onGroupAdded, onGroupDeleted }) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    if (groups.some((g) => g.toLowerCase() === trimmed.toLowerCase())) {
      setError('Group dengan nama ini sudah ada');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onGroupAdded(trimmed);
      setNewGroupName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const countForGroup = (name: string) => {
    return bookmarks.filter((b) => b.group === name).length;
  };

  return (
    <div className="overlay">
      <div className="panel modal-panel w-full max-w-md shadow-2xl shadow-black/50">
        <div className="panel-head">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-cockpit-accent" />
            <h3 className="panel-title">Kelola Group Shortcut</h3>
          </div>
          <button onClick={onClose} className="icon-btn" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <form onSubmit={handleCreate} className="space-y-2">
            <label className="label block">Buat Group Baru</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: Media, Work, Dev, Tools..."
                value={newGroupName}
                onChange={(e) => {
                  setNewGroupName(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isSubmitting}
                className="field flex-1"
                autoFocus
              />
              <button
                type="submit"
                disabled={isSubmitting || !newGroupName.trim()}
                className="btn-primary inline-flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah</span>
              </button>
            </div>
            {error && <p className="text-[11.5px] text-state-bad">{error}</p>}
          </form>

          <div className="pt-2">
            <label className="label mb-2 block">Daftar Group Tersedia ({groups.length})</label>
            {groups.length === 0 ? (
              <div className="rounded-lg border border-dashed border-cockpit-border p-4 text-center text-[12px] text-cockpit-muted">
                Belum ada group yang dibuat. Buat group di atas untuk mengelompokkan shortcut kamu.
              </div>
            ) : (
              <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                {groups.map((group) => {
                  const count = countForGroup(group);
                  return (
                    <div
                      key={group}
                      className="flex items-center justify-between rounded-lg border border-cockpit-border bg-cockpit-bg px-3 py-2 text-[12.5px]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-cockpit-text truncate">{group}</span>
                        <span className="pill pill-neutral font-mono text-[10px]">
                          {count} shortcut
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onGroupDeleted(group)}
                        className="rounded p-1 text-cockpit-muted hover:bg-cockpit-panel hover:text-state-bad transition-colors"
                        title={`Hapus group ${group}${count > 0 ? ' (shortcut di dalamnya akan masuk ke Ungrouped)' : ''}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={onClose} className="btn-primary">
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookmarkModal: React.FC<{
  editing: Bookmark | null;
  groups: string[];
  onOpenManageGroups: () => void;
  onClose: () => void;
  onSaved: () => void;
}> = ({ editing, groups, onOpenManageGroups, onClose, onSaved }) => {
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
            <div className="flex items-center justify-between">
              <label className="label block">Pilih Group</label>
              <button
                type="button"
                onClick={onOpenManageGroups}
                className="text-[11px] font-semibold text-cockpit-accent hover:underline inline-flex items-center gap-1"
              >
                <FolderPlus className="h-3 w-3" />
                <span>+ Kelola Group</span>
              </button>
            </div>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              disabled={isSubmitting}
              className="field w-full cursor-pointer"
            >
              <option value="">Tanpa Group (Default / Ungrouped)</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
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
  const [groups, setGroups] = useState<string[]>([]);
  const [originalBookmarks, setOriginalBookmarks] = useState<Bookmark[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isManagingGroups, setIsManagingGroups] = useState(false);
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Drag & drop bookmark across groups
  const [draggedBookmarkId, setDraggedBookmarkId] = useState<string | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

  // Collapsed / Minimized groups persistence
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('homelab_collapsed_bookmark_groups');
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      try {
        localStorage.setItem('homelab_collapsed_bookmark_groups', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const loadData = async () => {
    try {
      const [resB, resG] = await Promise.all([
        authFetch('/api/bookmarks'),
        authFetch('/api/bookmarks/groups'),
      ]);
      if (resB.ok) {
        const bData: Bookmark[] = await resB.json();
        setBookmarks(bData);
      }
      if (resG.ok) {
        const gData: string[] = await resG.json();
        setGroups(gData);
      }
    } catch (e) {
      console.warn('Failed to load bookmarks or groups:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGroupAdded = async (name: string) => {
    const res = await authFetch('/api/bookmarks/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.groups) setGroups(data.groups);
      await loadData();
    }
  };

  const handleGroupDeleted = async (name: string) => {
    const res = await authFetch(`/api/bookmarks/groups/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.groups) setGroups(data.groups);
      await loadData();
    }
  };

  // Move bookmark to a different group via drag & drop
  const handleMoveBookmarkToGroup = async (bookmarkId: string, targetGroup: string) => {
    const b = bookmarks.find((item) => item.id === bookmarkId);
    if (!b) return;

    const normalizedTarget = targetGroup === UNGROUPED ? '' : targetGroup;
    const currentGroup = b.group || '';
    if (currentGroup === normalizedTarget) return;

    // Optimistic UI update
    setBookmarks((prev) =>
      prev.map((item) => (item.id === bookmarkId ? { ...item, group: normalizedTarget || undefined } : item))
    );

    try {
      await authFetch(`/api/bookmarks/${bookmarkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: b.name,
          url: b.url,
          group: normalizedTarget,
        }),
      });
      await loadData();
    } catch (err) {
      console.error('Failed to move bookmark to group:', err);
      loadData();
    }
  };

  // Reorder mode handlers
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

  const handleReorderDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleReorderDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...bookmarks];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setBookmarks(updated);
  };

  // Combined unique groups: explicitly registered groups + groups currently in bookmarks
  const allGroups = useMemo(() => {
    const set = new Set(groups);
    for (const b of bookmarks) {
      if (b.group?.trim()) set.add(b.group.trim());
    }
    return Array.from(set).sort();
  }, [groups, bookmarks]);

  // Grouped entries to render on the dashboard:
  // 1. UNGROUPED (Shortcuts) if there are ungrouped bookmarks
  // 2. All user groups (including empty ones so user can drop into them)
  const groupSections = useMemo(() => {
    const result: { groupName: string; items: Bookmark[] }[] = [];

    // Check ungrouped bookmarks
    const ungroupedItems = bookmarks.filter((b) => !b.group?.trim());
    if (ungroupedItems.length > 0 || allGroups.length === 0) {
      result.push({ groupName: UNGROUPED, items: ungroupedItems });
    }

    // Add each defined group
    for (const g of allGroups) {
      const items = bookmarks.filter((b) => b.group === g);
      result.push({ groupName: g, items });
    }

    return result;
  }, [bookmarks, allGroups]);

  return (
    <section className="panel animate-fade-in-up stagger-2">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Shortcuts</h2>
          <p className="panel-sub">
            {isReordering
              ? 'Drag & drop shortcut untuk mengatur urutan, lalu klik Save'
              : 'Drag & drop shortcut langsung ke group tujuan, atau minimize group yang diinginkan'}
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

          {/* Manage Groups session button */}
          {!isReordering && (
            <button
              onClick={() => setIsManagingGroups(true)}
              className="btn-ghost inline-flex items-center gap-1.5"
              title="Kelola group shortcut (bikin, edit, hapus)"
            >
              <Layers className="h-3.5 w-3.5 text-cockpit-accent" />
              <span className="hidden sm:inline">Kelola Group</span>
            </button>
          )}

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

      {bookmarks.length === 0 && allGroups.length === 0 ? (
        <div className="px-5 py-8 text-center flex flex-col items-center justify-center gap-3">
          <p className="text-[13px] text-cockpit-muted">
            Belum ada shortcut tersimpan — tambahkan link yang sering kamu gunakan.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(true)}
              className="btn-primary flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Shortcut Pertama</span>
            </button>
            <button
              onClick={() => setIsManagingGroups(true)}
              className="btn-ghost flex items-center gap-1.5"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Buat Group</span>
            </button>
          </div>
        </div>
      ) : isReordering ? (
        /* REORDER VIEW */
        <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {bookmarks.map((b, index) => {
            const favicon = faviconFor(b.url);
            return (
              <div
                key={b.id}
                draggable={true}
                onDragStart={(e) => handleReorderDragStart(e, index)}
                onDragOver={(e) => handleReorderDragOver(e, index)}
                onDragEnd={() => setDraggedIndex(null)}
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
                {b.group && (
                  <span className="pointer-events-none font-mono text-[9.5px] text-cockpit-muted">
                    {b.group}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* NORMAL GROUPED VIEW WITH DRAG-TO-GROUP AND MINIMIZE */
        <div className="space-y-4 p-4">
          {groupSections.map(({ groupName, items }) => {
            const isCollapsed = collapsedGroups.has(groupName);
            const isHoveredDrop = dragOverGroup === groupName;

            return (
              <div
                key={groupName}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverGroup !== groupName) setDragOverGroup(groupName);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  if (dragOverGroup === groupName) setDragOverGroup(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverGroup(null);
                  const bId = e.dataTransfer.getData('text/plain') || draggedBookmarkId;
                  if (bId) {
                    handleMoveBookmarkToGroup(bId, groupName);
                  }
                  setDraggedBookmarkId(null);
                }}
                className={`rounded-xl border transition-all ${
                  isHoveredDrop
                    ? 'border-cockpit-accent bg-cockpit-accent/10 shadow-md ring-2 ring-cockpit-accent/30'
                    : 'border-cockpit-border/60 bg-cockpit-bg/40'
                }`}
              >
                {/* Group Header with Minimize toggle */}
                <div
                  onClick={() => toggleGroupCollapse(groupName)}
                  className="flex cursor-pointer items-center justify-between px-3.5 py-2.5 transition-colors hover:bg-cockpit-panel/50 rounded-t-xl select-none"
                  title="Klik untuk minimize / expand group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      className="text-cockpit-muted hover:text-cockpit-text transition-transform"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    <span className="font-bold text-[13px] text-cockpit-text truncate">
                      {groupName}
                    </span>
                    <span className="pill pill-neutral font-mono text-[10px]">
                      {items.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-cockpit-muted">
                    {isHoveredDrop && (
                      <span className="font-semibold text-cockpit-accent animate-pulse">
                        Lepaskan untuk pindah ke group ini
                      </span>
                    )}
                    <span className="text-[11px] opacity-70 hidden sm:inline">
                      {isCollapsed ? 'Minimized (klik untuk buka)' : 'Drag shortcut ke sini'}
                    </span>
                  </div>
                </div>

                {/* Group Body: Shortcuts or Empty Drop Target */}
                {!isCollapsed && (
                  <div className="p-3 pt-0.5">
                    {items.length === 0 ? (
                      <div
                        className={`rounded-lg border-2 border-dashed p-5 text-center transition-all ${
                          isHoveredDrop
                            ? 'border-cockpit-accent bg-cockpit-accent/10 text-cockpit-accent'
                            : 'border-cockpit-border/80 text-cockpit-muted'
                        }`}
                      >
                        <p className="text-[12px] font-medium">
                          {isHoveredDrop
                            ? 'Lepaskan untuk memasukkan shortcut ke group ini'
                            : 'Group ini masih kosong — drag shortcut ke sini atau pilih group ini saat menambah shortcut'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {items.map((b) => {
                          const favicon = faviconFor(b.url);
                          const isBeingDragged = draggedBookmarkId === b.id;

                          return (
                            <div
                              key={b.id}
                              draggable={true}
                              onDragStart={(e) => {
                                setDraggedBookmarkId(b.id);
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('text/plain', b.id);
                              }}
                              onDragEnd={() => {
                                setDraggedBookmarkId(null);
                                setDragOverGroup(null);
                              }}
                              className={`shortcut-card group relative flex flex-col items-center justify-center gap-2 rounded-lg border border-cockpit-border bg-cockpit-bg p-3.5 text-center transition-all hover:border-cockpit-accent/50 hover:bg-cockpit-panel/60 active:scale-[0.98] cursor-grab active:cursor-grabbing select-none ${
                                isBeingDragged ? 'opacity-30 border-dashed border-cockpit-accent scale-95' : ''
                              }`}
                              title="Klik untuk buka link, atau drag ke group lain"
                            >
                              <a
                                href={b.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center gap-2 w-full"
                                onClick={(e) => {
                                  // Don't open if dragged
                                  if (draggedBookmarkId) e.preventDefault();
                                }}
                              >
                                {favicon ? (
                                  <img
                                    src={favicon}
                                    alt=""
                                    className="pointer-events-none h-7 w-7 rounded object-contain"
                                  />
                                ) : (
                                  <ExternalLink className="pointer-events-none h-7 w-7 text-cockpit-muted" />
                                )}
                                <span className="pointer-events-none w-full truncate text-[11.5px] font-medium text-cockpit-text">
                                  {b.name}
                                </span>
                              </a>

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
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Shortcut Modal */}
      {(isAdding || editing) && (
        <BookmarkModal
          editing={editing}
          groups={allGroups}
          onOpenManageGroups={() => setIsManagingGroups(true)}
          onClose={() => {
            setIsAdding(false);
            setEditing(null);
          }}
          onSaved={loadData}
        />
      )}

      {/* Manage Groups Modal */}
      {isManagingGroups && (
        <ManageGroupsModal
          groups={allGroups}
          bookmarks={bookmarks}
          onClose={() => setIsManagingGroups(false)}
          onGroupAdded={handleGroupAdded}
          onGroupDeleted={handleGroupDeleted}
        />
      )}
    </section>
  );
};

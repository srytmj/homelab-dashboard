import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface BookmarkRecord {
  id: string;
  name: string;
  url: string;
  group?: string;
  addedAt: number;
}

interface BookmarksDb {
  bookmarks: BookmarkRecord[];
  groups?: string[];
}

/**
 * Personal web shortcuts (YouTube, Gmail, whatever the owner reaches for) —
 * a plain link list, not tied to a container. Same server-owned JSON shape
 * as PinsService: the client never persists these itself.
 */
export class BookmarksService {
  private dbPath: string;
  private db: BookmarksDb;

  constructor() {
    const dataDir = path.resolve(__dirname, '../../../data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // fallback
      }
    }
    this.dbPath = path.join(dataDir, 'bookmarks.json');
    this.db = this.loadDb();
  }

  private loadDb(): BookmarksDb {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[BookmarksService] Error reading bookmarks database:', err);
    }
    return { bookmarks: [] };
  }

  private saveDb() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('[BookmarksService] Error writing bookmarks database:', err);
    }
  }

  public getAll(): BookmarkRecord[] {
    return this.db.bookmarks;
  }

  public getGroups(): string[] {
    const custom = this.db.groups || [];
    const fromBookmarks = this.db.bookmarks
      .map((b) => b.group?.trim())
      .filter((g): g is string => Boolean(g));
    return Array.from(new Set([...custom, ...fromBookmarks])).sort();
  }

  public addGroup(name: string): string[] {
    const trimmed = name.trim();
    if (!trimmed) return this.getGroups();
    if (!this.db.groups) this.db.groups = [];
    if (!this.db.groups.includes(trimmed)) {
      this.db.groups.push(trimmed);
      this.saveDb();
    }
    return this.getGroups();
  }

  public add(name: string, url: string, group?: string): BookmarkRecord {
    const record: BookmarkRecord = {
      id: crypto.randomUUID(),
      name: name.trim(),
      url: this.normalizeUrl(url),
      group: group?.trim() || undefined,
      addedAt: Date.now(),
    };
    this.db.bookmarks.push(record);
    this.saveDb();
    return record;
  }

  public update(id: string, name: string, url: string, group?: string): BookmarkRecord | null {
    const record = this.db.bookmarks.find((b) => b.id === id);
    if (!record) return null;
    record.name = name.trim();
    record.url = this.normalizeUrl(url);
    record.group = group?.trim() || undefined;
    this.saveDb();
    return record;
  }

  public reorder(orderedIds: string[]): BookmarkRecord[] {
    const map = new Map(this.db.bookmarks.map((b) => [b.id, b]));
    const reordered: BookmarkRecord[] = [];
    for (const id of orderedIds) {
      const item = map.get(id);
      if (item) {
        reordered.push(item);
        map.delete(id);
      }
    }
    // Append any remaining bookmarks not specified in orderedIds
    for (const item of map.values()) {
      reordered.push(item);
    }
    this.db.bookmarks = reordered;
    this.saveDb();
    return this.db.bookmarks;
  }

  public renameGroup(oldName: string, newName: string): number {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();
    if (!trimmedOld || !trimmedNew || trimmedOld === trimmedNew) return 0;
    let count = 0;
    for (const b of this.db.bookmarks) {
      if (b.group === trimmedOld) {
        b.group = trimmedNew;
        count++;
      }
    }
    if (count > 0) this.saveDb();
    return count;
  }

  public deleteGroup(groupName: string, deleteShortcuts = false): number {
    const trimmed = groupName.trim();
    if (!trimmed) return 0;
    if (this.db.groups) {
      this.db.groups = this.db.groups.filter((g) => g !== trimmed);
    }
    if (deleteShortcuts) {
      const initialCount = this.db.bookmarks.length;
      this.db.bookmarks = this.db.bookmarks.filter((b) => b.group !== trimmed);
      const deleted = initialCount - this.db.bookmarks.length;
      this.saveDb();
      return deleted;
    } else {
      let count = 0;
      for (const b of this.db.bookmarks) {
        if (b.group === trimmed) {
          b.group = undefined;
          count++;
        }
      }
      this.saveDb();
      return count;
    }
  }

  public remove(id: string) {
    this.db.bookmarks = this.db.bookmarks.filter((b) => b.id !== id);
    this.saveDb();
  }

  // Same reasoning as PinsService.normalizeUrl: a bare domain resolves as a
  // relative path against the dashboard's own origin when opened client-side.
  private normalizeUrl(raw: string): string {
    const trimmed = raw.trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }
}

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type NotificationType =
  | 'pin'
  | 'unpin'
  | 'git-track'
  | 'git-untrack'
  | 'git-pull-start'
  | 'git-pull-success'
  | 'git-pull-failed'
  | 'git-auto-deploy';

export interface NotificationEntry {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: number;
}

interface NotificationsDb {
  entries: NotificationEntry[];
}

const MAX_ENTRIES = 50;

/**
 * A flat activity feed — pin/unpin, track/untrack, and every pull & rebuild
 * lifecycle event — so the owner can see what happened without having to
 * be watching the page it happened on. Persisted so it survives a restart,
 * capped at MAX_ENTRIES so it never grows into a real log store.
 */
export class NotificationsService {
  private dbPath: string;
  private db: NotificationsDb;

  constructor() {
    const dataDir = path.resolve(__dirname, '../../../data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // fallback
      }
    }
    this.dbPath = path.join(dataDir, 'notifications.json');
    this.db = this.loadDb();
  }

  private loadDb(): NotificationsDb {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[NotificationsService] Error reading database:', err);
    }
    return { entries: [] };
  }

  private saveDb() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('[NotificationsService] Error writing database:', err);
    }
  }

  public add(type: NotificationType, message: string): NotificationEntry {
    const entry: NotificationEntry = {
      id: crypto.randomUUID(),
      type,
      message,
      createdAt: Date.now(),
    };
    this.db.entries.unshift(entry);
    this.db.entries = this.db.entries.slice(0, MAX_ENTRIES);
    this.saveDb();
    return entry;
  }

  public getAll(): NotificationEntry[] {
    return this.db.entries;
  }

  public clear() {
    this.db.entries = [];
    this.saveDb();
  }
}

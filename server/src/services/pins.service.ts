import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PinRecord {
  publicUrl?: string;
  pinnedAt: number;
}

interface PinsDb {
  pins: Record<string, PinRecord>;
}

export class PinsService {
  private dbPath: string;
  private db: PinsDb;

  constructor() {
    const dataDir = path.resolve(__dirname, '../../../data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // fallback
      }
    }
    this.dbPath = path.join(dataDir, 'pins.json');
    this.db = this.loadDb();
  }

  private loadDb(): PinsDb {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[PinsService] Error reading pins database:', err);
    }
    return { pins: {} };
  }

  private saveDb() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('[PinsService] Error writing pins database:', err);
    }
  }

  public getAll(): Record<string, PinRecord> {
    return this.db.pins;
  }

  public pin(name: string, publicUrl?: string): PinRecord {
    const existing = this.db.pins[name];
    const record: PinRecord = {
      publicUrl: this.normalizeUrl(publicUrl),
      pinnedAt: existing?.pinnedAt ?? Date.now(),
    };
    this.db.pins[name] = record;
    this.saveDb();
    return record;
  }

  /**
   * A domain typed without a scheme (e.g. "vault.example.com") is not an
   * absolute URL. Opening it client-side with window.open() then resolves
   * it as a path relative to the dashboard's own origin instead of the
   * container's actual address, so every stored publicUrl must carry a
   * scheme before it ever reaches the client.
   */
  private normalizeUrl(raw?: string): string | undefined {
    const trimmed = raw?.trim();
    if (!trimmed) return undefined;
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }

  public unpin(name: string) {
    delete this.db.pins[name];
    this.saveDb();
  }
}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SettingsData {
  primaryNodeName?: string;
}

export class SettingsService {
  private dbPath: string;
  private settings: SettingsData;

  constructor() {
    const dataDir = path.resolve(__dirname, '../../../data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // fallback
      }
    }
    this.dbPath = path.join(dataDir, 'settings.json');
    this.settings = this.loadSettings();
  }

  private loadSettings(): SettingsData {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[SettingsService] Error reading settings database:', err);
    }
    return {};
  }

  private saveSettings(): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (err) {
      console.error('[SettingsService] Error saving settings database:', err);
    }
  }

  public getSettings(): SettingsData {
    return { ...this.settings };
  }

  public getPrimaryNodeName(): string | undefined {
    const trimmed = this.settings.primaryNodeName?.trim();
    return trimmed ? trimmed : undefined;
  }

  public updateSettings(partial: Partial<SettingsData>): SettingsData {
    if (partial.primaryNodeName !== undefined) {
      const trimmed = partial.primaryNodeName.trim();
      if (trimmed.length > 0) {
        this.settings.primaryNodeName = trimmed;
      } else {
        delete this.settings.primaryNodeName;
      }
    }
    this.saveSettings();
    return this.getSettings();
  }
}

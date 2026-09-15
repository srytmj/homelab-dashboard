import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface UserRecord {
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
}

interface SessionRecord {
  token: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

interface AuthDb {
  owner: UserRecord | null;
  sessions: SessionRecord[];
}

export class AuthService {
  private dbPath: string;
  private db: AuthDb;

  constructor() {
    // Store in root /data directory or server/.data
    const dataDir = path.resolve(__dirname, '../../../data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // fallback
      }
    }
    this.dbPath = path.join(dataDir, 'auth.json');
    this.db = this.loadDb();
  }

  private loadDb(): AuthDb {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[AuthService] Error reading auth database:', err);
    }
    return { owner: null, sessions: [] };
  }

  private saveDb() {
    try {
      // Clean expired sessions
      const now = Date.now();
      this.db.sessions = this.db.sessions.filter(s => s.expiresAt > now);
      fs.writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('[AuthService] Error writing auth database:', err);
    }
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.scryptSync(password, salt, 64).toString('hex');
  }

  public isRegistered(): boolean {
    return this.db.owner !== null;
  }

  public getUsername(): string | null {
    return this.db.owner?.username ?? null;
  }

  public registerOwner(username: string, password: string): { success: boolean; message: string; token?: string; username?: string } {
    if (this.isRegistered()) {
      return { success: false, message: 'Registration is closed. Owner account already exists.' };
    }

    const cleanUsername = username.trim();
    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, message: 'Username must be at least 3 characters.' };
    }

    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(password, salt);

    this.db.owner = {
      username: cleanUsername,
      passwordHash,
      salt,
      createdAt: Date.now(),
    };

    // Create initial session valid for 30 days
    const token = this.createSession(cleanUsername, true);
    this.saveDb();

    console.log(`[AuthService] 👑 Owner account successfully initialized for "${cleanUsername}". Registration is now permanently locked.`);

    return {
      success: true,
      message: 'Owner account created successfully.',
      token,
      username: cleanUsername,
    };
  }

  public login(username: string, password: string, rememberMe = true): { success: boolean; message: string; token?: string; username?: string } {
    if (!this.isRegistered() || !this.db.owner) {
      return { success: false, message: 'No owner registered. Please complete initial setup.' };
    }

    const cleanUsername = username.trim();
    if (cleanUsername.toLowerCase() !== this.db.owner.username.toLowerCase()) {
      return { success: false, message: 'Invalid username or password.' };
    }

    const hash = this.hashPassword(password, this.db.owner.salt);
    if (!crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(this.db.owner.passwordHash, 'hex'))) {
      return { success: false, message: 'Invalid username or password.' };
    }

    const token = this.createSession(this.db.owner.username, rememberMe);
    this.saveDb();

    return {
      success: true,
      message: 'Login successful.',
      token,
      username: this.db.owner.username,
    };
  }

  public changePassword(currentPassword: string, newPassword: string): { success: boolean; message: string } {
    if (!this.isRegistered() || !this.db.owner) {
      return { success: false, message: 'No registered owner account found.' };
    }

    if (!currentPassword) {
      return { success: false, message: 'Current password is required.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }

    const currentHash = this.hashPassword(currentPassword, this.db.owner.salt);
    if (!crypto.timingSafeEqual(Buffer.from(currentHash, 'hex'), Buffer.from(this.db.owner.passwordHash, 'hex'))) {
      return { success: false, message: 'Current password does not match.' };
    }

    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = this.hashPassword(newPassword, newSalt);

    this.db.owner.passwordHash = newHash;
    this.db.owner.salt = newSalt;
    this.saveDb();

    console.log(`[AuthService] Password successfully updated for user "${this.db.owner.username}".`);
    return { success: true, message: 'Password updated successfully.' };
  }

  public validateToken(token: string): boolean {
    if (!token) return false;
    const now = Date.now();
    const session = this.db.sessions.find(s => s.token === token);
    if (!session) return false;

    if (session.expiresAt < now) {
      this.db.sessions = this.db.sessions.filter(s => s.token !== token);
      this.saveDb();
      return false;
    }

    return true;
  }

  public logout(token: string) {
    this.db.sessions = this.db.sessions.filter(s => s.token !== token);
    this.saveDb();
  }

  private createSession(username: string, rememberMe: boolean): string {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    // 30 days if rememberMe, otherwise 24 hours
    const ttlMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    this.db.sessions.push({
      token,
      username,
      createdAt: now,
      expiresAt: now + ttlMs,
    });

    return token;
  }
}

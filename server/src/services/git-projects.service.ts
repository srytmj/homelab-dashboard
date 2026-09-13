import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { GitProjectStatus } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GitProjectRecord {
  repoOwner: string;
  repoName: string;
  branch: string;
  lastKnownSha?: string;
  // Cached result of the last successful GitHub check, so every collector
  // tick can return instantly without hitting the network.
  cachedLatestSha?: string;
  cachedLatestMessage?: string;
  cachedLatestDate?: string;
  lastCheckedAt?: number;
}

interface GitProjectsDb {
  projects: Record<string, GitProjectRecord>;
}

interface GithubCommit {
  sha: string;
  commit: { message: string; committer?: { date?: string } };
}

export class GitProjectsService {
  private dbPath: string;
  private db: GitProjectsDb;

  constructor() {
    const dataDir = path.resolve(__dirname, '../../../data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // fallback
      }
    }
    this.dbPath = path.join(dataDir, 'git-projects.json');
    this.db = this.loadDb();
  }

  private loadDb(): GitProjectsDb {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[GitProjectsService] Error reading database:', err);
    }
    return { projects: {} };
  }

  private saveDb() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('[GitProjectsService] Error writing database:', err);
    }
  }

  public getRegistered(): Record<string, GitProjectRecord> {
    return this.db.projects;
  }

  public register(containerName: string, repoOwner: string, repoName: string, branch: string): GitProjectRecord {
    const existing = this.db.projects[containerName];
    const record: GitProjectRecord = {
      repoOwner: repoOwner.trim(),
      repoName: repoName.trim(),
      branch: branch.trim() || 'main',
      lastKnownSha: existing?.lastKnownSha,
    };
    this.db.projects[containerName] = record;
    this.saveDb();
    return record;
  }

  public unregister(containerName: string) {
    delete this.db.projects[containerName];
    this.saveDb();
  }

  /** Marks the currently deployed commit, e.g. after a manual pull outside the dashboard. */
  public markDeployed(containerName: string, sha: string) {
    const record = this.db.projects[containerName];
    if (!record) return;
    record.lastKnownSha = sha;
    this.saveDb();
  }

  /**
   * Returns every registered project's status instantly from cache, kicking
   * off a background refresh for any project whose cache is older than
   * config.githubCheckIntervalMs. Never awaits the network itself, so this
   * is safe to call on every collector tick.
   */
  public getSnapshot(): GitProjectStatus[] {
    const now = Date.now();
    return Object.entries(this.db.projects).map(([containerName, record]) => {
      const isStale = !record.lastCheckedAt || now - record.lastCheckedAt > config.githubCheckIntervalMs;
      if (isStale) {
        // Fire-and-forget; the next tick(s) will pick up the refreshed cache.
        this.refresh(containerName, record).catch(() => {});
      }

      return {
        containerName,
        repoOwner: record.repoOwner,
        repoName: record.repoName,
        branch: record.branch,
        latestSha: record.cachedLatestSha,
        latestCommitMessage: record.cachedLatestMessage,
        latestCommitDate: record.cachedLatestDate,
        lastKnownSha: record.lastKnownSha,
        hasUpdate: Boolean(
          record.lastKnownSha && record.cachedLatestSha && record.cachedLatestSha !== record.lastKnownSha
        ),
      };
    });
  }

  private async refresh(containerName: string, record: GitProjectRecord): Promise<void> {
    // Mark checked immediately so concurrent ticks don't fire duplicate requests.
    record.lastCheckedAt = Date.now();

    try {
      const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
      if (config.githubToken) headers.Authorization = `token ${config.githubToken}`;

      const url = `https://api.github.com/repos/${record.repoOwner}/${record.repoName}/commits/${record.branch}`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);

      const commit = (await res.json()) as GithubCommit;
      record.cachedLatestSha = commit.sha;
      record.cachedLatestMessage = commit.commit.message.split('\n')[0];
      record.cachedLatestDate = commit.commit.committer?.date;
      this.saveDb();
    } catch (err) {
      console.warn(`[GitProjectsService] Check failed for ${record.repoOwner}/${record.repoName}:`, err);
    }
  }
}

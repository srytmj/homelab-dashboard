import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile as execFileCb, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { config } from '../config.js';
import { GitProjectStatus, GitPullState } from '../types.js';
import { NotificationsService } from './notifications.service.js';

const execFile = promisify(execFileCb);
const MAX_PULL_LOG_LINES = 400;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type RebuildCommand = 'compose-up-build' | 'compose-up-build-force-recreate';

const REBUILD_ARGS: Record<RebuildCommand, string[]> = {
  'compose-up-build': ['compose', 'up', '-d', '--build'],
  'compose-up-build-force-recreate': ['compose', 'up', '-d', '--build', '--force-recreate'],
};

// Files matching any of these are treated as a signal that pulling might
// change the database — a heuristic, not a guarantee. See docs/USER_MANUAL.md.
const MIGRATION_RISK_PATTERNS = [/migrations\//i, /prisma\/schema\.prisma$/i, /alembic\//i, /\.sql$/i];

const EXEC_OPTS = { timeout: 5 * 60 * 1000, maxBuffer: 10 * 1024 * 1024 };

interface GitProjectRecord {
  repoOwner: string;
  repoName: string;
  branch: string;
  localPath?: string;
  rebuildCommand?: RebuildCommand;
  lastKnownSha?: string;
  // Cached result of the last successful GitHub check, so every collector
  // tick can return instantly without hitting the network.
  cachedLatestSha?: string;
  cachedLatestMessage?: string;
  cachedLatestDate?: string;
  lastCheckedAt?: number;
  // Opt-in per project — see pullIfSafe() below for what "safe" means.
  autoDeploy?: boolean;
  // Set when autoDeploy found a migration-risk file and backed off, so the
  // UI can explain why an update is sitting there instead of deploying itself.
  autoDeployBlocked?: boolean;
}

interface GitProjectsDb {
  projects: Record<string, GitProjectRecord>;
}

interface GithubCommit {
  sha: string;
  commit: { message: string; committer?: { date?: string } };
}

export interface CheckPullResult {
  ok: boolean;
  message?: string;
  riskyFiles: string[];
  changedFiles: string[];
}

export interface PullResult {
  success: boolean;
  message: string;
  newSha?: string;
}

export class GitProjectsService {
  private dbPath: string;
  private db: GitProjectsDb;
  private pullStates: Map<string, GitPullState> = new Map();

  constructor(private notifications: NotificationsService) {
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

  public async register(
    containerName: string,
    repoOwner: string,
    repoName: string,
    branch: string,
    localPath?: string,
    rebuildCommand?: RebuildCommand,
    autoDeploy?: boolean
  ): Promise<GitProjectRecord> {
    const existing = this.db.projects[containerName];
    const record: GitProjectRecord = {
      repoOwner: repoOwner.trim(),
      repoName: repoName.trim(),
      branch: branch.trim() || 'main',
      localPath: localPath?.trim() || existing?.localPath,
      rebuildCommand: rebuildCommand || existing?.rebuildCommand,
      lastKnownSha: existing?.lastKnownSha,
      autoDeploy: autoDeploy ?? existing?.autoDeploy ?? false,
    };
    this.db.projects[containerName] = record;

    // A project usually already exists and is running by the time it's
    // tracked here — without a baseline it would show "Not deployed yet"
    // forever until the owner found the manual mark-deployed button. Best
    // effort: if this is the first time localPath is set and there's no
    // baseline yet, read whatever commit is actually checked out right now.
    if (record.localPath && !record.lastKnownSha) {
      try {
        const cwd = this.resolveWorkingTree(record);
        const { stdout } = await execFile('git', ['-C', cwd, 'rev-parse', 'HEAD'], EXEC_OPTS);
        record.lastKnownSha = stdout.trim();
      } catch {
        // No working tree there yet, or it's not a git repo — leave it
        // unset, same as before; the owner can still use the manual button.
      }
    }

    this.saveDb();
    this.notifications.add(
      existing ? 'git-track' : 'git-track',
      existing ? `Updated ${containerName} (${record.repoOwner}/${record.repoName})` : `Tracking ${containerName} (${record.repoOwner}/${record.repoName})`
    );
    return record;
  }

  public unregister(containerName: string) {
    delete this.db.projects[containerName];
    this.pullStates.delete(containerName);
    this.saveDb();
    this.notifications.add('git-untrack', `Stopped tracking ${containerName}`);
  }

  /** Marks the currently deployed commit, e.g. after a manual pull outside the dashboard. */
  public markDeployed(containerName: string, sha: string) {
    const record = this.db.projects[containerName];
    if (!record) return;
    record.lastKnownSha = sha;
    this.saveDb();
  }

  /**
   * Reads whatever commit is actually checked out on disk right now and
   * records that as deployed — for a project that was already running
   * before it was tracked here (a manual `git pull` outside the dashboard,
   * or the initial deploy). Without this, a freshly-tracked project always
   * starts as "Not deployed yet" even though it's clearly running, because
   * this dashboard has no baseline until either this or a pull happens.
   */
  public async markDeployedFromLocal(containerName: string): Promise<PullResult> {
    const record = this.db.projects[containerName];
    if (!record) return { success: false, message: 'Not tracked.' };

    let cwd: string;
    try {
      cwd = this.resolveWorkingTree(record);
    } catch (err: any) {
      return { success: false, message: err.message };
    }

    try {
      const { stdout } = await execFile('git', ['-C', cwd, 'rev-parse', 'HEAD'], EXEC_OPTS);
      const sha = stdout.trim();
      record.lastKnownSha = sha;
      this.saveDb();
      return { success: true, message: `Marked ${sha.slice(0, 7)} as deployed.`, newSha: sha };
    } catch (err: any) {
      return { success: false, message: err.message || 'Could not read the current commit.' };
    }
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
        localPath: record.localPath,
        rebuildCommand: record.rebuildCommand,
        autoDeploy: record.autoDeploy ?? false,
        autoDeployBlocked: record.autoDeployBlocked ?? false,
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

  /**
   * Forces an immediate GitHub check for every registered project, ignoring
   * githubCheckIntervalMs — used by the manual refresh button, so it's the
   * one place in this service that does await the network on request.
   */
  public async refreshAll(): Promise<void> {
    await Promise.all(
      Object.entries(this.db.projects).map(([containerName, record]) => this.refresh(containerName, record))
    );
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

      if (record.autoDeploy && record.lastKnownSha && record.cachedLatestSha !== record.lastKnownSha) {
        await this.autoDeployIfSafe(containerName, record);
      }
    } catch (err) {
      console.warn(`[GitProjectsService] Check failed for ${record.repoOwner}/${record.repoName}:`, err);
    }
  }

  /**
   * Auto-deploy is opt-in per project (see the `autoDeploy` toggle) and only
   * ever proceeds when checkPull() reports zero migration-risk files — the
   * same heuristic the manual Pull & rebuild confirmation shows the owner.
   * A migration-risk file sets autoDeployBlocked instead of deploying, so
   * the project waits for a manual, informed click rather than silently
   * running something that might touch the database unattended.
   */
  private async autoDeployIfSafe(containerName: string, record: GitProjectRecord): Promise<void> {
    if (!record.localPath || !record.rebuildCommand) return;

    const check = await this.checkPull(containerName);
    if (!check.ok) return;

    if (check.riskyFiles.length > 0) {
      if (!record.autoDeployBlocked) {
        record.autoDeployBlocked = true;
        this.saveDb();
        console.warn(
          `[GitProjectsService] Auto-deploy paused for ${containerName}: migration-risk files detected`,
          check.riskyFiles
        );
      }
      return;
    }

    record.autoDeployBlocked = false;
    this.notifications.add('git-auto-deploy', `Auto-deploying ${containerName} — new commit detected`);
    const result = await this.pullAndRebuild(containerName);
    if (!result.success) {
      console.warn(`[GitProjectsService] Auto-deploy failed for ${containerName}:`, result.message);
    }
  }

  /**
   * Resolves a project's working tree to an absolute path and confirms it's
   * actually inside config.gitProjectsRoot — localPath is owner-entered, so
   * this blocks a value like "../../etc" from escaping the mounted directory.
   */
  private resolveWorkingTree(record: GitProjectRecord): string {
    if (!record.localPath) {
      throw new Error('This project has no local path configured yet — edit it to add one.');
    }
    const resolved = path.resolve(config.gitProjectsRoot, record.localPath);
    const root = path.resolve(config.gitProjectsRoot);
    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
      throw new Error('localPath must resolve inside the Git Projects root.');
    }
    if (!fs.existsSync(resolved)) {
      throw new Error(`${resolved} does not exist inside the container — check the bind mount and localPath.`);
    }
    return resolved;
  }

  /**
   * Read-only: fetches upstream and lists which files would change on pull,
   * flagging any that match a migration-risk pattern. Never modifies the
   * working tree — safe to call speculatively before the owner confirms.
   */
  public async checkPull(containerName: string): Promise<CheckPullResult> {
    const record = this.db.projects[containerName];
    if (!record) return { ok: false, message: 'Not tracked.', riskyFiles: [], changedFiles: [] };

    try {
      const cwd = this.resolveWorkingTree(record);
      await execFile('git', ['-C', cwd, 'fetch', 'origin', record.branch], EXEC_OPTS);
      const { stdout } = await execFile(
        'git',
        ['-C', cwd, 'diff', '--name-only', `HEAD..origin/${record.branch}`],
        EXEC_OPTS
      );
      const changedFiles = stdout.split('\n').map((l) => l.trim()).filter(Boolean);
      const riskyFiles = changedFiles.filter((f) => MIGRATION_RISK_PATTERNS.some((p) => p.test(f)));

      // Local HEAD already matches origin — if the stored baseline still
      // disagrees (stale from a manual pull outside the dashboard, or from
      // before this project had a local path), self-heal it here rather
      // than leaving "Update available" showing with nothing left to pull.
      if (changedFiles.length === 0) {
        const { stdout: headOut } = await execFile('git', ['-C', cwd, 'rev-parse', 'HEAD'], EXEC_OPTS);
        const head = headOut.trim();
        if (record.lastKnownSha !== head) {
          record.lastKnownSha = head;
          this.saveDb();
        }
      }

      return { ok: true, riskyFiles, changedFiles };
    } catch (err: any) {
      return { ok: false, message: err.message, riskyFiles: [], changedFiles: [] };
    }
  }

  /** Current pull/rebuild state for a project — polled by the client for the inline live log view. */
  public getPullState(containerName: string): GitPullState {
    return (
      this.pullStates.get(containerName) ?? {
        status: 'idle',
        log: [],
      }
    );
  }

  /**
   * Kicks off git pull + rebuild in the background and returns immediately
   * — the caller polls getPullState() for live progress instead of waiting
   * on this request. Refuses a second concurrent run for the same project.
   * `force` still only ever runs the same fixed pull-then-rebuild sequence;
   * it just means "run it even though checkPull found nothing to pull",
   * for the case where the working tree already matches origin but the
   * running container doesn't reliably reflect it (a bad image layer cache,
   * a rebuild that silently failed last time, etc).
   */
  public startPull(containerName: string): { started: boolean; message?: string } {
    const record = this.db.projects[containerName];
    if (!record) return { started: false, message: 'Not tracked.' };
    if (!record.rebuildCommand) {
      return { started: false, message: 'No rebuild command configured — edit this project to set one.' };
    }
    const current = this.pullStates.get(containerName);
    if (current && (current.status === 'pulling' || current.status === 'rebuilding')) {
      return { started: false, message: 'Already running.' };
    }

    this.notifications.add('git-pull-start', `Pulling ${containerName}…`);
    this.pullAndRebuild(containerName).catch(() => {});
    return { started: true };
  }

  /**
   * git pull followed by the project's fixed rebuild command. The request
   * only ever names *which* registered project — the argv actually run is
   * resolved here from rebuildCommand, never taken from the request body.
   * Runs both steps through spawn (not execFile) so output streams into
   * pullStates as it happens, for startPull()'s live log view; autoDeploy
   * awaits this directly instead of going through startPull.
   */
  public async pullAndRebuild(containerName: string): Promise<PullResult> {
    const record = this.db.projects[containerName];
    if (!record) return { success: false, message: 'Not tracked.' };
    if (!record.rebuildCommand) {
      return { success: false, message: 'No rebuild command configured — edit this project to set one.' };
    }

    const state: GitPullState = { status: 'pulling', log: [], startedAt: Date.now() };
    this.pullStates.set(containerName, state);

    const appendLog = (line: string) => {
      state.log.push(line);
      if (state.log.length > MAX_PULL_LOG_LINES) state.log.splice(0, state.log.length - MAX_PULL_LOG_LINES);
    };

    let cwd: string;
    try {
      cwd = this.resolveWorkingTree(record);
    } catch (err: any) {
      state.status = 'failed';
      state.message = err.message;
      state.finishedAt = Date.now();
      this.notifications.add('git-pull-failed', `${containerName}: ${err.message}`);
      return { success: false, message: err.message };
    }

    try {
      appendLog(`$ git pull origin ${record.branch}`);
      await this.spawnCapture('git', ['-C', cwd, 'pull', 'origin', record.branch], cwd, appendLog);

      const { stdout: shaOut } = await execFile('git', ['-C', cwd, 'rev-parse', 'HEAD'], EXEC_OPTS);
      const newSha = shaOut.trim();

      state.status = 'rebuilding';
      appendLog(`$ docker ${REBUILD_ARGS[record.rebuildCommand].join(' ')}`);
      await this.spawnCapture('docker', REBUILD_ARGS[record.rebuildCommand], cwd, appendLog);

      record.lastKnownSha = newSha;
      this.saveDb();

      const message = `Pulled and rebuilt at ${newSha.slice(0, 7)}.`;
      state.status = 'success';
      state.message = message;
      state.finishedAt = Date.now();
      this.notifications.add('git-pull-success', `${containerName}: ${message}`);
      return { success: true, message, newSha };
    } catch (err: any) {
      const message = err.message || 'Pull/rebuild failed.';
      state.status = 'failed';
      state.message = message;
      state.finishedAt = Date.now();
      this.notifications.add('git-pull-failed', `${containerName}: ${message}`);
      return { success: false, message };
    }
  }

  /** Runs a fixed command via spawn, streaming each output line into onLine, and rejects on a non-zero exit. */
  private spawnCapture(cmd: string, args: string[], cwd: string, onLine: (line: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args, { cwd, timeout: EXEC_OPTS.timeout });
      const pipe = (stream: NodeJS.ReadableStream) => {
        let buffer = '';
        stream.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) onLine(line);
        });
        stream.on('end', () => {
          if (buffer.trim()) onLine(buffer);
        });
      };
      pipe(child.stdout);
      pipe(child.stderr);
      child.on('error', (err) => reject(err));
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${cmd} exited with code ${code}`));
      });
    });
  }
}

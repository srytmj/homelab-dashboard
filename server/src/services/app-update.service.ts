import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile as execFileCb, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { config } from '../config.js';
import { AppUpdateStatus, AppUpdateState, UpdateAnnouncement } from '../types.js';
import { NotificationsService } from './notifications.service.js';

const execFile = promisify(execFileCb);
const MAX_UPDATE_LOG_LINES = 500;
const EXEC_OPTS = { timeout: 10 * 60 * 1000, maxBuffer: 20 * 1024 * 1024 };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GithubCommit {
  sha: string;
  html_url?: string;
  commit: {
    message: string;
    committer?: {
      date?: string;
    };
  };
}

export class AppUpdateService {
  private repoRoot: string;
  private isGitRepo: boolean = false;
  private repoOwner: string = 'srytmj';
  private repoName: string = 'homelab-dashboard';
  private branch: string = 'main';
  private repoUrl: string = 'https://github.com/srytmj/homelab-dashboard';

  private currentSha: string = 'unknown';
  private currentCommitDate?: string;
  private currentCommitSubject?: string;

  private latestSha?: string;
  private latestCommitDate?: string;
  private latestCommitMessage?: string;
  private hasUpdate: boolean = false;
  private behindBy: number = 0;
  private announcement?: UpdateAnnouncement;
  private recentCommits: Array<{ sha: string; message: string; date?: string }> = [];
  private lastCheckedAt: number = 0;

  private updateState: AppUpdateState = {
    status: 'idle',
    log: [],
  };

  constructor(private notifications: NotificationsService) {
    this.repoRoot = process.env.APP_ROOT || path.resolve(__dirname, '../../..');
    this.isGitRepo = fs.existsSync(path.join(this.repoRoot, '.git'));
    this.inspectLocalRepo().catch((err) => {
      console.warn('[AppUpdateService] Initial git inspect warning:', err.message);
    });
  }

  private async inspectLocalRepo() {
    if (!this.isGitRepo) {
      console.log('[AppUpdateService] Running without local .git directory');
      this.currentSha = 'head';
      return;
    }

    try {
      const { stdout: headOut } = await execFile('git', ['-C', this.repoRoot, 'rev-parse', 'HEAD'], EXEC_OPTS);
      this.currentSha = headOut.trim();

      const { stdout: branchOut } = await execFile('git', ['-C', this.repoRoot, 'rev-parse', '--abbrev-ref', 'HEAD'], EXEC_OPTS);
      const detectedBranch = branchOut.trim();
      if (detectedBranch && detectedBranch !== 'HEAD') {
        this.branch = detectedBranch;
      }

      const { stdout: dateOut } = await execFile('git', ['-C', this.repoRoot, 'log', '-1', '--format=%cd', '--date=iso'], EXEC_OPTS);
      this.currentCommitDate = dateOut.trim();

      const { stdout: subjOut } = await execFile('git', ['-C', this.repoRoot, 'log', '-1', '--format=%s'], EXEC_OPTS);
      this.currentCommitSubject = subjOut.trim();

      const { stdout: remoteOut } = await execFile('git', ['-C', this.repoRoot, 'remote', 'get-url', 'origin'], EXEC_OPTS);
      const remote = remoteOut.trim();
      const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/i);
      if (match) {
        this.repoOwner = match[1];
        this.repoName = match[2];
        this.repoUrl = `https://github.com/${this.repoOwner}/${this.repoName}`;
      }
    } catch (err: any) {
      console.warn('[AppUpdateService] Git inspection failed:', err.message);
    }
  }

  public getStatus(): AppUpdateStatus {
    const isStale = !this.lastCheckedAt || Date.now() - this.lastCheckedAt > config.githubCheckIntervalMs;
    if (isStale) {
      this.checkForUpdates().catch(() => {});
    }

    return {
      repoUrl: this.repoUrl,
      repoOwner: this.repoOwner,
      repoName: this.repoName,
      branch: this.branch,
      currentSha: this.currentSha,
      currentCommitDate: this.currentCommitDate,
      currentCommitSubject: this.currentCommitSubject,
      latestSha: this.latestSha,
      latestCommitDate: this.latestCommitDate,
      latestCommitMessage: this.latestCommitMessage,
      hasUpdate: this.hasUpdate,
      behindBy: this.behindBy,
      announcement: this.announcement,
      recentCommits: this.recentCommits,
      lastCheckedAt: this.lastCheckedAt,
      updateState: this.updateState,
    };
  }

  public getUpdateState(): AppUpdateState {
    return this.updateState;
  }

  public async checkForUpdates(force: boolean = false): Promise<AppUpdateStatus> {
    this.lastCheckedAt = Date.now();
    await this.inspectLocalRepo();

    try {
      const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
      if (config.githubToken) {
        headers.Authorization = `token ${config.githubToken}`;
      }

      // Fetch latest commits
      const commitsUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/commits?sha=${this.branch}&per_page=15`;
      const res = await fetch(commitsUrl, { headers });
      if (!res.ok) {
        throw new Error(`GitHub API returned ${res.status}`);
      }

      const commits = (await res.json()) as GithubCommit[];
      if (Array.isArray(commits) && commits.length > 0) {
        const latest = commits[0];
        this.latestSha = latest.sha;
        this.latestCommitDate = latest.commit.committer?.date;
        this.latestCommitMessage = latest.commit.message.split('\n')[0];

        const currentIndex = commits.findIndex((c) => c.sha.startsWith(this.currentSha) || this.currentSha.startsWith(c.sha));
        if (currentIndex > 0) {
          this.hasUpdate = true;
          this.behindBy = currentIndex;
        } else if (currentIndex === 0) {
          this.hasUpdate = false;
          this.behindBy = 0;
        } else {
          // Current SHA not found in top 15 commits
          this.hasUpdate = this.latestSha !== this.currentSha;
          this.behindBy = this.hasUpdate ? commits.length : 0;
        }

        this.recentCommits = commits.slice(0, 10).map((c) => ({
          sha: c.sha.slice(0, 7),
          message: c.commit.message.split('\n')[0],
          date: c.commit.committer?.date,
        }));

        // Load announcements: check raw github first, then fallback to local repo announcements.json
        let announcementsData: UpdateAnnouncement[] = [];
        try {
          const rawAnnounceUrl = `https://raw.githubusercontent.com/${this.repoOwner}/${this.repoName}/${this.branch}/announcements.json`;
          const announceRes = await fetch(rawAnnounceUrl);
          if (announceRes.ok) {
            announcementsData = (await announceRes.json()) as UpdateAnnouncement[];
          }
        } catch {
          // ignore network failure for raw announcements
        }

        if (announcementsData.length === 0) {
          const localAnnouncePath = path.join(this.repoRoot, 'announcements.json');
          if (fs.existsSync(localAnnouncePath)) {
            try {
              announcementsData = JSON.parse(fs.readFileSync(localAnnouncePath, 'utf-8'));
            } catch {
              // ignore json parse error
            }
          }
        }

        if (Array.isArray(announcementsData) && announcementsData.length > 0) {
          const topAnnouncement = announcementsData[0];
          this.announcement = {
            id: topAnnouncement.id || this.latestSha,
            version: topAnnouncement.version,
            title: topAnnouncement.title,
            date: topAnnouncement.date || this.latestCommitDate || new Date().toISOString(),
            description: topAnnouncement.description,
            highlights: topAnnouncement.highlights || [],
            commitSha: this.latestSha,
            commitUrl: latest.html_url || `${this.repoUrl}/commit/${this.latestSha}`,
          };
        } else {
          // Synthesize announcement from latest commit messages
          const lines = latest.commit.message.split('\n');
          const title = lines[0].trim();
          const desc = lines.slice(1).map((l) => l.trim()).filter(Boolean).join(' ') || 'Pembaruan baru telah dipublikasikan ke repository.';
          const highlights = commits
            .slice(0, Math.min(this.behindBy || 3, 5))
            .map((c) => c.commit.message.split('\n')[0].trim());

          this.announcement = {
            id: this.latestSha,
            title: title || 'Pembaruan Tersedia',
            date: latest.commit.committer?.date || new Date().toISOString(),
            description: desc,
            highlights: highlights.length > 0 ? highlights : [title],
            commitSha: this.latestSha,
            commitUrl: latest.html_url || `${this.repoUrl}/commit/${this.latestSha}`,
          };
        }
      }
    } catch (err: any) {
      console.warn(`[AppUpdateService] Check failed for ${this.repoOwner}/${this.repoName}:`, err.message);
    }

    return this.getStatus();
  }

  public startUpdate(): { started: boolean; message?: string } {
    if (this.updateState.status === 'updating') {
      return { started: false, message: 'Update is already in progress.' };
    }

    if (!this.isGitRepo) {
      return { started: false, message: 'Current environment is not a git repository. Bind-mount the repo or pull new image.' };
    }

    this.notifications.add('app-update-start', 'Memulai pembaruan Homelab Dashboard...');
    this.performUpdate().catch(() => {});
    return { started: true };
  }

  private async performUpdate(): Promise<void> {
    this.updateState = {
      status: 'updating',
      log: [],
      startedAt: Date.now(),
    };

    const appendLog = (line: string) => {
      this.updateState.log.push(line);
      if (this.updateState.log.length > MAX_UPDATE_LOG_LINES) {
        this.updateState.log.splice(0, this.updateState.log.length - MAX_UPDATE_LOG_LINES);
      }
    };

    try {
      appendLog(`[1/4] Menarik commit terbaru dari origin/${this.branch}...`);
      appendLog(`$ git fetch origin ${this.branch}`);
      await this.spawnCapture('git', ['-C', this.repoRoot, 'fetch', 'origin', this.branch], this.repoRoot, appendLog);

      appendLog(`$ git pull origin ${this.branch}`);
      await this.spawnCapture('git', ['-C', this.repoRoot, 'pull', 'origin', this.branch], this.repoRoot, appendLog);

      const { stdout: headOut } = await execFile('git', ['-C', this.repoRoot, 'rev-parse', 'HEAD'], EXEC_OPTS);
      const newSha = headOut.trim();
      appendLog(`Checked out HEAD at ${newSha.slice(0, 7)}.`);

      appendLog('[2/4] Memeriksa & menginstall dependensi npm...');
      appendLog('$ npm install');
      await this.spawnCapture('npm', ['install'], this.repoRoot, appendLog);

      appendLog('[3/4] Membangun frontend dan backend (npm run build)...');
      appendLog('$ npm run build');
      await this.spawnCapture('npm', ['run', 'build'], this.repoRoot, appendLog);

      appendLog('[4/4] Memperbarui status versi...');
      this.currentSha = newSha;
      this.hasUpdate = false;
      this.behindBy = 0;

      appendLog(`✓ Berhasil! Homelab Dashboard kini berjalan di commit ${newSha.slice(0, 7)}.`);
      appendLog('Aset web telah diperbarui dan siap digunakan.');

      this.updateState.status = 'success';
      this.updateState.finishedAt = Date.now();
      this.notifications.add('app-update-success', `Homelab Dashboard berhasil diupdate ke versi ${newSha.slice(0, 7)}!`);
    } catch (err: any) {
      const msg = err.message || 'Proses update gagal.';
      appendLog(`✕ Gagal: ${msg}`);
      this.updateState.status = 'failed';
      this.updateState.message = msg;
      this.updateState.finishedAt = Date.now();
      this.notifications.add('app-update-failed', `Pembaruan Homelab Dashboard gagal: ${msg}`);
    }
  }

  private spawnCapture(cmd: string, args: string[], cwd: string, onLine: (line: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args, { cwd, timeout: EXEC_OPTS.timeout });
      const pipe = (stream: NodeJS.ReadableStream) => {
        let buffer = '';
        stream.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            onLine(line);
          }
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

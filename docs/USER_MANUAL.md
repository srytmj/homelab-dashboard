# User manual

How to read the dashboard and use every control. For installation see the [README](../README.md).

## Signing in

The first time the dashboard is opened it asks you to create the owner account. That happens once: after the account exists, registration is closed and the screen becomes a plain sign-in form. There is no password reset, so store the credentials somewhere durable.

"Stay signed in for 30 days" keeps the session token in this browser. Without it the session ends sooner and you sign in again. The logout button sits at the right end of the header and invalidates the token immediately, on every tab.

## Layout

Six pages, reachable from the header nav or by typing the address directly — each has its own URL and survives a reload or a bookmark:

| Page | What it holds |
| --- | --- |
| Overview (`/`) | Device identity, spec, the four headline tiles, and shortcuts into Fleet and Infra |
| Fleet (`/fleet`) | The container table |
| Infra (`/infra`) | Overview and Performance sub-views: storage/Tailscale/SSL/backup inventory, or live host and disk performance |
| Git projects (`/git-projects`) | Containers built from your own repos, and whether they have new commits upstream |
| Processes (`/processes`) | Every process on the host, sorted by CPU, memory or disk I/O |
| Terminal (`/terminal`) | A real shell to Proxmox or a configured Docker host, over SSH |
| Sentinel (`/sentinel`) | Telegram companion status and command reference |

The nav underlines whichever page you're on.

## Header

The dot on the logo is green when the WebSocket is connected and Proxmox is reachable, amber otherwise.

The strip below the logo is the standing summary: Proxmox address, LXC address, Tailnet peers online, containers running, and the machine spec. The two dots next to the addresses mirror node reachability.

Controls on the right, left to right:

- **Command Deck** opens the command palette (see below). Also opens with `Ctrl+K` / `Cmd+K` from anywhere in the app.
- **Sun/moon icon** switches between light and dark theme. Your choice is remembered; before you've picked one, it follows your OS setting.
- **Eye icon** toggles privacy mode. IPs become `192.168.•••.•••` and domains become `••••••.com`, so a screenshot is safe to post. The button turns amber while active. Nothing is sent anywhere; this is display-only.
- **Arrows icon** toggles browser fullscreen for a wall display or tablet.
- **Live pill** shows connection state and the time of the last update. Click it to force a refresh; it falls back to HTTP polling if the socket drops, and reconnects on its own after three seconds.
- **Logout icon** ends the session and returns to the sign-in screen.

## Command palette

`Ctrl+K` (`Cmd+K` on a Mac) opens a search box over whatever page you're on. Type to filter across two groups:

- **Pages** — jump straight to Overview, Fleet, Infra or Sentinel.
- **Pinned containers** — whatever you've pinned from the Fleet table, opened at its public domain if it has one, otherwise its Tailscale address, otherwise LAN. That order never changes based on how you're currently connected. Nothing pinned yet shows a prompt to go pin something instead of an empty list.

Arrow keys move the selection, Enter opens it, Escape closes the palette. There's no separate "consoles" list any more — pinning is now the only way to get something into the palette, so pin the things you actually reach for.

## Overview

The top card names the machine and its spec. Below it, four tiles carry the numbers worth glancing at:

- **CPU / Proxmox** with a bar that turns amber above 75 percent and red above 90.
- **Memory** used against total, same thresholds.
- **Fleet throughput**, the sum of every container's live rate. Down is the large figure, up is underneath. This is where a Jellyfin transcode or a Transmission download shows up.
- **Package temp**, labelled COOL under 60 degrees, WARM under 75, HOT above.

Two cards underneath link to Fleet (running/total containers, and how many are pinned) and Infra (volumes tracked). The Proxmox node, LXC runner and backup detail panels that used to sit here have moved to the Infra page — Overview stays a glance, not a scroll.

## Fleet

One row per container.

- The dot is green when running, grey when stopped.
- **Health** shows the Docker state plus the L7 probe result, for example `200 · 15ms`. A red `502 error` means the process is up but the service behind it is broken, which the Docker state alone will not tell you.
- **Web UI** opens a small menu rather than a single link — pick LAN, Tailscale, or the public domain if you've pinned one for this container. Each row also has its own copy button.
- **CPU** and **Memory** show the current value and a sparkline of recent history.
- **Throughput** shows the live per-second rate, with cumulative totals underneath.
- **Actions** — pin, view logs, or restart. All three appear on hover.

Filtering and sorting:

- The search box matches name, image and port.
- `All / Running / Stopped` filters by state.
- If more than one Docker host is configured, a **host filter** appears: buttons for up to five hosts, or a searchable dropdown beyond that. Each row also shows which host it's on when more than one is configured.
- Click a column header to sort by it, click again to reverse. Sorted columns are marked with an arrow.
- The footer sets rows per page (10, 25, 50, 100) and pages through the result. Changing a filter or the page size returns you to page one.

### Logs

Opens the last 50, 100 or 250 lines. This is a snapshot, not a stream, so reopen or change the tail count to refresh. Copy sends the whole buffer to the clipboard.

### Restart

Confirms the container name and current status before acting. The container stops and starts, so anything streaming through it drops for a few seconds. The dashboard refreshes once the daemon reports success.

### Pin

Pins a container into the command palette, so `Ctrl+K` reaches it without hunting through the table. The dialog has one optional field: a public domain, for containers reached through a Cloudflare tunnel you've already set up outside this dashboard. Leave it blank and the palette falls back to the container's LAN or Tailscale address. A shortcut in the dialog opens the Cloudflare dashboard to manage the tunnel itself — this app never talks to Cloudflare's API, it just remembers the URL you give it.

Pins are stored on the daemon, not the browser, so they're the same whether you open the dashboard from your phone or your desktop. Clicking Pin on an already-pinned container reopens the same dialog to edit the domain or unpin it.

## Infra

Two sub-views, switched with the tab strip at the top of the page.

### Overview

**Docker hosts.** Only appears once a second Docker host is configured. One row per host, with a connected/simulated pill and how many containers it's currently reporting. CPU and memory aren't shown here — that's only ever readable for the machine the daemon itself runs on, so a second host contributes containers, not its own vitals.

**Storage and DAS watchdog.** One row per volume, named from `STORAGE_LABELS` if the owner set one for that mount, otherwise auto-named from the mount's own folder. Each row has a usage bar. The line underneath carries the mount path, used and free space, and either the SMART result or the canary state for external bays. A `DETACHED` badge and a red banner at the top of the page mean an enclosure dropped: containers pointed at that path will silently write to the root NVMe until it fills, so stop them or remount before doing anything else.

The footer button shows reclaimable Docker space and opens the prune dialog. Prune removes untagged image layers and builder cache only; running containers and named volumes are left alone.

**Tailscale mesh.** Peers with online state, address and last-seen time. `THIS HOST` marks the machine serving the dashboard, `EXIT` marks an exit node, and a peer advertising routes shows them in place of its MagicDNS name. Hover a row to copy its address.

**SSL certificates.** Days remaining per domain, amber under 30 days, red under 14. The header pill shows the soonest expiry across all of them.

**Backup.** Shows when it's configured, when the last backup ran and whether it succeeded. Three actions:

- **Run backup now** — syncs your configured source paths up to the rclone remote immediately, without waiting for the schedule.
- **Restore from backup** — the reverse: pulls the remote back down over your local paths. This overwrites whatever's there now, so it lists exactly which paths before asking you to confirm. This is what you run after replacing a dead disk and pointing a fresh install at the same remote.
- **Import config from link** — separate from the two above, and works even without a backup remote configured. Paste a link to a small zip (an "Anyone with the link" Google Drive share works) and it restores just your pinned containers and tracked git projects — never your login, never the fleet itself. Meant for a quick config restore, not disaster recovery; use Restore from backup for that.

Both "Run backup now" and "Restore from backup" stay disabled until `BACKUP_RCLONE_REMOTE` is configured.

### Performance

**Host detail.** The Proxmox node's address, core count, version and uptime; the LXC runner's live CPU and memory bars, load average and fan or throttle state; and last night's vzdump backup with size and duration. A `SIMULATED` badge on the Proxmox panel means the API token is not configured and the numbers are generated.

**Disk performance.** A tab per volume, internal and external alike — the tab strip always shows every configured mount, even one with no data yet. Below it, a graph of active time (how much of the last stretch that disk was busy) plus four readouts: active time, average response time, read speed and write speed — the same shape as Task Manager's own Performance tab for a disk. This reads `/proc/diskstats` directly, so it only has real numbers on a Linux host; elsewhere, or for a volume behind LVM/device-mapper, the tab says so instead of showing stale or wrong numbers.

## Git projects

For containers that are your own projects — not off-the-shelf services like Jellyfin or Kavita. **Track a project** links a container to a GitHub repo and branch; the daemon checks that repo's latest commit every few minutes and shows an **Update available** pill when it differs from what you last deployed. **Refresh** forces that check for every tracked project right now instead of waiting for the next scheduled one.

Picking the container to track: if more than one Docker host is configured, a tab strip lets you narrow the list to one host first. The container field itself is a search box, not a plain dropdown — type part of a name to filter, since a fleet with many containers across hosts would otherwise be a long scroll.

Click a tracked row to edit its repo/branch, set a local path and rebuild command, or stop tracking it.

### Pull and rebuild

The download icon on a row pulls and rebuilds that project — it's disabled until the project has both a **local path** (the folder name under your `GIT_PROJECTS_ROOT`, where the project's working tree actually lives on the host) and a **rebuild command** set in the edit dialog.

Clicking it first checks what would change, without touching anything:

- If the changed files include something that looks like a database migration (a `migrations/` folder, `prisma/schema.prisma`, `alembic/`, or a `.sql` file), you get a warning listing exactly which files matched before you can continue. This is a pattern match, not a guarantee — it can miss a real migration named unusually, or flag a file that isn't one. Read the list.
- Confirming runs `git pull` followed by the configured rebuild command in that project's directory. This can take a while for a slow build; the dialog stays open until it finishes.
- The record of "what's deployed" only updates through this button. Deploying the same project some other way (SSH, a separate CI job) leaves the dashboard showing the old commit as deployed until you pull through here again.

## Processes

Every process the daemon can see, sorted by CPU by default — click a column header to sort by memory or disk I/O instead, or reverse the current sort. The search box filters by process name, command, user or PID.

Disk I/O per process reads `/proc/[pid]/io` and only works on Linux, for processes the daemon has permission to inspect; where that's not available, the column shows a dash instead of a wrong number. The list refreshes every three seconds on its own — it doesn't ride the same two-second feed as the rest of the dashboard, since gathering the full process list is heavier than everything else on that feed combined.

## Terminal

A real shell, in the browser, to any host listed in `SSH_TARGETS`. Pick a target and it connects immediately — there's no confirmation step, because unlike every other action in this dashboard, a terminal isn't one specific thing to confirm; read the security note in the [README](../README.md#terminal) if you haven't already before turning this on.

The connection status shows in the terminal's own header bar. **Disconnect** closes the session cleanly; closing the browser tab or navigating away does the same. If a target doesn't appear in the list, it isn't configured in `SSH_TARGETS` — this page never lets you type in a host to connect to, only pick from what's pre-configured.

## Sentinel

Shows whether the Telegram companion is polling, whether the Gemini key is present, how many Telegram user IDs are allowed, and the last command received. **Commands** expands the reference:

- Tier 1 is read-only: `/status`, `/resources`, `/backup_status`, `/logs <name>`.
- Tier 2 answers questions in natural language through Gemini and never acts.
- Tier 3 changes state: `/restart <container>` and `/prune`, each requiring `/confirm` within 60 seconds, restricted to a whitelist. `/cancel` aborts.

Messages from any Telegram ID outside the allowlist are ignored without a reply.

## Notes

- Telemetry updates every two seconds. Sparklines cover recent history only and reset when the daemon restarts.
- Privacy mode, filters, sort order and page size are per-browser session and reset on reload.
- Animations respect the operating system's reduce-motion setting.

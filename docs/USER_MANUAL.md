# User manual

How to read the dashboard and use every control. For installation see the [README](../README.md).

## Signing in

The first time the dashboard is opened it asks you to create the owner account. That happens once: after the account exists, registration is closed and the screen becomes a plain sign-in form. There is no password reset, so store the credentials somewhere durable.

"Stay signed in for 30 days" keeps the session token in this browser. Without it the session ends sooner and you sign in again. The logout button sits at the right end of the header and invalidates the token immediately, on every tab.

## Layout

The page is one scrolling column with four sections, reachable from the header nav:

| Section | What it holds |
| --- | --- |
| Overview | Four headline tiles, then the Proxmox node, LXC runner and backup panels |
| Fleet | The container table |
| Infra | Storage, Tailscale mesh and SSL certificates, side by side |
| Sentinel | Telegram companion status and command reference |

The nav underlines whichever section you are looking at as you scroll.

## Header

The dot on the logo is green when the WebSocket is connected and Proxmox is reachable, amber otherwise.

The strip below the logo is the standing summary: Proxmox address, LXC address, Tailnet peers online, containers running, and the machine spec. The two dots next to the addresses mirror node reachability.

Controls on the right, left to right:

- **Command Deck** opens the console launcher. Switch the whole list between LAN and Tailscale addresses with the toggle in its header.
- **Eye icon** toggles privacy mode. IPs become `192.168.•••.•••` and domains become `••••••.com`, so a screenshot is safe to post. The button turns amber while active. Nothing is sent anywhere; this is display-only.
- **Arrows icon** toggles browser fullscreen for a wall display or tablet.
- **Logout icon** ends the session and returns to the sign-in screen.
- **Live pill** shows connection state and the time of the last update. Click it to force a refresh; it falls back to HTTP polling if the socket drops, and reconnects on its own after three seconds.

## Overview

Four tiles carry the numbers worth glancing at:

- **CPU / Proxmox** with a bar that turns amber above 75 percent and red above 90.
- **Memory** used against total, same thresholds.
- **Fleet throughput**, the sum of every container's live rate. Down is the large figure, up is underneath. This is where a Jellyfin transcode or a Transmission download shows up.
- **Package temp**, labelled COOL under 60 degrees, WARM under 75, HOT above.

Below them, three panels: the Proxmox node identity and uptime, the LXC runner with its own CPU and memory bars and load average, and last night's vzdump backup with size and duration. A `SIMULATED` badge on the Proxmox panel means the API token is not configured and the numbers are generated.

## Fleet

One row per container.

- The dot is green when running, grey when stopped.
- **Health** shows the Docker state plus the L7 probe result, for example `200 · 15ms`. A red `502 error` means the process is up but the service behind it is broken, which the Docker state alone will not tell you.
- **Web UI** links to the service port and copies its URL. Which address is used depends on the **Links** toggle: `Auto` picks Tailscale when you opened the dashboard over Tailscale and LAN otherwise, or force one.
- **CPU** and **Memory** show the current value and a sparkline of recent history.
- **Throughput** shows the live per-second rate, with cumulative totals underneath.
- **Actions** open the log viewer or the restart confirmation. Both appear on hover.

Filtering and sorting:

- The search box matches name, image and port.
- `All / Running / Stopped` filters by state; `All nets / Tailscale / LAN` filters by exposure.
- Click a column header to sort by it, click again to reverse. Sorted columns are marked with an arrow.
- The footer sets rows per page (10, 25, 50, 100) and pages through the result. Changing a filter or the page size returns you to page one.

### Logs

Opens the last 50, 100 or 250 lines. This is a snapshot, not a stream, so reopen or change the tail count to refresh. Copy sends the whole buffer to the clipboard.

### Restart

Confirms the container name and current status before acting. The container stops and starts, so anything streaming through it drops for a few seconds. The dashboard refreshes once the daemon reports success.

## Infra

**Storage and DAS watchdog.** One row per volume with a usage bar. The line underneath carries the mount path, used and free space, and either the SMART result or the canary state for external bays. A `DETACHED` badge and a red banner at the top of the page mean an enclosure dropped: containers pointed at that path will silently write to the root NVMe until it fills, so stop them or remount before doing anything else.

The footer button shows reclaimable Docker space and opens the prune dialog. Prune removes untagged image layers and builder cache only; running containers and named volumes are left alone.

**Tailscale mesh.** Peers with online state, address and last-seen time. `THIS HOST` marks the machine serving the dashboard, `EXIT` marks an exit node, and a peer advertising routes shows them in place of its MagicDNS name. Hover a row to copy its address.

**SSL certificates.** Days remaining per domain, amber under 30 days, red under 14. The header pill shows the soonest expiry across all of them.

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

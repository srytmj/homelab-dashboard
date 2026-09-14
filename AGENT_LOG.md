# Agent Activity Log

This file tracks the activities of all AI agents (Gemini, Claude, etc.) operating in this repository. 
**Rule:** Always review this file when starting a task, and append a new entry when finishing a significant task.

---

### [2026-09-14 15:50 UTC]
**Agent:** Gemini (Removed Beta UI & Instant Primary Node Customization)
**Status:** `[COMPLETED]`
**Activities Completed:**
- **Removed Beta UI Entirely:**
  - Deleted `BetaLayout.tsx`, `BetaHeader.tsx`, `BetaSidebar.tsx`, and `HomePageBeta.tsx`.
  - Removed `/beta` routes, route redirect logic, and `beta-ui` body class from `App.tsx`.
  - Removed "Switch to Beta UI" promotional banner from `HomePage.tsx`.
  - Removed Beta UI switcher and button pill from `Header.tsx` and `Sidebar.tsx`.
  - Cleaned up Beta page mappings from `CommandPalette.tsx`.
- **Fixed Primary Node Name Customization:**
  - In `server/src/index.ts`, updated `PATCH /api/settings` to immediately trigger `await collectorService.collectAndBroadcast()` so WebSocket connected clients receive updated telemetry in real-time without delay.
  - In `server/src/services/collector.service.ts`, ensured that both `pveMetrics.nodeName` and `dockerHostMetrics.hostname` adopt the custom node name from `settingsService.getPrimaryNodeName()`. Made `collectAndBroadcast()` public.
  - In `client/src/components/UserSettingsModal.tsx`, streamlined the settings modal into two clean tabs: **Node & Appearance** and **Account Security**. Saved custom node name immediately to `localStorage` and dispatched `cockpit_settings_updated` custom window event, triggering instant optimistic UI updates.
  - In `Header.tsx` and `HomePage.tsx`, hooked into the dynamic node name cache and custom settings event so node label updates render immediately across all views.
- **Verification & Build:**
  - Verified compilation and build: `npm run build` passed with 0 errors across server and client.
  - Bumped version to `1.1.12` across `package.json`, `version.json`, and `announcements.json`.

---

### [2026-09-14 14:35 UTC]
**Agent:** Gemini (User Settings Hub, Node Renaming & Git Project Failure Recovery)
**Status:** `[COMPLETED]`
**Activities Completed:**
- **User Settings Modal (UserSettingsModal.tsx):**
  - Added dedicated Settings modal accessible via the Settings icon in both Classic (`Header.tsx`) and Beta (`BetaHeader.tsx`) headers.
  - Implemented UI Style Preference selection with descriptive names: **Classic Glassmorphism** (`/`) vs **Neo-Brutalism (Beta)** (`/beta`), with automatic route navigation and persistent storage in `localStorage` (`cockpit_preferred_ui`).
  - Added Dark / Light color mode toggle.
  - Implemented dynamic **Primary Node Name** customization with persistence in server-side `data/settings.json` via `SettingsService` (`GET /api/settings`, `PATCH /api/settings`), with one-click reset to default.
  - Hooked custom node name into `CollectorService`, automatically updating `pve.nodeName` across all client telemetry views and headers.
  - Implemented **Login / One-time Password Change** form calling `POST /api/auth/change-password` with current password validation using timing-safe scrypt verification and salt generation.
- **Git Projects Failed State Recovery & Repull/Redeploy:**
  - In `GitPullInline.tsx`, resolved the issue where a failed check (`check.ok === false`) rendered only red text with no action buttons. Added prominent **"Repull & Redeploy (Force Sync)"** and **"Retry Check"** buttons.
  - When `pullState.status === "failed"`, added an explicit **"Repull & Redeploy"** action button styled as `btn-danger`.
  - In `git-projects.service.ts`, added automatic stale `.git/index.lock` removal before running git operations in both `checkPull()` and `pullAndRebuild()`.
  - Exposed `lastPullStatus` and `lastPullMessage` in `GitProjectStatus` snapshot telemetry, rendering a clear `Deploy failed` badge in `GitProjectsPage.tsx`.
- **Quality & Parity Assurance:**
  - Maintained 100% design token compliance using CSS RGB triplets.
  - Verified compilation and build: `npm run build` passed with 0 errors across server and client.
  - Updated `announcements.json`, `version.json`, and `package.json` to `1.1.11`.

---

### [2026-09-14 12:25 UTC]
**Agent:** Gemini (Feature Parity Rules & Layout Architecture Documentation)
**Status:** `[COMPLETED]`
**Activities Completed:**
- **Created Comprehensive Layout Architecture Guide:** Added `docs/LAYOUT_AND_STYLES_GUIDE.md` containing the complete 100% Feature Parity Checklist, base code component wiring map, and step-by-step instructions for creating new UI styles without dropping features.
- **Updated Agent Rules in CLAUDE.md:** Added `## UI Styles, Layout Variants & 100% Feature Parity Rule` and mandated that any agent creating/modifying styles or features MUST update `docs/LAYOUT_AND_STYLES_GUIDE.md` and `CLAUDE.md`.
- **Linked Design System Documentation:** Updated `docs/DESIGN_SYSTEM.md` with cross-references to the parity checklist.

---

### [2026-09-14 12:20 UTC]
**Agent:** Gemini (Beta UI Feature Parity & Shortcuts System)
**Status:** `[COMPLETED]`
**Activities Completed:**
- **Command Palette Beta Routing:** Updated `CommandPalette.tsx` to detect active `/beta` routes and dynamically rewrite page destinations so navigation stays within the Beta UI.
- **Beta Header Enhancements:** Added missing `NotificationsPanel`, active `username` badge, and keybinding indicator `Ctrl K` on the CMD trigger button in `BetaHeader.tsx`.
- **Collapsible Beta Sidebar:** Added collapse/expand state toggle with `localStorage` persistence (`cockpit-beta-sidebar-collapsed`) to `BetaSidebar.tsx`.
- **Complete Host Vitals on Beta Overview:** Implemented real-time CPU usage % with status tones, RAM used vs total metrics, thermal package sensor with color-coded alerts, pinned container count, and expanded quick actions in `HomePageBeta.tsx`.
- **Personal Web Shortcuts & Styling:** Integrated `BookmarksSection` with empty state CTA button in `HomePageBeta.tsx`, and added high-contrast `.shortcut-card` brutalist styling in `index.css`.
- **Scoped Beta Notice:** Scoped the persistent Beta notice banner in `BetaLayout.tsx` exclusively to `/beta` overview with a dismiss button to keep sub-pages uncluttered.
- **Version Bump:** Bumped to version 1.1.10 in `package.json` and `version.json`, added release entry in `announcements.json`.

---

### [2026-09-14 12:15 UTC]
**Agent:** Gemini (Force Pull & Resilient Redeploy for Git Projects)
**Status:** `[COMPLETED]`
**Activities Completed:**
- **Identified Root Cause:** Standard `git pull` aborted when tracked files (such as `docker-compose.yml`) had local modifications on disk.
- **Implemented Force Sync Pipeline:** Replaced `git pull` in `git-projects.service.ts` with `git fetch origin <branch>` and `git reset --hard origin/<branch>`, guaranteeing clean deployment without aborting.
- **Data & Environment Protection:** Integrated auto-stash (`git stash push -m "Auto-stashed before pull and redeploy"`) prior to reset to safeguard tracked edits, while preserving all untracked runtime files (.env, bind mount data, databases).
- **Version Bump & Announcements:** Added release announcement to `announcements.json` for v1.1.9 and bumped `package.json` and `version.json`.

---

### [2026-09-14 11:51 UTC]
**Agent:** Gemini (Fix Window Auto-Scroll Bug during App Update)
**Status:** `[COMPLETED]`
**Activities Completed:**
- **Identified Root Cause:** Located `scrollIntoView()` on dummy child div in `AppUpdateBanner.tsx` that hijacked the browser `window` scroll every 1 second during update log streaming.
- **Container-Scoped Auto-Scroll:** Replaced `scrollIntoView()` with `scrollTo({ top: scrollHeight })` called directly on the scrollable terminal `div` container via `logContainerRef`.
- **Preserved User Scroll Control:** Scrolling up inside the terminal continues to disengage auto-scroll without window disruption, allowing users to scroll freely to earlier logs or browse the page.
- **Version Bump & Announcements:** Updated `announcements.json` for v1.1.8 and bumped `package.json` and `version.json`.

### [2026-09-14 11:43 UTC]
**Agent:** Gemini (Beta UI Perfection, Mobile Layout & Dedicated Storage/DAS Real-time SMART Watchdog)
**Status:** `[COMPLETED]`
**Activities Completed:**
- **Dedicated Storage & DAS Watchdog Section:** Relocated `StorageMatrixSection` out of the 3-column grid in `InfraPage.tsx` into its own full-width dedicated section, while Tailscale and SSL sections now share a balanced 2-column grid.
- **Real-Time SMART & I/O Telemetry:** Re-engineered `StorageMatrixSection.tsx` with live SMART health diagnostics (`PASSED`/`WARNING`/`FAILED`), live I/O throughput rates (Read/Write MB/s), disk active time %, latency, and detailed Proxmox LVM-thin allocation workload tiers.
- **Canary Watchdog Visual Guard:** Upgraded external DAS bay monitoring with live canary heartbeat indicators, preventing root filesystem overflow if an external enclosure disconnects.
- **HomePage Beta Overview Vitals:** Added real-time Storage & DAS Watchdog summary card to the Core Vitals grid on `HomePageBeta.tsx`.
- **Universal Brutalist Styling Engine:** Extended `.beta-ui` in `index.css` with universal `rounded-none`, `backdrop-blur-none`, snappy 0.08s brutalist slide animations, sharp brutalist scrollbars, and styled tables (`th`, `td`).
- **Mobile Responsiveness Polish:** Optimized header action buttons and touch-scroll mobile navigation strip in `BetaHeader.tsx` without horizontal clipping or scroll blowout.
- **Version Bump & Announcements:** Updated `announcements.json` for v1.1.7 and bumped `package.json` & `version.json`.

---

### [2026-09-14 05:00 UTC]
**Agent:** Gemini (Real-Time Updater Engine & Unified Commit Sync v1.1.3)
**Status:** `[COMPLETED]`
**Activities Completed:**
- **Real-Time Update Engine:** Added 30-second client-side polling in `AppUpdateBanner.tsx` and reduced `githubCheckIntervalMs` to 60s in `server/src/config.ts`.
- **Auto-Fetch on Check:** Updated `checkForUpdates()` in `app-update.service.ts` to run `git fetch origin ${branch}` and inspect local repo.
- **Accurate Divergence Detection:** Eliminated version semver false-positives so that differing commit SHAs between local `HEAD` and remote `origin/main` always trigger an update status.
- **Resilient Rebase & Reset Fallback:** Hardened `performUpdate()` to use `git pull --rebase origin ${branch}` with clean fallback to `git reset --hard origin/${branch}` to prevent stalled state on diverged local commits.
- **Integrated Docker & Compose from docker-host:** Unified `Dockerfile` (optimized packages) and `docker-compose.yml` (mounted read-only `/root/.t3` volume for AI Agent telemetry).
- **Bumped Version to 1.1.3:** Added release announcement in `announcements.json` and bumped `version.json` and `package.json` to `1.1.3`.

---

### [2026-09-14 04:52 UTC]
**Agent:** Gemini (Fleet Card View Sort Controls)
**Status:** `[COMPLETED]`
**Activities Completed:**
- **Default Sort by Name:** Changed default sorting in Container Fleet (`client/src/components/ContainerGridSection.tsx`) from `cpu` (desc) to `name` (asc A-Z).
- **Sort Controls in Cards View:** Added dedicated Sort By dropdown (Name, CPU, RAM, Network) and toggle order button (ASC / DESC with direction arrow icons) in the toolbar when in Card View mode.
- **Bi-directional Order Memory:** Made column toggles default to ascending for name and descending for resource metrics (CPU/RAM/NET).

---

### [2026-09-13 16:47 UTC]
**Agent:** Gemini (Show Google Account Email on Antigravity Cards)
**Status:** `[COMPLETED]`
**Activities Completed:**
- **Show User Email for Antigravity Cards:** Updated `server/src/services/ai-agents.service.ts` to dynamically inherit and display the user's Google account email (`suryatmaja.dev@gmail.com`) for all Gemini / Antigravity agents (Default, Auth, Marmut) instead of a generic "Google account" label.

---

### [2026-09-13 16:38 UTC]
**Agent:** Gemini (Fix Updater Build & Announcements v1.1.2)
**Status:** `[COMPLETED]`
**Activities Completed:**
- **Configured Monorepo Workspaces in root `package.json`:** Added `"workspaces": ["client", "server"]` so that running `npm install` automatically installs dependencies across both sub-projects and links binary executables (`tsc`, `vite`).
- **Hardened Subprocess Environment in `app-update.service.ts`:** Injected local and workspace `node_modules/.bin` paths into `PATH` and set `NODE_ENV=development` with `--include=dev` during `npm install` so TypeScript compiler (`tsc`) is guaranteed to be available during self-update builds.
- **Published v1.1.2 Announcements in `announcements.json`:** Added rich update announcement covering AI Agents Monitor, Glassmorphism UI, Fleet Cards view, and self-updater stability improvements.
- **Bumped Version:** Updated `version.json` and `package.json` to version `1.1.2`.

---

### [2026-09-13 16:30 UTC]
**Agent:** Gemini (Hotfix Husky / Self-Updater)
**Status:** `[COMPLETED]`
**Activities Completed:**
- **Fixed Husky Lifecycle Script in package.json:** Changed `"prepare": "husky"` to `"prepare": "command -v husky >/dev/null 2>&1 && husky || true"` so that running `npm install` inside production / container environments where devDependencies are omitted will no longer fail with `sh: husky: not found (exit code 127)`.

---

### [2026-09-13 16:25 UTC]
**Agent:** Gemini (AI Agent Usage Monitor)
**Status:** `[COMPLETED]`
**Activities Completed:**
- **AI Agents Monitor Feature:** Implemented backend service (`server/src/services/ai-agents.service.ts`) and Fastify endpoint (`/api/ai-agents/telemetry`) tracking local T3 Code sessions, caches (`caches/*.json`), and SQLite turn history (`userdata/state.sqlite`).
- **Telemetry Metrics:** Calculated 5-hour rolling window usage, cooldown countdown timers, and past 7-day weekly activity histograms per agent (Claude Pro, Gemini Default, Auth, Marmut).
- **UI Frontend (`client/src/pages/AiAgentsPage.tsx`):** Added responsive glassmorphism view with agent cards, live running indicators, progress meters, interactive mini bar charts, and real-time interaction log stream.
- **Navigation Integration:** Added route `/ai-agents` in `App.tsx` and updated `Sidebar.tsx` / `Header.tsx` with `Sparkles` icon.
- **Docs:** Updated `docs/USER_MANUAL.md` and `README.md` detailing the T3 Code zero-API-key architecture and configuration instructions.

---

### [2026-09-14 13:42 UTC]
**Agent:** Antigravity (Bugfix: Search Component Icon Overlap)
**Status:** 
**Activities Completed:**
- **Fixed Search Icon & Input Text Overlap in Beta UI:** Removed hardcoded `px-3.5 py-2` from `.beta-ui .field` in `client/src/index.css` which had a CSS specificity of (0, 2, 0) and was overriding utility classes like `pl-8` with `px-3.5` (14px), causing placeholder text and typed queries to collide directly with the 14px Search icon.
- **Enhanced Search Padding and Spacing:** Applied `!pl-9 pr-7` and aligned Search icons with `left-3` across `ContainerGridSection.tsx`, `ProcessesPage.tsx`, and `GitProjectModal.tsx` for a clean 10px spacing buffer.
- **Added One-Click Clear Search Button:** Added an interactive `X` button inside the search inputs that appears when text is entered, allowing quick clearing of search filters.

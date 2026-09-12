# Working brief for AI coding agents

Read this before changing anything. It exists so an agent, or someone driving one, lands on the conventions this repo already follows instead of inventing new ones.

## What this is

A homelab dashboard in two parts: a Fastify daemon that polls Proxmox, Docker, Tailscale and the filesystem every two seconds, and a React client that renders the snapshot. No database beyond small JSON files under `data/` (auth, pins), no external monitoring stack. The daemon is the only thing that talks to infrastructure.

Stack: TypeScript throughout, Fastify 5 and Dockerode on the server, React 18 with Vite 6, React Router 6 and Tailwind 3 on the client.

## Commands

```bash
npm run dev:server   # daemon on :3000
npm run dev:client   # Vite on :5173, proxies /api and /ws to :3000
npm run build        # both
```

Verify a client change with `cd client && npx tsc -b && npx vite build`; verify a server change with `cd server && npx tsc`. That's the extent of automated verification in this repo — the owner tests behavior manually, so don't drive a browser to click through the UI on their behalf. Report what you changed and let them try it.

The daemon runs without any configuration: with no Docker socket and no Proxmox token it serves generated telemetry and sets `isDemoMode`. That is the normal development path on Windows and macOS.

## Repo map

```
server/src/index.ts              routes, auth guard, WebSocket broadcast
server/src/services/             one file per data source, including auth and pins
server/src/types.ts              server-side shape of the snapshot
client/src/context/AuthContext   session state, login, register, logout
client/src/utils/api.ts          authFetch, the only way to call /api
client/src/App.tsx               router, persistent shell (header, palette, modals)
client/src/pages/                one file per route, thin — real content lives in components/
client/src/hooks/useCockpitData  WebSocket with HTTP polling fallback
client/src/hooks/useTheme.ts     light/dark state, localStorage, system fallback
client/src/components/           one file per section or modal
client/src/components/CommandPalette.tsx  Ctrl+K palette: pages + consoles + pinned containers
client/src/utils/formatters.ts   byte, rate, uptime, redaction, thresholds
client/src/types.ts              client-side shape of the snapshot
client/tailwind.config.js        design tokens (CSS variables, see below)
client/src/index.css             token values per theme, shared component classes
```

`server/src/types.ts` and `client/src/types.ts` are maintained in parallel by hand. Change one and you must change the other, or the client will silently render `undefined`.

## Rules that matter

**Use the design tokens.** Colours come from `cockpit-*` and `state-*` in the Tailwind config, never as literal hex in a component. Layout patterns come from the component classes in `index.css`. If a change needs a new colour, read [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) first; the answer is usually a different structure, not a new hue.

**Token values are `R G B` triplets, never hex.** Every `cockpit-*`/`state-*` token is defined in `index.css` as `--name: R G B;` and consumed in `tailwind.config.js` as `rgb(var(--name) / <alpha-value>)`. A hex value there silently breaks every `/NN` opacity usage (there are dozens) with no build error — Tailwind just drops the opacity. Add both a `:root` (dark) and `:root.light` value for any new token.

**The accent is not a status colour.** `cockpit-accent` marks interactive and neutral-informational things. `state-good`, `state-warn` and `state-bad` mean healthy, degraded and failed. Mixing the two makes the dashboard unreadable at a glance, which is the only thing it is for.

**Thresholds live in one place.** `getStatusColor` and `getTempColor` in `formatters.ts` decide when a number turns amber or red. Do not inline threshold comparisons in a component.

**Monospace and `tabular-nums` for anything numeric** that a person compares across rows. Values that jitter as they update are a bug.

**Every protected request goes through `authFetch`.** Plain `fetch` against `/api` returns 401 for anything outside `/api/health` and `/api/auth/*`. `authFetch` in `client/src/utils/api.ts` attaches the bearer token; the WebSocket passes the same token as a query parameter. Auth state lives in `AuthContext` and nothing else should read `localStorage` for it.

**Respect privacy mode.** Any IP, hostname or domain rendered in the client goes through `redactText(value, isPrivacyMode)`. A new field that leaks an address in a screenshot defeats the feature.

**Respect reduce-motion.** Global handling exists in `index.css`. Never make an animation the only way information is conveyed.

**Destructive actions are confirmed and scoped.** Restart and prune each go through a modal that names exactly what will happen. Prune touches dangling layers and build cache only. The Telegram companion additionally requires an allowlisted user ID and a `/confirm` inside 60 seconds. Do not add a path that skips these.

**Pins are server-owned, not client state.** `PinsService` (`server/src/services/pins.service.ts`) is the only writer of `data/pins.json`. The client never persists a pin itself — it calls `POST`/`DELETE /api/pins/:name` and waits for the next snapshot to reflect it. `CollectorService` merges `isPinned`/`publicUrl` onto each container by name before it reaches the client; don't duplicate that merge client-side.

## Common tasks

**Adding a metric to an existing section.** Add the field to both `types.ts` files, populate it in the relevant service, render it as a `.data-row` or a tile. Keep the label short and lowercase-with-capital, not a sentence.

**Adding a section.** Build a `.panel` with a `.panel-head`, put the items in rows rather than a grid of cards, give each row exactly one status signal, and mount it inside the page it belongs on (`client/src/pages/`). If it belongs on Infra, it must survive a one-third-width column on desktop and full width on mobile.

**Adding a page.** Add the file to `client/src/pages/`, a `<Route>` in `App.tsx`, a `NavLink` entry in `Header.tsx`, and a page entry in `CommandPalette.tsx`'s `PAGES` array so `Ctrl+K` can reach it. All three lists must agree, on purpose — there's no single source of truth for "what pages exist" to derive them from.

**Adding a route.** Register it in `server/src/index.ts` next to the others and keep the response shape flat. Anything that changes state is a POST and needs a confirmation path in the client.

## What not to do

- Do not add a charting or component library. The sparklines are hand-written SVG and the whole client is 200 KB for a reason.
- Do not put emoji in the interface, in documentation, or in commit messages.
- Do not add backwards-compatibility shims, feature flags or defensive checks for states that cannot occur. This is a single-owner tool with no external consumers.
- Do not commit generated output. `client/dist` is ignored; `client/tsconfig.tsbuildinfo` is tracked for historical reasons and its churn can be ignored.
- Do not add attribution for AI tooling to commits, pull requests or documentation.

## Commits

Conventional commits, enforced on every commit by commitlint through a husky `commit-msg` hook. A message that does not parse is rejected before the commit exists, so fix the message and commit again rather than reaching for `--no-verify`.

Format is `type(scope): subject`, subject in lowercase imperative with no trailing period, header at most 72 characters. Types come from `@commitlint/config-conventional`: `feat`, `fix`, `refactor`, `perf`, `style`, `docs`, `test`, `build`, `ci`, `chore`, `revert`. The scope is optional, but when present it must be one of `ui`, `client`, `server`, `auth`, `sentinel`, `docker`, `docs`, `deps`, `repo`. Add to that list in [commitlint.config.mjs](commitlint.config.mjs) rather than working around it.

The hooks are installed by the `prepare` script, so they exist after `npm install` at the repo root. An agent working in a fresh clone that has not installed root dependencies will find commits passing unchecked; run the install first.

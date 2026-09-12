# Working brief for AI coding agents

Read this before changing anything. It exists so an agent, or someone driving one, lands on the conventions this repo already follows instead of inventing new ones.

## What this is

A homelab dashboard in two parts: a Fastify daemon that polls Proxmox, Docker, Tailscale and the filesystem every two seconds, and a React client that renders the snapshot. No database, no external monitoring stack, no auth layer. The daemon is the only thing that talks to infrastructure.

Stack: TypeScript throughout, Fastify 5 and Dockerode on the server, React 18 with Vite 6 and Tailwind 3 on the client.

## Commands

```bash
npm run dev:server   # daemon on :3000
npm run dev:client   # Vite on :5173, proxies /api and /ws to :3000
npm run build        # both
```

Verify a client change with `cd client && npx tsc -b && npx vite build`, then look at it in a browser. Type checking passing is not evidence that the UI is correct.

The daemon runs without any configuration: with no Docker socket and no Proxmox token it serves generated telemetry and sets `isDemoMode`. That is the normal development path on Windows and macOS.

## Repo map

```
server/src/index.ts              routes, auth guard, WebSocket broadcast
server/src/services/             one file per data source, including auth
client/src/context/AuthContext   session state, login, register, logout
client/src/utils/api.ts          authFetch, the only way to call /api
server/src/types.ts              server-side shape of the snapshot
client/src/App.tsx               page layout and modal state
client/src/hooks/useCockpitData  WebSocket with HTTP polling fallback
client/src/components/           one file per section or modal
client/src/utils/formatters.ts   byte, rate, uptime, redaction, thresholds
client/src/types.ts              client-side shape of the snapshot
client/tailwind.config.js        design tokens
client/src/index.css             shared component classes
```

`server/src/types.ts` and `client/src/types.ts` are maintained in parallel by hand. Change one and you must change the other, or the client will silently render `undefined`.

## Rules that matter

**Use the design tokens.** Colours come from `cockpit-*` and `state-*` in the Tailwind config, never as literal hex in a component. Layout patterns come from the component classes in `index.css`. If a change needs a new colour, read [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) first; the answer is usually a different structure, not a new hue.

**The accent is not a status colour.** `cockpit-accent` marks interactive and neutral-informational things. `state-good`, `state-warn` and `state-bad` mean healthy, degraded and failed. Mixing the two makes the dashboard unreadable at a glance, which is the only thing it is for.

**Thresholds live in one place.** `getStatusColor` and `getTempColor` in `formatters.ts` decide when a number turns amber or red. Do not inline threshold comparisons in a component.

**Monospace and `tabular-nums` for anything numeric** that a person compares across rows. Values that jitter as they update are a bug.

**Every protected request goes through `authFetch`.** Plain `fetch` against `/api` returns 401 for anything outside `/api/health` and `/api/auth/*`. `authFetch` in `client/src/utils/api.ts` attaches the bearer token; the WebSocket passes the same token as a query parameter. Auth state lives in `AuthContext` and nothing else should read `localStorage` for it.

**Respect privacy mode.** Any IP, hostname or domain rendered in the client goes through `redactText(value, isPrivacyMode)`. A new field that leaks an address in a screenshot defeats the feature.

**Respect reduce-motion.** Global handling exists in `index.css`. Never make an animation the only way information is conveyed.

**Destructive actions are confirmed and scoped.** Restart and prune each go through a modal that names exactly what will happen. Prune touches dangling layers and build cache only. The Telegram companion additionally requires an allowlisted user ID and a `/confirm` inside 60 seconds. Do not add a path that skips these.

## Common tasks

**Adding a metric to an existing section.** Add the field to both `types.ts` files, populate it in the relevant service, render it as a `.data-row` or a tile. Keep the label short and lowercase-with-capital, not a sentence.

**Adding a section.** Build a `.panel` with a `.panel-head`, put the items in rows rather than a grid of cards, give each row exactly one status signal, and mount it in `App.tsx`. If it belongs in the Infra row, it must survive a one-third-width column on desktop and full width on mobile.

**Adding a route.** Register it in `server/src/index.ts` next to the others and keep the response shape flat. Anything that changes state is a POST and needs a confirmation path in the client.

## What not to do

- Do not add a charting or component library. The sparklines are hand-written SVG and the whole client is 200 KB for a reason.
- Do not put emoji in the interface, in documentation, or in commit messages.
- Do not add backwards-compatibility shims, feature flags or defensive checks for states that cannot occur. This is a single-owner tool with no external consumers.
- Do not commit generated output. `client/dist` is ignored; `client/tsconfig.tsbuildinfo` is tracked for historical reasons and its churn can be ignored.
- Do not add attribution for AI tooling to commits, pull requests or documentation.

## Commits

Conventional commits, enforced by commitlint: `type(scope): subject`, subject in lowercase imperative, no trailing period, header under 72 characters. Types in use: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `build`. Scopes follow the repo map, for example `ui`, `client`, `server`, `docs`.

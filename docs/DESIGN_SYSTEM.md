# Design system

The interface is an internal operations tool: neutral dark surfaces, one accent colour, monospace reserved for data. It is scanned and operated, not read top to bottom, so state has to be legible at a glance without decoration competing for attention.

Tokens live in [client/tailwind.config.js](../client/tailwind.config.js); shared component classes live in [client/src/index.css](../client/src/index.css). Use those rather than literal values.

## Colour

Every token is a CSS variable holding an `R G B` triplet (not a hex string), so Tailwind's opacity modifiers work: `bg-cockpit-accent/10` composes to `rgb(var(--cockpit-accent) / 0.1)`. Always add new tokens the same way — a hex value breaks every `/NN` usage silently, with no build error.

**Dark** (default, `:root`):

| Token | Value | Use |
| --- | --- | --- |
| `cockpit-bg` | `#101115` | Page background, inset surfaces inside panels |
| `cockpit-panel` | `#17181e` | Panel surface |
| `cockpit-panelHover` | `#1c1d24` | Row and card hover |
| `cockpit-topbar` | `#131419` | Header and footer |
| `cockpit-border` | `#26272f` | Every border and divider, and empty progress track |
| `cockpit-text` | `#eef0f4` | Primary text and figures |
| `cockpit-muted` | `#84899a` | Labels, secondary text, inactive controls |
| `cockpit-accent` | `#7c9cff` | Links, active nav, primary bars, sparklines, focus ring |
| `state-good` | `#48d597` | Healthy |
| `state-warn` | `#f2a93c` | Degraded, above 75 percent, expiring soon |
| `state-bad` | `#f2554d` | Failed, above 90 percent, destructive actions |

**Light** (`:root.light`, toggled by `useTheme`):

| Token | Value |
| --- | --- |
| `cockpit-bg` | `#f4f5f7` |
| `cockpit-panel` | `#ffffff` |
| `cockpit-panelHover` | `#eef0f4` |
| `cockpit-topbar` | `#ffffff` |
| `cockpit-border` | `#dde0e6` |
| `cockpit-text` | `#14161c` |
| `cockpit-muted` | `#62697a` |
| `cockpit-accent` | `#4f6fe0` |
| `state-good` | `#178a5c` |
| `state-warn` | `#a8620a` |
| `state-bad` | `#c93a35` |

Light isn't dark-with-inverted-lightness: the accent and state colours are deepened and desaturated slightly so they hold contrast on a white panel instead of looking washed out. Button text uses literal `white`, not a token, since it needs to work against both accent values.

The accent is never a status colour and the status colours are never decoration. A green pill means something is healthy; a periwinkle bar means a bar. `getStatusColor` and `getTempColor` in [formatters.ts](../client/src/utils/formatters.ts) are the single source for threshold mapping, and return Tailwind classes that already point at the right tokens — they don't need to know which theme is active.

## Typography

Manrope carries the interface, IBM Plex Mono carries the data. Anything a person compares across rows is monospace with `tabular-nums`: percentages, byte counts, rates, ports, addresses, timestamps, uptimes. Prose, headings, buttons and labels stay in Manrope.

Sizes in use: `23px` headline figures, `13.5px` panel titles, `13px` body rows, `12.5px` values, `11px` mono meta, `10px` uppercase labels with `0.09em` tracking.

## Layout

Panels are 10px radius, one pixel border, no shadow. Depth is reserved for modals. Separation comes from the border, not from stacked shadows and radii, so nothing reads as more important than it is.

Related items are rows in a shared panel rather than a grid of individual cards. A card per item multiplies borders and makes scanning harder, which is why the container fleet is a table and storage, mesh and certificates are row lists.

Wide content scrolls inside its own container. The page body never scrolls sideways.

## Components

| Class | Purpose |
| --- | --- |
| `.panel`, `.panel-head`, `.panel-title`, `.panel-sub` | Panel shell and header |
| `.label` | Uppercase mono caption above a value |
| `.metric`, `.metric-lg`, `.metric-unit` | Numeric values |
| `.pill` with `.pill-good`, `.pill-warn`, `.pill-bad`, `.pill-neutral`, `.pill-accent` | Status chips |
| `.track`, `.track-fill` | Progress bars |
| `.data-row` | Label and value pair with a bottom border |
| `.seg`, `.seg-btn`, `.seg-btn-on` | Segmented controls |
| `.btn` with `.btn-primary`, `.btn-ghost`, `.btn-danger` | Buttons |
| `.icon-btn` | Square icon button |
| `.field` | Text input |
| `.overlay`, `.modal-panel` | Modal backdrop and panel |

The command palette and every modal share `.overlay`/`.modal-panel`. Don't invent a second overlay treatment — a new dialog should look like the existing ones by construction, not by copying their styles.

## Motion

Motion confirms an interaction; it does not announce itself. Interactive elements transition in 150ms and compress slightly on press. Modals fade the backdrop and lift the panel over 200ms. Content that appears in place, such as the command reference or a page of table rows, fades in over 160ms. Progress bars ease over 500ms so live values move rather than jump.

Everything above collapses to near-zero duration under `prefers-reduced-motion`, handled globally in `index.css`. Do not add motion that carries meaning on its own, because for those users it will not play.

## Adding a section

Reuse the panel shell, put items in rows, give each row one status signal, and take the threshold colours from `getStatusColor`. If a new colour seems necessary, the section probably needs a different structure instead.

# make.fun Frontend Design Plan

## Subject & Brief
**Product**: make.fun - competitive bounty platform for developers & forecasters  
**Audience**: Technical competitors (devs, data scientists, forecasters)  
**Job**: Browse bounties → view details → check leaderboards → view profiles — fast, data-dense, offline-capable

---

## Color Palette (4 named values)

| Name | Hex | Usage |
|------|-----|-------|
| `ink` | `#0D0D0D` | Background, near-black base |
| `paper` | `#FAFAFA` | Text primary, high contrast |
| `muted` | `#6B6B6B` | Secondary text, timestamps, metadata |
| `accent` | `#FF6B35` | **Signature orange** — CTAs, live indicators, rank #1, winning entries |
| `card` | `#1A1A1A` | Card backgrounds, elevated surfaces |
| `border` | `#2A2A2A` | Subtle dividers, input borders |
| `success` | `#22C55E` | Positive deltas, completed, valid |
| `danger` | `#EF4444` | Negative deltas, ended, invalid |

**Why not defaults**: Avoids warm cream/serif, near-black+acid-green, broadsheet newspaper. Orange accent (`#FF6B35`) is energetic, technical, distinct from typical "success green" or "link blue" — fits competitive/forecasting energy.

---

## Typography

| Role | Font | Weight/Style | Scale |
|------|------|--------------|-------|
| **Display** | `Space Grotesk` | 700, tight tracking | `clamp(1.75rem, 4vw, 3rem)` |
| **Body** | `IBM Plex Sans` | 400, 1.5 line-height | `1rem` base |
| **Mono/Data** | `JetBrains Mono` | 400/500, tabular nums | `0.875rem` for scores, rates, money |
| **Caption** | `IBM Plex Sans` | 500, uppercase, letter-spacing `0.08em` | `0.75rem` |

**Pairing rationale**: Space Grotesk has technical character (geometric, slightly wide) without being monospace. IBM Plex Sans is highly readable at small sizes. JetBrains Mono for tabular numbers (scores, rates, currency) — essential for leaderboards. All variable fonts, self-hosted via `@font-face` for offline/PWA.

---

## Layout Concept

### Board (list view) — "Scoreboard"
```
┌─────────────────────────────────────────────────────────────┐
│  make.fun bounties                    [🔍 Search]  [👤]     │
├─────────────────────────────────────────────────────────────┤
│  ┌─ ROW ─────────────────────────────────────────────────┐  │
│  │ Predict the next 5 trading days…          $250  2d 4h │  │
│  │ Forecasting  •  62 entries  •  $10 entry fee          │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌─ ROW ─────────────────────────────────────────────────┐  │
│  │ Build a WebGL fluid solver…                  $500  5h │  │
│  │ Graphics  •  14 entries  •  Free entry                │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```
- **Virtual list**: Only render visible rows + buffer (IntersectionObserver)
- Each row: title (truncated 2 lines), pot (mono, right), deadline (live countdown), meta line
- Hover/focus: subtle card lift, accent left border

### Bounty Detail — "Spec Sheet"
```
┌─────────────────────────────────────────────────────────────┐
│  ← All bounties                                    [Share]  │
├─────────────────────────────────────────────────────────────┤
│  Predict the next 5 trading days' moves of 9 Nasdaq stocks  │
│  ─────────────────────────────────────────────────────────  │
│  Reward:      $250                    Deadline:  Nov 10 2:00 UTC (2d 4h) │
│  Entry fee:   $10                     Entries:   62            │
│  Category:    Forecasting             Skills:    TS, Python   │
│  ─────────────────────────────────────────────────────────  │
│  [Leaderboard]  [All Entries]  [Enter]                      │
├─────────────────────────────────────────────────────────────┤
│  Description                                                    │
│  Nine big Nasdaq stocks trade on Solana as xStocks…           │
└─────────────────────────────────────────────────────────────┘
```
- Two-column desktop, stacked mobile
- Sticky action bar on scroll (Enter, Leaderboard, Entries)
- Description in scrollable card, pre-wrap

### Leaderboard — "Standings Table"
```
┌─────────────────────────────────────────────────────────────┐
│  ← Predict the next 5 trading days…              [View: 📊] │
├─────────────────────────────────────────────────────────────┤
│  #  │ Entrant                    │ Log Score  │ Prize  │   │
│  ───┼────────────────────────────┼────────────┼────────┤   │
│  1  │ @kokonutscereal-dotcom     │ -5.0500    │  #1    │ 🥇│
│  2  │ @quant_wizard              │ -5.2300    │  #2    │   │
│  3  │ @data_nerd                 │ -5.4100    │  #3    │   │
│  …  │ …                          │ …          │  …     │   │
│  47 │ @newcomer                  │ -12.3000   │  —     │   │
└─────────────────────────────────────────────────────────────┘
```
- **Virtualized table** (tanstack/virtual or custom) — handles 1000+ rows
- Sticky header, frozen rank column
- Row hover: highlight, click → profile
- Medal icons for top 3 (signature touch)
- Live indicator pulsing on active competition

### Profile — "Player Card"
```
┌─────────────────────────────────────────────────────────────┐
│  ← All bounties                                                   │
├─────────────────────────────────────────────────────────────┤
│  @kokonutscereal-dotcom                              [Avatar] │
│  ─────────────────────────────────────────────────────────  │
│  Wins: 3    Podiums: 7    Total: $2,450    Best: #1          │
│  Entered: 12    Joined: Nov 2026                              │
│  ─────────────────────────────────────────────────────────  │
│  Placed Entries                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Predict the next 5 trading days…         #1    $250     │ │
│  │ WebGL Fluid Solver Challenge             #2    $150     │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```
- Compact stats row (scannable)
- Table of placed entries only

---

## Signature Element: **Live Pulse System**

Every time-sensitive element (deadlines, live scores, active competition badges) shares a **unified pulse animation**:
- A subtle `::before` ring that expands/fades on a 2s loop
- Only runs when `prefers-reduced-motion: no-preference`
- Color: `accent` (`#FF6B35`) for deadlines, `success` for live scores
- Applied via CSS custom property `--pulse-color` — single source of truth

**Why**: Makes "live" tangible without spinners. Competitors *feel* the time pressure. One cohesive motion language across board, detail, leaderboard.

---

## Responsive Breakpoints

| Breakpoint | Layout Changes |
|------------|----------------|
| `≥1024px` | Two-column detail, full table, sticky sidebar |
| `640–1023px` | Stacked detail, table horizontal scroll, condensed rows |
| `<640px` | Card-based board rows, collapsed meta, bottom action bar |

---

## PWA / Offline Strategy

1. **Service Worker** (Workbox-style, native):
   - `CacheFirst` for static assets (JS, CSS, fonts, images)
   - `StaleWhileRevalidate` for API GETs (bounties, leaderboard, profile)
   - `NetworkOnly` for mutations (enter bounty — not in scope)
   - Offline page: cached board + "You're offline" banner

2. **App Manifest**: `manifest.json` with icons, shortcuts to Board/Leaderboard

3. **Background Sync**: Queue "view later" bounties when offline

---

## Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.2s |
| Largest Contentful Paint | < 2.0s |
| Time to Interactive | < 2.5s |
| Bundle (JS + CSS) | < 50 KB gzipped |
| First load requests | ≤ 8 |

**Techniques**:
- No build step — native ES modules, CSS `@import` (or single file)
- Fonts: `font-display: swap`, preload critical
- Virtual lists for board (100+) and leaderboard (1000+)
- API response caching in IndexedDB (5 min TTL)
- Request deduplication (in-flight map)
- `defer` on non-critical JS

---

## Accessibility

- Semantic HTML: `<nav>`, `<main>`, `<article>`, `<table>`, `<dl>`
- Focus visible: `outline: 2px solid var(--accent); outline-offset: 2px`
- ARIA: `aria-live="polite"` on live countdowns, `aria-sort` on table headers
- Color contrast: AA+ on all text
- Reduced motion: `@media (prefers-reduced-motion: reduce)` disables pulse
- Keyboard: all interactive elements reachable, `Enter`/`Space` on buttons

---

## Code Structure (app/)

```
/app
  index.html          # Shell, manifest link, font preloads
  main.js             # Router, SW registration, global state
  api.js              # Fetch with caching, dedup, IndexedDB
  views/
    board.js          # Virtual list, row template
    bounty.js         # Detail + sticky actions
    leaderboard.js    # Virtual table, sort, medals
    profile.js        # Stats card, placed entries table
  components/
    countdown.js      # Live deadline component (pulse)
    avatar.js         # GitHub avatar fallback
    table.js          # Virtualized table base
  style.css           # Single CSS, custom props, @font-face
  sw.js               # Service worker
  manifest.json       # PWA manifest
  fonts/              # Self-hosted variable fonts (woff2)
```

---

## Risk & Mitigation

| Risk | Mitigation |
|------|------------|
| Virtual list complexity | Start simple: IntersectionObserver + fixed row height, upgrade to tanstack/virtual if needed |
| SW caching API responses | Versioned cache keys, max-age header respect, clear on deploy |
| Font loading flash | `font-display: swap` + critical preload, system-ui fallback |
| Live countdowns drift | Single `setInterval` tick, all components read from shared `now` ref |

---

## Next Steps

1. Create `app/` structure with new files
2. Implement design tokens in CSS custom properties
3. Add self-hosted fonts (download woff2)
4. Build virtual list for board
5. Build virtual table for leaderboard
6. Add live countdown component with pulse
7. Implement service worker + manifest
8. Test offline, measure bundle, iterate
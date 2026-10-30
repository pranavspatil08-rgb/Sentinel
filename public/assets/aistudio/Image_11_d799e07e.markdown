---
name: Sentinel AI Command System
colors:
  surface: '#0d1320'
  surface-dim: '#0d1320'
  surface-bright: '#333948'
  surface-container-lowest: '#080e1b'
  surface-container-low: '#161b29'
  surface-container: '#1a1f2d'
  surface-container-high: '#242a38'
  surface-container-highest: '#2f3543'
  on-surface: '#dde2f5'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#dde2f5'
  inverse-on-surface: '#2a303f'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#1bbd85'
  on-tertiary-container: '#00452e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0d1320'
  on-background: '#dde2f5'
  surface-variant: '#2f3543'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  code-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-dense: 0.5rem
  margin: 1.5rem
  margin-mobile: 0.75rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style
The design system establishes a tactical, high-velocity intelligence environment engineered for mission-critical situational awareness, digital forensics, and CCTV surveillance operations. Built for forensic analysts, security dispatchers, and tactical command operators, the interface demands zero visual ambiguity under prolonged operational stress.

The aesthetic fuses modern aerospace telemetry with refined glass-paneled mission control UI. It prioritizes dark-adapted ergonomic performance, sharp signal-to-noise ratios, and spatial density. Interactive surfaces feel crisp, structured, and active—balancing calculated militaristic restraint with intelligent AI-assisted workflows. Live status beacons, cryptographic markers, and real-time bounding overlays emphasize an active link to field operations.

## Colors
The color architecture enforces strict dark-mode semantics engineered to reduce optical fatigue while delivering immediate cognitive parsing of threat priorities:

- **Canvas & Foundations:** Base canvases operate on `#0B111E` and nested zones at `#0F172A`. Surfaces and modules sit on `#162032` and `#1E293B`.
- **Accents & Optical Targets:** Primary system telemetry, focus rings, and primary actions utilize high-energy Cyan (`#06B6D4`) paired with atmospheric glow highlights in Electric Teal (`#38BDF8`).
- **Tactical Status Tokens:**
  - *Normal / Verified / Stream Active:* Emerald green (`#10B981`)
  - *Under Review / Anomalous / Queued:* Amber gold (`#F59E0B`)
  - *Critical Alert / Weapon Detection / Breach / Offline:* Crimson red (`#EF4444`)
- **Typography & Data Tiers:** Absolute white (`#F8FAFC`) for primary intelligence headers and video timestamps; cool slate (`#CBD5E1` and `#94A3B8`) for contextual text and telemetry values; slate mute (`#64748B`) for grid axis markers, camera UUIDs, and secondary metadata.
- **Structural Outlines:** Ghost seams configured with `#334155` and focused data feeds using `rgba(56, 189, 248, 0.15)`.

## Typography
Typography is split strictly into two functional disciplines:

1. **Analytical Sans (`Inter`):** Used for structural navigation, alert summaries, narrative incident dossiers, search inputs, and modal titles. Sets an uncluttered, authoritative tone that prevents ocular distortion during long-shift monitoring.
2. **Telemetry Monospace (`JetBrains Mono`):** Applied to forensic identification metrics, automated license plate recognition (ALPR), stream telemetry (bitrates, framerates, codecs), camera UUIDs, network nodes, and ISO 8601 millisecond timestamps. Numbers remain vertically aligned and tabular across live data streams.

All uppercase telemetry labels (`label-caps`) employ deliberate tracking (+0.08em) for immediate readability against dark container chrome.

## Layout & Spacing
The layout architecture is configured as a dense, high-efficiency command-center grid:

- **Desktop (Multi-Screen & Ultra-Wide Workstations):** Operates on a 16-column, viewport-locked fluid grid. Panels stretch or dock dynamically to sustain concurrent video feeds (2x2, 3x3, 4x4 matrices) flanked by telemetry inspector rails and synchronized audit event logs. Inner component spacing relies on compact steps (`space-xs` to `space-md`) to maximize visual payload density.
- **Tablet / Portable Field Unit (768px – 1024px):** Adapts to an 8-column layout with collapsable inspector drawers and priority toggle tabs between active surveillance cameras and incident response feeds.
- **Mobile Handheld (320px – 767px):** Reflows into a single-column stacked view with horizontal swipe reels for multi-angle streams and expandable bottom sheets for alert triage.

Grid gutters default to `1rem` on dashboard shells and drop to `0.5rem` (`gutter-dense`) inside video multi-viewers to minimize dead border zones between camera streams.

## Elevation & Depth
Elevation mimics stacked physical military avionics displays with glass composites rather than generic soft drop-shadows:

- **Level 0 (Canvas Base):** Flat `#0B111E` background with optional low-contrast coordinate grid lines.
- **Level 1 (Docked Monitoring Panels & Matrix Tiles):** `#162032` surface with a 1px border of `#334155`. Zero shadow to keep multi-panel interfaces clean and performant.
- **Level 2 (Active Camera Inspector / Selected Feed):** `#1E293B` surface surrounded by a 1px border of `rgba(56, 189, 248, 0.4)` and a faint diffuse ambient back-glow: `0 0 16px rgba(6, 182, 212, 0.15)`.
- **Level 3 (Tactical Overlays & Floating HUD Controls):** Translucent backdrop blur (`backdrop-filter: blur(12px)`) with `rgba(15, 23, 42, 0.85)` surface fill, sealed with a 1px border of `rgba(56, 189, 248, 0.25)` and a directional shadow: `0 8px 32px rgba(2, 6, 23, 0.6)`.
- **Critical Alert State:** Threat panels breach normal elevation rules by emitting an inner border pulse of `#EF4444` accompanied by a localized red beacon glow (`0 0 24px rgba(239, 68, 68, 0.3)`).

## Shapes
The design system embraces a calibrated, technical rounding language (`roundedness: 2`):

- **Standard Cards & Video Viewports:** Use `rounded-lg` (0.75rem to 1rem) to soften panel boundaries without losing structural edge precision.
- **Floating Modals & Tactical Overlays:** Standardized to `rounded-xl` (1.25rem to 1.5rem) to set off floating HUD windows from the grid underneath.
- **Pill Elements & Indicators:** High-frequency status pills, telemetry chips, and stream indicators employ full pill curves (`rounded-full`) to contrast against angular video canvases.
- **Interactive Micro-controls & Monospace Badges:** Retain tighter corners (`rounded-sm` / 0.25rem to `rounded-md` / 0.375rem) to retain their mechanical, instrumented feel.

## Components

### Buttons
- **Primary Tactical Action:** Solid `#06B6D4` background, `#0B111E` high-contrast bold typography. Hover state transitions to `#38BDF8` with a cyan edge glow (`0 0 12px rgba(6, 182, 212, 0.35)`). Active state applies a subtle scale reduction (0.98).
- **Secondary / Ghost Control:** `rgba(30, 41, 59, 0.6)` surface with a 1px border of `#334155` and `#F8FAFC` label. On hover, the border shifts to `rgba(56, 189, 248, 0.4)` and text adopts `#38BDF8`.
- **Destructive / Emergency Override:** Dark slate surface with a 1px crimson border (`#EF4444`) and `#EF4444` text. In armed or confirmed mode, fills solid `#EF4444` with white text.

### Telemetry Chips & Status Badges
- Built using `label-caps` / `code-sm` typography with padding `0.25rem 0.5rem`.
- Feature a live pulsed beacon ring (a 6px glowing dot paired with a CSS ping ring for active transmissions).
- Colors directly align with tactical status:
  - *Online / Active:* `rgba(16, 185, 129, 0.12)` background, `#10B981` border, `#10B981` text.
  - *Review / Warning:* `rgba(245, 158, 11, 0.12)` background, `#F59E0B` border, `#F59E0B` text.
  - *Threat Detected:* `rgba(239, 68, 68, 0.15)` background, `#EF4444` border, `#EF4444` text.

### Inputs & Search Bars
- Background set to deep slate (`#0F172A`), enclosed in a 1px `#334155` border.
- Integrated prefix icons (e.g., optical target icons, magnifying lens) in `#64748B`.
- Focused state eliminates generic native rings and applies a clean 1px `#06B6D4` border and an ambient cyan rim glow (`0 0 8px rgba(6, 182, 212, 0.25)`).

### Checkboxes & Radios
- Checkboxes are 16px squares with `rounded-sm` corners; radios are 16px circles.
- Unchecked state features an empty `#0F172A` interior with a `#334155` edge.
- Checked state fills with `#06B6D4` displaying `#0B111E` check icons or center pips.

### Cards & Surveillance Tiles
- Standardized with `rounded-xl` borders, `#162032` interior fills, and a 1px boundary of `#334155`.
- Tiles include a top telemetry header carrying the Camera Identifier (e.g., `CAM-04-NORTH`), recording timestamp, and resolution tag in `JetBrains Mono`.
- Video frames feature semi-transparent HUD bounding-box overlays (`rgba(6, 182, 212, 0.3)`) displaying object classification tags (e.g., `PERSON 98.4%`, `PLATE: 7XYZ421`).

### Specialized CCTV Timeline Scrubber
- Full-width dark baseline (`#0F172A`) lined with micro tick marks for hours and minutes in `#64748B`.
- Color-coded bar overlays track event clusters: Crimson bars for critical motion alerts, Amber for anomaly flags, Emerald for uninterrupted verified capture.
- Playhead marker: High-contrast 2px `#38BDF8` vertical rule topped with an illuminated diamond scrubber pin.
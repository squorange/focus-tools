# Theme System — Documentation Index

> **Last Updated:** February 8, 2026
> **Current Phase:** Phase 2 — Theme Infrastructure (starting)

---

## Documents

### Planning & Strategy

| Document | Purpose | Status |
|----------|---------|--------|
| **THEME_SYSTEM_MIGRATION_PROMPTS.md** | Claude Code session prompts (Sessions 1-10) | ✅ Ready |
| **THEME_SYSTEM_MIGRATION_TRACKER.md** | Progress tracking, metrics, component checklist, decisions | ✅ Ready |
| **THEME_SYSTEM_AUDIT_PROMPTS.md** | Original audit prompts (reference, already executed) | ✅ Complete |

### Audit Results

| Document | What It Found | Key Takeaway |
|----------|--------------|-------------|
| `docs/audits/01-token-inventory.md` | ~220 tokens, full light/dark coverage, some legacy duplication | Token system is architecturally sound |
| `docs/audits/02-color-usage-audit.md` | ~2,076 raw colors across ~100 files | Majority are repeating patterns — systematic replacement |
| `docs/audits/03-component-status.md` | 89% of design system clean; 60% of app components "Easy" | Color maps are highest-leverage targets |
| `docs/audits/04-interactive-states.md` | 82% of hover states hardcoded; focus rings all raw | ~8 new tokens covers the majority |
| `docs/audits/05-edge-case-colors.md` | Overlays high priority; shadows/SVGs can defer | Overlays pulled into Phase 1 scope |
| `docs/audits/06-typography.md` | System fonts, no CSS var for font-family yet | Trivial to add, high theming impact |
| `docs/audits/07-ai-bar-purple-tinge.md` | Purple glass is a gradient in AIAssistantOverlay.tsx | Needs dedicated AI glass tokens |

### Existing Project Docs (Related)

| Document | Relevance |
|----------|-----------|
| `ARCHITECTURE_EVOLUTION_GUIDE.md` | Phase sequencing: Design System → Theming → Orbital Zen |
| `FUTURE_CONSIDERATIONS.md` | Theme System / UI Add-on Packs strategic analysis |
| `ROADMAP.md` | Infrastructure phases 4 (Design System) → 7 (Theming) → 8 (Orbital Zen) |

---

## Architecture Overview

```
Phase 1 (NOW)                    Phase 2                        Phase 3
Token Migration                  Theme Infrastructure           Theme Features
───────────────                  ────────────────────           ──────────────
foundations.css                   ColorTheme type                Settings UI
  ├── :root (light)              ThemeProvider context           Preset picker
  ├── .dark (dark)               Dark mode integration           Custom editor
  └── new tokens                 Preset themes (3-4)             Export/import
                                 Storybook switcher
tailwind.preset.cjs
  └── maps utilities → vars

lib/color-maps.ts
  └── priority, energy,
      status, etc.

Components
  └── all use semantic
      token classes only
```

### Token Architecture

```
CSS Custom Properties (source of truth)
  --color-bg-neutral-base: #fafafa
  --color-bg-accent-high: #8b5cf6
  --glass-ai-bg: linear-gradient(...)
         │
         ▼
Tailwind Preset (maps to utilities)
  bg-bg-neutral-base → var(--color-bg-neutral-base)
  bg-bg-accent-high → var(--color-bg-accent-high)
         │
         ▼
Components (consume utilities)
  <div className="bg-bg-neutral-base text-fg-neutral-primary">
  // No dark: prefix — CSS vars handle mode switching
  // No hardcoded colors — everything flows through tokens
         │
         ▼
ThemeProvider (Phase 2 — swaps all vars at runtime)
  setTheme('warm') → writes new values to <html style="...">
```

---

## Key Decisions Reference

1. **AI components use `generative` tokens** (not `accent`) — preserves distinct AI identity
2. **AI glass gets dedicated tokens** — hand-tunable per theme, not auto-derived
3. **Dark mode stays orthogonal to themes** — each theme defines both light+dark values
4. **Orbital Zen deferred** — different paradigm, will be a Layer 3 theme
5. **Project colors stay as inline styles** — user-defined, must remain dynamic
6. **Font family tokenized now** — single token, outsized personality impact

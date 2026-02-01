# Orbital Zen — Concept Document

> **Status:** 📋 Planned (Phase 7 of Infrastructure Evolution)
> **Last Updated:** February 2026
> **Purpose:** Define the calming, planetary visualization as an alternative UI mode
> **Background:** See [UI_CONCEPTS_EXPLORED.md](./UI_CONCEPTS_EXPLORED.md) for full concept analysis

---

## Overview

Orbital Zen is a calming, visually pleasing alternative interface where tasks are represented as celestial bodies orbiting in a solar system. Bodies with closer orbits are higher priority. This provides a soothing, spatial way to interact with tasks that complements the detail-heavy list UI.

**Core Principle:** Two UI modes serving different mental states:
- **List UI (current):** Heavy-lifting editing, details, rapid triage
- **Orbital Zen:** Calming overview, gentle prioritization, ambient awareness

Users can toggle between modes via a quick switch in the top nav.

---

## View-by-View Design

### Focus Queue (Orbital View)

**Concept:** Today's tasks orbit the user's "focus sun" with upcoming tasks outside an asteroid belt.

```
                    ╭─────────────────────────────╮
                   ╱                               ╲
                  │      ○ Task A (Today)           │
                  │   ╱                             │
                  │  ☀️  ← Focus Sun                │
                  │   ╲     ○ Task B (Today)        │
                  │      ═══════════════════        │  ← Asteroid Belt
                  │         ◦ Task C (Upcoming)     │
                  │           ◦ Task D (Upcoming)   │
                   ╲                               ╱
                    ╰─────────────────────────────╯
```

**Interactions:**
- Drag/drop tasks to different orbital positions (reorder)
- Drag across asteroid belt to move Today ↔ Upcoming
- Tap task to zoom into Task Details view
- Routine tasks appear as asteroids floating around the belt, highlighting immediate ones

**Visual Properties:**
| Property | Mapping |
|----------|---------|
| Orbital distance | Priority (closer = higher) |
| Planet size | Complexity / step count |
| Color/glow | Energy type or health status |
| Orbit speed | Urgency (faster = more urgent) |
| Opacity | Staleness (faded = neglected) |

---

### Task Details (Planetary View)

**Concept:** Main task as a planet with steps as orbiting moons.

```
                    ╭─────────────────────────────╮
                   ╱         🌙 Step 1              ╲
                  │                                  │
                  │      🌙 Step 2                   │
                  │             🪐 Task              │
                  │                  🌙 Step 3       │
                  │                                  │
                   ╲              🌙 Step 4         ╱
                    ╰─────────────────────────────╯
```

**Interactions:**
- Tap moon to see step details
- Completed moons fade/drift outward
- Add step = new moon materializes
- Substeps could be moonlets orbiting moons

**Visual Properties:**
| Property | Mapping |
|----------|---------|
| Moon size | Step complexity |
| Moon phase | Completion progress |
| Orbital position | Step order |
| Glow | Currently focused step |

---

### Focus Mode (Surface Landing)

**Concept:** Zoom into planet surface or moon surface to focus on one thing at a time.

```
┌────────────────────────────────────────────────────┐
│                                                    │
│                    🌙                              │
│              Current Step Moon                     │
│               (large, central)                     │
│                                                    │
│         [Body Double AI Messages]                  │
│         [Timer / Progress]                         │
│                                                    │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│                Planet Surface Arc                  │
└────────────────────────────────────────────────────┘
```

**Interactions:**
- Complete step = moon sets below horizon, next moon rises
- Stuck = moon dims, AI companion appears
- Timer shown as moon phase progression
- Exit = zoom out to planetary view

---

### Tasks View / Staging

**Concept:** Each section is a star system that can be swiped between and zoomed into.

```
┌─────────────────────────────────────────────────────┐
│  [Inbox System]  [High Priority]  [Medium]  [Low]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│         ★ Inbox System                              │
│        ╱ ╲                                          │
│       ○   ○   ○  ← Tasks as planets                 │
│      ╱         ╲                                    │
│     ○           ○                                   │
│                                                     │
│     ← Swipe to [High Priority System] →             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Open Questions:**
- Should sections be separate star systems or zones in one system?
- How to show task counts without clutter?
- Pinch to zoom between galaxy view and individual systems?

---

## Theme Pack Architecture

Orbital Zen is the first "theme pack" — a complete visual and interaction alternative built on the same core actions.

### Vision: Swappable Theme Packs

```
┌─────────────────────────────────────────────────────┐
│                   Core Actions Layer                 │
│  addTask, completeStep, addToQueue, startFocus...   │
└─────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ List UI  │   │ Orbital  │   │ Bubbles  │   ...
    │ (base)   │   │  Zen     │   │ Theme    │
    └──────────┘   └──────────┘   └──────────┘
```

**Future Theme Ideas:**
- **Bubbles:** Tasks float up based on urgency, pop on completion
- **Garden:** Tasks as plants that grow, harvest when complete
- **River:** Tasks flow downstream toward today
- **Minimal Zen:** Ultra-clean list with gentle animations

### Community Themes (Long-term)

Eventually support community-created themes that match different mental models:
- Same data, different visualizations
- Core interactions preserved (add, complete, reorder)
- Theme-specific interactions allowed (drag orbits, shake bubbles)
- Accessibility baseline required

---

## Dependencies

| Dependency | Why Needed | Status |
|------------|------------|--------|
| Design System Extraction | Separate logic from presentation | Phase 3 |
| Theming Infrastructure | Theme provider, switching, tokens | Phase 6 |
| Component Primitives | Reusable action hooks | Part of design system |
| Canvas/WebGL | Smooth orbital animations | Research needed |

**Cannot start Orbital Zen until:**
1. Design tokens extracted
2. Core actions available as hooks
3. Theme adapter interface defined

---

## Technical Considerations

### Animation Performance

| Concern | Mitigation |
|---------|------------|
| Many orbiting objects | Limit visible objects; use CSS transforms where possible |
| Mobile performance | Simplified orbits; reduce particle effects |
| Battery drain | Pause animations when not visible; respect reduced-motion |

### Interaction Challenges

| Challenge | Approach |
|-----------|----------|
| Drag on curved paths | Snap to orbital tracks; visual guides |
| Touch targets on small moons | Minimum size; tap-to-select then act |
| Discoverability | Tutorial on first use; subtle affordances |

### State Synchronization

Both List UI and Orbital Zen show the same data:
- Toggle should preserve context (viewing Task X → still viewing Task X)
- Changes in one mode immediately reflected in other
- No mode-specific state beyond view preferences

---

## Open Questions

1. **Animation library:** Framer Motion? Three.js? Pure CSS?
2. **Accessibility:** How to make orbital view screen-reader friendly?
3. **Transition:** Animate between List ↔ Orbital or instant switch?
4. **Mobile-first or desktop-first?** Orbital may work better on larger screens
5. **Routine tasks in asteroid belt:** How prominent? Always visible?

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [UI_CONCEPTS_EXPLORED.md](./UI_CONCEPTS_EXPLORED.md) | Full catalog of visual concepts |
| [FUTURE_CONSIDERATIONS.md](./FUTURE_CONSIDERATIONS.md) | Theme system analysis |
| [../ROADMAP.md](../ROADMAP.md) | Implementation timeline |
| [../ARCHITECTURE_EVOLUTION_GUIDE.md](../ARCHITECTURE_EVOLUTION_GUIDE.md) | Infrastructure phasing |

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-02 | Initial concept document with view-by-view designs |

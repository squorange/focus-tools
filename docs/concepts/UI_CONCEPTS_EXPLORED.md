# Focus Tools — UI Concepts Explored

> **Status:** Reference Document  
> **Last Updated:** December 2024  
> **Purpose:** Catalog of visual/interaction concepts explored during ideation, with analysis for future reference

---

## Overview

During the design phase of Focus Tools, we explored numerous UI metaphors and visual paradigms to find the best fit for ADHD-friendly task management. This document captures all concepts discussed, their unique aspects, and analysis for future consideration.

**Selected Direction:** Orbital Zen (with body double AI integration)  
**High Priority for v2:** Creature Companion System

---

## Primary Concepts

### 1. Orbital Zen ⭐ (Selected)

**Description:**  
Tasks orbit around the user's current focus like celestial bodies in a solar system. Priority determines orbital distance (closer = more urgent). Subtasks appear as moons orbiting parent task planets. Projects can be represented as star systems.

**Unique Aspects:**
- Fractal zoom: Galaxy → Solar system → Planet → Moons
- Gravity well pulls urgent tasks closer to center
- Constellation lines show relationships between related tasks
- "Asteroid belt" represents daily focus items
- Visual drift for neglected/stale tasks

**Visual Mapping:**

| Visual Property | Data Source | Effect |
|-----------------|-------------|--------|
| Planet/Moon Size | Complexity | simple=small, complex=large |
| Orbital Distance | Focus Score | high priority=close, low=far |
| Color Intensity | Priority | high=vivid, low=muted |
| Glow/Pulse | Health Status | at_risk=amber, critical=red |
| Opacity | Staleness | fresh=100%, stale=40% |

**Strengths:**
- Matches spatial thinking patterns common in ADHD
- Natural hierarchy through distance/scale
- Reduces overwhelm (start minimal, zoom out for complexity)
- Scientific metaphor feels sophisticated, not childish
- Scalable from 5 tasks to hundreds

**Weaknesses:**
- Animation performance concerns with many objects
- Learning curve for users unfamiliar with the metaphor
- May feel abstract for users who prefer traditional lists
- Orbital mechanics can become complex to implement well

**Opportunities:**
- AR/VR expansion potential
- Gamification through "space exploration" progression
- Natural fit for time-based views (orbital periods)
- Could integrate real astronomical events as features

**Usability/Performance:**
- Requires WebGL or Canvas for smooth animation
- Performance degrades with 50+ visible objects
- Mobile adaptation needs aggressive simplification

**Implementation Difficulty:** Medium-High

---

### 2. Creature Companion System 🐾 (High Priority v2)

**Description:**  
Tasks manifest as friendly geometric creatures in an ecosystem. Creatures have behaviors that reflect task states—sleeping (backlog), wandering (available), calling (due soon), jumping (urgent). The AI body double becomes a companion creature that works alongside you.

**Unique Aspects:**
- Creature states communicate urgency through behavior, not color/size
- Different biomes represent different life areas (work, home, health)
- "Herds" of similar creatures for batch work
- Roundup/lasso mode to collect tasks for focus sessions
- Calling/whistling to attract relevant tasks to current view
- Creatures "burrow" to hide when filtered out

**Visual Design Notes:**
- Geometric/abstract creatures (not literal animals)
- Box shapes with motion and subtle details for personality
- Clean aesthetic that doesn't distract
- Movement and behavior over visual complexity

**Strengths:**
- Makes tasks feel less intimidating—companions, not burdens
- Natural body doubling metaphor
- Playful engagement increases motivation
- Strong emotional connection reduces avoidance
- Works well for people who personify objects

**Weaknesses:**
- Risk of feeling too "gamey" or childish for some users
- Animation complexity for unique creature behaviors
- May not scale well visually with many creatures
- Harder to quickly scan/compare task properties

**Opportunities:**
- Strong differentiation from all existing task apps
- Natural fit for rewards/achievements system
- Could evolve creatures based on completion history
- Potential for creature "personalities" matching task types

**Usability/Performance:**
- Requires significant animation work
- AI behavior systems add complexity
- Mobile performance a concern with many creatures

**Implementation Difficulty:** High

---

### 3. Living Bubbles

**Description:**  
Tasks appear as bubbles in a fizzy drink. Items needing attention naturally float to the top. Bubble clusters represent multi-task projects. Simple, playful, with natural physics-based prioritization.

**Unique Aspects:**
- Urgency = buoyancy (important tasks float up)
- Project clusters as connected bubble groups
- Completion = bubble pops with satisfying effect
- Shaking/stirring interface to reorganize

**Strengths:**
- Extremely intuitive—everyone understands bubbles
- Physics-based prioritization feels natural
- Satisfying micro-interactions (pop, merge, float)
- Scales well visually
- Low cognitive load

**Weaknesses:**
- Limited visual vocabulary for task properties
- Bubbles don't convey hierarchy well
- May feel too casual for professional use
- Hard to show task details without breaking metaphor

**Opportunities:**
- Great for quick capture/triage views
- Could combine with other metaphors as a "mode"
- Natural fit for mobile with touch interactions

**Usability/Performance:**
- Simple physics engine required
- Excellent mobile adaptation potential
- Easy to understand immediately

**Implementation Difficulty:** Low-Medium

---

### 4. Gardening / Growth Metaphor 🌱

**Description:**  
Tasks follow an organic lifecycle: plant (capture), water (nurture), tend (execute), prune (deprioritize), harvest (complete), compost (archive), resurface (recall dormant items).

**Unique Aspects:**
- Growth metaphor allows for dormancy without failure
- Seasonal patterns for recurring tasks
- Visual maturation over time
- Decay enriches future growth (learning from completed tasks)

**Strengths:**
- Warm, ADHD-friendly—growth vs. productivity guilt
- Natural metaphor for task evolution
- Shame-free abandonment (composting, not failure)
- Works well for long-term projects

**Weaknesses:**
- May feel too "soft" for some users
- Growth timelines don't match task urgency
- Visual complexity with many plants
- Harder to show precise deadlines

**Opportunities:**
- Strong emotional resonance for nature-oriented users
- Natural fit for habit tracking
- Could integrate weather as energy/capacity

**Usability/Performance:**
- Moderate animation requirements
- Good scalability
- Intuitive for most users

**Implementation Difficulty:** Medium

---

### 5. Time River

**Description:**  
Tasks flow down a river toward "today." User stands at "now" looking upstream. Throw nets to catch tasks for today. Rapids indicate urgency; calm pools represent someday/maybe items.

**Unique Aspects:**
- Temporal flow is literal, not abstract
- Fork paths for different life streams
- River guide (AI) suggests what to catch
- Tasks can be "thrown back" (deferred)

**Strengths:**
- Time blindness addressed through spatial time representation
- Natural prioritization through flow speed
- Intuitive catch/release interaction
- Peaceful, zen aesthetic

**Weaknesses:**
- Linear metaphor may not fit non-linear task relationships
- Limited space for task details
- May feel passive (tasks come to you)
- Hard to show task relationships

**Opportunities:**
- Strong fit for daily planning rituals
- Could work well for inbox processing
- Natural integration with calendar

**Usability/Performance:**
- Continuous animation required
- Good mobile potential
- Moderate learning curve

**Implementation Difficulty:** Medium

---

### 6. Frequency Tuner / Radio Metaphor 🎵

**Description:**  
Tasks exist as radio frequencies. Tune a dial to find different "stations" (contexts/projects). Volume = urgency, clarity = definition level. Static between stations reveals orphan tasks.

**Unique Aspects:**
- Audio metaphor creates different mental model
- DJ persona for AI (mixing your daily playlist)
- Loop/repeat for recurring tasks
- Playlists for different energy states

**Strengths:**
- Novel organization method
- Built-in time sense (track duration)
- Natural fit for music/audio lovers
- Creative, distinctive approach

**Weaknesses:**
- Abstract metaphor may confuse users
- Limited visual vocabulary
- Audio feedback may not suit all environments
- Harder to see "big picture"

**Opportunities:**
- Could actually generate ambient sounds based on task state
- Integration with focus music/soundscapes
- Unique market positioning

**Usability/Performance:**
- Audio adds complexity
- Novel interaction patterns need testing
- High learning curve

**Implementation Difficulty:** Medium-High

---

### 7. Memory Foam / Physical Surface

**Description:**  
Tasks physically indent a surface based on weight (importance) and time (attention). Your attention "presses" into areas. Neglected areas bounce back/rise up. Can smooth or reshape the surface.

**Unique Aspects:**
- Physical metaphor for attention allocation
- History visible through surface deformation
- AI as "massage therapist" working problem areas
- Haptic potential for mobile

**Strengths:**
- Visceral, tactile mental model
- Shows attention patterns over time
- Natural for understanding balance/imbalance
- Unique interaction paradigm

**Weaknesses:**
- Abstract—may not immediately communicate meaning
- Limited task detail visibility
- 3D rendering complexity
- Novel metaphor requires learning

**Opportunities:**
- Potential for stress/overwhelm visualization
- Natural fit for capacity planning
- Could work with physical devices (pressure-sensitive)

**Usability/Performance:**
- 3D rendering requirements
- High processing for deformation physics
- Steep learning curve

**Implementation Difficulty:** High

---

### 8. Task Weather System 🌤️

**Description:**  
Projects are pressure systems. Tasks precipitate when conditions align. Storm warnings for deadline convergence. User controls climate (energy/focus level). AI as meteorologist.

**Unique Aspects:**
- Storm clouds = blocked/high difficulty
- Sunrise on tasks = becoming available
- Climate patterns for recurring tasks
- Weather forecasts for upcoming pressure

**Strengths:**
- Rich visual vocabulary
- Natural fit for deadline awareness
- Intuitive metaphor for most people
- Works well for anticipating conflicts

**Weaknesses:**
- Weather is unpredictable—tasks shouldn't feel that way
- Complex visual system
- May feel overwhelming with many "weather patterns"
- Passive framing (weather happens to you)

**Opportunities:**
- Strong potential for proactive notifications
- Natural integration with calendar
- Could use real weather as energy indicator

**Usability/Performance:**
- Animation-heavy
- Many visual states to design
- Moderate learning curve

**Implementation Difficulty:** Medium-High

---

### 9. Quantum Superposition

**Description:**  
Tasks exist in multiple states until observed. Choosing a lens "collapses" possibilities. Entangled tasks affect each other. Probability clouds show completion likelihood.

**Unique Aspects:**
- Tasks can be "maybe" states until committed
- Entanglement shows task dependencies
- Timeline branches for different decision paths
- Probability-based prioritization

**Strengths:**
- Intellectually engaging for physics-minded users
- Natural fit for uncertainty and planning
- Elegant handling of task state ambiguity
- Sophisticated feel

**Weaknesses:**
- High conceptual complexity
- May feel too abstract for practical use
- Learning curve is steep
- Metaphor may not resonate with non-physicists

**Opportunities:**
- Strong fit for decision-making support
- Natural for "what-if" scenario planning
- Unique positioning in market

**Usability/Performance:**
- Complex state management
- Visualization challenges
- Niche appeal

**Implementation Difficulty:** High

---

### 10. Mycelial Network 🍄

**Description:**  
Underground root system connecting all tasks. Tasks "fruit" when ready. Nutrients (attention) flow through network. Symbiotic relationships between tasks. Decay enriches future growth.

**Unique Aspects:**
- Hidden connections revealed over time
- Nutrients flow based on attention
- Fruiting bodies = tasks ready to complete
- Network visualization shows relationships

**Strengths:**
- Rich metaphor for interconnected work
- Natural for understanding dependencies
- Growth-oriented, shame-free
- Sophisticated, nature-inspired aesthetic

**Weaknesses:**
- Abstract—root systems aren't intuitive for everyone
- Complex visualization
- May feel slow/passive
- Underground = out of sight concern

**Opportunities:**
- Strong fit for complex projects
- Natural for team/collaboration features
- Could reveal hidden task relationships

**Usability/Performance:**
- Network visualization complexity
- Performance concerns with large networks
- Moderate-high learning curve

**Implementation Difficulty:** High

---

### 11. Zen Command Center

**Description:**  
Minimalist interface with progressive disclosure. Start with 3-5 priority items. Command palette with natural language input. Workspace grows only when needed. Gently flowing gradient backgrounds with nice typography.

**Unique Aspects:**
- Elements emerge like objects from liquid surface
- Existing elements reposition elegantly as new ones appear
- History trail/breadcrumbs of navigation
- Maximum simplicity by default

**Strengths:**
- Lowest cognitive load
- Clean, professional aesthetic
- Fast, practical
- Works well as "default mode" for other concepts
- Easy mobile adaptation

**Weaknesses:**
- May feel boring compared to other concepts
- Less differentiation from existing tools
- Limited engagement/motivation features
- Relies heavily on typography and spacing

**Opportunities:**
- Fastest to implement
- Could be "base layer" for other views
- Natural fit for keyboard-first users

**Usability/Performance:**
- Excellent performance
- Easy to learn
- Works well everywhere

**Implementation Difficulty:** Low

---

### 12. Adaptive Focus System 🎭

**Description:**  
Meta-concept where interface shape-shifts between ALL concepts based on user state—energy level, time of day, stress level, type of work. Morning = Zen, Afternoon = Orbital, Evening = River, Overwhelm = Ecosystem comfort.

**Unique Aspects:**
- AI selects optimal view mode
- User state detection/input
- Seamless transitions between metaphors
- Personalized experience over time

**Strengths:**
- Best of all worlds
- Deeply personalized
- Maximum flexibility
- Could learn user preferences

**Weaknesses:**
- Most complex to build
- Transitions may confuse users
- Requires all concepts to be built
- Risk of feeling inconsistent

**Opportunities:**
- Ultimate long-term vision
- Strong AI integration story
- Maximum differentiation

**Usability/Performance:**
- Requires significant optimization
- Complex state management
- Longest learning curve

**Implementation Difficulty:** Very High

---

## Focus Mode Variations (Orbital Zen)

Within the Orbital Zen system, several sub-concepts were explored for Focus Mode:

### Planet Surface Composition ⭐ (Recommended Start)

**Description:** Land on planet surface (arc at screen bottom), focused subtask moon dominates sky.

**Visual:**
```
┌────────────────────────────────┐
│                                │
│            🌙                  │ ← Subtask moon (large, central)
│    [Focus UI elements]         │
│                                │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ ← Planet surface arc
└────────────────────────────────┘
```

**Why Recommended:** More UI space for body double AI, natural grounding metaphor, easier mobile adaptation.

---

### Moon-Centric Composition

**Description:** Current subtask moon fills most of screen with subtle planet arc behind.

**Visual:**
```
┌────────────────────────────────┐
│     ╭─────────────────╮        │
│    │                   │       │
│    │   Current Task    │       │ ← Moon fills view
│    │    [Controls]     │       │
│     ╰─────────────────╯        │
│                        ◯       │ ← Planet as reference
└────────────────────────────────┘
```

**Best For:** Simple subtasks requiring extreme focus.

---

### Eclipse Focus Mode

**Description:** Subtask moon passing in front of planet creates focus. UI appears in corona/shadow.

**Concept:** Subtask literally blocks out distractions. Natural metaphor for focused attention.

---

### Ring System View

**Description:** Subtasks as particles in planetary rings. Current subtask "lifts" from ring, completed tasks fade into ring particles.

**Concept:** Beautiful progress visualization that works at any scale.

---

### Twilight Zone Composition

**Description:** Task planet half in shadow (completed), half in light (in progress). Moons migrate from light to shadow as completed.

**Concept:** Visual boundary between done/todo creates natural progress metaphor.

---

### Lagrange Point Focus

**Description:** UI elements float in gravitational sweet spot between planet and moon. Perfect balance point.

**Concept:** Scientific accuracy adds sophistication; natural balance metaphor.

---

### Orbital Decay Progression

**Description:** Moons spiral inward as you work. Completion = moon merges with planet. Planet grows with each completion.

**Concept:** Progress through gravitational pull creates momentum feeling.

---

### Moon Phase Timer

**Description:** Subtask moon goes through phases slowly (~25m for full lunar cycle) to reflect passage of time.

**Concept:** Natural timer that's less anxiety-inducing than digits. Progress without pressure.

---

## Comparison Matrix

| Concept | Cognitive Load | Implementation | Uniqueness | ADHD Fit | Mobile | Scalability |
|---------|----------------|----------------|------------|----------|--------|-------------|
| Orbital Zen | Medium | Medium-High | High | High | Medium | High |
| Creature Companion | Medium | High | Very High | Very High | Medium | Medium |
| Living Bubbles | Low | Low-Medium | Medium | High | High | High |
| Gardening | Low-Medium | Medium | Medium | High | High | Medium |
| Time River | Medium | Medium | High | Medium | Medium | Medium |
| Frequency Tuner | High | Medium-High | Very High | Medium | Low | Medium |
| Memory Foam | High | High | Very High | Medium | Low | Low |
| Weather System | Medium-High | Medium-High | High | Medium | Medium | Medium |
| Quantum | Very High | High | Very High | Low | Low | Low |
| Mycelial Network | High | High | High | Medium | Low | Medium |
| Zen Command Center | Very Low | Low | Low | High | Very High | High |
| Adaptive System | Variable | Very High | Very High | Very High | Medium | High |

---

## Decision Rationale

**Why Orbital Zen was selected:**
1. Matches spatial thinking patterns
2. Provides natural hierarchy without overwhelming
3. Scalable from simple to complex
4. AI integration feels natural (body double in "focus mode")
5. Unique enough to differentiate, familiar enough to learn quickly
6. Good balance of implementation effort vs. value

**Why Creature Companion is v2 priority:**
1. Highest ADHD fit and emotional engagement
2. Natural body double metaphor
3. Strong differentiation potential
4. Builds on Orbital Zen foundation (creatures can live on planets)

---

## Future Considerations

1. **Hybrid Approaches:** Many concepts could combine (e.g., Orbital + Zen as default/focused modes)
2. **User Preference:** Allow power users to switch metaphors
3. **Context Switching:** Different metaphors for different task types
4. **Accessibility:** Ensure all concepts work for various ability levels
5. **Performance Testing:** Validate animations don't impact usability

---

## Revision History

| Date | Changes |
|------|---------|
| December 2024 | Initial comprehensive catalog created |

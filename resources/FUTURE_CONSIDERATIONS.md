# Focus Tools — Future Considerations

> **Status:** Living document for strategic options and speculative features  
> **Last Updated:** December 31, 2024  
> **Purpose:** Capture ideas worth exploring, with analysis, before committing to roadmap

---

## How to Use This Document

- **Ideas start here** → Analyzed → If viable, promoted to Roadmap
- **Not a backlog** — no priority order, no commitment
- **Include tradeoffs** — every idea has pros/cons/alternatives
- **Link to decisions** — when idea is decided (yes/no), note outcome and move rationale to Decision Log

**Lifecycle:**
```
Idea → [EXPLORING] → Analysis complete → [READY] → Decision made → [PROMOTED/DEFERRED/REJECTED]
```

---

## Active Considerations

---

### 1. Theme System / UI Add-on Packs

**Status:** Exploring

**Summary:** Allow alternative visual metaphors (minimal list, bubbles, garden, etc.) as purchasable add-ons or community-created packs built on the core data model.

**Target Users:** 
- Users who find Orbital Zen too playful/abstract
- Users wanting personalization
- Accessibility needs (simpler visuals)
- Community creators wanting to contribute

**Analysis:**

| Aspect | Assessment |
|--------|------------|
| Feasibility | High — data model is visualization-agnostic |
| Revenue potential | Medium-High (direct sales or marketplace cut) |
| Complexity | Medium — requires theme adapter architecture |
| Dependencies | Core app stability, proven demand |

**Data Model → Theme Mapping (Already Supported):**

| Data Field | Orbital Zen | Minimal List | Bubbles | Garden |
|------------|-------------|--------------|---------|--------|
| `focusScore` | Orbital distance | Sort order | Buoyancy | Growth stage |
| `complexity` | Planet size | Indent depth | Bubble size | Plant type |
| `healthStatus` | Glow color | Badge/icon | Bubble color | Wilting/thriving |
| `priority` | Color intensity | Bold/weight | Pulse rate | Flower color |
| `DailyPlan` | Asteroid belt | "Today" section | Pinned top | "Harvest ready" |

**Technical Approach:**

```typescript
interface ThemeAdapter {
  id: string;
  name: string;
  
  // Capabilities
  layoutEngine: 'orbital' | 'list' | 'freeform' | 'grid';
  supportsDragDrop: boolean;
  animationLevel: 'none' | 'subtle' | 'rich';
  mobileSupported: boolean;
  accessibilityLevel: 'full' | 'partial' | 'limited';
  
  // Mapping functions
  getTaskVisuals(task: Task): TaskVisuals;
  getStepVisuals(step: Step, parent: Task): StepVisuals;
  
  // Rendering
  renderTask(task: Task, visuals: TaskVisuals): ReactNode;
  renderFocusMode(task: Task, step: Step): ReactNode;
}
```

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A. View modes first** | List/Orbital/Calendar (same visual language, different layouts) | Lower complexity, validates architecture | Less differentiation |
| **B. Full theme system** | Complete visual metaphor changes | Maximum flexibility, revenue potential | High development cost |
| **C. Density levels** | Minimal → Standard → Rich (same metaphor) | Simpler than full themes | Less exciting |

**Monetization Options:**

| Model | Description |
|-------|-------------|
| Freemium | Orbital free, others $2-5 each |
| Subscription | Pro tier unlocks all themes |
| Marketplace | 70/30 rev share with creators |
| Seasonal | Limited-time holiday themes |

**Concerns & Mitigations:**

| Concern | Impact | Mitigation |
|---------|--------|------------|
| Interaction divergence | Different themes expect different interactions | Define core interactions ALL themes must support |
| QA burden | Multiplies testing with each theme | Automated visual regression; community themes = community QA |
| Accessibility | Some themes inherently less accessible | Require accessible mode fallback; Minimal List as baseline |
| Mobile performance | Rich animations lag on mobile | Theme metadata includes `mobileSupported`; auto-fallback |
| Community quality | Security, bugs, abandonment | Review process, sandboxing, "verified" badges |

**Open Questions:**
- [ ] What's minimum viable theme system? View modes vs full metaphor change?
- [ ] Community store: build vs use existing platform (Gumroad, etc.)?
- [ ] How to handle theme-specific tutorials/onboarding?

**Recommendation:** 
- **Phase 1 (MVP):** Orbital Zen only, but build with ThemeAdapter interface in mind
- **Phase 2:** Add Minimal List as accessibility/simplicity option (validates architecture)
- **Phase 3:** Open community submissions with review process

**References:** 
- `UI_CONCEPTS_EXPLORED.md` — Full catalog of visual concepts considered
- `FOCUS_TOOLS_DATA_MODEL.md` — Visualization fields (focusScore, complexity, healthStatus)

---

### 2. Bring Your Own AI (BYOAI)

**Status:** Exploring

**Summary:** Allow users to connect their own AI API key instead of using (and paying for) our hosted AI calls.

**Target Users:**

| Segment | Motivation | Expected Volume |
|---------|------------|-----------------|
| Power users | Heavy usage, cost control | High |
| Privacy-focused | Don't want data through our servers | Medium |
| Enterprise | Existing API agreements, compliance | High |
| Developers | Experimentation, customization | Low-Medium |

**Analysis:**

| Aspect | Assessment |
|--------|------------|
| Feasibility | Medium — technically simple, business implications complex |
| Revenue potential | Low direct (reduces our API revenue), High retention |
| Complexity | Low-Medium (single provider) to High (multi-provider) |
| Dependencies | Stable prompt architecture, clear support boundaries |

**Technical Approaches:**

| Approach | Prompt Visibility | Security | Complexity |
|----------|-------------------|----------|------------|
| **Client-side calls** | Fully visible in browser | User's key never on server | Low |
| **Server proxy** | Hidden (server calls API) | We handle their key | Medium |
| **Hybrid** | Core hidden, user additions visible | Split responsibility | High |

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A. Anthropic only, proxied** | Server-side calls with user's Claude API key | Prompts protected, single model to optimize | Limited flexibility |
| **B. Multi-provider** | Support Claude, GPT, etc. | Maximum flexibility | Prompt engineering per model, support burden |
| **C. Local model hybrid** | Simple tasks local, complex tasks cloud | Cost reduction, privacy | Quality variance, complexity |

**Concerns & Mitigations:**

| Concern | Impact | Mitigation |
|---------|--------|------------|
| **Prompt IP leakage** | Competitive advantage exposed | Server-side proxy keeps prompts hidden; OR accept prompts aren't the moat—UX is |
| **Support burden** | "It doesn't work" = their API issues | Clear error messages, self-service diagnostics, reduced support for BYOAI tier |
| **Inconsistent experience** | Different models behave differently | Lock to tested models; OR extensive per-model prompt engineering |
| **Model selection complexity** | Prompt engineering explodes | Start with Anthropic-only; expand based on demand |

**Monetization Angles:**

| Model | How It Works |
|-------|--------------|
| BYOAI as premium | Free: limited AI via our API. Pro: BYOAI unlimited |
| Reverse freemium | Everyone BYOAI, sell "convenience credits" for easy path |
| Enterprise only | Consumer = our API. Enterprise = must BYOAI (compliance) |

**Open Questions:**
- [ ] How much of our value is in the prompts vs. the product experience?
- [ ] What's the support policy for BYOAI users?
- [ ] Should BYOAI users get access to prompt customization?

**Recommendation:**
- **Phase 1 (MVP):** Our API only, simple pricing (free limited, paid unlimited)
- **Phase 2:** Add BYOAI as "Power User" option, Anthropic API only, server-proxied
- **Phase 3:** Evaluate demand for other providers; local model for basic interactions

**References:**
- `AI_UI_COMMUNICATION_PATTERNS.md` — Technical patterns for AI integration

---

### 3. Community Marketplace

**Status:** Exploring (dependent on Theme System)

**Summary:** Platform for community members to create, share, and sell themes, templates, or extensions.

**Target Users:**
- Creators wanting to monetize designs
- Users wanting variety/personalization
- Power users wanting workflow templates

**Analysis:**

| Aspect | Assessment |
|--------|------------|
| Feasibility | Medium — requires theme system + platform infrastructure |
| Revenue potential | High (passive income from rev share) |
| Complexity | High (moderation, payments, quality control) |
| Dependencies | Theme system, user base size, legal framework |

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A. Build marketplace** | Full in-app store | Maximum control, seamless UX | High development, payment complexity |
| **B. External platform** | Gumroad, Itch.io, etc. | Fast to launch, proven infrastructure | Less integrated, brand dilution |
| **C. Curated gallery** | We select and host, no payments | Quality control, simpler | Limited scale, no creator incentive |

**Revenue Share Models:**

| Model | Our Cut | Creator Cut | Precedent |
|-------|---------|-------------|-----------|
| 70/30 | 30% | 70% | App Store, most platforms |
| 85/15 | 15% | 85% | Epic Games Store |
| Subscription pool | Subscription % | Pro-rata by usage | Spotify model |

**Concerns & Mitigations:**

| Concern | Mitigation |
|---------|------------|
| Quality variance | Review process, user ratings, "verified" badges |
| Security (malicious code) | Sandboxing, code review, limited API access |
| Abandonment | Deprecation policy, "last updated" visibility |
| Legal/licensing | Clear terms of service, attribution requirements |
| Support burden | Creators responsible for their items; platform-level issues only |

**Open Questions:**
- [ ] Minimum user base before marketplace makes sense?
- [ ] Build vs. use existing platform?
- [ ] What can be sold beyond themes? (Templates, workflows, integrations?)

**Recommendation:**
- **Defer** until theme system proven and user base established
- **Interim:** Community Discord for sharing, manual curation

---

### 4. Local/Hybrid AI

**Status:** Exploring (long-term)

**Summary:** Run simple AI tasks locally (on-device) to reduce API costs and latency, with cloud fallback for complex tasks.

**Target Users:**
- Privacy-conscious users
- Users in low-connectivity environments
- Cost-sensitive high-volume users

**Analysis:**

| Aspect | Assessment |
|--------|------------|
| Feasibility | Medium — depends on model quality improvements |
| Revenue potential | Cost reduction (not direct revenue) |
| Complexity | Medium-High |
| Dependencies | WebLLM/WebGPU maturity, small model quality |

**Task Distribution:**

| Task Type | Local Candidate? | Rationale |
|-----------|------------------|-----------|
| Step acknowledgments | ✅ Yes | Simple, low stakes |
| Focus mode prompts | ✅ Yes | Short, predictable |
| Task breakdown | ❌ No | Complex reasoning needed |
| Stuck help | ❌ No | Nuanced, context-heavy |
| Recall/search | ⚠️ Maybe | Depends on implementation |

**Open Questions:**
- [ ] When will small models be "good enough" for simple tasks?
- [ ] WebLLM/WebGPU browser support timeline?
- [ ] User perception of local vs cloud AI?

**Recommendation:**
- **Monitor** WebLLM progress and small model improvements
- **Revisit** in 12-18 months
- **Design** prompt architecture to allow task-level routing

---

## Deferred Ideas

| Idea | Reason Deferred | Revisit Trigger |
|------|-----------------|-----------------|
| Voice-first interface | Complexity, accessibility concerns | User demand, speech API improvements |
| Team/collaboration features | Single-user validation first | After personal use proven |
| Calendar deep integration | External API complexity | After core loop stable |
| Habit/recurring task system | Scope creep risk | After v1 stable |

---

## Rejected Ideas

| Idea | Reason Rejected | Date |
|------|-----------------|------|
| — | — | — |

*No ideas rejected yet. When we decide against something, document why here to prevent re-litigating.*

---

## Revision History

| Date | Changes |
|------|---------|
| 2024-12-31 | Initial document created with Theme System, BYOAI, Marketplace, Local AI considerations |

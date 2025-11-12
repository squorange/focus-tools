# Orbital Zen - Focus & Time Tracking

An offline-ready task manager with orbital visualization, focus tracking, and time analytics.

**Status**: Phase 1 Complete ✅ | Production Ready

---

## Quick Start

```bash
# Install dependencies
npm install

# Run development server (starts on port 3002)
npm run dev

# Open app
http://localhost:3002
```

---

## Features

### Phase 1 (Complete)

- ✅ **Orbital Task Visualization** - Tasks orbit based on priority
- ✅ **Subtask Management** - Nested tasks with orbital animations
- ✅ **Focus Session Tracking** - Live timer with pause/resume
- ✅ **Time Analytics** - Session history, aggregation, breakdowns
- ✅ **Activity Logging** - All actions tracked automatically
- ✅ **Priority Belt System** - Visual priority zones with celebration mode
- ✅ **Offline Support** - IndexedDB storage, works without internet

### Upcoming (Phase 2+)

- Break reminder system
- Stale session detection
- Manual time entry UI
- Focus mode UI transformation
- Time history visualization

See `docs/TODO.md` for full roadmap.

---

## Architecture

### Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│ UI Component│────▶│  State (React│────▶│  IndexedDB │
│   (React)   │◀────│   useState)  │◀────│ (Persistent)│
└─────────────┘     └──────────────┘     └────────────┘
```

### Key Concepts

- **Focus Session** - Active timer (one at a time, mutable)
- **Time Entry** - Historical record (many, immutable)
- **Activity Log** - All user actions and system events
- **Priority Belt** - Visual marker for high-priority tasks

### Project Structure

```
app/
├── components/
│   ├── OrbitalView.tsx       # Main view controller
│   ├── TaskNode.tsx           # Task visualization
│   ├── SubtaskMoons.tsx       # Subtask orbitals
│   ├── AIPanel.tsx            # Task details & controls
│   ├── TimerBadge.tsx         # Live timer display
│   ├── PriorityMarker.tsx     # Priority belt indicator
│   └── ErrorBoundary.tsx      # Error handling
├── lib/
│   ├── types.ts               # TypeScript interfaces
│   ├── offline-store.ts       # IndexedDB operations
│   ├── focus-session.ts       # Session management
│   ├── orbit-utils.ts         # Orbital positioning
│   └── logger.ts              # Structured logging
└── hooks/
    └── useFocusTimer.ts       # Timer state management

docs/
├── adr/                       # Architecture Decision Records
├── CODE_REVIEW_CHECKLIST.md  # Review guidelines
├── TESTING_FIXES.md           # Bug prevention guide
├── TEST_EXECUTION.md          # Test results
└── TODO.md                    # Roadmap
```

---

## Development Workflow

### Before You Start

1. Read the code review checklist: `docs/CODE_REVIEW_CHECKLIST.md`
2. If modifying focus/time code, read: `docs/TESTING_FIXES.md`

### Making Changes

```bash
# 1. Create a feature branch
git checkout -b feat/my-feature

# 2. Make your changes
# ...code code code...

# 3. Format code
npm run format

# 4. Lint and fix issues
npm run lint:fix

# 5. Type check
npm run type-check

# 6. Test manually (see Testing section)

# 7. Commit (pre-commit hooks will run automatically)
git add .
git commit -m "feat(focus): add break reminder system"
```

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

Examples:
feat(focus): add break reminder system
fix(timer): prevent double time counting on page reload
docs(adr): add decision record for time calculation approach
refactor(orbital): extract radius calculation logic
test(focus): add session pause/resume tests
chore(deps): update dependencies
```

**Valid types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

Commitlint will enforce this format automatically.

### Pre-commit Hooks

Automatically run before every commit:

- **ESLint** - Code quality checks
- **Prettier** - Code formatting
- **Type check** - TypeScript validation

If hooks fail, fix the issues and commit again.

---

## Testing

### Manual Testing

Follow test suites in `docs/TEST_EXECUTION.md`:

1. **Clear database**: Navigate to `/clear-db.html`
2. **Load sample data**: Refresh the app
3. **Run test suites**: Follow test steps in TEST_EXECUTION.md
4. **Check console**: No errors or warnings
5. **Verify IndexedDB**: Check data persistence

### Automated Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format checking
npm run format:check
```

---

## Code Quality Tools

### TypeScript Strict Mode

Enabled with additional checks:

- `noUncheckedIndexedAccess` - Safe array access
- `noImplicitReturns` - All code paths return
- `noFallthroughCasesInSwitch` - Explicit switch breaks
- `forceConsistentCasingInFileNames` - Case-sensitive imports

### ESLint Rules

- No `console.log` (except `console.warn`/`console.error`)
- No `debugger` statements
- No unused variables (prefix with `_` to ignore)
- No `any` types (use `unknown` instead)
- Exhaustive useEffect dependencies

### Prettier

Consistent code formatting:

- Single quotes
- 2-space indentation
- 100-character line length
- Trailing commas (ES5)

---

## Architecture Decision Records (ADRs)

Major architectural decisions are documented in `docs/adr/`:

- **ADR-001**: Use IndexedDB for local storage
- **ADR-002**: Calculate time from first principles
- **ADR-003**: Separate active sessions from history

Create a new ADR when making significant architectural choices.

---

## Critical Code Sections

### Focus Session & Time Tracking

**⚠️ Read before modifying:**

- `docs/TESTING_FIXES.md` - Bug prevention guide
- `docs/CODE_REVIEW_CHECKLIST.md` - Focus-specific checks

**Key files:**

- `app/lib/focus-session.ts:211-240` - Time calculation (critical!)
- `app/components/AIPanel.tsx:113-145` - formatDuration() helper
- `app/components/AIPanel.tsx:798-814` - Session cleanup pattern

**Common pitfalls:**

1. **Don't** use `session.totalTime + elapsedSinceResume` for time calculation
2. **Don't** manually format time with `Math.floor(seconds / 60)`
3. **Don't** call both `endSession()` and `onStopFocus()`
4. **Don't** forget `focusSession?.id` in useEffect dependencies

---

## Error Handling

### Error Boundary

Wrap components that might fail:

```typescript
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

<ErrorBoundary>
  <OrbitalView {...props} />
</ErrorBoundary>
```

### Structured Logging

Use logger instead of `console.log`:

```typescript
import { logger } from '@/app/lib/logger';

// Info logging
logger.info('User started focus session', { taskId, duration: 60 });

// Error logging
logger.error('Failed to save task', error, { taskId, operation: 'save' });

// Debug logging (development only)
logger.debug('Session state updated', { sessionId, isActive: true });
```

---

## Common Tasks

### Adding a New Feature

1. Check if it requires an ADR (architectural decision)
2. Create feature branch: `git checkout -b feat/feature-name`
3. Implement feature with tests
4. Update relevant documentation
5. Create pull request with checklist

### Fixing a Bug

1. Create bug branch: `git checkout -b fix/bug-description`
2. Add regression test if possible
3. Fix the bug
4. Document fix in `TESTING_FIXES.md` if critical
5. Create pull request referencing issue/test

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update package
npm update package-name

# Test thoroughly after updates
npm run type-check
npm run lint
npm run build
```

---

## Troubleshooting

### "Session showing wrong time"

→ See `docs/TESTING_FIXES.md` - Bug #1
→ Check: Are you calculating from first principles?

### "Stats not updating after session end"

→ See `docs/TESTING_FIXES.md` - Bug #3
→ Check: Is `focusSession?.id` in useEffect deps?

### "Timer not clearing after task completion"

→ See `docs/TESTING_FIXES.md` - Bug #4
→ Check: Using `onClearFocusSession()` not `onStopFocus()`?

### "Pre-commit hook failing"

```bash
# Run checks manually to see errors:
npm run lint
npm run format:check
npm run type-check

# Fix automatically:
npm run lint:fix
npm run format
```

---

## Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety (strict mode)
- **Tailwind CSS** - Styling
- **IndexedDB (idb)** - Offline storage
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Commitlint** - Commit message enforcement

---

## Resources

### Documentation

- `docs/TODO.md` - Project roadmap and phases
- `docs/TEST_EXECUTION.md` - Test results (25/25 passing)
- `docs/TESTING_FIXES.md` - Critical bug fixes and prevention
- `docs/CODE_REVIEW_CHECKLIST.md` - Review guidelines
- `docs/adr/` - Architecture decisions

### Getting Help

1. Check documentation first
2. Search for error in `docs/TESTING_FIXES.md`
3. Review relevant ADR in `docs/adr/`
4. Check git commit history for context
5. Ask for help with specific context

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following code quality standards
4. Run all checks (`lint`, `format`, `type-check`)
5. Commit with conventional commit format
6. Create pull request using CODE_REVIEW_CHECKLIST.md

---

## License

MIT

---

**Last Updated**: 2025-11-11
**Phase**: 1 Complete, Phase 2 Planning
**Test Status**: 25/25 tests passing ✅

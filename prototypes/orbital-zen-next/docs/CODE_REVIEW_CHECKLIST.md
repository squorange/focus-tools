# Code Review Checklist

Use this checklist when reviewing pull requests or self-reviewing code before committing.

---

## Functionality

- [ ] Code does what it's supposed to do
- [ ] Edge cases are handled (empty arrays, null values, missing data)
- [ ] Error states are handled gracefully
- [ ] No regressions in existing features

---

## Code Quality

- [ ] No `console.log()` left in code (except intentional error/warn logging)
- [ ] No commented-out code blocks
- [ ] Functions follow single responsibility principle
- [ ] Names are clear and descriptive
- [ ] Magic numbers replaced with named constants
- [ ] No code duplication (DRY principle followed)

---

## Testing

- [ ] Manually tested happy path
- [ ] Manually tested error cases
- [ ] Tested with real data (not just perfect test data)
- [ ] Verified no console errors or warnings
- [ ] Checked IndexedDB state (for storage operations)

---

## Documentation

- [ ] Complex logic has "why" comments (not just "what")
- [ ] Bug fixes reference the bug or test case (see: `docs/TESTING_FIXES.md`)
- [ ] Public functions have JSDoc comments
- [ ] New features documented in relevant docs
- [ ] ADRs created for architectural decisions

---

## Performance

- [ ] No unnecessary re-renders (use React.memo if needed)
- [ ] No memory leaks (cleanup in useEffect return functions)
- [ ] Database queries use indexes
- [ ] Large lists use virtualization if needed
- [ ] No synchronous operations blocking UI

---

## TypeScript

- [ ] No `any` types (use `unknown` with type guards if needed)
- [ ] No type assertions (`as Type`) without comments explaining why
- [ ] Interfaces properly defined for all data structures
- [ ] No missing required properties
- [ ] Proper null/undefined handling

---

## React Specific

- [ ] useEffect dependencies are complete (no ESLint warnings)
- [ ] No state mutations (always create new objects/arrays)
- [ ] Keys are stable and unique for lists
- [ ] Event handlers don't create new functions on every render
- [ ] Props are properly typed with interfaces

---

## Security

- [ ] No sensitive data in console.log
- [ ] User input is validated/sanitized
- [ ] No XSS vulnerabilities (be careful with innerHTML)
- [ ] No SQL injection (if using database queries)
- [ ] API keys not committed to repository

---

## Accessibility

- [ ] Buttons have descriptive labels or aria-labels
- [ ] Forms have proper labels
- [ ] Interactive elements are keyboard-accessible
- [ ] Color is not the only means of conveying information
- [ ] Alt text for images

---

## Focus Session & Time Tracking (Domain-Specific)

**Critical:** Read `docs/TESTING_FIXES.md` before reviewing changes to:

- `app/lib/focus-session.ts`
- `app/components/AIPanel.tsx` (session management sections)
- `app/components/OrbitalView.tsx` (session lifecycle)

### Time Calculations

- [ ] Time calculated from first principles (NOT accumulated)
- [ ] Uses formula: `(endTime - startTime) - totalPauseTime`
- [ ] Does NOT use: `session.totalTime + elapsedSinceResume`
- [ ] See: `docs/TESTING_FIXES.md` - Bug #1

### Time Display

- [ ] Uses `formatDuration()` helper for all time displays
- [ ] Does NOT use: `Math.floor(seconds / 60) + " min"`
- [ ] Handles seconds, minutes, and hours correctly
- [ ] See: `docs/TESTING_FIXES.md` - Bug #2

### Session Cleanup

- [ ] After calling `endSession()`: uses `onClearFocusSession()`
- [ ] For user-initiated stops: uses `onStopFocus()`
- [ ] Never calls both `endSession()` and `onStopFocus()`
- [ ] See: `docs/TESTING_FIXES.md` - Bug #4

### useEffect Dependencies

- [ ] Stats-loading effects include `focusSession?.id` in dependencies
- [ ] Activity log effects trigger on relevant state changes
- [ ] See: `docs/TESTING_FIXES.md` - Bug #3

### Activity Logging

- [ ] All user actions create activity logs
- [ ] Both complete AND uncomplete actions are logged
- [ ] `loadActivityLogs()` called after creating logs
- [ ] See: `docs/TESTING_FIXES.md` - Bugs #5, #6

---

## Git & Commits

- [ ] Commit message follows conventional commits format
- [ ] Commit message is descriptive (not "fix bug" or "updates")
- [ ] Example: `fix(focus-session): prevent double time counting on page reload`
- [ ] See: `commitlint.config.js` for valid types

---

## Before Merging

- [ ] All linting errors fixed (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] App builds successfully (`npm run build`)
- [ ] No new console warnings in browser

---

## Self-Review Tips

1. **Take a break** - Review your code after stepping away
2. **Read it aloud** - Helps catch unclear variable names
3. **Check the diff** - Use `git diff` to see all changes
4. **Test the opposite** - If you test completion, also test un-completion
5. **Think about state** - What if this runs twice? What if it fails halfway?

---

## When to Ask for Help

- Unsure about architectural decision → Create ADR draft, discuss
- Complex algorithm → Pair program or seek second opinion
- Security concern → Always err on side of caution
- Performance issue → Profile before optimizing
- Testing uncertainty → Ask for test case examples

---

**Last Updated**: 2025-11-11

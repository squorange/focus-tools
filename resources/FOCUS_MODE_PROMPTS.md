# Focus Mode Implementation Prompts for Claude Code

Use these prompts in sequence to build the Focus Mode feature. Each prompt builds on the previous work.

---

## Prompt 1: Add Focus Mode State and Entry Point

```
Read CLAUDE.md for project context, specifically the "Focus Mode (Execution Loop)" section.

Add focus mode state management and entry point:

1. Update lib/types.ts:
   - Add FocusModeState interface with: active, stepId, paused, startTime, pausedTime
   - Add focusMode to AppState

2. Update app/page.tsx:
   - Add focusMode state with initial values (active: false, stepId: null, etc.)
   - Add enterFocusMode(stepId) function
   - Add exitFocusMode() function
   - Include focusMode in localStorage persistence

3. Update components/TaskList.tsx:
   - Add focus arrow button [→] to each incomplete task row
   - Hide or grey out arrow for completed tasks
   - Arrow click calls onEnterFocus(stepId)

4. Add prop for onEnterFocus to TaskList and TaskItem components

Don't build the focus mode view yet—just the state and entry point. We'll add the view next.
```

---

## Prompt 2: Create Basic Focus Mode View

```
Continue building focus mode. Create the basic FocusMode view component.

Create components/FocusMode.tsx with:

1. Layout structure:
   - Header: Exit button (left), Timer (right), Pause/Continue toggle
   - Task title (subtle, smaller text, centered)
   - "Step X of Y" indicator
   - Progress bar showing completed steps / total
   - Current step text (large, prominent, centered)
   - [Done] and [I'm Stuck] buttons
   - AI presence message at bottom

2. Props needed:
   - task: { title, steps }
   - currentStep: Step
   - stepIndex: number
   - totalSteps: number
   - completedCount: number
   - onDone: () => void
   - onStuck: () => void
   - onExit: () => void
   - isPaused: boolean
   - onPauseToggle: () => void
   - elapsedTime: number (in seconds)

3. Styling:
   - Clean, minimal, centered layout
   - Progress bar with Tailwind (bg-neutral-200 track, bg-blue-500 fill)
   - Current step in a subtle card/box
   - Buttons with adequate spacing for touch

4. Update app/page.tsx to:
   - Conditionally render FocusMode when focusMode.active is true
   - Pass required props
   - Hide TaskList/StagingArea/AIDrawer when in focus mode

Don't implement timer logic yet—just accept elapsedTime as a prop and display it as MM:SS.
```

---

## Prompt 3: Implement Timer Logic

```
Add timer functionality to focus mode.

1. In app/page.tsx, implement timer:
   - Use useEffect with setInterval when focus mode is active and not paused
   - Track elapsed seconds in state
   - Clear interval when paused or exiting
   - Calculate elapsed = (now - startTime - pausedTime) / 1000

2. Implement pause/continue:
   - When pausing: record current timestamp
   - When continuing: add (now - pauseStart) to pausedTime
   - Pass isPaused and onPauseToggle to FocusMode

3. Update FocusMode.tsx:
   - Show pause icon (⏸) when active, play icon (▶) when paused
   - Dim or overlay the view slightly when paused
   - Show "Paused" indicator near timer when paused
   - When paused, hide Done/Stuck buttons, show only Continue

4. Format timer display as MM:SS (pad with zeros)
```

---

## Prompt 4: Implement Step Completion Flow

```
Implement the step completion flow in focus mode.

1. When user clicks [Done]:
   - Mark the current step as completed (update steps state)
   - Show AI acknowledgment message
   - Show options: [Continue] and [Take a Break]

2. Create completion state in FocusMode:
   - showCompletion: boolean
   - When true, show completion UI instead of Done/Stuck buttons

3. Completion UI:
   - AI message: "Step {n} complete. Step {n+1} is '{next step text}'—continue or take a break?"
   - If this was the last step: "All {n} steps complete. '{task title}' is done."
   - [Continue] button → advance to next incomplete step
   - [Take a Break] button → pause the timer, stay in focus mode

4. Handle edge cases:
   - If all steps complete after this one, show final completion message
   - [Back to List] button on final completion

5. AI message tone: direct, concise, positive (not peppy)
   - "Step 3 complete. Moving to Step 4?"
   - "Got it. Three down, two to go."
```

---

## Prompt 5: Implement "I'm Stuck" Flow

```
Implement the "I'm Stuck" options menu and flows.

1. Create components/StuckMenu.tsx:
   - Three button options in a centered menu:
     - "Break this down smaller"
     - "Skip to another step"
     - "Talk it through"
   - Cancel/close option

2. When user clicks [I'm Stuck]:
   - Show StuckMenu overlay or inline options

3. Implement each option:

   "Skip to another step":
   - Find next incomplete step
   - Show AI message: "Skipping Step {n} for now. Moving to Step {m}."
   - Navigate to that step
   - If no other incomplete steps, show message and stay

   "Break this down smaller" and "Talk it through":
   - Open AIDrawer (expand it)
   - Pre-populate with appropriate AI message:
     - Break down: "What part of '{step text}' feels unclear or too big?"
     - Talk through: "What's making '{step text}' feel stuck? Sometimes describing the blocker helps."
   - User can chat with AI
   - Need a way to close drawer and return to focus mode

4. Update app/page.tsx:
   - Handle stuck menu selection
   - Pass necessary handlers to FocusMode
```

---

## Prompt 6: Add Substep Support in Focus Mode

```
Add substep display and interaction in focus mode.

1. Update components/FocusMode.tsx (or create FocusStep.tsx):
   - If current step has substeps, display them as a checklist below the step text
   - Each substep has a checkbox
   - Checking a substep updates its completed status

2. Substep display:
   - Indented slightly from main step text
   - Smaller font than main step
   - Empty circle checkbox (○) when incomplete
   - Filled checkbox (●) when complete
   - Strikethrough text when complete

3. Update state handling:
   - Substep toggle updates the step in the main steps array
   - Main step still requires explicit [Done] click (no auto-complete)

4. When all substeps are checked:
   - Maybe show a subtle prompt: "All substeps done. Ready to mark complete?"
   - But still require [Done] click

5. AI acknowledgment for substeps is optional for POC—can just update silently
```

---

## Prompt 7: Polish and Edge Cases

```
Polish the focus mode implementation and handle edge cases.

1. Visual polish:
   - Add subtle transitions when entering/exiting focus mode
   - Progress bar animates when step completed
   - Smooth fade for completion message appearance

2. Edge cases:
   - Entering focus mode when all steps complete: show message, return to list
   - Only one step total: adjust "Step 1 of 1" display
   - Very long step text: ensure it wraps nicely
   - Empty task title: handle gracefully

3. AI presence message updates:
   - Default: "Working on Step {n}. Here if you need me."
   - After pause: "Paused. Take your time."
   - After resume: "Back at it. On Step {n}."
   - Stuck resolved: "Let's continue with Step {n}."

4. Keyboard accessibility (basic):
   - Escape key exits focus mode
   - Enter key marks done (when focused on Done button)

5. Test the full flow:
   - Enter focus mode
   - Complete a step
   - Get stuck, try each option
   - Complete all steps
   - Verify list updates correctly
```

---

## Prompt 8: Connect AI Drawer for Stuck Flows

```
Ensure the AI drawer works correctly for "Break down" and "Talk through" flows.

1. When entering stuck chat:
   - Open AIDrawer in focus mode context
   - Pre-populate with AI's question
   - User can type response
   - AI responds (uses existing /api/structure endpoint)

2. Drawer behavior in focus mode:
   - Appears at bottom of focus view (similar to list view)
   - Can be collapsed back
   - When collapsed, return to normal focus mode view

3. If AI suggests adding substeps:
   - Show staging-like UI for accepting them
   - "Add these as substeps?" with accept/dismiss
   - Accepted substeps appear in current step

4. Ensure conversation context includes:
   - Current step being worked on
   - That user is in focus/execution mode (body double context)
   - May need to adjust system prompt slightly for body double persona

5. After stuck flow resolved:
   - User can close drawer
   - Return to focus mode on same step
   - Continue working
```

---

## Quick Verification Prompts

After building, use these to verify:

```
Test focus mode: enter focus on a task with substeps, complete one substep, mark step done, verify the next step loads correctly.
```

```
Test stuck flow: enter focus mode, click I'm Stuck, try "Skip to another step", verify it advances correctly.
```

```
Test timer: enter focus mode, wait 30 seconds, pause, wait 10 seconds, continue, verify timer only counted the active time.
```

```
Test completion: create a task with 2 steps, complete both in focus mode, verify the completion message shows and you can return to list.
```

---

## Notes

- Build incrementally—each prompt should result in testable functionality
- If something breaks, fix it before moving to next prompt
- Prompts can be combined if you want faster progress
- Adjust prompts based on what's already built or different from spec
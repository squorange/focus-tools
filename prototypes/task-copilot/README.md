# Task Co-Pilot

AI-powered task breakdown assistant with interactive checklist.

## What's New (v0.2)

- **Two-module architecture**: Task List + AI Drawer
- **Inline editing**: Click any task to edit in place
- **Hybrid transfer model**: Auto-populate when empty, staging area when list has items
- **Full CRUD**: Add, edit, delete, reorder tasks and substeps
- **localStorage persistence**: Your tasks survive page refresh

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local → add your ANTHROPIC_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
task-copilot/
├── app/
│   ├── api/structure/route.ts   # Claude API endpoint
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Main app with state management
├── components/
│   ├── TaskList.tsx             # Task list container
│   ├── TaskItem.tsx             # Individual task with inline edit
│   ├── StagingArea.tsx          # AI suggestions staging
│   └── AIDrawer.tsx             # Collapsible chat interface
├── lib/
│   ├── types.ts                 # TypeScript types
│   └── prompts.ts               # System prompt
└── README.md
```

## How It Works

### Two-Module Layout

```
┌─────────────────────────────────┐
│  📋 Task List                   │  ← Primary: your tasks
│  - Inline editing               │
│  - Checkboxes                   │
│  - Reorder, delete              │
├─────────────────────────────────┤
│  💡 Suggestions (when present)  │  ← Staging: AI proposals
├─────────────────────────────────┤
│  💬 AI Assistant (drawer)       │  ← Chat interface
└─────────────────────────────────┘
```

### Hybrid Transfer Model

| List State | AI Action | Behavior |
|------------|-----------|----------|
| Empty | Proposes breakdown | Auto-populates list |
| Has items | Proposes additions | Shows in staging area |
| Has items | User says "start over" | Replaces list |

### Task Interactions

- **Click task text** → Edit inline
- **Click checkbox** → Toggle complete
- **Click ••• menu** → Add substep, move, delete
- **"+ Add task"** → Manual task creation

### AI Interactions

- **Empty list**: "I need to do taxes somehow" → Populates list
- **Has items**: "What about quarterly payments?" → Suggests additions
- **Refinement**: "Step 3 is too vague" → AI responds with suggestions

## Testing Scenarios

1. **Fresh start**: Enter task intent → See list populate
2. **Manual creation**: Add tasks yourself → AI suggests additions
3. **Hybrid flow**: AI creates base → You edit → AI adds more
4. **Persistence**: Refresh page → Data preserved

## Learnings Log

### Prompt Design
- _How well does the hybrid model detect when to suggest vs. replace?_
- _Does context (current list) help AI make better suggestions?_

### State Management  
- _Is localStorage sufficient? When would you need a backend?_
- _How to handle conflicts between rapid edits and AI responses?_

### UX Patterns
- _Does staging area feel natural or friction-y?_
- _Is click-to-edit discoverable enough?_

---

## Related Docs

- [Focus Tools Product Doc](../../../docs/focus-tools-product-doc.md)
- [Anthropic API Docs](https://docs.anthropic.com/)

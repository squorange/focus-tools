# Orbital Zen - Next.js Prototype

An offline-ready task manager with orbital visualization and AI assistant integration.

## Features

- **Orbital Task Visualization**: Tasks orbit around a central focus point based on priority
- **AI Chat Integration**: Click any task to open an AI assistant panel (stub implementation)
- **Offline Support**: IndexedDB storage with PWA capabilities
- **Dark Theme**: Modern gradient design optimized for focus
- **Mobile Responsive**: Touch-friendly interface

## Architecture

```
app/
├── components/
│   ├── OrbitalView.tsx      # Main orbital visualization
│   ├── TaskNode.tsx          # Individual task orbs
│   ├── AIPanel.tsx           # AI chat interface
│   └── OfflineIndicator.tsx  # Online/offline status
├── lib/
│   ├── types.ts              # TypeScript definitions
│   ├── offline-store.ts      # IndexedDB wrapper
│   └── ai-service.ts         # AI routing stub
└── api/
    ├── tasks/route.ts        # Task CRUD endpoints
    └── ai/chat/route.ts      # AI chat endpoint (stub)
```

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Sample Tasks

The app includes 5 sample tasks:
1. Call dentist (urgent - closest orbit)
2. Review Q3 budget (high priority)
3. Buy birthday gift (medium priority)
4. Fix leaky faucet (medium priority)
5. Schedule car service (low priority - furthest orbit)

## Next Steps

### AI Integration
- Replace AI stub in `app/lib/ai-service.ts` with actual provider (Claude, OpenAI, etc.)
- Implement proper prompt engineering for task assistance
- Add context management and conversation history

### PWA Setup
- Add proper app icons to `public/` (icon-192.png, icon-512.png)
- Test service worker registration
- Implement background sync for task updates

### Features to Add
- Task creation/editing UI
- Task completion and archiving
- Priority adjustment (drag tasks between orbits)
- Categories and filtering
- Due date visualization
- Subtask support
- Analytics and insights

## Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **IndexedDB (idb)** - Offline storage
- **next-pwa** - Progressive Web App support
- **Vercel** - Recommended deployment platform

## Notes

- AI responses are currently stubbed - integrate with actual AI provider
- Icons need to be generated for full PWA support
- Service worker disabled in development mode

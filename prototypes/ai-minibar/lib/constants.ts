import { QuickAction } from './types';

// ============ Animation Specifications ============

export const ANIMATIONS = {
  // Collapse ↔ Expand transition
  expandDuration: 0.3,      // seconds (framer-motion uses seconds)
  expandEasing: [0.32, 0.72, 0, 1] as const, // iOS-like spring

  // Expand ↔ Drawer transition
  drawerDuration: 0.35,
  drawerEasing: [0.32, 0.72, 0, 1] as const,

  // Content fade
  contentFadeDuration: 0.15,

  // Response appear
  responseDelay: 0.05,        // Stagger for list items (seconds)

  // Auto-collapse after response accepted
  autoCollapseDelay: 300,     // ms
};

// Spring config for framer-motion
export const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 35,
  mass: 0.8,
};

// Snappier spring for quick interactions
export const SPRING_SNAPPY = {
  type: 'spring' as const,
  stiffness: 600,
  damping: 40,
};

// Gentler spring for larger movements
export const SPRING_GENTLE = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

// Smooth tween for height (no overshoot)
export const HEIGHT_TRANSITION = {
  type: 'tween' as const,
  duration: 0.3,
  ease: [0.32, 0.72, 0, 1] as [number, number, number, number], // iOS-like ease
};

// ============ Heights ============

export const HEIGHTS = {
  collapsed: 56,            // px
  expandedMin: 200,         // Minimum expanded height
  expandedMax: '50vh',      // Maximum expanded height
  drawerHeight: '85vh',     // Drawer covers most of screen
  tabBar: 56,               // Mock tab bar height
};

// ============ Breakpoints ============

export const BREAKPOINTS = {
  mobile: 640,              // < 640px: bottom sheet drawer
  tablet: 640,              // 640-1023px: side overlay drawer
  desktop: 1024,            // >= 1024px: side push drawer
};

// ============ Responsive Widths ============

export const WIDTHS = {
  miniBar: 400,             // MiniBar width on tablet/desktop
  palette: 400,             // Palette width on tablet/desktop (matches MiniBar)
  drawer: 400,              // Side drawer width on tablet/desktop
};

// ============ Quick Actions by Context ============

export const QUICK_ACTIONS_BY_CONTEXT: Record<string, QuickAction[]> = {
  queue: [
    { id: 'next', label: 'What next?', icon: '🎯', query: 'What should I work on next?', contexts: ['queue'] },
    { id: 'reorder', label: 'Reorder', icon: '↕️', query: 'Help me prioritize my queue', contexts: ['queue'] },
  ],
  taskDetail: [
    { id: 'breakdown', label: 'Break down', icon: '📋', query: 'Break this task into steps', contexts: ['taskDetail'] },
    { id: 'estimate', label: 'Estimate', icon: '⏱', query: 'How long will this take?', contexts: ['taskDetail'] },
  ],
  focusMode: [
    { id: 'stuck', label: "I'm stuck", icon: '🤔', query: "I'm stuck on this step", contexts: ['focusMode'] },
    { id: 'explain', label: 'Explain', icon: '❓', query: 'Explain this step', contexts: ['focusMode'] },
    { id: 'smaller', label: 'Smaller', icon: '🔬', query: 'Break this into smaller steps', contexts: ['focusMode'] },
  ],
  inbox: [
    { id: 'triage', label: 'Help triage', icon: '📥', query: 'Help me triage these items', contexts: ['inbox'] },
    { id: 'priority', label: 'Priority?', icon: '⚡', query: 'What priority should this be?', contexts: ['inbox'] },
  ],
  global: [
    { id: 'next', label: 'What next?', icon: '🎯', query: 'What should I work on?', contexts: ['global'] },
    { id: 'help', label: 'Help', icon: '💡', query: 'What can you help me with?', contexts: ['global'] },
  ],
};

// ============ Default Collapsed Content by Context ============

export const DEFAULT_COLLAPSED_BY_CONTEXT: Record<string, { type: 'idle' | 'status'; text: string }> = {
  queue: { type: 'status', text: '3 tasks today • 2 high priority' },
  taskDetail: { type: 'status', text: '5 steps • ~45 min' },
  focusMode: { type: 'status', text: 'Step 3 of 5 • 12:34' },
  inbox: { type: 'status', text: '7 items to triage' },
  global: { type: 'idle', text: 'Ask AI for help...' },
};

// ============ Colors ============

export const COLORS = {
  primary: '#7c3aed',       // violet-600
  primaryHover: '#6d28d9',  // violet-700
  success: '#22c55e',       // green-500
  error: '#ef4444',         // red-500
  warning: '#f59e0b',       // amber-500
};

// ============ Reduced Motion ============

// No-animation spring config for reduced motion preference
export const SPRING_REDUCED = {
  type: 'tween' as const,
  duration: 0,
};

// Helper to get appropriate spring config
export function getSpringConfig(prefersReducedMotion: boolean) {
  return prefersReducedMotion ? SPRING_REDUCED : SPRING_CONFIG;
}

// Helper to get whileTap prop (undefined disables it)
export function getWhileTap(prefersReducedMotion: boolean, scale = 0.95) {
  return prefersReducedMotion ? undefined : { scale };
}

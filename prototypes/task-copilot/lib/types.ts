// ============================================
// Task Structure Types
// ============================================

export interface Substep {
  id: string;
  text: string;
  completed: boolean;
  skipped?: boolean;  // Substep marked as not needed
}

export interface Step {
  id: string;
  text: string;
  substeps: Substep[];
  completed: boolean;
  skipped?: boolean;  // Step marked as not needed (e.g., contingency step where condition wasn't met)
}

export interface TaskBreakdown {
  taskTitle: string;
  steps: Step[];
}

// ============================================
// Conversation Types
// ============================================

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  stepId?: string;  // For focus mode: which step this message belongs to
}

// ============================================
// API Types
// ============================================

export type AIAction = "replace" | "suggest" | "edit" | "none";

export interface StructureRequest {
  userMessage: string;
  currentList: Step[] | null;
  taskTitle: string | null;
  conversationHistory: Message[];
}

export interface SuggestedStep {
  id: string;
  text: string;
  substeps: { id: string; text: string }[];
  parentStepId?: string;  // If set, add as substep to this step instead of as new step
}

export interface EditSuggestion {
  targetId: string;           // "2" or "2a" (step or substep)
  targetType: "step" | "substep";
  parentId?: string;          // For substeps, the parent step ID
  originalText: string;       // Current text (for display)
  newText: string;            // Proposed change
}

export interface StructureResponse {
  action: AIAction;
  taskTitle: string | null;
  steps: Step[] | null;           // For "replace" action
  suggestions: SuggestedStep[] | null;  // For "suggest" action
  edits: EditSuggestion[] | null;       // For "edit" action
  message: string;
}

// ============================================
// Focus Mode Types
// ============================================

export interface FocusModeState {
  active: boolean;
  stepId: string | null;
  paused: boolean;
  startTime: number | null;       // Timestamp when session started
  pausedTime: number;             // Accumulated paused duration (ms)
  pauseStartTime: number | null;  // When current pause started
}

// ============================================
// App State Types
// ============================================

export interface AppState {
  // Task list
  taskTitle: string;
  taskNotes: string;  // Single notes module for entire task
  steps: Step[];

  // AI staging
  suggestions: SuggestedStep[];
  edits: EditSuggestion[];

  // Conversation
  messages: Message[];
  focusModeMessages: Message[];  // Separate thread for focus mode AI chat

  // UI state
  isDrawerOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Focus mode
  focusMode: FocusModeState;
}

// ============================================
// Utility Types
// ============================================

export type EditSource = "user" | "ai";

// For generating unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Create a new empty step
export function createEmptyStep(id?: string): Step {
  return {
    id: id || generateId(),
    text: "",
    substeps: [],
    completed: false,
  };
}

// Create a new substep
export function createEmptySubstep(parentId: string, index: number): Substep {
  return {
    id: `${parentId}${String.fromCharCode(97 + index)}`, // e.g., "1a", "1b"
    text: "",
    completed: false,
  };
}

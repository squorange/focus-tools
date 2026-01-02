// ============================================
// Task Structure Types
// ============================================

export interface Substep {
  id: string;
  text: string;
  completed: boolean;
}

export interface Step {
  id: string;
  text: string;
  substeps: Substep[];
  completed: boolean;
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
}

// ============================================
// API Types
// ============================================

export type AIAction = "replace" | "suggest" | "none";

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
}

export interface StructureResponse {
  action: AIAction;
  taskTitle: string | null;
  steps: Step[] | null;           // For "replace" action
  suggestions: SuggestedStep[] | null;  // For "suggest" action
  message: string;
}

// ============================================
// App State Types
// ============================================

export interface AppState {
  // Task list
  taskTitle: string;
  steps: Step[];
  
  // AI staging
  suggestions: SuggestedStep[];
  
  // Conversation
  messages: Message[];
  
  // UI state
  isDrawerOpen: boolean;
  isLoading: boolean;
  error: string | null;
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

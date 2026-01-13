// AI Tool Definitions for Claude Function Calling
// These tools provide guaranteed structured output for task management

import { Tool } from "@anthropic-ai/sdk/resources/messages";

// ============================================
// Planning Mode Tools (Task Structuring)
// ============================================

export const structuringTools: Tool[] = [
  {
    name: "replace_task_steps",
    description: `Replace all steps with a complete new breakdown.

ONLY use this tool when:
- The current list is EMPTY (no steps exist yet)
- User explicitly says "start over", "redo from scratch", or "replace all"

If steps already exist and user asks to "break down" or add more, use suggest_additions instead.
This tool is for initial task setup or complete rewrites only.`,
    input_schema: {
      type: "object" as const,
      properties: {
        taskTitle: {
          type: "string",
          description: "Inferred or improved task title",
        },
        steps: {
          type: "array",
          description: "3-7 concrete, actionable steps",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Sequential: '1', '2', '3'" },
              text: { type: "string", description: "Clear, actionable step" },
              estimatedMinutes: {
                type: "number",
                description: "Optional. Only include if 75%+ confident. Use: 1, 2, 5, 10, 15, 20, 30, 45, 60, 90, 120",
              },
              substeps: {
                type: "array",
                description: "Optional. Only if step is genuinely complex.",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "e.g., '1a', '1b'" },
                    text: { type: "string" },
                  },
                  required: ["id", "text"],
                },
              },
            },
            required: ["id", "text"],
          },
        },
        message: {
          type: "string",
          description: "Brief encouragement (1-2 sentences). Do NOT list steps here.",
        },
      },
      required: ["steps", "message"],
    },
  },
  {
    name: "suggest_additions",
    description: `Suggest new steps or substeps to add. THIS IS THE DEFAULT TOOL FOR MOST REQUESTS.

USE THIS TOOL when user asks ANY of these (whether or not list has items):
- "Break this down", "break down", "break it down", "smaller steps"
- "Add more steps", "what else?", "more steps"
- "Expand step N", "add substeps"
- "Help me", "help me break this down"
- "Insert a step before/after step N"
- Any request for new steps or breakdown

ONLY use replace_task_steps if list is EMPTY and doing initial breakdown.
Include parentStepId when adding substeps to an existing step.
Use insertAfterStepId to specify WHERE to insert a new step (omit to append at end).`,
    input_schema: {
      type: "object" as const,
      properties: {
        suggestions: {
          type: "array",
          description: "New steps or substeps to add",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Continue from existing. If 3 steps exist, use '4', '5'. For substeps: '2a', '2b'",
              },
              text: { type: "string" },
              estimatedMinutes: {
                type: "number",
                description: "Optional. Only if 75%+ confident.",
              },
              parentStepId: {
                type: "string",
                description: "REQUIRED when adding as substep. The parent step's ID (e.g., '2').",
              },
              insertAfterStepId: {
                type: "string",
                description: "Insert this step AFTER the step with this ID. Omit to append at end. Use '0' to insert at beginning.",
              },
              substeps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    text: { type: "string" },
                  },
                  required: ["id", "text"],
                },
              },
            },
            required: ["id", "text"],
          },
        },
        suggestedTitle: {
          type: "string",
          description: "Optional. Only if current title could be meaningfully improved.",
        },
        message: {
          type: "string",
          description: "Brief encouragement. Do NOT list the suggestions here.",
        },
      },
      required: ["suggestions", "message"],
    },
  },
  {
    name: "edit_steps",
    description: `Edit existing steps or substeps. Use when user asks to:
- "Reword step N" or "change step N to..."
- "Simplify" or "make clearer"
- "Update step N"

Skip completed items unless user specifically asks to edit them.`,
    input_schema: {
      type: "object" as const,
      properties: {
        edits: {
          type: "array",
          items: {
            type: "object",
            properties: {
              targetId: { type: "string", description: "The step/substep ID to edit" },
              targetType: {
                type: "string",
                enum: ["step", "substep"],
              },
              parentId: {
                type: "string",
                description: "For substeps only: the parent step ID",
              },
              originalText: { type: "string", description: "Current text" },
              newText: { type: "string", description: "Improved text" },
            },
            required: ["targetId", "targetType", "originalText", "newText"],
          },
        },
        message: {
          type: "string",
          description: "Brief confirmation. Do NOT repeat the edits here.",
        },
      },
      required: ["edits", "message"],
    },
  },
  {
    name: "delete_steps",
    description: `Delete existing steps or substeps. Use when user asks to:
- "Remove step N" or "delete step N"
- "I don't need step N" or "skip step N"
- "This step is no longer applicable"
- "Remove the step about X"

This is for removing steps that are no longer relevant, not for editing text.`,
    input_schema: {
      type: "object" as const,
      properties: {
        deletions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              targetId: { type: "string", description: "The step/substep display ID (e.g., '1', '2', '1a', '1b')" },
              targetType: {
                type: "string",
                enum: ["step", "substep"],
              },
              parentId: {
                type: "string",
                description: "For substeps only: the parent step display ID (e.g., '1')",
              },
              originalText: { type: "string", description: "The current text of the step/substep being deleted" },
              reason: { type: "string", description: "Brief reason for removal" },
            },
            required: ["targetId", "targetType", "originalText", "reason"],
          },
        },
        message: {
          type: "string",
          description: "Brief confirmation of the deletion.",
        },
      },
      required: ["deletions", "message"],
    },
  },
  {
    name: "edit_title",
    description: `Change the task title. Use when user asks to:
- "Rename this task" or "change the title"
- "Call this..." or "name this..."
- "Update the title to..."

Use this tool specifically for title changes, not for step changes.`,
    input_schema: {
      type: "object" as const,
      properties: {
        newTitle: {
          type: "string",
          description: "The new title for the task",
        },
        message: {
          type: "string",
          description: "Brief confirmation of the title change",
        },
      },
      required: ["newTitle", "message"],
    },
  },
  {
    name: "conversational_response",
    description: `Respond conversationally WITHOUT making any changes.

ONLY use this tool when ALL of these are true:
- User is asking a pure question (like "what do you think about X?")
- User is NOT requesting any breakdown, steps, additions, or changes
- User just wants to chat or get encouragement

NEVER USE THIS TOOL if user says ANY of: "break", "breakdown", "steps", "add", "help me", "stuck", "expand", "suggest".
When in doubt, use suggest_additions instead—it's better to suggest steps than to just chat.`,
    input_schema: {
      type: "object" as const,
      properties: {
        message: {
          type: "string",
          description: "Your conversational response",
        },
      },
      required: ["message"],
    },
  },
];

// ============================================
// Focus Mode Tools (Body Double)
// ============================================

export const focusModeTools: Tool[] = [
  {
    name: "break_down_step",
    description: `Break the current step into smaller substeps. THIS IS THE DEFAULT TOOL FOR FOCUS MODE.

USE THIS TOOL when user says ANY of:
- "Break this down", "break it down", "break down", "smaller steps"
- "I'm stuck", "help me", "I can't do this"
- "What are the pieces?", "what do I do?"
- Any request that implies wanting the step broken into parts

ALWAYS use this tool when user mentions "break" or "stuck" or asks for help with the current step.
Always include parentStepId set to the current step's ID from context.`,
    input_schema: {
      type: "object" as const,
      properties: {
        substeps: {
          type: "array",
          description: "2-5 smaller, concrete substeps",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Based on parent. If parent is step '2', use '2a', '2b', etc.",
              },
              text: { type: "string", description: "Concrete, doable action" },
            },
            required: ["id", "text"],
          },
        },
        parentStepId: {
          type: "string",
          description: "The current step's ID (from context)",
        },
        message: {
          type: "string",
          description: "Brief encouragement. Do NOT list substeps here.",
        },
      },
      required: ["substeps", "parentStepId", "message"],
    },
  },
  {
    name: "suggest_first_action",
    description: `Suggest a tiny first action to overcome inertia. Use when user says:
- "Help me start" or "where do I begin?"
- "I don't know how to start"
- "What's my first step?"

The action should take < 2 minutes and be very concrete.`,
    input_schema: {
      type: "object" as const,
      properties: {
        firstAction: {
          type: "string",
          description: "A concrete, 2-minute action to get started",
        },
        message: {
          type: "string",
          description: "Warm encouragement",
        },
      },
      required: ["firstAction", "message"],
    },
  },
  {
    name: "explain_step",
    description: `Explain what the current step means or how to approach it. Use when user says:
- "What does this mean?"
- "I don't understand"
- "How do I do this?"`,
    input_schema: {
      type: "object" as const,
      properties: {
        explanation: {
          type: "string",
          description: "Clear explanation of the step",
        },
        tips: {
          type: "array",
          description: "Optional actionable tips",
          items: { type: "string" },
        },
        message: {
          type: "string",
          description: "Supportive closing",
        },
      },
      required: ["explanation", "message"],
    },
  },
  {
    name: "encourage",
    description: `Provide pure encouragement, check-in, or celebrate progress.

ONLY use this tool when ALL of these are true:
- User is just chatting, checking in, or celebrating
- User is NOT asking for help with the current step
- User is NOT stuck or asking for breakdown

NEVER USE THIS TOOL if user says ANY of: "break", "stuck", "help", "how do I", "what should I", "start", "begin".
When in doubt, use break_down_step instead—it's better to provide actionable substeps.`,
    input_schema: {
      type: "object" as const,
      properties: {
        message: {
          type: "string",
          description: "Warm, supportive message",
        },
      },
      required: ["message"],
    },
  },
];

// ============================================
// Queue Mode Tools (Task Selection + Conversation)
// ============================================

export const queueModeTools: Tool[] = [
  {
    name: "conversational_response",
    description: `Respond conversationally to questions about the queue or tasks.

USE THIS TOOL when user asks:
- Questions about counts/status: "how many tasks?", "what's in my queue?", "what do I have?"
- Summaries: "what's for today?", "overview of my tasks", "what's on my plate?"
- Reordering/prioritization help: "help me prioritize", "what order should I do these?"
- General questions that aren't asking for a specific task recommendation

DO NOT use this tool for:
- "What should I work on next?" → use recommend_task
- "What next?" → use recommend_task
- "Help me choose" → use recommend_task
- Any request for a single task recommendation → use recommend_task`,
    input_schema: {
      type: "object" as const,
      properties: {
        message: {
          type: "string",
          description: "Your conversational response answering the user's question",
        },
      },
      required: ["message"],
    },
  },
  {
    name: "recommend_task",
    description: `Recommend a single task from the user's Focus Queue to work on next.

## CRITICAL: reasonType Rules

You MUST select the correct reasonType based on the ACTUAL DATA:

- **"deadline"**: ONLY use if deadlineDate is NOT null. Never use if deadlineDate is null!
- **"momentum"**: Use if completedSteps > 0 (task has progress)
- **"priority"**: Use if priority === "high"
- **"quick_win"**: Use if effort === "quick" OR focusScore indicates quick task
- **"oldest"**: Fallback based on addedAt (earliest in queue)
- **"no_recommendation"**: Only if queue is empty or all tasks excluded

## Selection Priority

1. Has deadline (deadlineDate NOT null) → reasonType: "deadline"
2. Has progress (completedSteps > 0) → reasonType: "momentum"
3. High priority (priority === "high") → reasonType: "priority"
4. Quick effort (effort === "quick") → reasonType: "quick_win"
5. Highest focusScore → reasonType based on why score is high
6. Oldest in queue (earliest addedAt) → reasonType: "oldest"

Consider excludeTaskIds if provided and skip those tasks.
If only one task in queue, still recommend it (validates user's choice).`,
    input_schema: {
      type: "object" as const,
      properties: {
        taskId: {
          type: "string",
          description: "ID of the recommended task from the queue",
        },
        taskTitle: {
          type: "string",
          description: "Title of the task (for display)",
        },
        reason: {
          type: "string",
          description: "Brief explanation why this task (1-2 sentences). ONLY mention deadline if deadlineDate is NOT null!",
        },
        reasonType: {
          type: "string",
          enum: ["deadline", "momentum", "quick_win", "priority", "oldest", "no_recommendation"],
          description: "Category of reasoning. 'deadline' ONLY if deadlineDate is NOT null. 'no_recommendation' if queue empty/all excluded.",
        },
      },
      required: ["taskId", "taskTitle", "reason", "reasonType"],
    },
  },
];

// ============================================
// Tool Response Types
// ============================================

export interface ReplaceStepsInput {
  taskTitle?: string;
  steps: Array<{
    id: string;
    text: string;
    estimatedMinutes?: number;
    substeps?: Array<{ id: string; text: string }>;
  }>;
  message: string;
}

export interface SuggestAdditionsInput {
  suggestions: Array<{
    id: string;
    text: string;
    estimatedMinutes?: number;
    parentStepId?: string;
    insertAfterStepId?: string;  // Insert after this step ID, '0' for beginning, omit for end
    substeps?: Array<{ id: string; text: string }>;
  }>;
  suggestedTitle?: string;
  message: string;
}

export interface EditStepsInput {
  edits: Array<{
    targetId: string;
    targetType: "step" | "substep";
    parentId?: string;
    originalText: string;
    newText: string;
  }>;
  message: string;
}

export interface DeleteStepsInput {
  deletions: Array<{
    targetId: string;
    targetType: "step" | "substep";
    parentId?: string;
    originalText: string;
    reason: string;
  }>;
  message: string;
}

export interface EditTitleInput {
  newTitle: string;
  message: string;
}

export interface ConversationalInput {
  message: string;
}

export interface BreakDownStepInput {
  substeps: Array<{ id: string; text: string }>;
  parentStepId: string;
  message: string;
}

export interface SuggestFirstActionInput {
  firstAction: string;
  message: string;
}

export interface ExplainStepInput {
  explanation: string;
  tips?: string[];
  message: string;
}

export interface EncourageInput {
  message: string;
}

export interface RecommendTaskInput {
  taskId: string;
  taskTitle: string;
  reason: string;
  reasonType: "deadline" | "momentum" | "quick_win" | "priority" | "oldest" | "no_recommendation";
}

// Union type for all tool inputs
export type ToolInput =
  | { name: "replace_task_steps"; input: ReplaceStepsInput }
  | { name: "suggest_additions"; input: SuggestAdditionsInput }
  | { name: "edit_steps"; input: EditStepsInput }
  | { name: "delete_steps"; input: DeleteStepsInput }
  | { name: "edit_title"; input: EditTitleInput }
  | { name: "conversational_response"; input: ConversationalInput }
  | { name: "break_down_step"; input: BreakDownStepInput }
  | { name: "suggest_first_action"; input: SuggestFirstActionInput }
  | { name: "explain_step"; input: ExplainStepInput }
  | { name: "encourage"; input: EncourageInput }
  | { name: "recommend_task"; input: RecommendTaskInput };

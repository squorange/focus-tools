import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, FOCUS_MODE_PROMPT, QUEUE_MODE_PROMPT } from "@/lib/prompts";
import { StructureRequest, StructureResponse, Substep, Step, Task, FocusQueueItem } from "@/lib/types";
import {
  structuringTools,
  focusModeTools,
  queueModeTools,
  ReplaceStepsInput,
  SuggestAdditionsInput,
  EditStepsInput,
  DeleteStepsInput,
  EditTitleInput,
  ConversationalInput,
  BreakDownStepInput,
  SuggestFirstActionInput,
  ExplainStepInput,
  EncourageInput,
  RecommendTaskInput,
  SuggestTaskMetadataInput,
} from "@/lib/ai-tools";

// Extended request body for focus mode and queue mode
interface ExtendedStructureRequest extends StructureRequest {
  taskDescription?: string | null;
  taskNotes?: string;
  // Legacy format (full object)
  focusMode?: boolean | {
    currentStepId: string;
    currentStepText: string;
    currentSubsteps: Substep[];
    stepIndex: number;
    totalSteps: number;
  };
  // Simplified format (separate fields)
  currentStep?: {
    id: string;
    text: string;
    completed: boolean;
  } | null;
  // Pending staging context (for follow-up questions about suggestions)
  pendingSuggestions?: Array<{
    id: string;
    text: string;
    substeps?: Array<{ id: string; text: string }>;
    parentStepId?: string;
    estimatedMinutes?: number;
  }> | null;
  pendingEdits?: Array<{
    targetId: string;
    targetType: 'step' | 'substep';
    parentId?: string;
    originalText: string;
    newText: string;
  }> | null;
  pendingDeletions?: Array<{
    targetId: string;
    targetType: 'step' | 'substep';
    parentId?: string;
    originalText: string;
    reason: string;
  }> | null;
  pendingAction?: 'replace' | 'suggest' | 'edit' | 'delete' | null;
  // Queue mode (task recommendation)
  queueMode?: boolean;
  queueContext?: {
    todayItems: Array<{
      taskId: string;
      taskTitle: string;
      priority: string | null;
      targetDate: string | null;
      deadlineDate: string | null;
      completedSteps: number;
      totalSteps: number;
      effort: string | null;
      addedAt?: number;
      focusScore?: number;
    }>;
    upcomingItems: Array<{
      taskId: string;
      taskTitle: string;
      priority: string | null;
      targetDate: string | null;
      deadlineDate: string | null;
      focusScore?: number;
    }>;
    excludeTaskIds?: string[];
  };
  // Tasks view mode (inbox + pool context)
  tasksViewMode?: boolean;
  tasksViewContext?: {
    triageItems: Array<{
      taskId: string;
      taskTitle: string;
      createdAt: number;
    }>;
    readyTasks: Array<{
      taskId: string;
      taskTitle: string;
      priority: string | null;
      targetDate: string | null;
      deadlineDate: string | null;
      stepsCount: number;
      completedSteps: number;
      focusScore: number;
      inQueue: boolean;
    }>;
  };
  // Targeted step ID (for step-scoped AI actions via sparkle button)
  targetedStepId?: string | null;
  // Routine context (for recurring tasks)
  routineContext?: {
    isRecurring: boolean;
    streak: number;
    bestStreak: number;
    totalCompletions: number;
    isOverdue: boolean;
    overdueDays: number | null;
    patternDescription: string;
    scheduledTime: string | null;
    activeInstanceDate: string | null;
    instanceStepCount: number;
    templateStepCount: number;
  } | null;
  // Recurring task mode (executing = today's instance, managing = template)
  recurringMode?: 'executing' | 'managing';
  // Task detail mode (full task context for AI assistance)
  taskDetailMode?: boolean;
  taskDetailContext?: {
    taskId: string;
    status: string;
    priority: string | null;
    targetDate: string | null;
    deadlineDate: string | null;
    effort: string | null;
    health: {
      status: string;
      reasons: string[];
    };
    reminder: {
      type: 'relative' | 'absolute';
      relativeMinutes?: number;
      relativeTo?: 'target' | 'deadline';
      absoluteTime?: number;
    } | null;
    waitingOn: {
      who: string;
      since: number;
      followUpDate: string | null;
    } | null;
    inFocusQueue: boolean;
    progress: {
      completedSteps: number;
      totalSteps: number;
    };
    steps: Array<{
      id: string;
      text: string;
      completed: boolean;
      stepNumber: number;
      substeps: Array<{
        id: string;
        text: string;
        completed: boolean;
        label: string;
      }>;
    }>;
    // Nudge System Fields
    importance: 'must_do' | 'should_do' | 'could_do' | 'would_like_to' | null;
    importanceSource: 'self' | 'partner' | null;
    importanceNote: string | null;
    energyType: 'energizing' | 'neutral' | 'draining' | null;
    leadTimeDays: number | null;
    // Computed Priority
    priorityScore: number;
    priorityTier: 'critical' | 'high' | 'medium' | 'low';
    effectiveDeadline: string | null;
  };
}

// Extended response for recommendations
export interface RecommendationResponse extends StructureResponse {
  recommendation?: {
    taskId: string;
    taskTitle: string;
    reason: string;
    reasonType: string;
  };
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Validate and sanitize estimatedMinutes - ensures it's a valid positive number
// Handles cases where AI returns strings like "~30 min" or invalid values
function sanitizeEstimatedMinutes(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  // If it's already a valid number
  if (typeof value === 'number' && !isNaN(value) && value > 0) {
    return Math.round(value);
  }

  // If it's a string, try to extract the number
  if (typeof value === 'string') {
    // Match patterns like "30", "~30", "30 min", "~30 min", "1h 30m"
    const hourMatch = value.match(/(\d+)\s*(?:hr?s?|hours?)/i);
    const minMatch = value.match(/(\d+)\s*(?:min|mins?|minutes?|m)?$/i);

    let minutes = 0;
    if (hourMatch) {
      minutes += parseInt(hourMatch[1]) * 60;
    }
    if (minMatch && !hourMatch) {
      // Only use minMatch if we didn't find hours (to avoid double-counting "1h 30m")
      minutes = parseInt(minMatch[1]);
    } else if (minMatch && hourMatch) {
      // Add minutes to hours
      const minPart = value.match(/(\d+)\s*(?:min|mins?|minutes?|m)$/i);
      if (minPart) {
        minutes += parseInt(minPart[1]);
      }
    }

    return minutes > 0 ? minutes : null;
  }

  return null;
}

// Extract embedded time estimates from step text and clean up
// Fallback for when AI incorrectly embeds times like "Buy groceries ~15 min"
function extractEmbeddedTime(text: string): { cleanText: string; minutes: number | null } {
  // Match patterns like "~15 min", "~2h", "~1h 30m", "15 min", "(30 min)", etc.
  const timePatterns = [
    /\s*[~≈]?\s*\(?\s*(\d+)\s*(?:hr?s?|hours?)\s*(?:(\d+)\s*(?:min|mins?|m))?\s*\)?$/i,
    /\s*[~≈]?\s*\(?\s*(\d+)\s*(?:min|mins?|minutes?|m)\s*\)?$/i,
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      const cleanText = text.replace(pattern, "").trim();
      // First pattern handles hours + optional minutes
      if (pattern.source.includes("hr")) {
        const hours = parseInt(match[1]);
        const mins = match[2] ? parseInt(match[2]) : 0;
        return { cleanText, minutes: hours * 60 + mins };
      } else {
        // Second pattern handles minutes only
        return { cleanText, minutes: parseInt(match[1]) };
      }
    }
  }

  return { cleanText: text, minutes: null };
}

// Apply extraction to step data if estimatedMinutes is not already set
function cleanStepText<T extends { text: string; estimatedMinutes?: number | null }>(step: T): T {
  if (step.estimatedMinutes) return step; // Already has estimate, don't override

  const { cleanText, minutes } = extractEmbeddedTime(step.text);
  if (minutes) {
    return { ...step, text: cleanText, estimatedMinutes: minutes };
  }
  return step;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExtendedStructureRequest = await request.json();
    const { userMessage, currentList, taskTitle, taskDescription, conversationHistory, taskNotes, focusMode, currentStep, queueMode, queueContext, tasksViewMode, tasksViewContext, targetedStepId, taskDetailMode, taskDetailContext, routineContext, recurringMode, pendingSuggestions, pendingEdits, pendingDeletions, pendingAction } = body;

    // Determine which prompt and tools to use
    const isFocusMode = Boolean(focusMode);
    const isQueueMode = Boolean(queueMode);
    const isTasksViewMode = Boolean(tasksViewMode);
    const isTaskDetailMode = Boolean(taskDetailMode);

    let systemPrompt = SYSTEM_PROMPT;
    let tools = structuringTools;

    if (isQueueMode || isTasksViewMode) {
      // Both queue and tasks view use queue mode prompt/tools for now
      // They provide list context for conversational help
      systemPrompt = QUEUE_MODE_PROMPT;
      tools = queueModeTools;
    } else if (isFocusMode) {
      systemPrompt = FOCUS_MODE_PROMPT;
      tools = focusModeTools;
    }
    // Task detail mode uses the default structuring prompt/tools but with rich context

    // Build context message with current state
    const contextMessage = isQueueMode
      ? buildQueueContextMessage(userMessage, queueContext)
      : isTasksViewMode
        ? buildTasksViewContextMessage(userMessage, tasksViewContext)
        : isTaskDetailMode
          ? buildTaskDetailContextMessage(userMessage, taskTitle, taskDescription, taskNotes, taskDetailContext, targetedStepId, routineContext, pendingSuggestions, pendingEdits, pendingDeletions, pendingAction, recurringMode)
          : buildContextMessage(userMessage, currentList, taskTitle, taskDescription, taskNotes, focusMode, currentStep, routineContext, pendingSuggestions, pendingEdits, pendingDeletions, pendingAction, recurringMode);
    console.log("[AI Debug] Context message:", contextMessage);
    console.log("[AI Debug] Focus mode:", isFocusMode);
    console.log("[AI Debug] Queue mode:", isQueueMode);
    console.log("[AI Debug] Current list length:", currentList?.length || 0);

    // Build messages array for Claude
    const messages: Anthropic.MessageParam[] = [];

    // Add conversation history (excluding the current message)
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current message with context
    messages.push({
      role: "user",
      content: contextMessage,
    });

    // Call Claude API with tools
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
      tools: tools,
      tool_choice: { type: "any" }, // Must call one of the tools
    });

    // Find the tool use block
    const toolUse = response.content.find((block) => block.type === "tool_use");
    console.log("[AI Debug] Tool called:", toolUse?.type === "tool_use" ? toolUse.name : "none");
    console.log("[AI Debug] Tool input:", JSON.stringify(toolUse?.type === "tool_use" ? toolUse.input : null, null, 2));
    if (!toolUse || toolUse.type !== "tool_use") {
      // Fallback if no tool was called (shouldn't happen with tool_choice: any)
      const textContent = response.content.find((block) => block.type === "text");
      return NextResponse.json({
        action: "none",
        taskTitle: null,
        steps: null,
        suggestions: null,
        edits: null,
        deletions: null,
        message: textContent?.type === "text" ? textContent.text : "I'm not sure how to help with that.",
      } as StructureResponse);
    }

    // Process the tool result based on which tool was called
    const validatedResponse = processToolResult(toolUse.name, toolUse.input, isFocusMode, currentStep);
    console.log("[AI Debug] Final response action:", validatedResponse.action);
    console.log("[AI Debug] Suggestions count:", validatedResponse.suggestions?.length || 0);
    console.log("[AI Debug] Steps count:", validatedResponse.steps?.length || 0);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error("Error in structure API:", error);

    let errorMessage = error instanceof Error ? error.message : "Failed to process request";

    // Parse Anthropic API error for more helpful messages
    if (errorMessage.includes('credit balance is too low')) {
      errorMessage = 'AI credits exhausted. Please check your Anthropic account billing.';
    } else if (errorMessage.includes('invalid_api_key') || errorMessage.includes('401')) {
      errorMessage = 'Invalid API key. Please check your ANTHROPIC_API_KEY.';
    } else if (errorMessage.includes('rate_limit')) {
      errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
    }

    return NextResponse.json(
      {
        action: "none",
        taskTitle: null,
        steps: null,
        suggestions: null,
        edits: null,
        deletions: null,
        message: `Sorry, something went wrong: ${errorMessage}`,
      } as StructureResponse,
      { status: 500 }
    );
  }
}

// Process tool result and map to StructureResponse format
function processToolResult(
  toolName: string,
  input: unknown,
  isFocusMode: boolean,
  currentStep?: { id: string; text: string; completed: boolean } | null
): StructureResponse {
  switch (toolName) {
    case "replace_task_steps": {
      const data = input as ReplaceStepsInput;
      // Clean step text and extract any embedded times
      const cleanedSteps = (data.steps ?? []).map(cleanStepText);
      return {
        action: "replace",
        taskTitle: data.taskTitle || null,
        steps: cleanedSteps.map((s) => ({
          id: s.id,
          text: s.text,
          shortLabel: null,
          substeps: (s.substeps || []).map((sub) => ({
            id: sub.id,
            text: sub.text,
            shortLabel: null,
            completed: false,
            completedAt: null,
            skipped: false,
            source: "ai_generated" as const,
          })),
          completed: false,
          completedAt: null,
          effort: null,
          estimatedMinutes: sanitizeEstimatedMinutes(s.estimatedMinutes),
          estimateSource: sanitizeEstimatedMinutes(s.estimatedMinutes) ? "ai" as const : null,
          timeSpent: 0,
          firstFocusedAt: null,
          estimationAccuracy: null,
          complexity: null,
          context: null,
          timesStuck: 0,
          skipped: false,
          source: "ai_generated" as const,
          wasEdited: false,
        })) as Step[],
        suggestions: null,
        edits: null,
        deletions: null,
        message: data.message,
      };
    }

    case "suggest_additions": {
      const data = input as SuggestAdditionsInput;
      // Clean suggestion text and extract any embedded times
      const cleanedSuggestions = (data.suggestions ?? []).map((s) => {
        const cleaned = cleanStepText(s);
        return {
          ...cleaned,
          substeps: (s.substeps || []).map((sub) => cleanStepText(sub)),
        };
      });
      return {
        action: "suggest",
        taskTitle: null,
        suggestedTitle: data.suggestedTitle,
        steps: null,
        suggestions: cleanedSuggestions.map((s) => ({
          id: s.id,
          text: s.text,
          substeps: (s.substeps || []).map((sub) => ({
            id: sub.id,
            text: sub.text,
          })),
          parentStepId: s.parentStepId,
          insertAfterStepId: s.insertAfterStepId,
          estimatedMinutes: sanitizeEstimatedMinutes(s.estimatedMinutes) ?? undefined,
        })),
        edits: null,
        deletions: null,
        message: data.message,
      };
    }

    case "edit_steps": {
      const data = input as EditStepsInput;
      return {
        action: "edit",
        taskTitle: null,
        steps: null,
        suggestions: null,
        edits: (data.edits ?? []).map((e) => ({
          targetId: e.targetId,
          targetType: e.targetType,
          parentId: e.parentId,
          originalText: e.originalText,
          newText: e.newText,
          estimatedMinutes: sanitizeEstimatedMinutes(e.estimatedMinutes) ?? undefined,
        })),
        deletions: null,
        message: data.message,
      };
    }

    case "delete_steps": {
      const data = input as DeleteStepsInput;
      return {
        action: "delete",
        taskTitle: null,
        steps: null,
        suggestions: null,
        edits: null,
        deletions: (data.deletions ?? []).map((d) => ({
          targetId: d.targetId,
          targetType: d.targetType,
          parentId: d.parentId,
          originalText: d.originalText,
          reason: d.reason,
        })),
        message: data.message,
      };
    }

    case "edit_title": {
      const data = input as EditTitleInput;
      return {
        action: "suggest",
        taskTitle: null,
        suggestedTitle: data.newTitle,
        steps: null,
        suggestions: [],  // Empty but present so staging shows
        edits: null,
        deletions: null,
        message: data.message,
      };
    }

    case "conversational_response": {
      const data = input as ConversationalInput;
      return {
        action: "none",
        taskTitle: null,
        steps: null,
        suggestions: null,
        edits: null,
        deletions: null,
        message: data.message,
      };
    }

    // Focus mode tools
    case "break_down_step": {
      const data = input as BreakDownStepInput;
      return {
        action: "suggest",
        taskTitle: null,
        steps: null,
        suggestions: (data.substeps ?? []).map((sub) => ({
          id: sub.id,
          text: sub.text,
          substeps: [],
          parentStepId: data.parentStepId,
        })),
        edits: null,
        deletions: null,
        message: data.message,
      };
    }

    case "suggest_first_action": {
      const data = input as SuggestFirstActionInput;
      // Return the first action as a message (it's guidance, not a new step)
      return {
        action: "none",
        taskTitle: null,
        steps: null,
        suggestions: null,
        edits: null,
        deletions: null,
        message: `${data.message}\n\n**Try this:** ${data.firstAction}`,
      };
    }

    case "explain_step": {
      const data = input as ExplainStepInput;
      let message = data.explanation;
      if (data.tips && data.tips.length > 0) {
        message += "\n\n**Tips:**\n" + data.tips.map((t) => `• ${t}`).join("\n");
      }
      if (data.message) {
        message += "\n\n" + data.message;
      }
      return {
        action: "none",
        taskTitle: null,
        steps: null,
        suggestions: null,
        edits: null,
        deletions: null,
        message,
      };
    }

    case "encourage": {
      const data = input as EncourageInput;
      return {
        action: "none",
        taskTitle: null,
        steps: null,
        suggestions: null,
        edits: null,
        deletions: null,
        message: data.message,
      };
    }

    // Queue mode tools
    case "recommend_task": {
      const data = input as RecommendTaskInput;
      return {
        action: "recommend",
        taskTitle: null,
        steps: null,
        suggestions: null,
        edits: null,
        deletions: null,
        message: data.reason,
        recommendation: {
          taskId: data.taskId,
          taskTitle: data.taskTitle,
          reason: data.reason,
          reasonType: data.reasonType,
        },
      } as RecommendationResponse;
    }

    // Metadata suggestion tool
    case "suggest_task_metadata": {
      const data = input as SuggestTaskMetadataInput;
      return {
        action: "suggest",
        taskTitle: null,
        steps: null,
        suggestions: null,
        edits: null,
        deletions: null,
        metadataSuggestions: data.suggestions.map((s) => ({
          field: s.field,
          value: s.value,
          reason: s.reason,
        })),
        message: data.message,
      };
    }

    default:
      return {
        action: "none",
        taskTitle: null,
        steps: null,
        suggestions: null,
        edits: null,
        deletions: null,
        message: "I'm not sure how to help with that.",
      };
  }
}

// Build staging context for follow-up questions about pending suggestions/edits
function buildStagingContext(
  pendingSuggestions?: ExtendedStructureRequest["pendingSuggestions"],
  pendingEdits?: ExtendedStructureRequest["pendingEdits"],
  pendingDeletions?: ExtendedStructureRequest["pendingDeletions"],
  pendingAction?: ExtendedStructureRequest["pendingAction"]
): string {
  // Skip if no pending staging
  if (!pendingAction) return "";

  let context = "\n=== PENDING STAGING (waiting for user acceptance) ===\n";

  if (pendingAction === 'suggest' || pendingAction === 'replace') {
    if (pendingSuggestions && pendingSuggestions.length > 0) {
      context += `Pending suggestions (${pendingSuggestions.length}):\n`;
      pendingSuggestions.forEach((s, i) => {
        const time = s.estimatedMinutes ? ` (~${s.estimatedMinutes}min)` : "";
        const parent = s.parentStepId ? ` [substep of ${s.parentStepId}]` : "";
        context += `  ${i + 1}. ${s.text}${time}${parent}\n`;
        if (s.substeps && s.substeps.length > 0) {
          s.substeps.forEach((sub, j) => {
            context += `     ${String.fromCharCode(97 + j)}. ${sub.text}\n`;
          });
        }
      });
    }
  }

  if (pendingAction === 'edit') {
    if (pendingEdits && pendingEdits.length > 0) {
      context += `Pending edits (${pendingEdits.length}):\n`;
      pendingEdits.forEach((e, i) => {
        context += `  ${i + 1}. "${e.originalText}" → "${e.newText}"\n`;
      });
    }
  }

  if (pendingAction === 'delete') {
    if (pendingDeletions && pendingDeletions.length > 0) {
      context += `Pending deletions (${pendingDeletions.length}):\n`;
      pendingDeletions.forEach((d, i) => {
        context += `  ${i + 1}. "${d.originalText}" (${d.reason})\n`;
      });
    }
  }

  context += "The user may be asking about these pending changes.\n";
  return context;
}

// Build routine context for recurring tasks
function buildRoutineContext(
  routineContext?: ExtendedStructureRequest["routineContext"],
  recurringMode?: 'executing' | 'managing'
): string {
  if (!routineContext || !routineContext.isRecurring) return "";

  const mode = recurringMode || 'executing';

  let context = "\n=== ROUTINE CONTEXT ===\n";
  context += `This is a RECURRING TASK (routine).\n`;
  context += `Pattern: ${routineContext.patternDescription}\n`;

  // Mode-specific guidance
  if (mode === 'managing') {
    context += `\nMode: TEMPLATE EDITING - Changes apply to ALL future occurrences.\n`;
    context += `IMPORTANT: When breaking down a step, add SUBSTEPS to the targeted step (set parentStepId).\n`;
    context += `Do NOT add new top-level steps when breaking down - add substeps instead.\n`;
  } else {
    context += `\nMode: TODAY'S INSTANCE - Changes apply only to this occurrence.\n`;
  }

  if (routineContext.scheduledTime) {
    context += `Scheduled time: ${routineContext.scheduledTime}\n`;
  }

  // Streak info
  context += `\nStreak info:\n`;
  context += `  Current streak: ${routineContext.streak}\n`;
  context += `  Best streak: ${routineContext.bestStreak}\n`;
  context += `  Total completions: ${routineContext.totalCompletions}\n`;

  // Streak milestone check
  const nearBest = routineContext.streak === routineContext.bestStreak - 1;
  const atBest = routineContext.streak >= routineContext.bestStreak && routineContext.streak > 0;
  if (atBest) {
    context += `  🎉 PERSONAL BEST! User has matched or exceeded their best streak!\n`;
  } else if (nearBest) {
    context += `  🔥 ONE AWAY from personal best! Completing this will set a new record!\n`;
  }

  // Overdue warning
  if (routineContext.isOverdue && routineContext.overdueDays) {
    context += `\n⚠️ OVERDUE by ${routineContext.overdueDays} day${routineContext.overdueDays > 1 ? 's' : ''}!\n`;
    if (routineContext.overdueDays >= 3) {
      context += `This routine needs urgent attention - streak may be at risk.\n`;
    }
  }

  // Instance vs template info
  context += `\nStep structure:\n`;
  context += `  Template steps: ${routineContext.templateStepCount}\n`;
  context += `  Current instance steps: ${routineContext.instanceStepCount}\n`;

  // Scope guidance
  context += `\nWhen suggesting step modifications for routines:\n`;
  context += `  - If user says "just today" / "this time" / "this instance" → apply to instance only\n`;
  context += `  - If user says "permanently" / "to the routine" / "always" → apply to template\n`;
  context += `  - If unclear about scope, ASK the user which they prefer\n`;

  context += `===========================\n`;
  return context;
}

// Build context message with current list state
function buildContextMessage(
  userMessage: string,
  currentList: StructureRequest["currentList"],
  taskTitle: string | null,
  taskDescription: string | null | undefined,
  taskNotes?: string,
  focusMode?: ExtendedStructureRequest["focusMode"],
  currentStep?: ExtendedStructureRequest["currentStep"],
  routineContext?: ExtendedStructureRequest["routineContext"],
  pendingSuggestions?: ExtendedStructureRequest["pendingSuggestions"],
  pendingEdits?: ExtendedStructureRequest["pendingEdits"],
  pendingDeletions?: ExtendedStructureRequest["pendingDeletions"],
  pendingAction?: ExtendedStructureRequest["pendingAction"],
  recurringMode?: 'executing' | 'managing'
): string {
  let context = "";

  // Focus mode specific context
  if (focusMode) {
    context += `=== FOCUS MODE CONTEXT ===\n`;
    context += `Task: "${taskTitle || "Untitled"}"\n`;
    if (taskDescription) {
      context += `Description: ${taskDescription}\n`;
    }

    // Handle both legacy object format and simple boolean + currentStep format
    if (typeof focusMode === 'object') {
      // Legacy format with full focusMode object
      const stepNum = focusMode.stepIndex + 1;
      context += `Progress: Step ${stepNum} of ${focusMode.totalSteps}\n\n`;
      context += `Current Step (id: ${focusMode.currentStepId}): ${focusMode.currentStepText}\n`;

      if (focusMode.currentSubsteps && focusMode.currentSubsteps.length > 0) {
        context += `Substeps:\n`;
        focusMode.currentSubsteps.forEach((sub, subIndex) => {
          const subNum = String.fromCharCode(97 + subIndex); // 'a', 'b', 'c'...
          const status = sub.completed ? "[x]" : "[ ]";
          context += `  ${status} ${stepNum}${subNum}. ${sub.text} (id: ${sub.id})\n`;
        });
      }
    } else if (currentStep) {
      // Simple format: focusMode=true with separate currentStep
      const stepIndex = currentList?.findIndex(s => s.id === currentStep.id) ?? -1;
      const stepNum = stepIndex + 1;
      const totalSteps = currentList?.length ?? 0;
      context += `Progress: Step ${stepNum} of ${totalSteps}\n\n`;
      context += `Current Step (id: ${currentStep.id}): ${currentStep.text}\n`;
      context += `Status: ${currentStep.completed ? 'Completed' : 'In progress'}\n`;

      // Include substeps if available
      const step = currentList?.find(s => s.id === currentStep.id);
      if (step?.substeps && step.substeps.length > 0) {
        context += `Substeps:\n`;
        step.substeps.forEach((sub, subIndex) => {
          const subNum = String.fromCharCode(97 + subIndex); // 'a', 'b', 'c'...
          const status = sub.completed ? "[x]" : "[ ]";
          context += `  ${status} ${stepNum}${subNum}. ${sub.text} (id: ${sub.id})\n`;
        });
      }
    }

    if (taskNotes) {
      context += `\nTask Notes:\n${taskNotes}\n`;
    }

    // Add routine context for recurring tasks
    context += buildRoutineContext(routineContext, recurringMode);

    // Add pending staging context if available
    context += buildStagingContext(pendingSuggestions, pendingEdits, pendingDeletions, pendingAction);

    context += `\n=========================\n\n`;
    context += `User message: ${userMessage}`;
    return context;
  }

  // Normal task list context
  if (currentList && currentList.length > 0) {
    context += `Current task: "${taskTitle || "Untitled"}"\n`;
    if (taskDescription) {
      context += `Description: ${taskDescription}\n`;
    }
    if (taskNotes) {
      context += `Notes: ${taskNotes}\n`;
    }
    context += `Current list (${currentList.length} items):\n`;
    currentList.forEach((step, stepIndex) => {
      const stepNum = stepIndex + 1;
      const status = step.completed ? "[x]" : "[ ]";
      context += `${status} ${stepNum}. ${step.text} (id: ${step.id})\n`;
      step.substeps.forEach((sub, subIndex) => {
        const subNum = String.fromCharCode(97 + subIndex); // 'a', 'b', 'c'...
        const subStatus = sub.completed ? "[x]" : "[ ]";
        context += `    ${subStatus} ${stepNum}${subNum}. ${sub.text} (id: ${sub.id})\n`;
      });
    });
    context += "\n";
  } else {
    context += `Current task: "${taskTitle || "Untitled"}"\n`;
    if (taskDescription) {
      context += `Description: ${taskDescription}\n`;
    }
    context += "Current list: EMPTY (no steps added yet)\n\n";
  }

  // Add pending staging context if available
  context += buildStagingContext(pendingSuggestions, pendingEdits, pendingDeletions, pendingAction);

  context += `User message: ${userMessage}`;

  return context;
}

// Build context message for queue mode (task recommendation)
function buildQueueContextMessage(
  userMessage: string,
  queueContext?: ExtendedStructureRequest["queueContext"]
): string {
  let context = `=== FOCUS QUEUE CONTEXT ===\n`;
  const today = new Date().toISOString().split("T")[0];
  context += `Today's date: ${today}\n\n`;

  if (!queueContext) {
    context += `No queue data available.\n`;
    context += `\n=========================\n\n`;
    context += `User message: ${userMessage}`;
    return context;
  }

  const { todayItems, upcomingItems, excludeTaskIds } = queueContext;

  // TODAY items
  if (todayItems.length > 0) {
    context += `TODAY (${todayItems.length} items):\n`;
    todayItems.forEach((item, index) => {
      // Skip excluded tasks
      if (excludeTaskIds?.includes(item.taskId)) {
        return;
      }

      const progressText = item.totalSteps > 0
        ? `${item.completedSteps}/${item.totalSteps} steps done`
        : "no steps";

      context += `  ${index + 1}. "${item.taskTitle}" (id: ${item.taskId})\n`;
      context += `     Progress: ${progressText}\n`;

      if (item.priority) {
        context += `     Priority: ${item.priority}\n`;
      }
      if (item.targetDate) {
        const isToday = item.targetDate === today;
        const target = isToday ? "TODAY" : item.targetDate;
        context += `     Target (personal goal): ${target}\n`;
      }
      if (item.deadlineDate) {
        const isToday = item.deadlineDate === today;
        const deadline = isToday ? "TODAY" : item.deadlineDate;
        context += `     Deadline (hard): ${deadline}\n`;
      }
      if (item.effort) {
        context += `     Effort: ${item.effort}\n`;
      }

      // Calculate days in queue
      if (item.addedAt) {
        const daysInQueue = Math.floor((Date.now() - item.addedAt) / (1000 * 60 * 60 * 24));
        if (daysInQueue > 0) {
          context += `     In queue: ${daysInQueue} day${daysInQueue > 1 ? "s" : ""}\n`;
        }
      }
    });
    context += "\n";
  } else {
    context += `TODAY: No items\n\n`;
  }

  // UPCOMING items (brief summary)
  if (upcomingItems.length > 0) {
    context += `UPCOMING (${upcomingItems.length} items):\n`;
    upcomingItems.forEach((item, index) => {
      if (excludeTaskIds?.includes(item.taskId)) {
        return;
      }
      context += `  ${index + 1}. "${item.taskTitle}"`;
      if (item.deadlineDate) {
        context += ` (deadline: ${item.deadlineDate})`;
      }
      context += "\n";
    });
    context += "\n";
  }

  // Note excluded tasks
  if (excludeTaskIds && excludeTaskIds.length > 0) {
    context += `(${excludeTaskIds.length} task${excludeTaskIds.length > 1 ? "s" : ""} excluded from consideration)\n\n`;
  }

  context += `=========================\n\n`;
  context += `User message: ${userMessage}`;

  return context;
}

// Build context message for tasks view mode (inbox triage + pool browse)
function buildTasksViewContextMessage(
  userMessage: string,
  tasksViewContext?: ExtendedStructureRequest["tasksViewContext"]
): string {
  let context = `=== TASKS VIEW CONTEXT ===\n`;
  const today = new Date().toISOString().split("T")[0];
  context += `Today's date: ${today}\n\n`;

  if (!tasksViewContext) {
    context += `No tasks data available.\n`;
    context += `\n=========================\n\n`;
    context += `User message: ${userMessage}`;
    return context;
  }

  const { triageItems, readyTasks } = tasksViewContext;

  // TRIAGE (inbox) items
  if (triageItems.length > 0) {
    context += `TRIAGE / INBOX (${triageItems.length} items to process):\n`;
    triageItems.forEach((item, index) => {
      const daysAgo = Math.floor((Date.now() - item.createdAt) / (1000 * 60 * 60 * 24));
      const ageText = daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`;
      context += `  ${index + 1}. "${item.taskTitle}" (added ${ageText})\n`;
    });
    context += "\n";
  } else {
    context += `TRIAGE / INBOX: Empty (all caught up!)\n\n`;
  }

  // READY (pool) tasks
  if (readyTasks.length > 0) {
    context += `READY / POOL (${readyTasks.length} tasks available):\n`;
    readyTasks.forEach((task, index) => {
      const progressText = task.stepsCount > 0
        ? `${task.completedSteps}/${task.stepsCount} steps`
        : "no steps";
      const queueStatus = task.inQueue ? " [in Focus Queue]" : "";

      context += `  ${index + 1}. "${task.taskTitle}"${queueStatus}\n`;
      context += `     Progress: ${progressText}\n`;

      if (task.priority) {
        context += `     Priority: ${task.priority}\n`;
      }
      if (task.targetDate) {
        const isToday = task.targetDate === today;
        const target = isToday ? "TODAY" : task.targetDate;
        context += `     Target (personal goal): ${target}\n`;
      }
      if (task.deadlineDate) {
        const isToday = task.deadlineDate === today;
        const deadline = isToday ? "TODAY" : task.deadlineDate;
        context += `     Deadline (hard): ${deadline}\n`;
      }
    });
    context += "\n";
  } else {
    context += `READY / POOL: Empty\n\n`;
  }

  context += `=========================\n\n`;
  context += `User message: ${userMessage}`;

  return context;
}

// Build context message for task detail mode (full task context)
function buildTaskDetailContextMessage(
  userMessage: string,
  taskTitle: string | null,
  taskDescription: string | null | undefined,
  taskNotes: string | undefined,
  taskDetailContext?: ExtendedStructureRequest["taskDetailContext"],
  targetedStepId?: string | null,
  routineContext?: ExtendedStructureRequest["routineContext"],
  pendingSuggestions?: ExtendedStructureRequest["pendingSuggestions"],
  pendingEdits?: ExtendedStructureRequest["pendingEdits"],
  pendingDeletions?: ExtendedStructureRequest["pendingDeletions"],
  pendingAction?: ExtendedStructureRequest["pendingAction"],
  recurringMode?: 'executing' | 'managing'
): string {
  const today = new Date().toISOString().split("T")[0];
  let context = `=== TASK DETAIL CONTEXT ===\n`;
  context += `Today's date: ${today}\n\n`;

  context += `Task: "${taskTitle || "Untitled"}"\n`;
  if (taskDescription) {
    context += `Description: ${taskDescription}\n`;
  }
  if (taskNotes) {
    context += `Notes: ${taskNotes}\n`;
  }

  if (!taskDetailContext) {
    context += `\n=========================\n\n`;
    context += `User message: ${userMessage}`;
    return context;
  }

  // Task metadata
  context += `\n--- Task Status ---\n`;
  context += `Status: ${taskDetailContext.status}\n`;
  if (taskDetailContext.priority) {
    context += `Priority: ${taskDetailContext.priority}\n`;
  }
  if (taskDetailContext.effort) {
    context += `Effort: ${taskDetailContext.effort}\n`;
  }
  context += `In Focus Queue: ${taskDetailContext.inFocusQueue ? 'Yes' : 'No'}\n`;

  // Health status
  context += `\n--- Health Status ---\n`;
  const healthLabels: Record<string, string> = {
    'healthy': 'On track',
    'at_risk': 'Check in (needs attention)',
    'critical': 'Needs attention (critical)',
  };
  context += `Health: ${healthLabels[taskDetailContext.health.status] || taskDetailContext.health.status}\n`;
  if (taskDetailContext.health.reasons.length > 0) {
    context += `Reasons:\n`;
    taskDetailContext.health.reasons.forEach(reason => {
      context += `  • ${reason}\n`;
    });
  }

  // Nudge Metadata
  const hasNudgeData = taskDetailContext.importance || taskDetailContext.energyType || taskDetailContext.leadTimeDays;
  if (hasNudgeData) {
    context += `\n--- Nudge Metadata ---\n`;
    if (taskDetailContext.importance) {
      const importanceLabels: Record<string, string> = {
        'must_do': 'Must Do',
        'should_do': 'Should Do',
        'could_do': 'Could Do',
        'would_like_to': 'Would Like To',
      };
      const sourceLabel = taskDetailContext.importanceSource === 'partner' ? ' (set by partner)' : '';
      context += `Importance: ${importanceLabels[taskDetailContext.importance] || taskDetailContext.importance}${sourceLabel}\n`;
      if (taskDetailContext.importanceNote) {
        context += `  Note: "${taskDetailContext.importanceNote}"\n`;
      }
    }
    if (taskDetailContext.energyType) {
      const energyLabels: Record<string, string> = {
        'energizing': 'Energizing',
        'neutral': 'Neutral',
        'draining': 'Draining (requires effort)',
      };
      context += `Energy Type: ${energyLabels[taskDetailContext.energyType] || taskDetailContext.energyType}\n`;
    }
    if (taskDetailContext.leadTimeDays) {
      context += `Lead Time: ${taskDetailContext.leadTimeDays} day${taskDetailContext.leadTimeDays > 1 ? 's' : ''} before deadline\n`;
    }
  }

  // Priority Analysis (computed)
  context += `\n--- Priority Analysis ---\n`;
  context += `Priority Score: ${taskDetailContext.priorityScore}/100\n`;
  const tierLabels: Record<string, string> = {
    'critical': 'CRITICAL',
    'high': 'HIGH',
    'medium': 'MEDIUM',
    'low': 'LOW',
  };
  context += `Priority Tier: ${tierLabels[taskDetailContext.priorityTier] || taskDetailContext.priorityTier}\n`;
  if (taskDetailContext.effectiveDeadline) {
    context += `Effective Deadline: ${taskDetailContext.effectiveDeadline} (with lead time)\n`;
  }

  // Dates
  if (taskDetailContext.targetDate || taskDetailContext.deadlineDate) {
    context += `\n--- Dates ---\n`;
    if (taskDetailContext.targetDate) {
      const isToday = taskDetailContext.targetDate === today;
      const isPast = taskDetailContext.targetDate < today;
      const target = isToday ? "TODAY" : isPast ? `${taskDetailContext.targetDate} (PAST)` : taskDetailContext.targetDate;
      context += `Target (personal goal): ${target}\n`;
    }
    if (taskDetailContext.deadlineDate) {
      const isToday = taskDetailContext.deadlineDate === today;
      const isPast = taskDetailContext.deadlineDate < today;
      const deadline = isToday ? "TODAY" : isPast ? `${taskDetailContext.deadlineDate} (OVERDUE!)` : taskDetailContext.deadlineDate;
      context += `Deadline (hard): ${deadline}\n`;
    }
  }

  // Reminder
  if (taskDetailContext.reminder) {
    context += `\n--- Reminder ---\n`;
    if (taskDetailContext.reminder.type === 'relative') {
      const mins = taskDetailContext.reminder.relativeMinutes || 0;
      const relTo = taskDetailContext.reminder.relativeTo || 'target';
      const timeStr = mins >= 1440 ? `${Math.floor(mins / 1440)} day(s)` : mins >= 60 ? `${Math.floor(mins / 60)} hour(s)` : `${mins} minutes`;
      context += `Reminder: ${timeStr} before ${relTo}\n`;
    } else if (taskDetailContext.reminder.type === 'absolute' && taskDetailContext.reminder.absoluteTime) {
      const reminderDate = new Date(taskDetailContext.reminder.absoluteTime);
      context += `Reminder: ${reminderDate.toLocaleString()}\n`;
    }
  }

  // Waiting on
  if (taskDetailContext.waitingOn) {
    context += `\n--- Waiting On ---\n`;
    context += `Waiting on: ${taskDetailContext.waitingOn.who}\n`;
    const sinceDate = new Date(taskDetailContext.waitingOn.since);
    context += `Since: ${sinceDate.toLocaleDateString()}\n`;
    if (taskDetailContext.waitingOn.followUpDate) {
      context += `Follow-up: ${taskDetailContext.waitingOn.followUpDate}\n`;
    }
  }

  // Progress and steps
  context += `\n--- Progress ---\n`;
  const { completedSteps, totalSteps } = taskDetailContext.progress;
  if (totalSteps === 0) {
    context += `No steps defined yet.\n`;
  } else {
    context += `Progress: ${completedSteps}/${totalSteps} steps completed (${Math.round((completedSteps / totalSteps) * 100)}%)\n\n`;
    context += `Steps:\n`;
    taskDetailContext.steps.forEach(step => {
      const status = step.completed ? "[COMPLETED]" : "[ ]";
      context += `${status} ${step.stepNumber}. ${step.text} (id: ${step.id})\n`;
      if (step.substeps.length > 0) {
        step.substeps.forEach(sub => {
          const subStatus = sub.completed ? "[COMPLETED]" : "[ ]";
          context += `    ${subStatus} ${step.stepNumber}${sub.label}. ${sub.text} (id: ${sub.id})\n`;
        });
      }
    });
  }

  // Add targeted step context when user clicked sparkle on a specific step
  if (targetedStepId && taskDetailContext.steps) {
    const targetedStep = taskDetailContext.steps.find(s => s.id === targetedStepId);
    if (targetedStep) {
      context += `\n=== TARGETED STEP ===\n`;
      context += `The user is asking specifically about this step:\n`;
      context += `  Step ${targetedStep.stepNumber}: "${targetedStep.text}" (id: ${targetedStepId})\n\n`;
      context += `IMPORTANT: When breaking down or expanding this step:\n`;
      context += `  - Set parentStepId to "${targetedStepId}" in your suggest_additions response\n`;
      context += `  - Suggestions will become SUBSTEPS of this step, not new top-level steps\n`;
      context += `  - Keep edits localized to this step unless user explicitly asks for more\n`;
    }
  }

  // Add routine context for recurring tasks
  context += buildRoutineContext(routineContext, recurringMode);

  // Add pending staging context if available
  context += buildStagingContext(pendingSuggestions, pendingEdits, pendingDeletions, pendingAction);

  context += `\n=========================\n\n`;
  context += `IMPORTANT: When suggesting steps or first actions, ALWAYS check the progress above. Do NOT recommend steps that are already marked [COMPLETED].\n\n`;
  context += `User message: ${userMessage}`;

  return context;
}

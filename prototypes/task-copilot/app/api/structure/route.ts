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
    const { userMessage, currentList, taskTitle, taskDescription, conversationHistory, taskNotes, focusMode, currentStep, queueMode, queueContext, tasksViewMode, tasksViewContext, pendingSuggestions, pendingEdits, pendingDeletions, pendingAction } = body;

    // Determine which prompt and tools to use
    const isFocusMode = Boolean(focusMode);
    const isQueueMode = Boolean(queueMode);
    const isTasksViewMode = Boolean(tasksViewMode);

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

    // Build context message with current state
    const contextMessage = isQueueMode
      ? buildQueueContextMessage(userMessage, queueContext)
      : isTasksViewMode
        ? buildTasksViewContextMessage(userMessage, tasksViewContext)
        : buildContextMessage(userMessage, currentList, taskTitle, taskDescription, taskNotes, focusMode, currentStep, pendingSuggestions, pendingEdits, pendingDeletions, pendingAction);
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

    const errorMessage =
      error instanceof Error ? error.message : "Failed to process request";

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
      const cleanedSteps = data.steps.map(cleanStepText);
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
          estimatedMinutes: s.estimatedMinutes || null,
          estimateSource: s.estimatedMinutes ? "ai" as const : null,
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
      const cleanedSuggestions = data.suggestions.map((s) => {
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
          estimatedMinutes: s.estimatedMinutes,
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
        edits: data.edits.map((e) => ({
          targetId: e.targetId,
          targetType: e.targetType,
          parentId: e.parentId,
          originalText: e.originalText,
          newText: e.newText,
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
        deletions: data.deletions.map((d) => ({
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
        suggestions: data.substeps.map((sub) => ({
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

// Build context message with current list state
function buildContextMessage(
  userMessage: string,
  currentList: StructureRequest["currentList"],
  taskTitle: string | null,
  taskDescription: string | null | undefined,
  taskNotes?: string,
  focusMode?: ExtendedStructureRequest["focusMode"],
  currentStep?: ExtendedStructureRequest["currentStep"],
  pendingSuggestions?: ExtendedStructureRequest["pendingSuggestions"],
  pendingEdits?: ExtendedStructureRequest["pendingEdits"],
  pendingDeletions?: ExtendedStructureRequest["pendingDeletions"],
  pendingAction?: ExtendedStructureRequest["pendingAction"]
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

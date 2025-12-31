import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, FOCUS_MODE_PROMPT } from "@/lib/prompts";
import { StructureRequest, StructureResponse, Substep } from "@/lib/types";

// Extended request body for focus mode
interface ExtendedStructureRequest extends StructureRequest {
  taskNotes?: string;
  focusMode?: {
    currentStepId: string;
    currentStepText: string;
    currentSubsteps: Substep[];
    stepIndex: number;
    totalSteps: number;
  };
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body: ExtendedStructureRequest = await request.json();
    const { userMessage, currentList, taskTitle, conversationHistory, taskNotes, focusMode } = body;

    // Determine which prompt to use
    const systemPrompt = focusMode ? FOCUS_MODE_PROMPT : SYSTEM_PROMPT;

    // Build context message with current state
    const contextMessage = buildContextMessage(userMessage, currentList, taskTitle, taskNotes, focusMode);

    // Build messages array for Claude
    const messages: { role: "user" | "assistant"; content: string }[] = [];

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

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    // Extract text content
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Parse JSON response
    let parsed: StructureResponse;
    try {
      // Clean potential markdown code fences
      let jsonText = textContent.text.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.slice(7);
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith("```")) {
        jsonText = jsonText.slice(0, -3);
      }
      jsonText = jsonText.trim();

      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse Claude response:", textContent.text);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate response structure
    const validatedResponse: StructureResponse = {
      action: parsed.action || "none",
      taskTitle: parsed.taskTitle || null,
      steps: parsed.steps || null,
      suggestions: parsed.suggestions || null,
      edits: parsed.edits || null,
      message: parsed.message || "I'm not sure how to help with that.",
    };

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
        message: `Sorry, something went wrong: ${errorMessage}`,
      } as StructureResponse,
      { status: 500 }
    );
  }
}

// Build context message with current list state
function buildContextMessage(
  userMessage: string,
  currentList: StructureRequest["currentList"],
  taskTitle: string | null,
  taskNotes?: string,
  focusMode?: ExtendedStructureRequest["focusMode"]
): string {
  let context = "";

  // Focus mode specific context
  if (focusMode) {
    context += `=== FOCUS MODE CONTEXT ===\n`;
    context += `Task: "${taskTitle || "Untitled"}"\n`;
    context += `Progress: Step ${focusMode.stepIndex + 1} of ${focusMode.totalSteps}\n\n`;
    context += `Current Step: ${focusMode.currentStepText}\n`;

    if (focusMode.currentSubsteps && focusMode.currentSubsteps.length > 0) {
      context += `Substeps:\n`;
      focusMode.currentSubsteps.forEach((sub) => {
        const status = sub.completed ? "[x]" : "[ ]";
        context += `  ${status} ${sub.id}. ${sub.text}\n`;
      });
    }

    if (taskNotes) {
      context += `\nTask Notes:\n${taskNotes}\n`;
    }

    context += `\n=========================\n\n`;
    context += `User message: ${userMessage}`;
    return context;
  }

  // Normal task list context
  if (currentList && currentList.length > 0) {
    context += `Current task: "${taskTitle || "Untitled"}"\n`;
    context += `Current list (${currentList.length} items):\n`;
    currentList.forEach((step) => {
      const status = step.completed ? "[x]" : "[ ]";
      context += `${status} ${step.id}. ${step.text}\n`;
      step.substeps.forEach((sub) => {
        const subStatus = sub.completed ? "[x]" : "[ ]";
        context += `    ${subStatus} ${sub.id}. ${sub.text}\n`;
      });
    });
    context += "\n";
  } else {
    context += "Current list: EMPTY\n\n";
  }

  context += `User message: ${userMessage}`;

  return context;
}

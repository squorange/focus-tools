import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { StructureRequest, StructureResponse } from "@/lib/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body: StructureRequest = await request.json();
    const { userMessage, currentList, taskTitle, conversationHistory } = body;

    // Build context message with current state
    const contextMessage = buildContextMessage(userMessage, currentList, taskTitle);

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
      system: SYSTEM_PROMPT,
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
  taskTitle: string | null
): string {
  let context = "";

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

import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Chat API Route
 *
 * POST /api/ai/chat - Send a message to the AI
 *
 * This is a stub that returns placeholder responses.
 * In production, this would integrate with Claude API, OpenAI, or other AI providers.
 */

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message, taskId, context } = body;

  // Stub response logic
  const responses = [
    'I can help you break this down into smaller steps. What aspect would you like to tackle first?',
    'Let me suggest a few approaches to this task...',
    'Based on the priority, I recommend focusing on the most critical part first.',
    'Would you like me to help you estimate how long this might take?',
    'I notice this task might benefit from being split into subtasks. Shall we do that?',
  ];

  const response = {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: responses[Math.floor(Math.random() * responses.length)],
    timestamp: new Date().toISOString(),
    taskId,
  };

  // Simulate slight delay for realism
  await new Promise((resolve) => setTimeout(resolve, 500));

  return NextResponse.json({ message: response });
}

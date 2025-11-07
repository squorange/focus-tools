import { Task, ChatMessage, AIContext } from './types';

/**
 * AI Service - Stub for AI routing and interaction
 *
 * This is a placeholder for the AI integration that will:
 * - Route requests to different AI providers (Claude, OpenAI, etc.)
 * - Manage context and conversation history
 * - Handle task-specific AI interactions
 */

export class AIService {
  private context: AIContext = {
    recentMessages: [],
  };

  setTask(task: Task | undefined) {
    this.context.task = task;
  }

  async sendMessage(content: string): Promise<ChatMessage> {
    // Stub implementation - returns a placeholder response
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date(),
      taskId: this.context.task?.id,
    };

    this.context.recentMessages.push(userMessage);

    // Simulate AI response
    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: this.generateStubResponse(content),
      timestamp: new Date(),
      taskId: this.context.task?.id,
    };

    this.context.recentMessages.push(assistantMessage);

    return assistantMessage;
  }

  private generateStubResponse(userInput: string): string {
    const responses = [
      `I understand you're working on "${this.context.task?.title || 'this task'}". How can I help you break this down?`,
      `That's a great question about "${this.context.task?.title || 'your task'}". Let me suggest some next steps...`,
      `For "${this.context.task?.title || 'this task'}", I recommend starting with the most important aspect first.`,
      `Let's prioritize this together. What's the biggest blocker right now?`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  getMessages(): ChatMessage[] {
    return this.context.recentMessages;
  }

  clearMessages() {
    this.context.recentMessages = [];
  }
}

// Singleton instance
export const aiService = new AIService();

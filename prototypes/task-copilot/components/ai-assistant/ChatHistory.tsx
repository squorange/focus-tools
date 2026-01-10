'use client';

import { motion } from 'framer-motion';
import { AIMessage } from '@/lib/ai-types';
import { ResponseDisplay } from './ResponseDisplay';

interface ChatHistoryProps {
  messages: AIMessage[];
}

export function ChatHistory({ messages }: ChatHistoryProps) {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.2 }}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`
              max-w-[85%] px-3 py-2 rounded-2xl text-sm
              ${message.role === 'user'
                ? 'bg-violet-600 text-white rounded-br-md'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-md'
              }
            `}
          >
            {message.role === 'assistant' && message.response ? (
              <ResponseDisplay response={message.response} />
            ) : (
              <p className="whitespace-pre-wrap">{parseMessageContent(message.content)}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Helper to parse message content (extract text from JSON if needed)
function parseMessageContent(content: string): string {
  try {
    const parsed = JSON.parse(content);
    if (parsed.message) return parsed.message;
    if (parsed.text) return parsed.text;
    return content;
  } catch {
    return content;
  }
}

export default ChatHistory;

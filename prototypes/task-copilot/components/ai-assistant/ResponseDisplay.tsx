'use client';

import { motion } from 'framer-motion';
import {
  AIResponse,
  TextContent,
  ExplanationContent,
} from '@/lib/ai-types';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ResponseDisplayProps {
  response: AIResponse;
}

/**
 * ResponseDisplay - Content-only component for rendering AI responses
 *
 * Design Decision: This component renders ONLY content (text, explanation, error).
 * Action buttons are handled by PaletteContent for consistent styling and behavior.
 *
 * See: AI Visual Design System in focus-tools-product-doc.md
 */
export function ResponseDisplay({ response }: ResponseDisplayProps) {
  const prefersReducedMotion = useReducedMotion();

  const renderContent = () => {
    switch (response.type) {
      case 'text':
        return <TextResponse content={response.content as TextContent} />;
      case 'suggestions':
        // Suggestions content should NOT be rendered here - Palette shows summary text instead
        // This case exists for type safety but should be filtered by parent
        return null;
      case 'explanation':
        return <ExplanationResponse content={response.content as ExplanationContent} />;
      case 'error':
        return <ErrorResponse content={response.content as TextContent} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      aria-live="polite"
    >
      {renderContent()}
    </motion.div>
  );
}

// ============ Text Response ============

function TextResponse({ content }: { content: TextContent }) {
  return (
    <p className="text-base text-zinc-600 dark:text-zinc-300 leading-relaxed text-left whitespace-pre-wrap">
      {content.text}
    </p>
  );
}

// ============ Explanation Response ============

function ExplanationResponse({ content }: { content: ExplanationContent }) {
  return (
    <div className="space-y-2 text-left">
      <h4 className="text-base font-medium text-zinc-800 dark:text-zinc-200">{content.title}</h4>
      <p className="text-base text-fg-neutral-secondary whitespace-pre-wrap leading-relaxed">
        {content.explanation}
      </p>
    </div>
  );
}

// ============ Error Response ============

function ErrorResponse({ content }: { content: TextContent }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-left">
      <span className="text-red-400">⚠️</span>
      <p className="text-base text-red-300">{content.text}</p>
    </div>
  );
}

export default ResponseDisplay;

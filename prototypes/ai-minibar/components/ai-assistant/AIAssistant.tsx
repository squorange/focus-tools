'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIAssistantContext, AIResponse } from '@/lib/types';
import { ANIMATIONS } from '@/lib/constants';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { MiniBar } from './MiniBar';
import { Palette } from './Palette';

interface AIAssistantProps {
  context?: AIAssistantContext;
  onSubmit?: (query: string, context: AIAssistantContext) => Promise<AIResponse>;
  onAcceptSuggestions?: (response: AIResponse) => void;
  className?: string;
}

export function AIAssistant({
  context = 'global',
  onSubmit,
  onAcceptSuggestions,
  className = '',
}: AIAssistantProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const {
    state,
    quickActions,
    expand,
    collapse,
    openDrawer,
    setQuery,
    submitQuery,
    acceptSuggestions,
    dismissResponse,
  } = useAIAssistant({
    initialContext: context,
    onSubmit,
    onAcceptSuggestions,
  });

  // Apply nudge when prop changes
  // useEffect handled in hook

  const handleExpand = () => {
    if (state.mode === 'collapsed' && !isAnimating) {
      setIsAnimating(true);
      expand();
      setTimeout(() => setIsAnimating(false), ANIMATIONS.expandDuration * 1000);
    }
  };

  const handleCollapse = () => {
    if (state.mode === 'expanded' && !isAnimating) {
      setIsAnimating(true);
      collapse();
      setTimeout(() => setIsAnimating(false), ANIMATIONS.expandDuration * 1000);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Backdrop (when expanded) */}
      <AnimatePresence>
        {state.mode === 'expanded' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleCollapse}
            className="fixed inset-0 bg-black/40 z-40"
          />
        )}
      </AnimatePresence>

      {/* Main container */}
      <div className="fixed bottom-14 left-0 right-0 z-50">
        <AnimatePresence mode="wait">
          {state.mode === 'collapsed' && (
            <motion.div
              key="minibar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ANIMATIONS.contentFadeDuration }}
            >
              <MiniBar
                content={state.collapsedContent}
                onExpand={handleExpand}
                isAnimating={isAnimating}
              />
            </motion.div>
          )}

          {state.mode === 'expanded' && (
            <motion.div
              key="palette"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ANIMATIONS.contentFadeDuration }}
            >
              <Palette
                query={state.query}
                onQueryChange={setQuery}
                onSubmit={submitQuery}
                isLoading={state.isLoading}
                response={state.response}
                quickActions={quickActions}
                onCollapse={handleCollapse}
                onOpenDrawer={openDrawer}
                onAccept={acceptSuggestions}
                onDismiss={dismissResponse}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AIAssistant;

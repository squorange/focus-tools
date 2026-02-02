/**
 * AI Feedback Components - Phase 3a
 *
 * Components for collecting user feedback on AI suggestions.
 *
 * @see docs/features/ai-guardrails/SPEC.md
 */

'use client';

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, X } from 'lucide-react';
import { trackFeedback } from '@/lib/analytics';

// ============================================
// Quick Reaction (Thumbs Up/Down)
// ============================================

interface QuickReactionProps {
  context: 'suggestion' | 'conversation' | 'general';
  onFeedback?: (sentiment: 'positive' | 'negative') => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function QuickReaction({
  context,
  onFeedback,
  className = '',
  size = 'sm',
}: QuickReactionProps) {
  const [selected, setSelected] = useState<'positive' | 'negative' | null>(null);

  const handleFeedback = (sentiment: 'positive' | 'negative') => {
    setSelected(sentiment);
    trackFeedback(sentiment, context);
    onFeedback?.(sentiment);
  };

  const sizeClasses = size === 'sm'
    ? 'p-1.5 text-xs'
    : 'p-2 text-sm';

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  if (selected) {
    return (
      <div className={`flex items-center gap-1.5 text-slate-400 dark:text-slate-500 ${className}`}>
        <span className="text-xs">Thanks for the feedback!</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={() => handleFeedback('positive')}
        className={`${sizeClasses} rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors`}
        title="Helpful"
      >
        <ThumbsUp className={iconSize} />
      </button>
      <button
        onClick={() => handleFeedback('negative')}
        className={`${sizeClasses} rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors`}
        title="Not helpful"
      >
        <ThumbsDown className={iconSize} />
      </button>
    </div>
  );
}

// ============================================
// Detailed Feedback Modal
// ============================================

interface DetailedFeedbackProps {
  isOpen: boolean;
  onClose: () => void;
  context: 'suggestion' | 'conversation' | 'general';
  initialSentiment?: 'positive' | 'negative' | 'neutral';
}

export function DetailedFeedback({
  isOpen,
  onClose,
  context,
  initialSentiment = 'neutral',
}: DetailedFeedbackProps) {
  const [sentiment, setSentiment] = useState(initialSentiment);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    // Track the feedback
    trackFeedback(sentiment, context);

    // In Phase 3a, we store feedback locally
    // In future phases, this would be sent to Supabase
    const feedback = {
      timestamp: Date.now(),
      context,
      sentiment,
      text: feedbackText,
    };

    // Store locally for now (future: Supabase)
    try {
      const stored = localStorage.getItem('ai-feedback') || '[]';
      const feedbackList = JSON.parse(stored);
      feedbackList.push(feedback);
      // Keep only last 100 feedbacks
      if (feedbackList.length > 100) {
        feedbackList.splice(0, feedbackList.length - 100);
      }
      localStorage.setItem('ai-feedback', JSON.stringify(feedbackList));
    } catch {
      console.warn('[Feedback] Failed to store feedback');
    }

    setSubmitted(true);
    setTimeout(() => {
      onClose();
      // Reset state after closing
      setSentiment('neutral');
      setFeedbackText('');
      setSubmitted(false);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">
            Share Feedback
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <ThumbsUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Thanks for your feedback!
              </p>
            </div>
          ) : (
            <>
              {/* Sentiment selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  How was this AI response?
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSentiment('positive')}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                      sentiment === 'positive'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Helpful
                  </button>
                  <button
                    onClick={() => setSentiment('neutral')}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 transition-colors ${
                      sentiment === 'neutral'
                        ? 'border-slate-500 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    Okay
                  </button>
                  <button
                    onClick={() => setSentiment('negative')}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                      sentiment === 'negative'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    Not helpful
                  </button>
                </div>
              </div>

              {/* Feedback text */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tell us more (optional)
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="What could be better? What worked well?"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg resize-none h-24 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Your feedback helps us improve AI suggestions for everyone.
                </p>
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit Feedback
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Feedback Button (Trigger for detailed modal)
// ============================================

interface FeedbackButtonProps {
  onClick: () => void;
  className?: string;
}

export function FeedbackButton({ onClick, className = '' }: FeedbackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors ${className}`}
      title="Give feedback on AI"
    >
      <MessageSquare className="w-3.5 h-3.5" />
      Feedback
    </button>
  );
}

// ============================================
// Feedback Summary (for debugging)
// ============================================

export function getFeedbackSummary(): {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
} {
  try {
    const stored = localStorage.getItem('ai-feedback') || '[]';
    const feedbackList = JSON.parse(stored) as Array<{
      sentiment: 'positive' | 'negative' | 'neutral';
    }>;

    return {
      total: feedbackList.length,
      positive: feedbackList.filter(f => f.sentiment === 'positive').length,
      negative: feedbackList.filter(f => f.sentiment === 'negative').length,
      neutral: feedbackList.filter(f => f.sentiment === 'neutral').length,
    };
  } catch {
    return { total: 0, positive: 0, negative: 0, neutral: 0 };
  }
}

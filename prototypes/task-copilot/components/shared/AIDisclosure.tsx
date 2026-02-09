/**
 * AI Disclosure Components - Phase 3a Transparency
 *
 * Components for disclosing AI limitations to users.
 * Used in onboarding, settings, and help sections.
 *
 * @see docs/features/ai-guardrails/SPEC.md
 */

'use client';

import React from 'react';
import { Info, Brain, AlertCircle, Sparkles, Clock, User } from 'lucide-react';

// ============================================
// Short Disclosure (Onboarding / Tooltip)
// ============================================

interface AIDisclosureShortProps {
  className?: string;
}

export function AIDisclosureShort({ className = '' }: AIDisclosureShortProps) {
  return (
    <div className={`bg-bg-neutral-subtle rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-bg-info-subtle rounded-lg">
          <Brain className="w-5 h-5 text-fg-info-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-fg-neutral-primary mb-2">
            About AI Suggestions
          </h3>
          <ul className="space-y-1.5 text-sm text-fg-neutral-secondary">
            <li className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 text-fg-attention-primary shrink-0" />
              <span>Suggestions are starting points — adjust them to fit your needs</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 text-fg-neutral-soft shrink-0" />
              <span>Time estimates are rough guides, not commitments</span>
            </li>
            <li className="flex items-start gap-2">
              <User className="w-4 h-4 mt-0.5 text-fg-positive-primary shrink-0" />
              <span>You're the expert on your life — AI doesn't know your full context</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 text-fg-attention-primary shrink-0" />
              <span>For critical tasks, always verify important details yourself</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Full Disclosure (Settings / Help)
// ============================================

interface AIDisclosureFullProps {
  className?: string;
  showPrivacyNote?: boolean;
}

export function AIDisclosureFull({
  className = '',
  showPrivacyNote = true,
}: AIDisclosureFullProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-bg-info-subtle rounded-lg">
          <Brain className="w-6 h-6 text-fg-info-primary" />
        </div>
        <h2 className="text-lg font-semibold text-fg-neutral-primary">
          How AI Works in Task Co-Pilot
        </h2>
      </div>

      <p className="text-sm text-fg-neutral-secondary">
        The AI assistant helps you break down tasks, estimate effort, and get
        unstuck. Here's what to know:
      </p>

      {/* What it's good at */}
      <div className="bg-bg-positive-subtle rounded-lg p-4">
        <h3 className="font-medium text-sm text-fg-positive-primary mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          What it's good at
        </h3>
        <ul className="space-y-1 text-sm text-fg-positive-primary">
          <li>• Suggesting concrete next steps when a task feels overwhelming</li>
          <li>• Breaking large goals into smaller, actionable pieces</li>
          <li>• Offering different approaches when you're stuck</li>
        </ul>
      </div>

      {/* What it can't do */}
      <div className="bg-bg-attention-subtle rounded-lg p-4">
        <h3 className="font-medium text-sm text-fg-attention-primary mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          What it can't do
        </h3>
        <ul className="space-y-1 text-sm text-fg-attention-primary">
          <li>• Know your personal schedule, energy, or priorities</li>
          <li>• Guarantee time estimates are accurate for you</li>
          <li>• Replace your judgment on what matters most</li>
        </ul>
      </div>

      {/* Best practice */}
      <div className="bg-bg-info-subtle rounded-lg p-4">
        <h3 className="font-medium text-sm text-fg-info-primary mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Best practice
        </h3>
        <p className="text-sm text-fg-info-primary">
          Treat AI suggestions as a helpful starting point. Review, adjust, and
          make them your own. You can always modify or reject any suggestion.
        </p>
      </div>

      {/* Privacy note */}
      {showPrivacyNote && (
        <div className="border border-border-color-neutral rounded-lg p-4">
          <h3 className="font-medium text-sm text-fg-neutral-primary mb-2">
            Privacy Note
          </h3>
          <p className="text-sm text-fg-neutral-secondary">
            Your task content is processed by Anthropic's Claude AI to generate
            suggestions. We don't store your tasks on our servers.{' '}
            <span className="text-fg-info-primary cursor-pointer hover:underline">
              See Analytics Settings
            </span>{' '}
            for data sharing options.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// Inline AI Label
// ============================================

interface AILabelProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function AILabel({ size = 'sm', className = '' }: AILabelProps) {
  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5 gap-0.5'
    : 'text-xs px-2 py-1 gap-1';

  return (
    <span
      className={`inline-flex items-center bg-bg-info-subtle text-fg-info-primary rounded font-medium ${sizeClasses} ${className}`}
    >
      <Sparkles className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      AI
    </span>
  );
}

// ============================================
// Rate Limit Warning Banner
// ============================================

interface RateLimitBannerProps {
  message: string | null;
  cooldownMessage?: string | null;
  onClose?: () => void;
  className?: string;
}

export function RateLimitBanner({
  message,
  cooldownMessage,
  onClose,
  className = '',
}: RateLimitBannerProps) {
  if (!message && !cooldownMessage) return null;

  return (
    <div
      className={`bg-bg-attention-subtle border border-border-attention rounded-lg px-3 py-2 text-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-fg-attention-primary">
          <Clock className="w-4 h-4 shrink-0" />
          <span>{cooldownMessage || message}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-fg-attention-primary hover:text-fg-attention-primary"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Analytics Opt-In Card
// ============================================

interface AnalyticsOptInProps {
  onEnable: () => void;
  onDecline: () => void;
  className?: string;
}

export function AnalyticsOptIn({
  onEnable,
  onDecline,
  className = '',
}: AnalyticsOptInProps) {
  return (
    <div className={`bg-bg-neutral-min border border-border-color-neutral rounded-lg p-5 ${className}`}>
      <h3 className="font-semibold text-fg-neutral-primary mb-2">
        Help improve Task Co-Pilot
      </h3>
      <p className="text-sm text-fg-neutral-secondary mb-4">
        Share anonymous usage data to help us understand which features are most helpful.
      </p>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-xs font-medium text-fg-neutral-secondary mb-1">
            What we collect:
          </p>
          <ul className="text-xs text-fg-neutral-soft space-y-0.5">
            <li>✓ Which AI features you use (not your task content)</li>
            <li>✓ Whether suggestions were helpful (accepted/rejected)</li>
            <li>✓ General usage patterns</li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium text-fg-neutral-secondary mb-1">
            What we NEVER collect:
          </p>
          <ul className="text-xs text-fg-neutral-soft space-y-0.5">
            <li>✗ Task titles, descriptions, or notes</li>
            <li>✗ Personal information</li>
            <li>✗ Anything that identifies you</li>
          </ul>
        </div>
      </div>

      <p className="text-xs text-fg-neutral-soft mb-4">
        You can change this anytime in Settings.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onEnable}
          className="flex-1 px-4 py-2 bg-bg-accent-high text-fg-neutral-inverse-primary text-sm font-medium rounded-lg hover:bg-bg-accent-high-hover transition-colors"
        >
          Enable Analytics
        </button>
        <button
          onClick={onDecline}
          className="flex-1 px-4 py-2 bg-bg-neutral-subtle text-fg-neutral-secondary text-sm font-medium rounded-lg hover:bg-bg-neutral-subtle-hover transition-colors"
        >
          No Thanks
        </button>
      </div>
    </div>
  );
}

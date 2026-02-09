'use client';

import { motion } from 'framer-motion';
import { QuickAction } from '@/lib/ai-types';
import { ANIMATIONS } from '@/lib/ai-constants';

interface QuickActionsProps {
  actions: QuickAction[];
  onSelect: (action: QuickAction) => void;
  disabled?: boolean;
}

export function QuickActions({ actions, onSelect, disabled = false }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          onClick={() => onSelect(action)}
          disabled={disabled}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * ANIMATIONS.responseDelay,
            duration: 0.2,
          }}
          whileTap={{ scale: 0.95 }}
          className={`
            flex items-center gap-1.5 px-3 py-1.5
            bg-bg-accent-subtle
            hover:bg-bg-accent-subtle-hover
            rounded-full text-sm text-fg-accent-primary
            whitespace-nowrap font-medium
            transition-colors
            ${disabled ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

export default QuickActions;

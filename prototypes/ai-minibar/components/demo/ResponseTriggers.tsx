'use client';

import { CollapsedContentType } from '@/lib/types';

interface ResponseTriggersProps {
  onTriggerResponse: (key: string) => void;
  onSetCollapsedContent: (type: CollapsedContentType) => void;
}

export function ResponseTriggers({
  onTriggerResponse,
  onSetCollapsedContent,
}: ResponseTriggersProps) {
  return (
    <div className="space-y-4">
      {/* Collapsed State Triggers */}
      <div>
        <h3 className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">
          Collapsed States
        </h3>
        <div className="flex flex-wrap gap-2">
          {(['idle', 'loading', 'nudge', 'status', 'response'] as CollapsedContentType[]).map(
            (type) => (
              <button
                key={type}
                onClick={() => onSetCollapsedContent(type)}
                className="px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 capitalize transition-colors"
              >
                {type}
              </button>
            )
          )}
        </div>
      </div>

      {/* Response Triggers */}
      <div>
        <h3 className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">
          Trigger Responses
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onTriggerResponse('breakdown')}
            className="px-3 py-1.5 text-xs font-medium bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-800/50 border border-violet-300 dark:border-violet-700 rounded-lg text-violet-600 dark:text-violet-300 transition-colors"
          >
            Breakdown
          </button>
          <button
            onClick={() => onTriggerResponse('whatNext')}
            className="px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800/50 border border-blue-300 dark:border-blue-700 rounded-lg text-blue-600 dark:text-blue-300 transition-colors"
          >
            What Next
          </button>
          <button
            onClick={() => onTriggerResponse('explain')}
            className="px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-800/50 border border-green-300 dark:border-green-700 rounded-lg text-green-600 dark:text-green-300 transition-colors"
          >
            Explain
          </button>
          <button
            onClick={() => onTriggerResponse('stuck')}
            className="px-3 py-1.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 border border-yellow-300 dark:border-yellow-700 rounded-lg text-yellow-600 dark:text-yellow-300 transition-colors"
          >
            Stuck
          </button>
          <button
            onClick={() => onTriggerResponse('error')}
            className="px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/50 border border-red-300 dark:border-red-700 rounded-lg text-red-600 dark:text-red-300 transition-colors"
          >
            Error
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResponseTriggers;

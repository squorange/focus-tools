/**
 * AI Response Type Detection
 *
 * Routes AI responses to the appropriate surface:
 * - TEXT actions → Palette (dialogue)
 * - STRUCTURED actions → StagingArea (decisions)
 *
 * The API returns `action` field with values: 'replace' | 'suggest' | 'edit' | 'delete' | 'none'
 */

// Action values that produce TEXT responses (displayed in Palette)
export const TEXT_ACTIONS = [
  'none',  // Pure conversational response
] as const;

// Action values that produce STRUCTURED responses (displayed in StagingArea)
export const STRUCTURED_ACTIONS = [
  'replace',  // Replace all steps (from replace_task_steps)
  'suggest',  // Add suggestions (from suggest_additions, break_down_step)
  'edit',     // Edit existing steps (from edit_steps)
  'delete',   // Delete steps (from delete_steps)
] as const;

export type TextAction = typeof TEXT_ACTIONS[number];
export type StructuredAction = typeof STRUCTURED_ACTIONS[number];
export type ResponseCategory = 'text' | 'structured';

/**
 * Categorize a response by its action type
 * @param action The action value from the API response
 * @returns 'text' for Palette, 'structured' for StagingArea
 */
export function categorizeResponse(action: string): ResponseCategory {
  if ((TEXT_ACTIONS as readonly string[]).includes(action)) {
    return 'text';
  }
  if ((STRUCTURED_ACTIONS as readonly string[]).includes(action)) {
    return 'structured';
  }
  // Default to text for unknown actions (safer fallback)
  return 'text';
}

/**
 * Check if an action produces text-only responses
 */
export function isTextAction(action: string): action is TextAction {
  return (TEXT_ACTIONS as readonly string[]).includes(action);
}

/**
 * Check if an action produces structured responses
 */
export function isStructuredAction(action: string): action is StructuredAction {
  return (STRUCTURED_ACTIONS as readonly string[]).includes(action);
}

/**
 * Get a human-readable label for the action
 * Used for MiniBar status messages
 */
export function getActionLabel(action: string): string {
  switch (action) {
    // Text actions
    case 'none':
      return 'Response ready';
    // Structured actions
    case 'replace':
      return 'Steps ready';
    case 'suggest':
      return 'Suggestions ready';
    case 'edit':
      return 'Edits ready';
    case 'delete':
      return 'Deletions ready';
    default:
      return 'Response ready';
  }
}

/**
 * Build MiniBar status message for structured responses
 */
export function buildSuggestionsReadyMessage(action: string, count: number): string {
  switch (action) {
    case 'replace':
      return `${count} step${count !== 1 ? 's' : ''} ready`;
    case 'suggest':
      return `${count} suggestion${count !== 1 ? 's' : ''} ready`;
    case 'edit':
      return `${count} edit${count !== 1 ? 's' : ''} ready`;
    case 'delete':
      return `${count} deletion${count !== 1 ? 's' : ''} ready`;
    default:
      return `${count} change${count !== 1 ? 's' : ''} ready`;
  }
}

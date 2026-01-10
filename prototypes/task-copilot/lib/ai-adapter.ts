/**
 * AI Adapter - Translates between StructureResponse (API) and AIResponse (minibar)
 */

import { StructureResponse, SuggestedStep } from './types';
import { AIResponse, Suggestion } from './ai-types';

/**
 * Convert StructureResponse from /api/structure to AIResponse for minibar display
 */
export function structureToAIResponse(response: StructureResponse): AIResponse {
  switch (response.action) {
    case 'replace':
      // Replace action - show all steps as suggestions
      if (response.steps && response.steps.length > 0) {
        return {
          type: 'suggestions',
          content: {
            message: response.message || `Here's a complete breakdown:`,
            suggestions: response.steps.map((step, index) => ({
              id: step.id || `step-${index}`,
              text: step.text,
              substeps: step.substeps?.map((sub, subIndex) => ({
                id: sub.id || `substep-${index}-${subIndex}`,
                text: sub.text,
              })),
            })),
          },
          actions: [
            { id: 'accept', label: 'Replace all', variant: 'primary', onClick: () => {} },
            { id: 'dismiss', label: 'Dismiss', variant: 'ghost', onClick: () => {} },
          ],
        };
      }
      // Fallback to text if no steps
      return {
        type: 'text',
        content: { text: response.message },
      };

    case 'suggest':
      // Suggest action - show suggestions to add
      if (response.suggestions && response.suggestions.length > 0) {
        return {
          type: 'suggestions',
          content: {
            message: response.message || `I suggest adding these steps:`,
            suggestions: suggestedStepsToSuggestions(response.suggestions),
          },
          actions: [
            { id: 'accept', label: 'Add steps', variant: 'primary', onClick: () => {} },
            { id: 'dismiss', label: 'Dismiss', variant: 'ghost', onClick: () => {} },
          ],
        };
      }
      return {
        type: 'text',
        content: { text: response.message },
      };

    case 'edit':
      // Edit action - show as text with info about edits
      const editCount = response.edits?.length || 0;
      return {
        type: 'text',
        content: {
          text: response.message || `I've suggested ${editCount} edit${editCount !== 1 ? 's' : ''} to your steps.`,
        },
        actions: [
          { id: 'review', label: 'Review edits', variant: 'primary', onClick: () => {} },
        ],
      };

    case 'delete':
      // Delete action - show as text with deletion info
      const deleteCount = response.deletions?.length || 0;
      return {
        type: 'text',
        content: {
          text: response.message || `I suggest removing ${deleteCount} step${deleteCount !== 1 ? 's' : ''}.`,
        },
        actions: [
          { id: 'review', label: 'Review', variant: 'primary', onClick: () => {} },
        ],
      };

    case 'none':
    default:
      // Pure conversational response
      return {
        type: 'text',
        content: { text: response.message },
      };
  }
}

/**
 * Convert SuggestedStep[] to Suggestion[] for minibar display
 */
function suggestedStepsToSuggestions(steps: SuggestedStep[]): Suggestion[] {
  return steps.map((step, index) => ({
    id: step.id || `suggestion-${index}`,
    text: step.text,
    substeps: step.substeps?.map((sub, subIndex) => ({
      id: sub.id || `sub-${index}-${subIndex}`,
      text: sub.text,
    })),
  }));
}

/**
 * Determine the pending action type from StructureResponse
 * Used by page.tsx to know how to handle "Accept All"
 */
export function getPendingActionType(response: StructureResponse): 'replace' | 'suggest' | 'edit' | 'delete' | null {
  if (response.action === 'replace') return 'replace';
  if (response.action === 'suggest') return 'suggest';
  if (response.action === 'edit') return 'edit';
  if (response.action === 'delete') return 'delete';
  return null;
}

import { useMutation } from '@tanstack/react-query';
import { ValidationIssueExtended } from '../services/validationService';

interface AISuggestion {
  text: string;
  explanation: string;
  examples: string[];
}

interface UseAISuggestionsResult {
  suggestions: AISuggestion[];
  isLoading: boolean;
  error: Error | null;
  getSuggestions: (params: { content: string; issue: ValidationIssueExtended }) => Promise<void>;
}

export const useAISuggestions = (): UseAISuggestionsResult => {
  const mutation = useMutation({
    mutationFn: async ({ content, issue }: { content: string; issue: ValidationIssueExtended }) => {
      const response = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          issue: {
            type: issue.type,
            message: issue.message,
            severity: issue.severity,
            location: issue.location,
          },
          context: {
            surroundingContent: content.split('\n')
              .slice(
                Math.max(0, (issue.location?.line || 1) - 3),
                (issue.location?.line || 1) + 3
              )
              .join('\n'),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI suggestions');
      }

      return response.json();
    },
  });

  const getSuggestions = async (params: { content: string; issue: ValidationIssueExtended }) => {
    await mutation.mutateAsync(params);
  };

  return {
    suggestions: mutation.data?.suggestions || [],
    isLoading: mutation.isPending,
    error: mutation.error as Error | null,
    getSuggestions,
  };
};

export default useAISuggestions; 
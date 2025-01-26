import { useState, useCallback } from 'react';
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
  getSuggestions: (content: string, issue: ValidationIssueExtended) => Promise<void>;
}

export const useAISuggestions = (): UseAISuggestionsResult => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getSuggestions = useCallback(async (content: string, issue: ValidationIssueExtended) => {
    setIsLoading(true);
    setError(null);

    try {
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

      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      console.error('Error getting AI suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    getSuggestions,
  };
};

export default useAISuggestions; 
import { useQuery } from '@tanstack/react-query';
import ValidationService, { ValidationIssueExtended } from '../services/validationService';
import useDebounce from './useDebounce';

export interface UseBlogValidationProps {
  content: string;
  delay?: number;
  onValidationComplete?: (issues: ValidationIssueExtended[]) => void;
}

export default function useBlogValidation({ 
  content, 
  delay = 1000,
  onValidationComplete 
}: UseBlogValidationProps) {
  const debouncedContent = useDebounce(content, delay);

  const { data: issues = [], isLoading: isValidating } = useQuery({
    queryKey: ['validation', debouncedContent],
    queryFn: async () => {
      if (!debouncedContent) {
        return [];
      }
      const validationIssues = await ValidationService.validateContent(
        debouncedContent, 
        'technical_accuracy'
      );
      onValidationComplete?.(validationIssues);
      return validationIssues;
    },
    enabled: Boolean(debouncedContent),
  });

  return { issues, isValidating };
} 
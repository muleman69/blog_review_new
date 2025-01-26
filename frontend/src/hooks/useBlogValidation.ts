import { useState, useEffect } from 'react';
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
  const [issues, setIssues] = useState<ValidationIssueExtended[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const debouncedContent = useDebounce(content, delay);

  useEffect(() => {
    const validateContent = async () => {
      if (!debouncedContent) {
        setIssues([]);
        return;
      }

      setIsValidating(true);
      try {
        const validationIssues = await ValidationService.validateContent(
          debouncedContent, 
          'technical_accuracy'
        );
        setIssues(validationIssues);
        onValidationComplete?.(validationIssues);
      } catch (error) {
        console.error('Validation failed:', error);
        setIssues([]);
      } finally {
        setIsValidating(false);
      }
    };

    validateContent();
  }, [debouncedContent, onValidationComplete]);

  return { issues, isValidating };
} 
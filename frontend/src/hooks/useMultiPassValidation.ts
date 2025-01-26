import { useState, useCallback, useEffect } from 'react';
import { ValidationIssue } from '../services/blogPostService';
import NotificationService from '../services/notificationService';

interface ValidationPass {
  name: string;
  validate: (content: string) => Promise<ValidationIssue[]>;
  priority: number;
}

interface UseMultiPassValidationProps {
  content: string;
  passes: ValidationPass[];
  delay?: number;
}

interface UseMultiPassValidationResult {
  issues: ValidationIssue[];
  isValidating: boolean;
  progress: number;
  error: Error | null;
}

const useMultiPassValidation = ({
  content,
  passes,
  delay = 1000
}: UseMultiPassValidationProps): UseMultiPassValidationResult => {
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const runValidation = useCallback(async () => {
    setIsValidating(true);
    setError(null);
    setProgress(0);

    try {
      const sortedPasses = [...passes].sort((a, b) => b.priority - a.priority);
      const allIssues: ValidationIssue[] = [];
      
      for (let i = 0; i < sortedPasses.length; i++) {
        const pass = sortedPasses[i];
        try {
          const passIssues = await pass.validate(content);
          allIssues.push(...passIssues.map(issue => ({
            ...issue,
            source: pass.name
          })));
          setProgress((i + 1) / sortedPasses.length * 100);
        } catch (error) {
          NotificationService.error(`Validation failed in ${pass.name} pass`);
          console.error(`Validation error in ${pass.name} pass:`, error);
        }
      }

      setIssues(allIssues);
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Validation failed'));
      NotificationService.error('Validation failed');
    } finally {
      setIsValidating(false);
      setProgress(100);
    }
  }, [content, passes]);

  useEffect(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (content) {
      const id = setTimeout(runValidation, delay);
      setTimeoutId(id);
    } else {
      setIssues([]);
      setProgress(0);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [content, delay, runValidation]);

  return {
    issues,
    isValidating,
    progress,
    error
  };
};

export default useMultiPassValidation; 
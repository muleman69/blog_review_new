import { useState, useEffect } from 'react';
import { ValidationIssue } from '../services/blogPostService';
import BlogPostService from '../services/blogPostService';
import useDebounce from './useDebounce';

interface UseBlogValidationProps {
  postId: string;
  content: string;
  delay?: number;
}

interface UseBlogValidationResult {
  issues: ValidationIssue[];
  isValidating: boolean;
  error: Error | null;
}

function useBlogValidation({
  postId,
  content,
  delay = 1000
}: UseBlogValidationProps): UseBlogValidationResult {
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debouncedContent = useDebounce(content, delay);

  useEffect(() => {
    const validateContent = async () => {
      if (!debouncedContent.trim()) {
        setIssues([]);
        return;
      }

      try {
        setIsValidating(true);
        setError(null);
        const response = await BlogPostService.validate(postId, debouncedContent);
        setIssues(response.issues);
      } catch (err) {
        setError(err as Error);
        setIssues([]);
      } finally {
        setIsValidating(false);
      }
    };

    validateContent();
  }, [debouncedContent, postId]);

  return { issues, isValidating, error };
}

export default useBlogValidation; 
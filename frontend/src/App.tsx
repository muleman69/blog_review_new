import { useCallback, useState } from 'react';
import BlogPostEditor from './components/editor/BlogPostEditor';
import useBlogValidation from './hooks/useBlogValidation';
import { ValidationIssueExtended } from './services/validationService';

const App = () => {
  const [content, setContent] = useState('');
  const { issues, isValidating } = useBlogValidation({
    content,
    onValidationComplete: (validationIssues: ValidationIssueExtended[]) => {
      console.log('Validation complete:', validationIssues);
    }
  });

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
  }, []);

  return (
    <main className="container mx-auto p-4 h-screen">
      <BlogPostEditor
        content={content}
        onChange={handleContentChange}
        issues={issues}
      />
    </main>
  );
};

export default App;

import { useCallback, useState } from 'react';
import BlogPostEditor from './components/editor/BlogPostEditor';
import useBlogValidation from './hooks/useBlogValidation';

const App = () => {
  const [content, setContent] = useState('');
  const { issues } = useBlogValidation({
    content,
    onValidationComplete: (issues) => {
      console.log('Validation complete:', issues);
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

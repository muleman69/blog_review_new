import React, { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import useBlogValidation from '../../hooks/useBlogValidation';

const BlogPostEditor: React.FC = () => {
  const [content, setContent] = useState('');
  const { issues } = useBlogValidation({
    content,
    onValidationComplete: (issues) => {
      console.log('Validation complete:', issues);
    }
  });

  const handleContentChange = useCallback((value: string | undefined) => {
    setContent(value || '');
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold text-gray-900">Blog Post Editor</h1>
          <p className="mt-1 text-sm text-gray-500">
            Write your blog post content here. The content will be automatically validated.
          </p>
        </div>
        <div className="p-4">
          <Editor
            height="600px"
            defaultLanguage="markdown"
            value={content}
            onChange={handleContentChange}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              wordWrap: 'on',
              wrappingIndent: 'indent',
            }}
          />
        </div>
      </div>
      
      {issues && issues.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Validation Issues</h2>
          <ul className="space-y-2">
            {issues.map((issue, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-red-500">
                  ⚠️
                </span>
                <span className="ml-2 text-sm text-gray-700">{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BlogPostEditor;

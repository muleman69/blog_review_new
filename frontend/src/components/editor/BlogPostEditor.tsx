import { useCallback, useEffect, useState } from 'react';
import { Editor, OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { PhotoIcon } from '@heroicons/react/24/outline';
import useMultiPassValidation from '../../hooks/useMultiPassValidation';
import ValidationService, { ValidationIssueExtended, ValidationRule } from '../../services/validationService';
import NotificationService from '../../services/notificationService';
import ImageUploadService from '../../services/imageUploadService';
import { EnhancedValidationPanel } from '../EnhancedValidationPanel';
import ImageUpload from './ImageUpload';
import EditorSidebar from './EditorSidebar';

interface BlogPostEditorProps {
  content?: string;
  initialContent?: string;
  onChange?: (content: string) => void;
  issues?: ValidationIssueExtended[];
}

const BlogPostEditor: React.FC<BlogPostEditorProps> = ({
  content: externalContent,
  initialContent = '',
  onChange,
  issues = [],
}) => {
  const [localContent, setLocalContent] = useState(externalContent || initialContent);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  const [editor, setEditor] = useState<any>(null);
  const [customRules, setCustomRules] = useState<ValidationRule[]>([]);
  const [readabilityScore, setReadabilityScore] = useState<number>(0);
  const [keywordDensity, setKeywordDensity] = useState<Record<string, number>>({});

  const { error } = useMultiPassValidation({
    content: localContent,
    passes: ValidationService.getValidationPasses(),
    delay: 1000
  });

  useEffect(() => {
    if (error) {
      NotificationService.error(error.message);
    }
  }, [error]);

  useEffect(() => {
    if (externalContent !== undefined) {
      setLocalContent(externalContent);
    }
  }, [externalContent]);

  const handleEditorDidMount: OnMount = useCallback((editorInstance) => {
    setEditor(editorInstance);
    // Set editor options
    editorInstance.updateOptions({
      wordWrap: 'on',
      minimap: { enabled: false },
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      snippetSuggestions: 'inline'
    });

    // Add custom completions for code blocks
    monaco.languages.registerCompletionItemProvider('markdown', {
      provideCompletionItems: (model, position) => {
        const wordRange = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: wordRange.startColumn,
          endColumn: wordRange.endColumn
        };

        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });

        if (textUntilPosition.trim() === '```') {
          return {
            suggestions: [
              {
                label: 'javascript',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'javascript\n\n```',
                documentation: 'JavaScript code block',
                range
              },
              {
                label: 'typescript',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'typescript\n\n```',
                documentation: 'TypeScript code block',
                range
              },
              {
                label: 'python',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'python\n\n```',
                documentation: 'Python code block',
                range
              }
            ]
          };
        }
        return { suggestions: [] };
      }
    });
  }, []);

  const handleImageUploadComplete = useCallback((url: string, format: 'markdown' | 'html') => {
    const imageText = format === 'markdown' 
      ? ImageUploadService.getImageMarkdown(url)
      : ImageUploadService.getImageHtml(url);

    if (editor) {
      const position = editor.getPosition();
      const selection = editor.getSelection();
      const range = selection || {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      };
      
      editor.executeEdits('image-insert', [{
        range,
        text: imageText,
        forceMoveMarkers: true
      }]);
    } else {
      setLocalContent(localContent ? `${localContent}\n${imageText}` : imageText);
    }

    setIsImageUploadOpen(false);
  }, [editor, localContent]);

  const handleInsertCode = useCallback((code: string) => {
    if (editor) {
      const position = editor.getPosition();
      const selection = editor.getSelection();
      const range = selection || {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      };
      
      editor.executeEdits('code-insert', [{
        range,
        text: `\`\`\`typescript\n${code}\n\`\`\`\n`,
        forceMoveMarkers: true
      }]);
    }
  }, [editor]);

  const handleAddRule = useCallback((rule: ValidationRule) => {
    setCustomRules(current => [...current, rule]);
    NotificationService.success('Custom rule added successfully');
  }, []);

  const handleUpdateRule = useCallback((index: number, rule: ValidationRule) => {
    setCustomRules(current => {
      const updated = [...current];
      updated[index] = rule;
      return updated;
    });
    NotificationService.success('Custom rule updated successfully');
  }, []);

  const handleDeleteRule = useCallback((index: number) => {
    setCustomRules(current => current.filter((_, i) => i !== index));
    NotificationService.success('Custom rule deleted successfully');
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setLocalContent(value);
      onChange?.(value);
    }
  };

  const handleQuickFix = useCallback((issue: ValidationIssueExtended) => {
    if (issue.quickFix) {
      const lines = localContent.split('\n');
      if (issue.location) {
        const { line, column, length } = issue.location;
        const lineContent = lines[line - 1];
        const newLineContent =
          lineContent.substring(0, column - 1) +
          issue.quickFix.replacement +
          lineContent.substring(column - 1 + length);
        lines[line - 1] = newLineContent;
        const newContent = lines.join('\n');
        setLocalContent(newContent);
        onChange?.(newContent);
        NotificationService.success('Quick fix applied successfully');
      }
    }
  }, [localContent, onChange]);

  const handleIgnore = useCallback(() => {
    NotificationService.info('Issue ignored');
  }, []);

  const handleLearnMore = useCallback(() => {
    NotificationService.info('Documentation coming soon');
  }, []);

  return (
    <div className="relative h-full">
      <div className="absolute top-0 right-0 z-10 p-4 flex space-x-2">
        <button
          onClick={() => setIsImageUploadOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PhotoIcon className="h-5 w-5 mr-2" />
          Upload Image
        </button>
      </div>

      {isImageUploadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg w-1/3">
            <ImageUpload
              onUploadComplete={handleImageUploadComplete}
              onClose={() => setIsImageUploadOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-12rem)]">
        <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={localContent}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              wordWrap: 'on',
              minimap: { enabled: false },
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              scrollBeyondLastLine: false,
              automaticLayout: true
            }}
          />
        </div>

        <div className="w-80">
          <EditorSidebar
            onInsertCode={handleInsertCode}
            onAddRule={handleAddRule}
            onUpdateRule={handleUpdateRule}
            onDeleteRule={handleDeleteRule}
            customRules={customRules}
            readabilityScore={readabilityScore}
            keywordDensity={keywordDensity}
          />
        </div>
      </div>

      <div className="h-80 overflow-y-auto border-t border-gray-200">
        <EnhancedValidationPanel
          issues={issues}
          content={localContent}
          onQuickFix={handleQuickFix}
          onIgnore={handleIgnore}
          onLearnMore={handleLearnMore}
        />
      </div>
    </div>
  );
};

export default BlogPostEditor;

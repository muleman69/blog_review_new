import React, { useCallback, useEffect, useState } from 'react';
import { Editor, OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { PhotoIcon } from '@heroicons/react/24/outline';
import useMultiPassValidation from '../../hooks/useMultiPassValidation';
import ValidationService, { ValidationIssueExtended, ValidationRule } from '../../services/validationService';
import NotificationService from '../../services/notificationService';
import ImageUploadService from '../../services/imageUploadService';
import LoadingSpinner from '../common/LoadingSpinner';
import ProgressIndicator from '../common/ProgressIndicator';
import ImageUpload from './ImageUpload';
import ImageGallery from './ImageGallery';
import EditorSidebar from './EditorSidebar';
import { EnhancedValidationPanel } from '../EnhancedValidationPanel';
import useDebounce from '../../hooks/useDebounce';

interface EditorIssue {
  line: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface BlogPostEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
}

const BlogPostEditor: React.FC<BlogPostEditorProps> = ({
  initialContent = '',
  onChange,
}) => {
  const [content, setContent] = useState(initialContent);
  const [issues, setIssues] = useState<ValidationIssueExtended[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [images, setImages] = useState<Array<{ url: string; filename: string }>>([]);
  const [editor, setEditor] = useState<any>(null);
  const [customRules, setCustomRules] = useState<ValidationRule[]>([]);
  const [progress, setProgress] = useState(0);
  const [readabilityScore, setReadabilityScore] = useState<number>(0);
  const [keywordDensity, setKeywordDensity] = useState<Record<string, number>>({});
  const debouncedContent = useDebounce(content, 1000);

  const {
    error
  } = useMultiPassValidation({
    content,
    passes: ValidationService.getValidationPasses(),
    delay: 1000
  });

  useEffect(() => {
    if (error) {
      NotificationService.error(error.message);
    }
  }, [error]);

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    // Calculate readability score and keyword density whenever content changes
    if (content) {
      calculateReadabilityScore(content);
      calculateKeywordDensity(content);
    }
  }, [content]);

  const loadImages = async () => {
    setIsLoadingImages(true);
    try {
      const imageList = await ImageUploadService.list();
      setImages(imageList);
    } catch (error) {
      NotificationService.error('Failed to load images');
    } finally {
      setIsLoadingImages(false);
    }
  };

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
      setContent(content ? `${content}\n${imageText}` : imageText);
    }

    setIsImageUploadOpen(false);
    loadImages();
  }, [editor, content]);

  const handleDeleteImage = async (filename: string) => {
    try {
      await ImageUploadService.delete(filename);
      NotificationService.success('Image deleted successfully');
      loadImages();
    } catch (error) {
      NotificationService.error('Failed to delete image');
    }
  };

  const handleInsertImage = (url: string) => {
    handleImageUploadComplete(url, 'markdown');
  };

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

  const calculateReadabilityScore = (text: string) => {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]/).length;
    const syllables = text.split(/[aeiouy]{1,2}/).length;
    
    // Flesch-Kincaid Grade Level formula
    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    setReadabilityScore(Math.max(0, Math.min(100, score)));
  };

  const calculateKeywordDensity = (text: string) => {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCount = words.length;
    const density: Record<string, number> = {};

    words.forEach(word => {
      if (word.length > 3) { // Only count words longer than 3 characters
        density[word] = (density[word] || 0) + 1;
      }
    });

    // Convert counts to percentages
    Object.keys(density).forEach(word => {
      density[word] = density[word] / wordCount;
    });

    setKeywordDensity(density);
  };

  const getEditorDecorations = useCallback(() => {
    return issues.map(issue => ({
      range: {
        startLineNumber: issue.location?.line || 1,
        startColumn: issue.location?.column || 1,
        endLineNumber: issue.location?.line || 1,
        endColumn: (issue.location?.column || 1) + (issue.location?.length || 1)
      },
      options: {
        isWholeLine: !issue.location,
        className: `validation-${issue.severity === 'high' ? 'error' : 
                    issue.severity === 'medium' ? 'warning' : 'info'}`,
        glyphMarginClassName: `glyph-margin-${issue.severity === 'high' ? 'error' : 
                              issue.severity === 'medium' ? 'warning' : 'info'}`,
        hoverMessage: { value: `${issue.message}${issue.suggestion ? `\nSuggestion: ${issue.suggestion}` : ''}` }
      }
    }));
  }, [issues]);

  const validateContent = useCallback(async (text: string) => {
    setIsValidating(true);
    try {
      const technicalIssues = await ValidationService.validateTechnical(text);
      const structureIssues = await ValidationService.validateStructure(text);
      const standardsIssues = await ValidationService.validateIndustryStandards(text);
      const readabilityIssues = await ValidationService.validateReadability(text);
      const customIssues = await ValidationService.validateCustom(text);

      const allIssues = [
        ...technicalIssues,
        ...structureIssues,
        ...standardsIssues,
        ...readabilityIssues,
        ...customIssues,
      ].sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

      setIssues(allIssues);
      setProgress(Math.round((allIssues.length / (allIssues.length + customIssues.length)) * 100));
    } catch (error) {
      console.error('Error validating content:', error);
      NotificationService.error('Failed to validate content');
    } finally {
      setIsValidating(false);
    }
  }, []);

  useEffect(() => {
    validateContent(debouncedContent);
  }, [debouncedContent, validateContent]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
      onChange?.(value);
    }
  };

  const handleQuickFix = useCallback((issue: ValidationIssueExtended) => {
    if (issue.quickFix) {
      const lines = content.split('\n');
      if (issue.location) {
        const { line, column, length } = issue.location;
        const lineContent = lines[line - 1];
        const newLineContent =
          lineContent.substring(0, column - 1) +
          issue.quickFix.replacement +
          lineContent.substring(column - 1 + length);
        lines[line - 1] = newLineContent;
        const newContent = lines.join('\n');
        setContent(newContent);
        onChange?.(newContent);
        NotificationService.success('Quick fix applied successfully');
      }
    }
  }, [content, onChange]);

  const handleIgnore = useCallback((issue: ValidationIssueExtended) => {
    setIssues(currentIssues => currentIssues.filter(i => i !== issue));
    NotificationService.info('Issue ignored');
  }, []);

  const handleLearnMore = useCallback((issue: ValidationIssueExtended) => {
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
      
      <div className="mb-4">
        <ProgressIndicator
          total={100}
          resolved={progress}
          isLoading={isValidating}
        />
      </div>

      <div className="flex h-[calc(100vh-12rem)]">
        <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={content}
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
          content={content}
          isLoading={isValidating}
          onQuickFix={handleQuickFix}
          onIgnore={handleIgnore}
          onLearnMore={handleLearnMore}
        />
      </div>
    </div>
  );
};

export default BlogPostEditor;

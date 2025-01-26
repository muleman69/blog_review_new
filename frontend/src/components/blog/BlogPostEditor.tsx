import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Editor, Monaco } from '@monaco-editor/react';
import * as monacoEditor from 'monaco-editor';
import ValidationService from '../../services/validationService';
import { ValidationIssue } from '../../services/blogPostService';
import { EnhancedValidationPanel } from '../EnhancedValidationPanel';
import { EditorToolbar } from '../editor/EditorToolbar';
import { EditorLoadingState } from '../common/EditorLoadingState';
import { DocumentationModal } from '../documentation/DocumentationModal';
import useDebounce from '../../hooks/useDebounce';
import PerformanceService from '../../services/performanceService';
import { Dialog } from '@headlessui/react';

interface ValidationIssueExtended extends ValidationIssue {
  quickFix?: {
    label: string;
    replacement: string;
  };
}

interface BlogPostEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
}

interface ErrorState {
  message: string;
  type: 'network' | 'validation' | 'ai' | 'offline';
  action?: string;
}

export const BlogPostEditor: React.FC<BlogPostEditorProps> = ({
  initialContent = '',
  onChange,
}) => {
  const [content, setContent] = useState(initialContent);
  const [issues, setIssues] = useState<ValidationIssueExtended[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<ValidationIssueExtended | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [offlineChanges, setOfflineChanges] = useState<string[]>([]);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const debouncedContent = useDebounce(content, 500);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
      // Sync offline changes when back online
      if (offlineChanges.length > 0) {
        setError({
          type: 'network',
          message: 'Syncing offline changes...',
          action: 'Please wait while we sync your changes.'
        });
        // TODO: Implement sync logic
        setOfflineChanges([]);
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setError({
        type: 'offline',
        message: 'You are currently offline',
        action: 'Changes will be saved locally and synced when you\'re back online.'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineChanges]);

  useEffect(() => {
    // Preload common validations when component mounts
    ValidationService.preloadCommonValidations(initialContent);
  }, [initialContent]);

  useEffect(() => {
    const validateContent = async () => {
      if (!debouncedContent) return;

      setIsValidating(true);
      setError(null);
      const startTime = performance.now();

      try {
        if (!isOnline) {
          // Store changes for later sync
          setOfflineChanges(prev => [...prev, debouncedContent]);
          return;
        }

        const results = await Promise.all([
          ValidationService.validateContent(debouncedContent, 'technical_accuracy'),
          ValidationService.validateContent(debouncedContent, 'code_quality'),
          ValidationService.validateContent(debouncedContent, 'content_structure'),
          ValidationService.validateContent(debouncedContent, 'readability'),
        ]);

        const allIssues = results.flat() as ValidationIssueExtended[];
        setIssues(allIssues);
        setRetryCount(0);

        const duration = performance.now() - startTime;
        PerformanceService.trackMetric('validation_total', duration);
      } catch (error) {
        console.error('Validation error:', error);
        
        let errorState: ErrorState;
        if (!isOnline) {
          errorState = {
            type: 'offline',
            message: 'Unable to validate content while offline',
            action: 'Changes will be validated when you\'re back online.'
          };
        } else if (error instanceof TypeError && error.message.includes('NetworkError')) {
          errorState = {
            type: 'network',
            message: 'Network error occurred while validating',
            action: 'Check your internet connection and try again.'
          };
        } else if (error instanceof Error && error.message.includes('AI')) {
          errorState = {
            type: 'ai',
            message: 'AI service is temporarily unavailable',
            action: 'Basic validation will continue to work. Please try AI features again later.'
          };
        } else {
          errorState = {
            type: 'validation',
            message: 'Failed to validate content',
            action: 'Please try again or contact support if the issue persists.'
          };
        }
        
        setError(errorState);

        if (isOnline && retryCount < 3) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => void validateContent(), 1000 * Math.pow(2, retryCount));
        }
      } finally {
        setIsValidating(false);
      }
    };

    void validateContent();
  }, [debouncedContent, isOnline, retryCount]);

  const handleEditorDidMount = useCallback((editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);
    
    // Configure editor performance options
    editor.updateOptions({
      renderWhitespace: 'none',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      folding: true,
      wordWrap: 'on',
      // Increase viewport height for better virtualization
      scrollbar: {
        verticalScrollbarSize: 10,
        verticalSliderSize: 10,
        useShadows: false,
      },
    });

    // Add keyboard shortcuts for formatting
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => handleFormat('bold'));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => handleFormat('italic'));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Digit8, () => handleFormat('bullet-list'));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Digit7, () => handleFormat('numbered-list'));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK, () => handleFormat('code'));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => handleFormat('link'));

    // Add keyboard shortcuts for common actions
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
      return null;
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
      editor.trigger('keyboard', 'undo', null);
      return null;
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => {
      editor.trigger('keyboard', 'redo', null);
      return null;
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      editor.trigger('keyboard', 'actions.find', null);
      return null;
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
      editor.trigger('keyboard', 'editor.action.startFindReplaceAction', null);
      return null;
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => {
      setShowKeyboardShortcuts(true);
      return null;
    });

    // Register custom actions
    editor.addAction({
      id: 'show-keyboard-shortcuts',
      label: 'Show Keyboard Shortcuts',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP],
      run: () => setShowKeyboardShortcuts(true),
    });
  }, []);

  const handleEditorChange = useCallback((value: string | undefined) => {
    const newContent = value || '';
    setContent(newContent);
    onChange?.(newContent);
  }, [onChange]);

  const handleFormat = useCallback((type: string) => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const selection = editor.getSelection();
    if (!selection) return;

    const selectedText = editor.getModel()?.getValueInRange(selection) || '';

    let formattedText = selectedText;
    switch (type) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'bullet-list':
        formattedText = selectedText.split('\n').map(line => `- ${line}`).join('\n');
        break;
      case 'numbered-list':
        formattedText = selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
        break;
      case 'code':
        formattedText = `\`\`\`\n${selectedText}\n\`\`\``;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
    }

    editor.executeEdits('format', [{
      range: selection,
      text: formattedText,
    }]);
  }, []);

  const handleQuickFix = useCallback((issue: ValidationIssueExtended) => {
    if (!editorRef.current || !issue.quickFix) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    const { line, column } = issue.location || { line: 1, column: 1 };

    editor.executeEdits('quick-fix', [{
      range: {
        startLineNumber: line,
        startColumn: column,
        endLineNumber: line,
        endColumn: column + (issue.quickFix.replacement.length || 0),
      },
      text: issue.quickFix.replacement,
    }]);
  }, []);

  const handleIgnoreIssue = useCallback((issue: ValidationIssueExtended) => {
    setIssues(prevIssues => prevIssues.filter(i => i !== issue));
  }, []);

  const handleLearnMore = useCallback((issue: ValidationIssueExtended) => {
    if (!isOnline) {
      setError({
        type: 'offline',
        message: 'Documentation is not available offline',
        action: 'Please check your internet connection and try again.'
      });
      return;
    }
    setSelectedIssue(issue);
    setIsDocModalOpen(true);
  }, [isOnline]);

  const handleCloseDocModal = useCallback(() => {
    setIsDocModalOpen(false);
    setSelectedIssue(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!isOnline) {
      setError({
        type: 'offline',
        message: 'Cannot save while offline',
        action: 'Changes will be saved automatically when you\'re back online.'
      });
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Implement save logic
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulated save
      setIsSaving(false);
    } catch (error) {
      setError({
        type: 'network',
        message: 'Failed to save changes',
        action: 'Please try again or check your internet connection.'
      });
      setIsSaving(false);
    }
  }, [isOnline]);

  const KeyboardShortcutsModal = () => (
    <Dialog
      open={showKeyboardShortcuts}
      onClose={() => setShowKeyboardShortcuts(false)}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="min-h-screen px-4 text-center">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <Dialog.Title className="text-lg font-medium text-gray-900">
            Keyboard Shortcuts
          </Dialog.Title>
          <div className="mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Formatting</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Bold</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+B</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Italic</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+I</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Bullet List</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+Shift+8</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Numbered List</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+Shift+7</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Code Block</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+Shift+K</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Link</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+K</kbd>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Common Actions</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Save</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+S</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Undo</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+Z</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Redo</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+Shift+Z</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Find</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+F</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Replace</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+H</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Show Shortcuts</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+Shift+P</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setShowKeyboardShortcuts(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );

  if (!isEditorReady) {
    return <EditorLoadingState />;
  }

  return (
    <div className="h-full flex flex-col">
      <EditorToolbar
        onFormat={handleFormat}
        isOnline={isOnline}
        isSaving={isSaving}
        hasOfflineChanges={offlineChanges.length > 0}
      />
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="markdown"
          defaultValue={initialContent}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            lineHeight: 1.6,
            padding: { top: 16, bottom: 16 },
            suggest: {
              showWords: false,
            },
          }}
        />
      </div>
      {error && (
        <div className={`p-4 ${error.type === 'offline' ? 'bg-yellow-50 border-yellow-500' : 'bg-red-50 border-red-500'} border-l-4`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className={`h-5 w-5 ${error.type === 'offline' ? 'text-yellow-400' : 'text-red-400'}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm ${error.type === 'offline' ? 'text-yellow-700' : 'text-red-700'}`}>{error.message}</p>
              {error.action && (
                <p className="mt-1 text-sm text-gray-600">{error.action}</p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="h-64 overflow-y-auto border-t border-gray-200">
        <EnhancedValidationPanel
          issues={issues}
          content={content}
          isLoading={isValidating}
          onQuickFix={handleQuickFix}
          onIgnore={handleIgnoreIssue}
          onLearnMore={handleLearnMore}
        />
      </div>
      {selectedIssue && (
        <DocumentationModal
          isOpen={isDocModalOpen}
          onClose={handleCloseDocModal}
          issue={selectedIssue}
        />
      )}
      {showKeyboardShortcuts && <KeyboardShortcutsModal />}
    </div>
  );
}; 
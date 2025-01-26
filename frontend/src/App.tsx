import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navigation from './components/common/Navigation';
import ErrorBoundary from './components/common/ErrorBoundary';
import BlogPostEditor from './components/editor/BlogPostEditor';
import ValidationPanel from './components/validation/ValidationPanel';
import ValidationRuleManager from './components/validation/ValidationRuleManager';
import ValidationService, { ValidationRule, ValidationIssueExtended } from './services/validationService';
import NotificationService from './services/notificationService';
import ProgressIndicator from './components/common/ProgressIndicator';
import useBlogValidation from './hooks/useBlogValidation';
import BlogPostService, { ValidationIssue } from './services/blogPostService';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [resolvedIssues, setResolvedIssues] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [customRules, setCustomRules] = useState<ValidationRule[]>([]);

  // Assuming we're working with a specific blog post
  const postId = 'current-post-id'; // This should come from your routing or state management

  const { issues, isValidating, error } = useBlogValidation({
    postId,
    content,
    delay: 1000
  });

  const handleContentChange = useCallback((value: string | undefined) => {
    setContent(value || '');
  }, []);

  const handleAcceptIssue = useCallback((issue: ValidationIssueExtended) => {
    const index = issues.indexOf(issue);
    setResolvedIssues(prev => new Set([...prev, index]));
  }, [issues]);

  const handleRejectIssue = useCallback((issue: ValidationIssueExtended) => {
    const index = issues.indexOf(issue);
    setResolvedIssues(prev => new Set([...prev, index]));
  }, [issues]);

  const handleIgnoreIssue = useCallback((issue: ValidationIssueExtended) => {
    const index = issues.indexOf(issue);
    setResolvedIssues(prev => new Set([...prev, index]));
  }, [issues]);

  const handleExport = useCallback(async (format: 'markdown' | 'html' | 'pdf') => {
    try {
      setIsExporting(true);
      let data: string | Blob;
      let filename: string;
      let type: string;

      switch (format) {
        case 'markdown':
          data = await BlogPostService.exportMarkdown(postId);
          filename = 'blog-post.md';
          type = 'text/markdown';
          break;
        case 'html':
          data = await BlogPostService.exportHtml(postId);
          filename = 'blog-post.html';
          type = 'text/html';
          break;
        case 'pdf':
          data = await BlogPostService.exportPdf(postId);
          filename = 'blog-post.pdf';
          type = 'application/pdf';
          break;
        default:
          throw new Error('Unsupported format');
      }

      const blob = data instanceof Blob ? data : new Blob([data], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      // Handle error (show notification, etc.)
    } finally {
      setIsExporting(false);
    }
  }, [postId]);

  const handleAddRule = useCallback((rule: ValidationRule) => {
    setCustomRules(prev => {
      const newRules = [...prev, rule];
      ValidationService.setCustomRules(newRules);
      return newRules;
    });
    NotificationService.success('Custom rule added successfully');
  }, []);

  const handleUpdateRule = useCallback((index: number, rule: ValidationRule) => {
    setCustomRules(prev => {
      const newRules = [...prev];
      newRules[index] = rule;
      ValidationService.setCustomRules(newRules);
      return newRules;
    });
    NotificationService.success('Custom rule updated successfully');
  }, []);

  const handleDeleteRule = useCallback((index: number) => {
    setCustomRules(prev => {
      const newRules = prev.filter((_, i) => i !== index);
      ValidationService.setCustomRules(newRules);
      return newRules;
    });
    NotificationService.success('Custom rule deleted successfully');
  }, []);

  const unresolvedIssues = issues.filter((_, index) => !resolvedIssues.has(index));

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navigation />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            
            {/* Protected routes */}
            <Route
              path="/editor"
              element={
                <ProtectedRoute requiredRole="writer">
                  <ErrorBoundary>
                    <div className="container mx-auto px-4 py-8">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                          <BlogPostEditor
                            content={content}
                            onChange={handleContentChange}
                            issues={unresolvedIssues.map(issue => ({
                              line: issue.location?.line || 1,
                              message: issue.message,
                              severity: issue.severity === 'high' ? 'error' :
                                      issue.severity === 'medium' ? 'warning' : 'info'
                            }))}
                          />
                        </div>
                        <div>
                          <ValidationPanel
                            issues={unresolvedIssues}
                            onAccept={handleAcceptIssue}
                            onReject={handleRejectIssue}
                            onIgnore={handleIgnoreIssue}
                            isLoading={isValidating}
                          />
                        </div>
                      </div>
                    </div>
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route
              path="/validation-rules"
              element={
                <ProtectedRoute requiredRole="editor">
                  <ErrorBoundary>
                    <div className="container mx-auto px-4 py-8">
                      <ValidationRuleManager
                        rules={customRules}
                        onAddRule={handleAddRule}
                        onUpdateRule={handleUpdateRule}
                        onDeleteRule={handleDeleteRule}
                      />
                    </div>
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            {/* Unauthorized access page */}
            <Route
              path="/unauthorized"
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                  <div className="max-w-md w-full space-y-8">
                    <div>
                      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Unauthorized Access
                      </h2>
                      <p className="mt-2 text-center text-sm text-gray-600">
                        You don't have permission to access this page.
                      </p>
                    </div>
                  </div>
                </div>
              }
            />

            {/* Redirect root to editor */}
            <Route path="/" element={<Navigate to="/editor" replace />} />
          </Routes>

          {/* Toast notifications container */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;

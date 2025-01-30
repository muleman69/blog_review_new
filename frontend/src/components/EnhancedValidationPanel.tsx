import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ValidationIssueExtended } from '../services/validationService';
import { ChevronDownIcon, ChevronUpIcon, LightBulbIcon, XMarkIcon, CheckIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import useAISuggestions from '../hooks/useAISuggestions';
import LoadingSpinner from './common/LoadingSpinner';
import PerformanceService from '../services/performanceService';

const DocumentationModal = lazy(() => 
  PerformanceService.measureAsync(
    'documentation_modal_load',
    () => import('./DocumentationModal')
  )
);

interface EnhancedValidationPanelProps {
  issues: ValidationIssueExtended[];
  content: string;
  isLoading?: boolean;
  onQuickFix: (issue: ValidationIssueExtended) => void;
  onIgnore: (issue: ValidationIssueExtended) => void;
  onLearnMore: (issue: ValidationIssueExtended) => void;
}

export const EnhancedValidationPanel: React.FC<EnhancedValidationPanelProps> = ({
  issues,
  content,
  isLoading,
  onQuickFix,
  onIgnore,
  onLearnMore,
}) => {
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());
  const [selectedIssue, setSelectedIssue] = useState<ValidationIssueExtended | null>(null);
  const { suggestions, isLoading: isLoadingAI, error: aiError, getSuggestions } = useAISuggestions();
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedDocIssue, setSelectedDocIssue] = useState<ValidationIssueExtended | null>(null);

  useEffect(() => {
    if (selectedIssue) {
      getSuggestions({ content, issue: selectedIssue });
    }
  }, [selectedIssue, content, getSuggestions]);

  useEffect(() => {
    // Preload DocumentationModal when there are issues
    if (issues.length > 0) {
      const preloadModal = () => {
        const startTime = performance.now();
        void import('./DocumentationModal').then(() => {
          const duration = performance.now() - startTime;
          PerformanceService.trackMetric('documentation_modal_preload', duration);
        });
      };

      // Delay preloading to prioritize main content rendering
      const timeoutId = setTimeout(preloadModal, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [issues.length]);

  const toggleIssue = (index: number, issue: ValidationIssueExtended) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
      setSelectedIssue(null);
    } else {
      newExpanded.add(index);
      setSelectedIssue(issue);
    }
    setExpandedIssues(newExpanded);
  };

  const handleLearnMore = (issue: ValidationIssueExtended) => {
    setSelectedDocIssue(issue);
    setIsDocModalOpen(true);
    onLearnMore(issue);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        {issues.map((issue, index) => (
          <div key={index} className="p-4 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-grow">
                <button
                  onClick={() => toggleIssue(index, issue)}
                  className="mt-1 text-gray-500 hover:text-gray-700"
                >
                  {expandedIssues.has(index) ? (
                    <ChevronUpIcon className="h-5 w-5" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5" />
                  )}
                </button>
                <div className="flex-grow">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                      {issue.severity.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {getTypeLabel(issue.type)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{issue.message}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {issue.quickFix && (
                  <button
                    onClick={() => onQuickFix(issue)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <LightBulbIcon className="h-4 w-4 mr-1" />
                    Quick Fix
                  </button>
                )}
                <button
                  onClick={() => handleLearnMore(issue)}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <InformationCircleIcon className="h-4 w-4 mr-1" />
                  Learn More
                </button>
                <button
                  onClick={() => onIgnore(issue)}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {expandedIssues.has(index) && (
              <div className="mt-4 pl-8">
                {issue.suggestion && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-900">Suggestion</h4>
                    <p className="mt-1 text-sm text-gray-600">{issue.suggestion}</p>
                  </div>
                )}
                {selectedIssue === issue && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-900">AI Suggestions</h4>
                    {isLoadingAI ? (
                      <div className="flex items-center justify-center py-4">
                        <LoadingSpinner className="h-6 w-6 text-blue-500" />
                        <span className="ml-2 text-sm text-gray-500">Getting AI suggestions...</span>
                      </div>
                    ) : aiError ? (
                      <p className="mt-1 text-sm text-red-600">Failed to load AI suggestions</p>
                    ) : suggestions.length > 0 ? (
                      <ul className="mt-1 space-y-2">
                        {suggestions.map((suggestion, i) => (
                          <li key={i} className="text-sm">
                            <div className="flex items-start">
                              <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                              <div>
                                <p className="text-gray-900">{suggestion.text}</p>
                                {suggestion.explanation && (
                                  <p className="mt-1 text-gray-600">{suggestion.explanation}</p>
                                )}
                                {suggestion.examples.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-gray-700">Examples:</p>
                                    <ul className="mt-1 list-disc pl-5 space-y-1">
                                      {suggestion.examples.map((example, j) => (
                                        <li key={j} className="text-xs text-gray-600">{example}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500">No AI suggestions available</p>
                    )}
                  </div>
                )}
                {issue.location && (
                  <div className="text-sm text-gray-500">
                    Line {issue.location.line}, Column {issue.location.column}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {issues.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No issues found. Your content looks great!
          </div>
        )}
      </div>

      {selectedDocIssue && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white p-6 rounded-lg shadow-xl">
                <LoadingSpinner className="h-8 w-8 text-blue-500" />
                <p className="mt-2 text-sm text-gray-500">Loading documentation...</p>
              </div>
            </div>
          }
        >
          <DocumentationModal
            isOpen={isDocModalOpen}
            onClose={() => setIsDocModalOpen(false)}
            issue={selectedDocIssue}
          />
        </Suspense>
      )}
    </>
  );
}; 
import React, { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, BookOpenIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ValidationIssueExtended } from '../../services/validationService';
import DocumentationService from '../../services/documentationService';
import LoadingSpinner from '../common/LoadingSpinner';
import PerformanceService from '../../services/performanceService';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: ValidationIssueExtended;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({
  isOpen,
  onClose,
  issue,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentation, setDocumentation] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const loadDocumentation = async () => {
      if (!isOpen || !issue) return;

      setIsLoading(true);
      setError(null);
      const startTime = performance.now();

      try {
        const doc = await DocumentationService.getDocumentation(issue.type);
        setDocumentation(doc);
        setRetryCount(0);

        const duration = performance.now() - startTime;
        PerformanceService.trackMetric('documentation_load', duration);
      } catch (error) {
        console.error('Error loading documentation:', error);
        setError('Failed to load documentation. Please try again.');

        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => void loadDocumentation(), 1000 * Math.pow(2, retryCount));
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadDocumentation();
  }, [isOpen, issue, retryCount]);

  return (
    <Dialog
      as="div"
      className="fixed inset-0 z-50 overflow-y-auto"
      onClose={onClose}
      open={isOpen}
    >
      <div className="min-h-screen px-4 text-center">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="inline-block w-full max-w-3xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex justify-between items-start">
            <Dialog.Title
              as="h3"
              className="text-lg font-medium leading-6 text-gray-900 flex items-center"
            >
              <BookOpenIcon className="h-6 w-6 mr-2 text-blue-500" />
              {documentation?.title || 'Documentation'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <LoadingSpinner className="h-8 w-8 text-blue-500" />
                <span className="ml-2 text-gray-500">Loading documentation...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-48 text-red-500">
                <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
                <span>{error}</span>
                {retryCount < 3 && (
                  <button
                    onClick={() => setRetryCount(prev => prev + 1)}
                    className="ml-2 text-blue-500 hover:text-blue-600"
                  >
                    Retry
                  </button>
                )}
              </div>
            ) : documentation ? (
              <div className="space-y-4">
                <p className="text-gray-600">{documentation.description}</p>

                {documentation.examples?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Examples</h4>
                    <div className="space-y-4">
                      {documentation.examples.map((example: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="space-y-2">
                            <div className="flex items-center text-sm">
                              <span className="text-green-500 font-medium">✓ Good</span>
                              <pre className="ml-2 text-gray-700">{example.good}</pre>
                            </div>
                            <div className="flex items-center text-sm">
                              <span className="text-red-500 font-medium">✗ Bad</span>
                              <pre className="ml-2 text-gray-700">{example.bad}</pre>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{example.explanation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {documentation.bestPractices?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Best Practices</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {documentation.bestPractices.map((practice: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600">{practice}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {documentation.resources?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Resources</h4>
                    <div className="space-y-2">
                      {documentation.resources.map((resource: any, index: number) => (
                        <a
                          key={index}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          <BookOpenIcon className="h-4 w-4 mr-1" />
                          {resource.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-500">
                No documentation available for this issue type.
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}; 
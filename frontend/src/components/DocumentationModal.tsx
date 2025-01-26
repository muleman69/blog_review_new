import React, { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, BookOpenIcon, LinkIcon } from '@heroicons/react/24/outline';
import { ValidationIssueExtended } from '../services/validationService';
import DocumentationService from '../services/documentationService';
import LoadingSpinner from './common/LoadingSpinner';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: ValidationIssueExtended;
}

const DocumentationModal: React.FC<DocumentationModalProps> = ({
  isOpen,
  onClose,
  issue,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [documentation, setDocumentation] = useState<any>(null);
  const [relatedConcepts, setRelatedConcepts] = useState<any[]>([]);

  useEffect(() => {
    const loadDocumentation = async () => {
      setIsLoading(true);
      try {
        const doc = await DocumentationService.getDocumentation(issue.type);
        setDocumentation(doc);

        // Load related concepts if available
        if (doc?.relatedConcepts) {
          const concepts = await Promise.all(
            doc.relatedConcepts.map(concept => 
              DocumentationService.getTechnicalConcept(concept)
            )
          );
          setRelatedConcepts(concepts.filter(Boolean));
        }
      } catch (error) {
        console.error('Error loading documentation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && issue) {
      loadDocumentation();
    }
  }, [isOpen, issue]);

  if (!isOpen) return null;

  return (
    <Dialog
      as="div"
      className="fixed inset-0 z-50 overflow-y-auto"
      onClose={onClose}
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

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <LoadingSpinner className="h-8 w-8 text-blue-500" />
            </div>
          ) : documentation ? (
            <div className="mt-4">
              <p className="text-sm text-gray-500">{documentation.description}</p>

              {documentation.examples?.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900">Examples</h4>
                  <div className="mt-2 space-y-4">
                    {documentation.examples.map((example: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-green-700">Good Example:</span>
                            <pre className="mt-1 text-sm text-gray-800 bg-white p-2 rounded">
                              {example.good}
                            </pre>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-red-700">Bad Example:</span>
                            <pre className="mt-1 text-sm text-gray-800 bg-white p-2 rounded">
                              {example.bad}
                            </pre>
                          </div>
                          <p className="text-sm text-gray-600">{example.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {documentation.bestPractices?.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900">Best Practices</h4>
                  <ul className="mt-2 list-disc pl-5 space-y-1">
                    {documentation.bestPractices.map((practice: string, index: number) => (
                      <li key={index} className="text-sm text-gray-600">{practice}</li>
                    ))}
                  </ul>
                </div>
              )}

              {documentation.commonMistakes?.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900">Common Mistakes</h4>
                  <ul className="mt-2 list-disc pl-5 space-y-1">
                    {documentation.commonMistakes.map((mistake: string, index: number) => (
                      <li key={index} className="text-sm text-gray-600">{mistake}</li>
                    ))}
                  </ul>
                </div>
              )}

              {documentation.resources?.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900">Additional Resources</h4>
                  <div className="mt-2 space-y-2">
                    {documentation.resources.map((resource: any, index: number) => (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <LinkIcon className="h-4 w-4 mr-1" />
                        {resource.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {relatedConcepts.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900">Related Concepts</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {relatedConcepts.map((concept, index) => (
                      <button
                        key={index}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {concept.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 text-center text-sm text-gray-500">
              No documentation available for this issue type.
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default DocumentationModal; 
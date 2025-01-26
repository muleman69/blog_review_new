import React from 'react';
import { ValidationIssueExtended } from '../../services/validationService';
import LoadingSpinner from '../common/LoadingSpinner';

interface ValidationPanelProps {
  issues: ValidationIssueExtended[];
  onAccept: (issue: ValidationIssueExtended) => void;
  onReject: (issue: ValidationIssueExtended) => void;
  onIgnore: (issue: ValidationIssueExtended) => void;
  isLoading?: boolean;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({
  issues,
  onAccept,
  onReject,
  onIgnore,
  isLoading = false
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Validation Issues</h2>
        {isLoading && <LoadingSpinner size="small" />}
      </div>

      {issues.length === 0 ? (
        <p className="text-sm text-gray-500">No validation issues found.</p>
      ) : (
        <div className="space-y-4">
          {issues.map((issue, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                issue.severity === 'high'
                  ? 'bg-red-50'
                  : issue.severity === 'medium'
                  ? 'bg-yellow-50'
                  : 'bg-blue-50'
              }`}
            >
              <div className="flex justify-between">
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    issue.severity === 'high'
                      ? 'text-red-800'
                      : issue.severity === 'medium'
                      ? 'text-yellow-800'
                      : 'text-blue-800'
                  }`}>
                    {issue.message}
                  </p>
                  {issue.suggestion && (
                    <p className="mt-1 text-sm text-gray-600">
                      Suggestion: {issue.suggestion}
                    </p>
                  )}
                  {issue.location && (
                    <p className="mt-1 text-sm text-gray-500">
                      Line {issue.location.line}, Column {issue.location.column}
                    </p>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0 flex space-x-2">
                  <button
                    onClick={() => onAccept(issue)}
                    className="text-green-600 hover:text-green-800"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onReject(issue)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => onIgnore(issue)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ValidationPanel; 
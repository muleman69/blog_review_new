import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ProgressIndicatorProps {
  total: number;
  resolved: number;
  isLoading?: boolean;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  total,
  resolved,
  isLoading = false,
  className = ''
}) => {
  const percentage = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium text-gray-700">
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="small" />
              <span>Validating content...</span>
            </div>
          ) : (
            <span>
              {resolved} of {total} issues resolved
            </span>
          )}
        </div>
        <span className="text-sm font-medium text-gray-700">{percentage}%</span>
      </div>
      <div className="relative">
        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
          <div
            style={{ width: `${percentage}%` }}
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
              percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
            } transition-all duration-500`}
          />
        </div>
        {isLoading && (
          <div className="absolute inset-0">
            <div className="h-2 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressIndicator; 
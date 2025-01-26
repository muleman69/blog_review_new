import React from 'react';

export const EditorLoadingState: React.FC = () => {
  return (
    <div className="h-full flex flex-col animate-pulse">
      <div className="h-10 bg-gray-200 mb-4"></div>
      <div className="flex-1 space-y-4 py-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="h-64 bg-gray-100">
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );
}; 
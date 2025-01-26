import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

interface ImageGalleryProps {
  images: Array<{ url: string; filename: string }>;
  onDelete: (filename: string) => void;
  onInsert: (url: string) => void;
  isLoading?: boolean;
  className?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  onDelete,
  onInsert,
  isLoading = false,
  className = ''
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No images uploaded yet
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {images.map(({ url, filename }) => (
        <div
          key={filename}
          className="group relative rounded-lg overflow-hidden bg-gray-100"
        >
          <img
            src={url}
            alt={filename}
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex space-x-2">
              <button
                onClick={() => onInsert(url)}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                title="Insert image"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(filename)}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Delete image"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
            {filename}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageGallery; 
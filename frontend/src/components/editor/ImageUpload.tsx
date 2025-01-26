import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';
import NotificationService from '../../services/notificationService';
import ImageUploadService from '../../services/imageUploadService';

interface ImageUploadProps {
  onUploadComplete: (url: string, format: 'markdown' | 'html') => void;
  onClose?: () => void;
  format?: 'markdown' | 'html';
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadComplete,
  onClose,
  format = 'markdown',
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const error = ImageUploadService.validateFile(file);
    if (error) {
      NotificationService.error(error);
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    setIsUploading(true);
    try {
      const response = await ImageUploadService.upload(file);
      onUploadComplete(response.url, format);
      NotificationService.success('Image uploaded successfully');
      if (onClose) {
        onClose();
      }
    } catch (error) {
      NotificationService.error(error instanceof Error ? error.message : 'Upload failed');
      setPreview(null);
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(previewUrl);
    }
  }, [onUploadComplete, format, onClose]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const handleCancel = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Upload Image</h3>
          {onClose && (
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          )}
        </div>

        {preview ? (
          <div className="relative rounded-lg overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <LoadingSpinner size="large" className="text-white" />
              </div>
            )}
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-center">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4 flex text-sm text-gray-600">
                <p className="pl-1">
                  {isDragActive
                    ? 'Drop the image here'
                    : 'Drag and drop an image, or click to select'}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 5MB</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isUploading}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          {preview && !isUploading && (
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload; 
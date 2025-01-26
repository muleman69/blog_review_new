import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import LoadingSpinner from './LoadingSpinner';
import NotificationService from '../../services/notificationService';
import ImageUploadService from '../../services/imageUploadService';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUploadComplete, className = '' }) => {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const error = ImageUploadService.validateFile(file);
    if (error) {
      NotificationService.error(error);
      return;
    }

    setIsUploading(true);
    try {
      const response = await ImageUploadService.upload(file);
      onUploadComplete(response.url);
      NotificationService.success('Image uploaded successfully');
    } catch (error) {
      NotificationService.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      } ${className}`}
    >
      <input {...getInputProps()} />
      <div className="text-center">
        {isUploading ? (
          <div className="space-y-2">
            <LoadingSpinner size="small" />
            <p className="text-sm text-gray-500">Uploading image...</p>
          </div>
        ) : (
          <>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-4 flex text-sm text-gray-600">
              <p className="pl-1">
                {isDragActive
                  ? 'Drop the image here'
                  : 'Drag and drop an image, or click to select'}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 5MB</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageUpload; 
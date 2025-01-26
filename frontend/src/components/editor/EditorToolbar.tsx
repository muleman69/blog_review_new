import React from 'react';
import {
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  QueueListIcon,
  CodeBracketIcon,
  LinkIcon,
  CloudIcon,
  CloudArrowDownIcon,
} from '@heroicons/react/24/outline';

export interface EditorToolbarProps {
  onFormat: (type: string) => void;
  isOnline: boolean;
  isSaving: boolean;
  hasOfflineChanges: boolean;
}

const formatOptions = [
  { id: 'bold', icon: BoldIcon, label: 'Bold', shortcut: 'Ctrl+B' },
  { id: 'italic', icon: ItalicIcon, label: 'Italic', shortcut: 'Ctrl+I' },
  { id: 'bullet-list', icon: ListBulletIcon, label: 'Bullet List', shortcut: 'Ctrl+Shift+8' },
  { id: 'numbered-list', icon: QueueListIcon, label: 'Numbered List', shortcut: 'Ctrl+Shift+7' },
  { id: 'code', icon: CodeBracketIcon, label: 'Code Block', shortcut: 'Ctrl+Shift+K' },
  { id: 'link', icon: LinkIcon, label: 'Link', shortcut: 'Ctrl+K' },
];

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onFormat,
  isOnline,
  isSaving,
  hasOfflineChanges,
}) => {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
      <div className="flex items-center space-x-2">
        {formatOptions.map(({ id, icon: Icon, label, shortcut }) => (
          <button
            key={id}
            onClick={() => onFormat(id)}
            className="p-1.5 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title={`${label} (${shortcut})`}
          >
            <Icon className="h-5 w-5 text-gray-600" />
          </button>
        ))}
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center text-sm">
          {isOnline ? (
            <>
              <CloudIcon className="h-5 w-5 text-green-500 mr-1" />
              <span className="text-green-600">Connected</span>
            </>
          ) : (
            <>
              <CloudArrowDownIcon className="h-5 w-5 text-yellow-500 mr-1" />
              <span className="text-yellow-600">Offline</span>
            </>
          )}
        </div>
        
        {isSaving && (
          <div className="text-sm text-gray-500">
            Saving...
          </div>
        )}
      </div>
    </div>
  );
}; 
import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import {
  CodeBracketIcon,
  BookOpenIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import CodeSnippetLibrary from './CodeSnippetLibrary';
import ValidationRuleManager from '../validation/ValidationRuleManager';
import { ValidationRule } from '../../services/validationService';

interface EditorSidebarProps {
  onInsertCode: (code: string) => void;
  onAddRule: (rule: ValidationRule) => void;
  onUpdateRule: (index: number, rule: ValidationRule) => void;
  onDeleteRule: (index: number) => void;
  customRules: ValidationRule[];
  readabilityScore?: number;
  keywordDensity?: { [key: string]: number };
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  onInsertCode,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  customRules,
  readabilityScore,
  keywordDensity
}) => {
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    {
      name: 'Code Snippets',
      icon: CodeBracketIcon,
      content: (
        <div className="p-4">
          <CodeSnippetLibrary onInsert={onInsertCode} />
        </div>
      )
    },
    {
      name: 'Validation Rules',
      icon: AdjustmentsHorizontalIcon,
      content: (
        <div className="p-4">
          <ValidationRuleManager
            rules={customRules}
            onAddRule={onAddRule}
            onUpdateRule={onUpdateRule}
            onDeleteRule={onDeleteRule}
          />
        </div>
      )
    },
    {
      name: 'Documentation',
      icon: BookOpenIcon,
      content: (
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Documentation</h3>
          <div className="prose prose-sm">
            <h4>Markdown Support</h4>
            <ul>
              <li><code># Heading 1</code> - Creates a main heading</li>
              <li><code>## Heading 2</code> - Creates a subheading</li>
              <li><code>**bold**</code> - Makes text bold</li>
              <li><code>*italic*</code> - Makes text italic</li>
              <li><code>[link](url)</code> - Creates a hyperlink</li>
              <li><code>![alt](image-url)</code> - Embeds an image</li>
              <li><code>```language</code> - Creates a code block</li>
            </ul>

            <h4>Code Blocks</h4>
            <p>
              Use triple backticks with a language identifier to create syntax-highlighted code blocks:
            </p>
            <pre className="bg-gray-100 p-2 rounded">
              <code>{`\`\`\`javascript
// Your code here
\`\`\``}</code>
            </pre>

            <h4>Technical Writing Tips</h4>
            <ul>
              <li>Use active voice for clarity</li>
              <li>Keep paragraphs focused and concise</li>
              <li>Include code examples for technical concepts</li>
              <li>Define technical terms and acronyms</li>
              <li>Use consistent terminology</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      name: 'Analysis',
      icon: DocumentTextIcon,
      content: (
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Content Analysis</h3>
          
          {readabilityScore !== undefined && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Readability Score</h4>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      readabilityScore > 60 ? 'bg-green-500' :
                      readabilityScore > 40 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${readabilityScore}%` }}
                  />
                </div>
                <span className="ml-2 text-sm text-gray-600">{readabilityScore}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {readabilityScore > 60 ? 'Easy to read' :
                 readabilityScore > 40 ? 'Moderately difficult' :
                 'Difficult to read'}
              </p>
            </div>
          )}

          {keywordDensity && Object.keys(keywordDensity).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Keyword Density</h4>
              <div className="space-y-2">
                {Object.entries(keywordDensity)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([keyword, density]) => (
                    <div key={keyword} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{keyword}</span>
                      <span className="text-sm text-gray-500">{(density * 100).toFixed(1)}%</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex border-b border-gray-200">
          {tabs.map((tab, index) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                classNames(
                  'flex-1 px-4 py-2 text-sm font-medium text-center focus:outline-none',
                  selected
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                )
              }
            >
              <div className="flex flex-col items-center">
                <tab.icon className="h-5 w-5" />
                <span className="mt-1">{tab.name}</span>
              </div>
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="flex-1 overflow-y-auto">
          {tabs.map((tab, index) => (
            <Tab.Panel
              key={index}
              className={classNames(
                'h-full',
                index === selectedTab ? 'block' : 'hidden'
              )}
            >
              {tab.content}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default EditorSidebar; 
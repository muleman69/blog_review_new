import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface CodeSnippet {
  name: string;
  description: string;
  code: string;
  language: string;
  tags: string[];
}

interface CodeSnippetLibraryProps {
  onInsert: (code: string) => void;
}

const defaultSnippets: CodeSnippet[] = [
  {
    name: 'React Functional Component',
    description: 'Basic React functional component with TypeScript',
    language: 'typescript',
    code: `interface Props {
  // Add props here
}

const MyComponent: React.FC<Props> = () => {
  return (
    <div>
      {/* Add content here */}
    </div>
  );
};

export default MyComponent;`,
    tags: ['react', 'typescript', 'component']
  },
  {
    name: 'React Hook',
    description: 'Custom React hook template',
    language: 'typescript',
    code: `import { useState, useEffect } from 'react';

interface Options {
  // Add options here
}

const useCustomHook = (options: Options) => {
  const [state, setState] = useState();

  useEffect(() => {
    // Add effect logic here
  }, []);

  return {
    // Return values here
  };
};

export default useCustomHook;`,
    tags: ['react', 'typescript', 'hook']
  },
  {
    name: 'API Service',
    description: 'TypeScript API service with Axios',
    language: 'typescript',
    code: `import axios from 'axios';

interface Response {
  // Add response type here
}

class ApiService {
  private static readonly BASE_URL = 'https://api.example.com';

  static async getData(): Promise<Response> {
    const response = await axios.get<Response>(\`\${this.BASE_URL}/endpoint\`);
    return response.data;
  }
}

export default ApiService;`,
    tags: ['api', 'typescript', 'axios']
  }
];

const CodeSnippetLibrary: React.FC<CodeSnippetLibraryProps> = ({ onInsert }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [expandedSnippet, setExpandedSnippet] = useState<string | null>(null);

  const allTags = Array.from(
    new Set(defaultSnippets.flatMap(snippet => snippet.tags))
  ).sort();

  const toggleTag = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  const filteredSnippets = defaultSnippets.filter(snippet => {
    const matchesSearch = snippet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snippet.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.size === 0 ||
                       snippet.tags.some(tag => selectedTags.has(tag));
    return matchesSearch && matchesTags;
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search snippets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="flex flex-wrap gap-2">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2 py-1 text-sm rounded-full ${
                selectedTags.has(tag)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filteredSnippets.map(snippet => (
          <div
            key={snippet.name}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setExpandedSnippet(
                expandedSnippet === snippet.name ? null : snippet.name
              )}
              className="w-full px-4 py-2 text-left bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
            >
              <div>
                <h3 className="font-medium text-gray-900">{snippet.name}</h3>
                <p className="text-sm text-gray-500">{snippet.description}</p>
              </div>
              {expandedSnippet === snippet.name ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSnippet === snippet.name && (
              <div className="p-4 space-y-4">
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto">
                  <code>{snippet.code}</code>
                </pre>
                <div className="flex justify-end">
                  <button
                    onClick={() => onInsert(snippet.code)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Insert Snippet
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CodeSnippetLibrary; 
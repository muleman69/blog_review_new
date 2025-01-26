import { ValidationIssueType } from './validationService';
import CacheService from './cacheService';
import PerformanceService from './performanceService';

interface Documentation {
  title: string;
  description: string;
  examples: Array<{
    good: string;
    bad: string;
    explanation: string;
  }>;
  resources: Array<{
    title: string;
    url: string;
  }>;
  bestPractices?: string[];
  commonMistakes?: string[];
  relatedConcepts?: string[];
}

interface TechnicalConcept {
  name: string;
  description: string;
  bestPractices: string[];
  commonMistakes: string[];
  resources: Array<{
    title: string;
    url: string;
  }>;
  relatedConcepts: string[];
}

class DocumentationService {
  private static documentationMap = new Map<ValidationIssueType, Documentation>();
  private static conceptsMap = new Map<string, TechnicalConcept>();
  private static readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  static {
    // Technical Accuracy Documentation
    this.documentationMap.set('technical_accuracy', {
      title: 'Technical Accuracy in Technical Writing',
      description: 'Technical accuracy is crucial for maintaining credibility and ensuring your readers can implement solutions correctly.',
      examples: [
        {
          good: 'React components re-render when their state or props change.',
          bad: 'React components always re-render.',
          explanation: 'The first statement accurately describes React\'s behavior, while the second is an overgeneralization.'
        },
        {
          good: 'Arrays and objects in JavaScript are passed by reference.',
          bad: 'Everything in JavaScript is passed by value.',
          explanation: 'While primitive types are passed by value, objects and arrays are passed by reference.'
        }
      ],
      resources: [
        {
          title: 'React Component Lifecycle',
          url: 'https://reactjs.org/docs/components-and-props.html'
        },
        {
          title: 'JavaScript Pass by Value vs Reference',
          url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions'
        }
      ]
    });

    // Code Quality Documentation
    this.documentationMap.set('code_quality', {
      title: 'Code Quality Best Practices',
      description: 'High-quality code is readable, maintainable, and follows established patterns and conventions.',
      examples: [
        {
          good: 'const user = await getUserById(id);',
          bad: 'var user = getUserById(id);',
          explanation: 'Use const/let instead of var, and await async operations properly.'
        }
      ],
      resources: [
        {
          title: 'Clean Code in JavaScript',
          url: 'https://github.com/ryanmcdermott/clean-code-javascript'
        }
      ]
    });

    // Add technical concepts
    this.conceptsMap.set('react_hooks', {
      name: 'React Hooks',
      description: 'Hooks are functions that allow you to "hook into" React state and lifecycle features from function components.',
      bestPractices: [
        'Only call Hooks at the top level',
        'Only call Hooks from React function components',
        'Use appropriate dependency arrays in useEffect'
      ],
      commonMistakes: [
        'Calling Hooks inside loops or conditions',
        'Forgetting to clean up side effects',
        'Incorrect dependency arrays leading to infinite loops'
      ],
      resources: [
        {
          title: 'React Hooks Documentation',
          url: 'https://reactjs.org/docs/hooks-intro.html'
        }
      ],
      relatedConcepts: ['useEffect', 'useState', 'Component Lifecycle']
    });
  }

  static async getDocumentation(type: ValidationIssueType): Promise<Documentation | null> {
    const cacheKey = `doc_${type}`;
    return CacheService.get(
      cacheKey,
      async () => {
        const startTime = performance.now();
        const doc = this.documentationMap.get(type) || null;
        const duration = performance.now() - startTime;
        PerformanceService.trackMetric('documentation_fetch', duration);
        return doc;
      },
      this.CACHE_TTL
    );
  }

  static async getTechnicalConcept(concept: string): Promise<TechnicalConcept | null> {
    const cacheKey = `concept_${concept}`;
    return CacheService.get(
      cacheKey,
      async () => {
        const startTime = performance.now();
        const result = this.conceptsMap.get(concept) || null;
        const duration = performance.now() - startTime;
        PerformanceService.trackMetric('concept_fetch', duration);
        return result;
      },
      this.CACHE_TTL
    );
  }

  static async searchDocumentation(query: string): Promise<Array<Documentation | TechnicalConcept>> {
    const cacheKey = `search_${query.toLowerCase()}`;
    return CacheService.get(
      cacheKey,
      async () => {
        const startTime = performance.now();
        const results: Array<Documentation | TechnicalConcept> = [];
        
        // Search in documentation
        this.documentationMap.forEach(doc => {
          if (
            doc.title.toLowerCase().includes(query.toLowerCase()) ||
            doc.description.toLowerCase().includes(query.toLowerCase())
          ) {
            results.push(doc);
          }
        });

        // Search in concepts
        this.conceptsMap.forEach(concept => {
          if (
            concept.name.toLowerCase().includes(query.toLowerCase()) ||
            concept.description.toLowerCase().includes(query.toLowerCase())
          ) {
            results.push(concept);
          }
        });

        const duration = performance.now() - startTime;
        PerformanceService.trackMetric('documentation_search', duration);
        return results;
      },
      5 * 60 * 1000 // 5 minutes TTL for search results
    );
  }

  static preloadCommonDocumentation(): void {
    const commonTypes: ValidationIssueType[] = [
      'technical_accuracy',
      'code_quality',
      'content_structure',
      'readability'
    ];

    void Promise.all(
      commonTypes.map(type => this.getDocumentation(type))
    );
  }

  static invalidateCache(): void {
    CacheService.invalidatePattern(/^(doc_|concept_|search_)/);
  }
}

export default DocumentationService; 
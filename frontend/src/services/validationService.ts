import { ValidationIssue } from './blogPostService';
import { sendMessage } from '../serviceWorkerRegistration';
import CacheService from './cacheService';
import PerformanceService from './performanceService';

export type ValidationIssueType = 
  | 'technical_accuracy' 
  | 'industry_standards' 
  | 'content_structure'
  | 'code_quality'
  | 'code_security'
  | 'code_performance'
  | 'readability';

export interface ValidationRule {
  pattern: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  suggestion?: string;
  type: ValidationIssueType;
  language?: string;
  aiEnabled?: boolean;
  quickFix?: {
    label: string;
    replacement: string;
  };
  location?: ValidationLocation;
}

export interface ValidationLocation {
  line: number;
  column: number;
  length: number;
}

export interface ValidationIssueExtended extends ValidationIssue {
  location?: ValidationLocation;
  aiSuggestions?: string[];
  quickFix?: {
    label: string;
    replacement: string;
  };
}

interface CodeBlock {
  code: string;
  language: string;
  startLine: number;
}

interface AIContext {
  language?: string;
  ruleType: ValidationIssueType;
  surroundingContent: string;
  codeContext?: string;
}

interface ValidationRequest {
  content: string;
  type: string;
}

interface ValidationPass {
  name: string;
  validate: (content: string) => Promise<ValidationIssue[]>;
  priority: number;
}

class ValidationService {
  private static readonly CACHE_TTL = 300; // 5 minutes

  static async validateContent(content: string, type: string): Promise<ValidationIssue[]> {
    const cacheKey = `validation:${content}:${type}`;
    
    const fetchValidation = async () => {
      const startTime = performance.now();
      
      try {
        await sendMessage({
          type: 'VALIDATION_REQUEST',
          payload: { content, type }
        });

        const duration = performance.now() - startTime;
        PerformanceService.trackMetric('validation', duration);

        return []; // For now, return empty array since we're not handling the response yet
      } catch (error) {
        console.error('Validation error:', error);
        throw error;
      }
    };

    const cachedResult = await CacheService.get<ValidationIssue[]>(
      cacheKey,
      fetchValidation,
      this.CACHE_TTL
    );
    
    return cachedResult;
  }

  static getValidationPasses(): ValidationPass[] {
    return [
      {
        name: 'Technical Accuracy',
        validate: (content: string) => this.validateContent(content, 'technical_accuracy'),
        priority: 5
      },
      {
        name: 'Content Structure',
        validate: (content: string) => this.validateContent(content, 'content_structure'),
        priority: 4
      },
      {
        name: 'Industry Standards',
        validate: (content: string) => this.validateContent(content, 'industry_standards'),
        priority: 3
      },
      {
        name: 'Readability',
        validate: (content: string) => this.validateContent(content, 'readability'),
        priority: 2
      }
    ];
  }

  static preloadCommonValidations(content: string): void {
    const commonTypes = ['technical_accuracy', 'content_structure', 'readability'];
    void Promise.all(commonTypes.map(type => this.validateContent(content, type)));
  }

  static clearCache(): void {
    CacheService.invalidatePattern(/^validation:/);
  }
}

export default ValidationService; 
import { ValidationIssue } from './blogPostService';
import { sendValidationRequest } from '../utils/serviceWorkerRegistration';
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

class ValidationService {
  private static validationQueue: Array<{
    content: string;
    type: ValidationIssueType;
    resolve: (issues: ValidationIssue[]) => void;
    reject: (error: Error) => void;
  }> = [];
  private static batchTimeout: NodeJS.Timeout | null = null;
  private static readonly BATCH_DELAY = 100; // ms
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private static technicalRules: ValidationRule[] = [
    // React Hooks and Lifecycle
    {
      pattern: '\\b(?:useEffect|componentDidMount)\\b.*\\b(setTimeout|setInterval)\\b',
      message: 'Avoid using timers directly in lifecycle methods',
      severity: 'high',
      suggestion: 'Use cleanup functions to prevent memory leaks',
      type: 'technical_accuracy',
      language: 'javascript',
      quickFix: {
        label: 'Add cleanup function',
        replacement: `useEffect(() => {
  const timer = setTimeout(() => {
    // Your code here
  }, delay);
  return () => clearTimeout(timer);
}, []);`
      }
    },
    {
      pattern: '\\b(?:componentWillMount|componentWillReceiveProps|componentWillUpdate)\\b',
      message: 'Using deprecated React lifecycle methods',
      severity: 'high',
      suggestion: 'Use modern alternatives like componentDidMount, getDerivedStateFromProps, or useEffect',
      type: 'technical_accuracy',
      language: 'javascript'
    },
    {
      pattern: '\\buseEffect\\([^)]*\\),\\s*\\[\\]\\)',
      message: 'Empty dependency array in useEffect',
      severity: 'medium',
      suggestion: 'Consider if any dependencies should be included in the dependency array',
      type: 'technical_accuracy',
      language: 'javascript'
    },
    // JavaScript/TypeScript Best Practices
    {
      pattern: '\\b(?:var)\\b',
      message: 'Avoid using var declarations',
      severity: 'medium',
      suggestion: 'Use let or const for better scoping',
      type: 'technical_accuracy',
      language: 'javascript',
      quickFix: {
        label: 'Replace with let',
        replacement: 'let'
      }
    },
    {
      pattern: '\\b(?:null|undefined)\\s*==\\s*(?:null|undefined)\\b',
      message: 'Use strict equality for null/undefined checks',
      severity: 'medium',
      suggestion: 'Use === instead of == for strict equality',
      type: 'technical_accuracy',
      language: 'javascript',
      quickFix: {
        label: 'Use strict equality',
        replacement: '==='
      }
    },
    // Common Technical Misconceptions
    {
      pattern: '\\b(?:array|object)\\s+(?:are|is)\\s+passed\\s+by\\s+value\\b',
      message: 'Incorrect explanation of JavaScript pass-by-value/reference',
      severity: 'high',
      suggestion: 'Arrays and objects are passed by reference in JavaScript',
      type: 'technical_accuracy'
    },
    // DevOps and Cloud
    {
      pattern: '\\b(?:docker|container)\\s+(?:image|instance)\\s+(?:are|is)\\s+stateful\\b',
      message: 'Incorrect explanation of container state',
      severity: 'high',
      suggestion: 'Docker containers are designed to be stateless by default',
      type: 'technical_accuracy'
    },
    // Data Science and ML
    {
      pattern: '\\b(?:correlation|correlation coefficient)\\s+(?:proves|show|demonstrates)\\s+causation\\b',
      message: 'Incorrect interpretation of correlation',
      severity: 'high',
      suggestion: 'Correlation does not imply causation',
      type: 'technical_accuracy'
    },
    // Mobile Development Rules
    {
      pattern: '\\b(?:UIViewController|Activity)\\s+(?:are|is)\\s+stateful\\b',
      message: 'Incorrect explanation of view controller state',
      severity: 'high',
      suggestion: 'View controllers should be stateless by default, with state managed externally',
      type: 'technical_accuracy',
      language: 'swift',
      aiEnabled: true
    },
    {
      pattern: '\\b(?:UIKit|SwiftUI)\\s+(?:are|is)\\s+(?:same|identical|equal)\\b',
      message: 'Incorrect comparison of UIKit and SwiftUI',
      severity: 'high',
      suggestion: 'UIKit and SwiftUI are different frameworks with distinct paradigms',
      type: 'technical_accuracy',
      language: 'swift'
    },
    {
      pattern: '\\bActivity\\s+(?:persist|persists|persisting)\\s+state\\b',
      message: 'Incorrect handling of Android activity state',
      severity: 'high',
      suggestion: 'Activities should use onSaveInstanceState for state persistence',
      type: 'technical_accuracy',
      language: 'kotlin',
      aiEnabled: true
    },
    {
      pattern: '\\bReact\\s+Native\\s+(?:compiles|converts)\\s+to\\s+native\\s+code\\b',
      message: 'Incorrect explanation of React Native architecture',
      severity: 'high',
      suggestion: 'React Native uses a bridge to communicate with native components',
      type: 'technical_accuracy',
      language: 'javascript'
    },
    // Cybersecurity Rules
    {
      pattern: '\\b(?:md5|sha1)\\s+(?:is|are)\\s+(?:secure|safe|recommended)\\b',
      message: 'Insecure cryptographic hash function',
      severity: 'high',
      suggestion: 'Use SHA-256 or better for cryptographic hashing',
      type: 'code_security',
      aiEnabled: true
    },
    {
      pattern: '\\b(?:jwt|token)\\s+in\\s+(?:localStorage|sessionStorage)\\b',
      message: 'Insecure token storage',
      severity: 'high',
      suggestion: 'Store sensitive tokens in HttpOnly cookies',
      type: 'code_security',
      quickFix: {
        label: 'Use secure cookie storage',
        replacement: 'httpOnly secure cookie'
      }
    },
    {
      pattern: '\\b(?:sql|database)\\s+query\\s+(?:with|using)\\s+(?:concatenation|\\+)\\b',
      message: 'Potential SQL injection vulnerability',
      severity: 'high',
      suggestion: 'Use parameterized queries or an ORM',
      type: 'code_security',
      aiEnabled: true
    },
    {
      pattern: '\\bcors\\s*:\\s*[\'"]\\*[\'"]',
      message: 'Overly permissive CORS configuration',
      severity: 'high',
      suggestion: 'Restrict CORS to specific origins',
      type: 'code_security',
      quickFix: {
        label: 'Restrict CORS',
        replacement: "cors: { origin: 'https://yourdomain.com' }"
      }
    },
    // Cloud Computing Rules
    {
      pattern: '\\b(?:aws|azure|gcp)\\s+credentials\\s+in\\s+(?:code|config)\\b',
      message: 'Hardcoded cloud credentials',
      severity: 'high',
      suggestion: 'Use environment variables or a secrets manager',
      type: 'code_security',
      aiEnabled: true
    },
    {
      pattern: '\\b(?:s3|blob|storage)\\s+bucket\\s+(?:public|open)\\b',
      message: 'Public cloud storage configuration',
      severity: 'high',
      suggestion: 'Restrict access to cloud storage resources',
      type: 'code_security'
    },
    {
      pattern: '\\b(?:lambda|function)\\s+(?:timeout|memory)\\s+(?:default|unchanged)\\b',
      message: 'Unoptimized serverless configuration',
      severity: 'medium',
      suggestion: 'Configure serverless function resources based on requirements',
      type: 'code_performance',
      aiEnabled: true
    },
    {
      pattern: '\\b(?:container|docker)\\s+(?:root|privileged)\\b',
      message: 'Container security concern',
      severity: 'high',
      suggestion: 'Run containers with minimal privileges',
      type: 'code_security',
      quickFix: {
        label: 'Add user directive',
        replacement: 'USER nonroot'
      }
    }
  ];

  private static structureRules: ValidationRule[] = [
    // Heading Hierarchy
    {
      pattern: '^#{4,}\\s+\\w+.*?(?=\\n#|$)',
      message: 'Deep heading nesting detected',
      severity: 'medium',
      suggestion: 'Consider restructuring to use fewer heading levels',
      type: 'content_structure'
    },
    {
      pattern: '^#\\s+.*\\n(?!##)',
      message: 'Main heading not followed by subheadings',
      severity: 'low',
      suggestion: 'Consider adding subheadings for better content organization',
      type: 'content_structure'
    },
    // Section Organization
    {
      pattern: '^(?!.*\\b(?:introduction|overview|background)\\b).{1,500}\\n#{2}',
      message: 'Missing introduction section',
      severity: 'medium',
      suggestion: 'Add an introduction to provide context',
      type: 'content_structure'
    },
    {
      pattern: '```[\\s\\S]+?```\\s*(?!\\n[^`]+)',
      message: 'Code block without explanation',
      severity: 'high',
      suggestion: 'Add explanatory text after code blocks',
      type: 'content_structure'
    },
    // Content Balance
    {
      pattern: '(?<!\\n)\\n{4,}(?!\\n)',
      message: 'Excessive blank lines',
      severity: 'low',
      suggestion: 'Use single blank lines between paragraphs',
      type: 'content_structure',
      quickFix: {
        label: 'Remove extra blank lines',
        replacement: '\n\n'
      }
    },
    // Section Completeness
    {
      pattern: '^##\\s*(?:Problem|Challenge).*?(?=^##|$)(?!.*?(?:Solution|Approach|Implementation))',
      message: 'Problem statement without solution',
      severity: 'high',
      suggestion: 'Add a solution section after describing the problem',
      type: 'content_structure'
    },
    {
      pattern: '^##\\s*Conclusion.*?(?=^##|$)(?!.*?(?:summary|learned|takeaway|next steps))',
      message: 'Incomplete conclusion section',
      severity: 'medium',
      suggestion: 'Include summary, lessons learned, or next steps in the conclusion',
      type: 'content_structure'
    }
  ];

  private static industryRules: ValidationRule[] = [
    // Technical Terminology
    {
      pattern: '\\b[A-Z]{2,}\\b(?!\\s*[\\(:])',
      message: 'Undefined acronym',
      severity: 'medium',
      suggestion: 'Define acronyms on first use',
      type: 'industry_standards'
    },
    {
      pattern: '\\b(?:API|REST|GraphQL|SQL)\\b(?!\\s*(?:is|are|\\.|,))',
      message: 'Technical term used without context',
      severity: 'low',
      suggestion: 'Provide context or explanation for technical terms',
      type: 'industry_standards'
    },
    // Attribution and References
    {
      pattern: '(?:copied from|source:|reference:)\\s*\\n',
      message: 'Incomplete attribution',
      severity: 'high',
      suggestion: 'Add proper citation with author and source URL',
      type: 'industry_standards'
    },
    {
      pattern: 'https?://[^\\s]+',
      message: 'Raw URL in text',
      severity: 'low',
      suggestion: 'Use descriptive link text with proper Markdown formatting',
      type: 'industry_standards',
      quickFix: {
        label: 'Format as Markdown link',
        replacement: '[Description]($&)'
      }
    },
    // Code Style
    {
      pattern: '```(?:js|javascript)\\n(?![\\s\\S]*?\\b(?:const|let)\\b)[\\s\\S]*?```',
      message: 'Modern JavaScript conventions not followed',
      severity: 'medium',
      suggestion: 'Use modern JavaScript features (const/let, arrow functions, etc.)',
      type: 'industry_standards'
    },
    // Documentation Standards
    {
      pattern: '```[^\\n]*\\n(?![\\s\\S]*?//)[\\s\\S]*?```',
      message: 'Code example without comments',
      severity: 'medium',
      suggestion: 'Add comments to explain complex code sections',
      type: 'industry_standards'
    }
  ];

  private static readabilityRules: ValidationRule[] = [
    // Complex Language
    {
      pattern: '\\b(?:utilize|leverage|facilitate|implement|functionality)\\b',
      message: 'Complex word choice',
      severity: 'low',
      suggestion: 'Use simpler alternatives: "use," "help," "add," or "features"',
      type: 'readability',
      quickFix: {
        label: 'Use simpler word',
        replacement: 'use'
      }
    },
    {
      pattern: '\\b(?:in order to|due to the fact that|in spite of the fact that|for the purpose of)\\b',
      message: 'Wordy phrase',
      severity: 'low',
      suggestion: 'Use "to," "because," "although," or "for"',
      type: 'readability',
      quickFix: {
        label: 'Simplify phrase',
        replacement: 'to'
      }
    },
    // Sentence Structure
    {
      pattern: '[^.!?]+(?:[,;]\\s+and\\s+|\\s+and\\s+)[^.!?]+[.!?]',
      message: 'Long compound sentence',
      severity: 'medium',
      suggestion: 'Consider breaking into shorter sentences',
      type: 'readability'
    },
    // Technical Clarity
    {
      pattern: '\\b(?:it|this|that|these|those)\\b\\s+(?:means|implies|suggests|indicates)',
      message: 'Ambiguous reference',
      severity: 'medium',
      suggestion: 'Be more specific about what you\'re referring to',
      type: 'readability'
    },
    // Paragraph Length
    {
      pattern: '(?:[^\\n]\\n){6,}[^\\n]',
      message: 'Long paragraph',
      severity: 'low',
      suggestion: 'Consider breaking into smaller paragraphs for better readability',
      type: 'readability'
    }
  ];

  private static customRules: ValidationRule[] = [];

  static setCustomRules(rules: ValidationRule[]) {
    this.customRules = rules;
  }

  private static async validateWithRules(content: string, rules: ValidationRule[]): Promise<ValidationIssueExtended[]> {
    const issues: ValidationIssueExtended[] = [];
    const codeBlocks = this.extractCodeBlocks(content);

    for (const rule of rules) {
      try {
        const pattern = new RegExp(rule.pattern, 'gi');
        
        if (rule.language) {
          // Only validate code blocks for language-specific rules
          for (const block of codeBlocks) {
            if (block.language === rule.language) {
              let match;
              while ((match = pattern.exec(block.code)) !== null) {
                const issue = await this.createIssue(content, match, rule, block.startLine);
                issues.push(issue);
              }
            }
          }
        } else {
          // Validate entire content for non-code rules
          let match;
          while ((match = pattern.exec(content)) !== null) {
            const issue = await this.createIssue(content, match, rule);
            issues.push(issue);
          }
        }
      } catch (error) {
        console.error(`Invalid regex pattern in rule: ${rule.message}`, error);
      }
    }

    return issues;
  }

  private static async createIssue(
    content: string,
    match: RegExpExecArray,
    rule: ValidationRule,
    codeBlockStartLine = 0
  ): Promise<ValidationIssueExtended> {
    const lines = content.substring(0, match.index).split('\n');
    const line = lines.length + codeBlockStartLine;
    const column = lines[lines.length - 1].length + 1;

    const issue: ValidationIssueExtended = {
      type: rule.type,
      message: rule.message,
      severity: rule.severity,
      suggestion: rule.suggestion || '',
      location: {
        line,
        column,
        length: match[0].length
      },
      quickFix: rule.quickFix
    };

    if (rule.aiEnabled) {
      issue.aiSuggestions = await this.getAISuggestions(content, rule);
    }

    return issue;
  }

  private static extractCodeBlocks(content: string): CodeBlock[] {
    const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
    const blocks: CodeBlock[] = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const startLine = content.substring(0, match.index).split('\n').length;
      blocks.push({
        language: match[1],
        code: match[2],
        startLine
      });
    }

    return blocks;
  }

  private static async getAISuggestions(content: string, rule: ValidationRule): Promise<string[]> {
    try {
      const context: AIContext = {
        language: rule.language,
        ruleType: rule.type,
        surroundingContent: this.getSurroundingContent(content, rule),
        codeContext: rule.language ? this.getCodeContext(content) : undefined
      };

      const response = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          context,
          rule: {
            type: rule.type,
            message: rule.message,
            severity: rule.severity
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI suggestions');
      }

      const suggestions = await response.json();
      return suggestions.map((suggestion: any) => ({
        text: suggestion.text,
        explanation: suggestion.explanation,
        examples: suggestion.examples
      }));
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      return [];
    }
  }

  private static getSurroundingContent(content: string, rule: ValidationRule): string {
    // Extract surrounding content (e.g., paragraph or code block) for context
    const lines = content.split('\n');
    const contextRange = 3; // Number of lines before and after
    const line = rule.location?.line ?? 0;
    const startLine = Math.max(0, line - contextRange);
    const endLine = Math.min(lines.length, line + contextRange);
    
    return lines.slice(startLine, endLine).join('\n');
  }

  private static getCodeContext(content: string): string | undefined {
    // Extract the entire code block containing the issue
    const codeBlockRegex = /```[\s\S]*?```/g;
    const match = content.match(codeBlockRegex);
    return match ? match[0] : undefined;
  }

  static async validateTechnical(content: string): Promise<ValidationIssueExtended[]> {
    return this.validateWithRules(content, this.technicalRules);
  }

  static async validateStructure(content: string): Promise<ValidationIssueExtended[]> {
    return this.validateWithRules(content, this.structureRules);
  }

  static async validateIndustryStandards(content: string): Promise<ValidationIssueExtended[]> {
    return this.validateWithRules(content, this.industryRules);
  }

  static async validateReadability(content: string): Promise<ValidationIssueExtended[]> {
    return this.validateWithRules(content, this.readabilityRules);
  }

  static async validateCustom(content: string): Promise<ValidationIssueExtended[]> {
    return this.validateWithRules(content, this.customRules);
  }

  static getValidationPasses() {
    return [
      {
        name: 'Technical Accuracy',
        validate: this.validateTechnical.bind(this),
        priority: 5
      },
      {
        name: 'Content Structure',
        validate: this.validateStructure.bind(this),
        priority: 4
      },
      {
        name: 'Industry Standards',
        validate: this.validateIndustryStandards.bind(this),
        priority: 3
      },
      {
        name: 'Readability',
        validate: this.validateReadability.bind(this),
        priority: 2
      },
      {
        name: 'Custom Rules',
        validate: this.validateCustom.bind(this),
        priority: 1
      }
    ];
  }

  static async validateContent(content: string, type: ValidationIssueType): Promise<ValidationIssue[]> {
    const cacheKey = `validation_${type}_${content.slice(0, 50)}`;
    
    return CacheService.get(
      cacheKey,
      () => this.queueValidationRequest(content, type),
      this.CACHE_TTL
    );
  }

  private static queueValidationRequest(content: string, type: ValidationIssueType): Promise<ValidationIssue[]> {
    return new Promise((resolve, reject) => {
      this.validationQueue.push({ content, type, resolve, reject });

      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          void this.processBatch();
          this.batchTimeout = null;
        }, this.BATCH_DELAY);
      }
    });
  }

  private static async processBatch(): Promise<void> {
    const batch = this.validationQueue.splice(0);
    if (batch.length === 0) return;

    const startTime = performance.now();

    try {
      const batchResults = await sendValidationRequest({
        requests: batch.map(({ content, type }) => ({ content, type }))
      });

      batch.forEach((request, index) => {
        request.resolve(batchResults[index]);
      });

      const duration = performance.now() - startTime;
      PerformanceService.trackMetric('validation_batch', duration);
    } catch (error) {
      batch.forEach(request => {
        request.reject(error as Error);
      });
    }
  }

  static preloadCommonValidations(content: string): void {
    const commonTypes: ValidationIssueType[] = [
      'technical_accuracy',
      'code_quality',
      'content_structure',
      'readability'
    ];

    void Promise.all(
      commonTypes.map(type => this.validateContent(content, type))
    );
  }

  static invalidateCache(): void {
    CacheService.invalidatePattern(/^validation_/);
  }
}

export default ValidationService; 
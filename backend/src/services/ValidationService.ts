import axios from 'axios';
import { config } from '../config/config';
import { createClient } from 'redis';
import { IBlogPost } from '../models/BlogPost';

interface ValidationFeedback {
    message: string;
    suggestion: string;
    severity: 'high' | 'medium' | 'low';
    location?: {
        line: number;
        column: number;
    };
}

interface ValidationResult {
    technical_accuracy: ValidationFeedback[];
    industry_standards: ValidationFeedback[];
    content_structure: ValidationFeedback[];
}

const redisClient = createClient({ url: config.redisUrl });
redisClient.connect();

export class ValidationService {
    private static async validateChunk(content: string): Promise<ValidationResult> {
        try {
            const response = await axios.post<ValidationResult>(
                `${config.deepseekApiUrl}/validate`,
                {
                    content,
                    options: {
                        validate_technical_accuracy: true,
                        validate_industry_standards: true,
                        validate_content_structure: true
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${config.deepseekApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('DeepSeek API Error:', error);
            throw new Error('Validation service error');
        }
    }

    private static async getCachedValidation(key: string): Promise<ValidationResult | null> {
        const cached = await redisClient.get(key);
        return cached ? JSON.parse(cached) : null;
    }

    private static async cacheValidation(key: string, result: ValidationResult): Promise<void> {
        await redisClient.set(key, JSON.stringify(result), {
            EX: 3600 // Cache for 1 hour
        });
    }

    public static async validateBlogPost(blogPost: IBlogPost): Promise<ValidationResult> {
        const cacheKey = `validation:${blogPost._id}:${blogPost.updatedAt}`;
        
        // Check cache first
        const cached = await this.getCachedValidation(cacheKey);
        if (cached) {
            return cached;
        }

        // Split content into manageable chunks (e.g., 1000 tokens each)
        const chunks = this.splitContent(blogPost.content);
        const validationResults: ValidationResult[] = [];

        for (const chunk of chunks) {
            const result = await this.validateChunk(chunk);
            validationResults.push(result);
        }

        // Combine and process results
        const combinedResults = this.combineResults(validationResults);
        
        // Cache the results
        await this.cacheValidation(cacheKey, combinedResults);

        return combinedResults;
    }

    private static splitContent(content: string): string[] {
        // Simple splitting by paragraphs - in production, use a proper tokenizer
        const paragraphs = content.split('\n\n');
        const chunks: string[] = [];
        let currentChunk = '';

        for (const paragraph of paragraphs) {
            if ((currentChunk + paragraph).length > 1000) {
                chunks.push(currentChunk);
                currentChunk = paragraph;
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    private static combineResults(results: ValidationResult[]): ValidationResult {
        const combined: ValidationResult = {
            technical_accuracy: [],
            industry_standards: [],
            content_structure: []
        };

        results.forEach(result => {
            combined.technical_accuracy.push(...result.technical_accuracy);
            combined.industry_standards.push(...result.industry_standards);
            combined.content_structure.push(...result.content_structure);
        });

        // Deduplicate feedback
        return {
            technical_accuracy: this.deduplicate(combined.technical_accuracy),
            industry_standards: this.deduplicate(combined.industry_standards),
            content_structure: this.deduplicate(combined.content_structure)
        };
    }

    private static deduplicate(feedback: ValidationFeedback[]): ValidationFeedback[] {
        const unique = new Map<string, ValidationFeedback>();
        
        feedback.forEach(item => {
            const key = item.message.toLowerCase();
            if (!unique.has(key)) {
                unique.set(key, item);
            }
        });

        return Array.from(unique.values());
    }
} 
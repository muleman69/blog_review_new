import { Request, Response } from 'express';
import BlogPost from '../models/BlogPost';
import { ValidationService } from '../services/ValidationService';

interface AuthRequest extends Request {
    user?: any;
}

type ValidationType = 'technical_accuracy' | 'industry_standards' | 'content_structure';

interface IValidationFeedback {
    type: ValidationType;
    message: string;
    suggestion: string;
    severity: 'high' | 'medium' | 'low';
    location?: {
        line: number;
        column: number;
    };
}

export class BlogPostController {
    public static async create(req: AuthRequest, res: Response): Promise<void> {
        try {
            const blogPost = new BlogPost({
                ...req.body,
                author: req.user._id,
                status: 'draft'
            });

            await blogPost.save();
            res.status(201).json(blogPost);
        } catch (error) {
            res.status(400).json({ error: 'Failed to create blog post' });
        }
    }

    public static async validate(req: Request, res: Response): Promise<void> {
        try {
            const blogPost = await BlogPost.findById(req.params.id);
            
            if (!blogPost) {
                res.status(404).json({ error: 'Blog post not found' });
                return;
            }

            const validationResult = await ValidationService.validateBlogPost(blogPost);
            
            // Update validation history
            const feedback: IValidationFeedback[] = [
                ...validationResult.technical_accuracy.map(f => ({
                    ...f,
                    type: 'technical_accuracy' as const,
                    timestamp: new Date(),
                    status: 'completed' as const,
                    validatedBy: (req as AuthRequest).user._id
                })),
                ...validationResult.industry_standards.map(f => ({
                    ...f,
                    type: 'industry_standards' as const,
                    timestamp: new Date(),
                    status: 'completed' as const,
                    validatedBy: (req as AuthRequest).user._id
                })),
                ...validationResult.content_structure.map(f => ({
                    ...f,
                    type: 'content_structure' as const,
                    timestamp: new Date(),
                    status: 'completed' as const,
                    validatedBy: (req as AuthRequest).user._id
                }))
            ];

            blogPost.validationHistory.push({
                type: 'technical_accuracy',
                message: 'Validation completed',
                suggestion: 'Review feedback for improvements',
                severity: 'low',
                timestamp: new Date(),
                status: 'completed',
                validatedBy: (req as AuthRequest).user._id,
                feedback
            });

            await blogPost.save();
            res.json(validationResult);
        } catch (error) {
            console.error('Validation error:', error);
            res.status(500).json({ error: 'Validation failed' });
        }
    }

    public static async getValidationHistory(req: Request, res: Response): Promise<void> {
        try {
            const blogPost = await BlogPost.findById(req.params.id)
                .populate('validationHistory.validatedBy', 'email');
            
            if (!blogPost) {
                res.status(404).json({ error: 'Blog post not found' });
                return;
            }

            res.json(blogPost.validationHistory);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch validation history' });
        }
    }

    public static async update(req: AuthRequest, res: Response): Promise<void> {
        try {
            const updates = Object.keys(req.body);
            const allowedUpdates = ['title', 'content', 'status', 'technicalTopics'];
            const isValidOperation = updates.every(update => allowedUpdates.includes(update));

            if (!isValidOperation) {
                res.status(400).json({ error: 'Invalid updates' });
                return;
            }

            const blogPost = await BlogPost.findOne({
                _id: req.params.id,
                author: req.user._id
            });

            if (!blogPost) {
                res.status(404).json({ error: 'Blog post not found' });
                return;
            }

            updates.forEach(update => {
                (blogPost as any)[update] = req.body[update];
            });

            await blogPost.save();
            res.json(blogPost);
        } catch (error) {
            res.status(400).json({ error: 'Failed to update blog post' });
        }
    }

    public static async list(req: Request, res: Response): Promise<void> {
        try {
            const match: any = {};
            const sort: any = {};

            // Filter by status
            if (req.query.status) {
                match.status = req.query.status;
            }

            // Filter by author
            if (req.query.author) {
                match.author = req.query.author;
            }

            // Sort by createdAt
            if (req.query.sortBy) {
                const parts = (req.query.sortBy as string).split(':');
                sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
            }

            const blogPosts = await BlogPost.find(match)
                .populate('author', 'email')
                .sort(sort)
                .limit(parseInt(req.query.limit as string) || 10)
                .skip(parseInt(req.query.skip as string) || 0);

            res.json(blogPosts);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch blog posts' });
        }
    }

    public static async delete(req: AuthRequest, res: Response): Promise<void> {
        try {
            const blogPost = await BlogPost.findOneAndDelete({
                _id: req.params.id,
                author: req.user._id
            });

            if (!blogPost) {
                res.status(404).json({ error: 'Blog post not found' });
                return;
            }

            res.json(blogPost);
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete blog post' });
        }
    }
} 
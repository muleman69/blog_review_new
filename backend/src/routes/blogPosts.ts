import { Router, Request, Response } from 'express';
import BlogPost, { IBlogPost } from '../models/BlogPost';

const router = Router();

// Get all blog posts
router.get('/', async (_req: Request, res: Response) => {
    try {
        const posts = await BlogPost.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        res.status(500).json({ error: 'Failed to fetch blog posts' });
    }
});

// Get a single blog post by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Blog post not found' });
        }
        res.json(post);
    } catch (error) {
        console.error('Error fetching blog post:', error);
        res.status(500).json({ error: 'Failed to fetch blog post' });
    }
});

// Create a new blog post
router.post('/', async (req: Request, res: Response) => {
    try {
        const { title, content, author, tags } = req.body;
        const post = new BlogPost({
            title,
            content,
            author,
            tags: tags || []
        });
        await post.save();
        res.status(201).json(post);
    } catch (error: any) {
        console.error('Error creating blog post:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to create blog post' });
    }
});

// Update a blog post
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { title, content, author, tags } = req.body;
        const post = await BlogPost.findByIdAndUpdate(
            req.params.id,
            { title, content, author, tags },
            { new: true, runValidators: true }
        );
        if (!post) {
            return res.status(404).json({ error: 'Blog post not found' });
        }
        res.json(post);
    } catch (error: any) {
        console.error('Error updating blog post:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to update blog post' });
    }
});

// Delete a blog post
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const post = await BlogPost.findByIdAndDelete(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Blog post not found' });
        }
        res.json({ message: 'Blog post deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog post:', error);
        res.status(500).json({ error: 'Failed to delete blog post' });
    }
});

export default router; 
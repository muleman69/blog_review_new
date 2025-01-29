import { Router } from 'express';
import { debugLog } from '../utils/debug';
import { authMiddleware, authorize, AuthRequest } from '../middleware/auth';
import BlogPostModel, { IBlogPost } from '../models/BlogPost';

const router = Router();

// Log all requests to blog post routes
router.use((req, res, next) => {
  debugLog.route('Blog post route accessed', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body
  });
  next();
});

// Get all blog posts
router.get('/', async (req, res) => {
  try {
    debugLog.route('Fetching all blog posts');
    const posts = await BlogPostModel.find().sort({ createdAt: -1 });
    debugLog.route('Successfully fetched blog posts', { count: posts.length });
    res.json(posts);
  } catch (error) {
    debugLog.error('Failed to fetch blog posts', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

// Create new blog post (requires authentication)
router.post('/', authMiddleware, authorize(['admin', 'writer']), async (req: AuthRequest, res) => {
  try {
    debugLog.route('Creating new blog post', { userId: req.user?.id });
    const post = new BlogPostModel({
      ...req.body,
      author: req.user?.id
    });
    await post.save();
    debugLog.route('Successfully created blog post', { postId: post._id });
    res.status(201).json(post);
  } catch (error) {
    debugLog.error('Failed to create blog post', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

// Update blog post (requires authentication)
router.put('/:id', authMiddleware, authorize(['admin', 'writer']), async (req: AuthRequest, res) => {
  try {
    debugLog.route('Updating blog post', { postId: req.params.id, userId: req.user?.id });
    const post = await BlogPostModel.findById(req.params.id);
    
    if (!post) {
      debugLog.route('Blog post not found', { postId: req.params.id });
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Only allow writers to edit their own posts (admins can edit any)
    if (req.user?.role !== 'admin' && post.author.toString() !== req.user?.id) {
      debugLog.route('Unauthorized edit attempt', { 
        postId: req.params.id, 
        userId: req.user?.id,
        authorId: post.author
      });
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }

    const updatedPost = await BlogPostModel.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastModified: new Date() },
      { new: true }
    );
    
    debugLog.route('Successfully updated blog post', { postId: req.params.id });
    res.json(updatedPost);
  } catch (error) {
    debugLog.error('Failed to update blog post', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

// Delete blog post (requires authentication)
router.delete('/:id', authMiddleware, authorize(['admin']), async (req: AuthRequest, res) => {
  try {
    debugLog.route('Deleting blog post', { postId: req.params.id, userId: req.user?.id });
    const post = await BlogPostModel.findByIdAndDelete(req.params.id);
    
    if (!post) {
      debugLog.route('Blog post not found for deletion', { postId: req.params.id });
      return res.status(404).json({ error: 'Blog post not found' });
    }

    debugLog.route('Successfully deleted blog post', { postId: req.params.id });
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    debugLog.error('Failed to delete blog post', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

export default router; 
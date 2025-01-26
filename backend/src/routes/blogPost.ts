import express from 'express';
import { BlogPostController } from '../controllers/BlogPostController';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

// Create blog post
router.post('/', auth, BlogPostController.create);

// Get all blog posts (with pagination and filters)
router.get('/', auth, BlogPostController.list);

// Validate blog post
router.post('/:id/validate', auth, authorize(['admin', 'editor']), BlogPostController.validate);

// Get validation history
router.get('/:id/validation-history', auth, BlogPostController.getValidationHistory);

// Update blog post
router.patch('/:id', auth, BlogPostController.update);

// Delete blog post
router.delete('/:id', auth, BlogPostController.delete);

export default router; 
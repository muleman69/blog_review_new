import { Router } from 'express';

const router = Router();

// Placeholder routes for blog posts
router.get('/', (_req, res) => {
  res.json({ message: 'Blog posts endpoint' });
});

export default router; 
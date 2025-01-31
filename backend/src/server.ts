import express from 'express';
import cors from 'cors';
import { debugLog } from './utils/debug';
import { ensureDatabaseConnections } from './utils/db';
import authRoutes from './routes/auth';

const app = express();

// Detailed request logging middleware
app.use((req, res, next) => {
  console.log('--------------------');
  console.log('Incoming Request Details:');
  console.log(`Original URL:`, req.originalUrl);
  console.log(`Base URL:`, req.baseUrl);
  console.log(`Path:`, req.path);
  console.log(`Method:`, req.method);
  console.log(`Headers:`, req.headers);
  console.log(`Body:`, req.body);
  console.log('--------------------');
  next();
});

// CORS configuration
const corsOptions = {
  origin: [
    'https://blog-review-new.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware before any routes
app.use(cors(corsOptions));
app.use(express.json());

// Database connection middleware for auth and blog routes
app.use(['/auth', '/api/auth', '/api/blog-posts', '/blog-posts'], async (req, res, next) => {
  console.log('Database middleware accessed:', req.path);
  try {
    await ensureDatabaseConnections();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(503).json({ error: 'Database connection failed. Please try again.' });
  }
});

// Health check endpoint
app.get(['/health', '/api/health'], (_req, res) => {
  console.log('Health check endpoint hit');
  res.status(200).json({ status: 'ok' });
});

// Mount auth routes with explicit paths
app.use(['/auth', '/api/auth'], (req, res, next) => {
  console.log('Auth route accessed:', req.path);
  next();
}, authRoutes);

// Blog posts routes
app.use(['/api/blog-posts', '/blog-posts'], (req, res, next) => {
  console.log('Blog posts route accessed:', req.path);
  next();
});

// Catch-all route for debugging (must be last)
app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.originalUrl);
  res.status(404).json({
    error: 'Route not found',
    requestedPath: req.originalUrl,
    method: req.method,
    baseUrl: req.baseUrl,
    path: req.path
  });
});

// Error handling middleware (must be after all routes)
app.use((err: Error, req: any, res: any, _next: any) => {
  console.error('Unhandled error:', err);
  console.error('Request details:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body
  });
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message
  });
});

// For Vercel serverless deployment
export default app; 
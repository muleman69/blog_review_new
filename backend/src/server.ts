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

// Error handling middleware
app.use((err: Error, _req: any, res: any, _next: any) => {
  debugLog.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// CORS configuration
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware before any routes
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get(['/health', '/api/health'], (_req, res) => {
  console.log('Health check endpoint hit');
  res.status(200).json({ status: 'ok' });
});

// Mount auth routes with explicit paths
app.use(['/auth', '/api/auth'], authRoutes);

// Catch-all route for debugging
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

// Database middleware for relevant routes
app.use(['/api/blog-posts', '/blog-posts'], async (req, res, next) => {
  debugLog.route('Database route accessed', { path: req.path });
  try {
    await ensureDatabaseConnections();
    next();
  } catch (error) {
    debugLog.error('Database connection failed', error);
    res.status(503).json({ error: 'Database connection failed' });
  }
});

// For Vercel serverless deployment
export default app; 
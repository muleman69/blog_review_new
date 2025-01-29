import express from 'express';
import cors from 'cors';
import { debugLog } from './utils/debug';
import { ensureDatabaseConnections } from './db';

const app = express();
const port = process.env.PORT || 3001;

// Middleware to log all requests
app.use((req, res, next) => {
  debugLog.request(req, 'Incoming request');
  
  // Log response when it's sent
  res.on('finish', () => {
    debugLog.response(res, 'Response sent');
  });
  
  next();
});

// Error handling middleware
app.use((err: Error, _req: any, res: any, _next: any) => {
  debugLog.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://buildableblog.pro', 'https://www.buildableblog.pro']
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  debugLog.route('Health check requested');
  try {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    });
    debugLog.route('Health check successful');
  } catch (error) {
    debugLog.error('Health check failed', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Database middleware for relevant routes
app.use('/api/blog-posts', async (req, res, next) => {
  debugLog.route('Database route accessed', { path: req.path });
  try {
    await ensureDatabaseConnections();
    next();
  } catch (error) {
    debugLog.error('Database connection failed', error);
    res.status(503).json({ error: 'Database connection failed' });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    debugLog.server(`Server started on port ${port}`, {
      env: process.env.NODE_ENV,
      nodeVersion: process.version
    });
  });
}

// For Vercel serverless deployment
export default app;
export { ensureDatabaseConnections }; 
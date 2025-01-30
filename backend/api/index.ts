import { VercelRequest, VercelResponse } from '@vercel/node';
import { debugLog } from '../src/utils/debug';
import cors from 'cors';

const corsMiddleware = cors({
    origin: 'https://www.buildableblog.pro',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle CORS
    await new Promise((resolve, reject) => {
        corsMiddleware(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });

    // Log request
    console.log(`[API] ${req.method} ${req.url}`);
    debugLog.server(`API Request: ${req.method} ${req.url}`);

    return res.status(200).json({
        message: 'API is running',
        timestamp: new Date().toISOString(),
        path: req.url,
        method: req.method
    });
} 
import { VercelRequest, VercelResponse } from '@vercel/node';
import { debugLog } from '../src/utils/debug';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Log the health check request
    console.log('Health check endpoint hit:', {
        method: req.method,
        url: req.url,
        headers: req.headers
    });

    try {
        console.log('[Health Check] Endpoint called');
        debugLog.server('Health check endpoint called');
        
        const healthInfo = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            version: process.env.npm_package_version || '1.0.0'
        };

        return res.status(200).json(healthInfo);
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        debugLog.error('health-check', err);
        
        return res.status(500).json({
            error: 'Health Check Failed',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
        });
    }
} 
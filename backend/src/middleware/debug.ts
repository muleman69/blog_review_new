import { Request, Response, NextFunction } from 'express';
import { debugLog, dumpState } from '../utils/debug';

export function debugMiddleware(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    // Log request start
    debugLog.server(`[${requestId}] Request started: ${req.method} ${req.url}`);
    debugLog.server(`[${requestId}] Headers: ${JSON.stringify(req.headers)}`);
    debugLog.server(`[${requestId}] Query: ${JSON.stringify(req.query)}`);
    debugLog.server(`[${requestId}] Body: ${JSON.stringify(req.body)}`);
    debugLog.server(`[${requestId}] System State: ${JSON.stringify(dumpState())}`);

    // Log response
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        debugLog.server(`[${requestId}] Response completed in ${responseTime}ms`);
        debugLog.server(`[${requestId}] Status: ${res.statusCode}`);
        debugLog.server(`[${requestId}] Headers: ${JSON.stringify(res.getHeaders())}`);
        
        if (res.statusCode >= 400) {
            debugLog.error('response', {
                requestId,
                method: req.method,
                url: req.url,
                status: res.statusCode,
                responseTime
            });
        }
    });

    next();
} 
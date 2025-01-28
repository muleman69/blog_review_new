import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { debugLog } from '../utils/debug';
import { validateAuthConfig } from '../config';

interface JwtPayload {
    id: string;
    email: string;
    role?: string;
}

export const auth = function(req: Request, res: Response, next: NextFunction): void {
    try {
        // Validate JWT configuration before processing
        validateAuthConfig();
        
        // Ensure JWT secret is configured
        if (!config.jwtSecret) {
            debugLog.error('auth', 'JWT secret is not configured');
            res.status(500).json({ error: 'Server configuration error' });
            return;
        }

        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        try {
            // Verify and decode token with type safety
            const decoded = jwt.verify(token, config.jwtSecret) as unknown;
            
            // Validate payload structure
            if (!isValidJwtPayload(decoded)) {
                throw new Error('Invalid token payload');
            }

            // Add user info to request
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role
            };

            next();
        } catch (err) {
            debugLog.error('auth', err);
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        debugLog.error('auth-middleware', err);
        res.status(500).json({
            error: 'Authentication Configuration Error',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
            timestamp: new Date().toISOString()
        });
        return;
    }
}

// Type guard for JWT payload
function isValidJwtPayload(payload: unknown): payload is JwtPayload {
    return (
        typeof payload === 'object' &&
        payload !== null &&
        'id' in payload &&
        'email' in payload &&
        typeof (payload as JwtPayload).id === 'string' &&
        typeof (payload as JwtPayload).email === 'string' &&
        (!('role' in payload) || typeof (payload as JwtPayload).role === 'string')
    );
}

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

// Role-based authorization middleware
export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!req.user.role || !roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }

        next();
    };
}; 
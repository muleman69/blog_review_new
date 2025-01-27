import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role?: string;
    };
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            res.status(401).json({ error: 'No authentication token provided' });
            return;
        }

        const decoded = jwt.verify(token, config.jwtSecret) as { id: string; email: string; role?: string };
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid authentication token' });
    }
};

export const authorize = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Please authenticate' });
            return;
        }

        if (!req.user.role || !roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        next();
    };
}; 
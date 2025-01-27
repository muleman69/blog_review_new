import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { User } from '../models/User';

interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        const decoded = jwt.verify(token, config.jwtSecret) as { id: string; email: string };
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid authentication token' });
    }
};

export const authorize = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Please authenticate' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        next();
    };
}; 
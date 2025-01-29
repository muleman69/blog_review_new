import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { debugLog } from '../utils/debug';
import config from '../config';

export function validateAuthConfig() {
  if (!config.jwtSecret) {
    const error = 'Missing required JWT_SECRET environment variable';
    debugLog.error(error);
    throw new Error(error);
  }
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    if (!config.jwtSecret) {
      debugLog.error('JWT_SECRET not configured');
      return res.status(500).json({ error: 'Authentication not configured' });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    debugLog.route('User authenticated', { userId: decoded.id, role: decoded.role });
    next();
  } catch (error) {
    debugLog.error('Authentication failed', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

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
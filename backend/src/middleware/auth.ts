import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { debugLog } from '../utils/debug';
import config from '../config/index';
import { IUser } from '../models/User';

// Extend Express Request type
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: IUser['role'];
  };
}

export function validateAuthConfig() {
  if (!config.jwtSecret) {
    const error = 'Missing required JWT_SECRET environment variable';
    debugLog.error(error);
    throw new Error(error);
  }
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    debugLog.route('Processing authentication', { 
      path: req.path,
      method: req.method,
      hasAuthHeader: !!req.headers.authorization
    });

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      debugLog.route('No authorization header found');
      res.status(401).json({ error: 'No authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      debugLog.route('No token found in authorization header');
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    if (!config.jwtSecret) {
      debugLog.error('JWT_SECRET not configured');
      res.status(500).json({ error: 'Authentication not configured' });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      email: string;
      role: IUser['role'];
    };

    req.user = decoded;
    debugLog.route('User authenticated', { 
      userId: decoded.id, 
      role: decoded.role,
      path: req.path
    });
    next();
  } catch (error) {
    debugLog.error('Authentication failed', error);
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
};

// Role-based authorization middleware
export const authorize = (roles: IUser['role'][]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    debugLog.route('Checking authorization', { 
      path: req.path,
      method: req.method,
      requiredRoles: roles,
      userRole: req.user?.role
    });

    if (!req.user) {
      debugLog.route('Authorization failed: No user found');
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!req.user.role || !roles.includes(req.user.role)) {
      debugLog.route('Authorization failed: Insufficient permissions', {
        userRole: req.user.role,
        requiredRoles: roles
      });
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    debugLog.route('Authorization successful', {
      userId: req.user.id,
      role: req.user.role,
      path: req.path
    });
    next();
  };
}; 
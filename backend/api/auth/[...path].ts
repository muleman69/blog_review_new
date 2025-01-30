import { VercelRequest, VercelResponse } from '@vercel/node';
import { debugLog } from '../../src/utils/debug';
import { ensureDatabaseConnections } from '../../src/server';
import { User } from '../../src/models/User';
import bcrypt from 'bcrypt';
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

    // Handle registration
    if (req.url?.endsWith('/register') && req.method === 'POST') {
        try {
            await ensureDatabaseConnections();
            
            const { email, password, role } = req.body;

            // Validate input
            if (!email || !password || !role) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'Email, password, and role are required'
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({
                    error: 'User already exists',
                    message: 'A user with this email already exists'
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create user
            const user = new User({
                email,
                password: hashedPassword,
                role
            });

            await user.save();

            // Return success without sensitive data
            return res.status(201).json({
                message: 'User registered successfully',
                user: {
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error: any) {
            debugLog.error('register', error);
            return res.status(500).json({
                error: 'Registration failed',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
            });
        }
    }

    // Handle 404 for unknown routes
    return res.status(404).json({ error: 'Route not found' });
} 
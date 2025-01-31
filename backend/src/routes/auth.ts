import express from 'express';
import { debugLog } from '../utils/debug';
import { ensureDatabaseConnections } from '../utils/db';
import { User } from '../models/User';
import bcrypt from 'bcrypt';

const router = express.Router();

// Debug middleware for auth routes
router.use((req, res, next) => {
    console.log('Auth Route Debug:');
    console.log('Path:', req.path);
    console.log('Method:', req.method);
    console.log('Body:', req.body);
    next();
});

// Middleware to ensure database connection
router.use(async (req, res, next) => {
    try {
        await ensureDatabaseConnections();
        next();
    } catch (error: any) {
        debugLog.error('auth-middleware', error);
        res.status(500).json({
            error: 'Database Connection Error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
        });
    }
});

// Registration endpoint
router.post('/register', async (req, res) => {
    console.log('Register endpoint hit');
    console.log('Request body:', req.body);
    
    try {
        const { email, password, role } = req.body;

        // Validate input
        if (!email || !password || !role) {
            console.log('Missing required fields:', { email: !!email, password: !!password, role: !!role });
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Email, password, and role are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists:', email);
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
        console.log('User created successfully:', email);

        // Return success without sensitive data
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                email: user.email,
                role: user.role
            }
        });
    } catch (error: any) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
        });
    }
});

export default router; 
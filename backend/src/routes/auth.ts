import express from 'express';
import { User } from '../models/User';
import bcrypt from 'bcrypt';

const router = express.Router();

// Debug middleware for auth routes
router.use((req, res, next) => {
    console.log('--------------------');
    console.log('Auth Route Accessed:');
    console.log('Full URL:', req.originalUrl);
    console.log('Base URL:', req.baseUrl);
    console.log('Path:', req.path);
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('--------------------');
    next();
});

// Registration endpoint
router.post('/register', async (req, res) => {
    console.log('Register endpoint hit');
    
    try {
        const { email, password, role } = req.body;

        // Input validation with detailed logging
        const validationErrors = [];
        if (!email) validationErrors.push('Email is required');
        if (!password) validationErrors.push('Password is required');
        if (!role) validationErrors.push('Role is required');
        if (!['writer', 'editor'].includes(role)) validationErrors.push('Invalid role');

        if (validationErrors.length > 0) {
            console.log('Validation errors:', validationErrors);
            return res.status(400).json({
                error: 'Validation failed',
                message: validationErrors.join(', '),
                details: validationErrors
            });
        }

        console.log('Checking for existing user:', email);
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(409).json({
                error: 'User exists',
                message: 'A user with this email already exists'
            });
        }

        console.log('Creating new user...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            email,
            password: hashedPassword,
            role,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await user.save();
        console.log('User created successfully:', { email, role });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error: any) {
        console.error('Registration error:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        // Handle specific database errors
        if (error.name === 'MongoError' || error.name === 'MongoServerError') {
            return res.status(503).json({
                error: 'Database error',
                message: 'Unable to complete registration. Please try again.'
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation error',
                message: 'Invalid input data',
                details: Object.values(error.errors).map((err: any) => err.message)
            });
        }

        res.status(500).json({
            error: 'Registration failed',
            message: 'Unable to complete registration. Please try again later.'
        });
    }
});

export default router; 
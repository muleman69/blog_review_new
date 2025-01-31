import { VercelRequest, VercelResponse } from '@vercel/node';
import { User } from '../../src/models/User';
import bcrypt from 'bcrypt';
import { ensureDatabaseConnections } from '../../src/utils/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Log the request
    console.log('Register endpoint hit:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
    });

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Ensure database connection
        await ensureDatabaseConnections();

        const { email, password, role } = req.body;

        // Input validation
        const validationErrors: string[] = [];
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

        // Check for existing user
        console.log('Checking for existing user:', email);
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(409).json({
                error: 'User exists',
                message: 'A user with this email already exists'
            });
        }

        // Create new user
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
} 
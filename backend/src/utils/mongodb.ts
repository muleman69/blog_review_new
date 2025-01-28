import mongoose from 'mongoose';
import { debugLog } from './debug';
import config from '../config';

let isConnecting = false;
let connectionPromise: Promise<void> | null = null;

export async function connectMongoDB(): Promise<void> {
    try {
        // If already connected or connecting, return existing promise
        if (mongoose.connection.readyState === 1) {
            debugLog.db('MongoDB already connected');
            return;
        }

        if (isConnecting && connectionPromise) {
            debugLog.db('MongoDB connection in progress, waiting...');
            return connectionPromise;
        }

        isConnecting = true;
        const sanitizedUri = config.mongoUri!.replace(/\/\/[^@]+@/, '//*****@');
        debugLog.db('Attempting to connect to MongoDB...');
        debugLog.db('MongoDB URI format:', sanitizedUri);

        const options = {
            ...config.db,
            ...(config.mongoUri!.includes('mongodb+srv') ? {
                retryWrites: true,
                retryReads: true,
                ssl: true,
                tls: true
            } : {})
        };

        mongoose.set('debug', process.env.NODE_ENV === 'development');
        
        connectionPromise = mongoose.connect(config.mongoUri!, options)
            .then(() => {
                debugLog.db('MongoDB connected successfully');
                setupMongoEventHandlers();
            })
            .catch((error) => {
                debugLog.error('mongodb', error);
                throw error;
            })
            .finally(() => {
                isConnecting = false;
                connectionPromise = null;
            });

        return connectionPromise;

    } catch (error) {
        isConnecting = false;
        connectionPromise = null;
        debugLog.error('mongodb', error);
        throw error;
    }
}

function setupMongoEventHandlers() {
    mongoose.connection.on('error', (err) => {
        debugLog.error('mongodb', err);
    });

    mongoose.connection.on('disconnected', () => {
        debugLog.db('MongoDB disconnected, attempting to reconnect...');
        connectMongoDB().catch(err => {
            debugLog.error('mongodb-reconnect', err);
        });
    });

    mongoose.connection.on('reconnected', () => {
        debugLog.db('MongoDB reconnected successfully');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
        try {
            await mongoose.connection.close();
            debugLog.db('MongoDB connection closed through app termination');
            process.exit(0);
        } catch (err) {
            debugLog.error('mongodb-shutdown', err);
            process.exit(1);
        }
    });
}

export function getMongoConnectionState(): string {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    return states[mongoose.connection.readyState] || 'unknown';
} 
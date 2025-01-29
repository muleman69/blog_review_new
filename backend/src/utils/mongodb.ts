import mongoose from 'mongoose';
import { debugLog } from './debug';
import config from '../config';

const mongoOptions = {
  maxPoolSize: 10,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4
};

export async function connectMongoDB() {
  try {
    debugLog.db('Connecting to MongoDB...', { uri: config.mongoUri });
    
    await mongoose.connect(config.mongoUri, mongoOptions);
    
    debugLog.db('MongoDB connected successfully');
    
    mongoose.connection.on('error', (error) => {
      debugLog.error('MongoDB connection error', error);
    });

    mongoose.connection.on('disconnected', () => {
      debugLog.db('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      debugLog.db('MongoDB reconnected');
    });

  } catch (error) {
    debugLog.error('Failed to connect to MongoDB', error);
    throw error;
  }
}

export function getMongoConnectionState(): string {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };
  return states[mongoose.connection.readyState] || 'unknown';
} 
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  port: process.env.PORT || 3001,
  mongoUri: process.env.MONGO_URI || '',
  redisUrl: process.env.REDIS_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'default-development-secret',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: process.env.NODE_ENV === 'production' 
    ? ['https://buildableblog.pro']
    : ['http://localhost:3000']
};

// Log config on startup (sanitized)
console.log('Loading configuration:', {
  nodeEnv: config.nodeEnv,
  port: config.port,
  mongoUri: config.mongoUri ? 'Set' : 'Not set',
  redisUrl: config.redisUrl ? 'Set' : 'Not set',
  jwtSecret: 'Hidden',
  corsOrigins: config.corsOrigins
});

export default config; 
import { debugLog } from '../utils/debug';

interface Config {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  redisUrl?: string;
  jwtSecret?: string;
}

function loadConfig(): Config {
  debugLog.server('Loading configuration');

  const config: Config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/blog_review',
    redisUrl: process.env.REDIS_URL,
    jwtSecret: process.env.JWT_SECRET
  };

  // Validate required configuration
  if (!config.mongoUri) {
    debugLog.error('Missing required MONGODB_URI environment variable');
    throw new Error('Missing required MONGODB_URI environment variable');
  }

  // Log configuration (excluding sensitive data)
  debugLog.server('Configuration loaded', {
    port: config.port,
    nodeEnv: config.nodeEnv,
    hasRedis: !!config.redisUrl,
    hasJwt: !!config.jwtSecret
  });

  return config;
}

export default loadConfig(); 
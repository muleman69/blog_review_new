import debug from 'debug';
import fs from 'fs';
import path from 'path';

// Create debug namespaces
const serverDebug = debug('server');
const routeDebug = debug('route');
const dbDebug = debug('db');
const errorDebug = debug('error');

// Enable all debug logs in development
if (process.env.NODE_ENV !== 'production') {
  debug.enable('server:*,route:*,db:*,error:*');
}

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file streams
const errorLogStream = fs.createWriteStream(path.join(logsDir, 'error.log'), { flags: 'a' });
const accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });

function formatLog(type: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  const logData = data ? `\n${JSON.stringify(data, null, 2)}` : '';
  return `[${timestamp}] [${type.toUpperCase()}] ${message}${logData}\n`;
}

export const debugLog = {
  server: (message: string, data?: any) => {
    const log = formatLog('SERVER', message, data);
    serverDebug(log);
    accessLogStream.write(log);
  },

  route: (message: string, data?: any) => {
    const log = formatLog('ROUTE', message, data);
    routeDebug(log);
    accessLogStream.write(log);
  },

  db: (message: string, data?: any) => {
    const log = formatLog('DB', message, data);
    dbDebug(log);
    accessLogStream.write(log);
  },

  error: (message: string, error?: Error | any) => {
    const errorData = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error;

    const log = formatLog('ERROR', message, errorData);
    errorDebug(log);
    errorLogStream.write(log);
  },

  request: (req: any, message: string) => {
    const requestData = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      body: req.body,
      ip: req.ip
    };

    const log = formatLog('REQUEST', message, requestData);
    routeDebug(log);
    accessLogStream.write(log);
  },

  response: (res: any, message: string) => {
    const responseData = {
      statusCode: res.statusCode,
      headers: res.getHeaders(),
      timestamp: new Date().toISOString()
    };

    const log = formatLog('RESPONSE', message, responseData);
    routeDebug(log);
    accessLogStream.write(log);
  }
};

export function dumpState() {
    return {
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version,
        debugEnabled: debug.enabled('app:*')
    };
} 
import debug from 'debug';

// Create namespaced debuggers
const dbDebug = debug('app:db');
const redisDebug = debug('app:redis');
const configDebug = debug('app:config');
const serverDebug = debug('app:server');

// Enable all debuggers in development
if (process.env.NODE_ENV !== 'production') {
    debug.enable('app:*');
}

export const debugLog = {
    db: dbDebug,
    redis: redisDebug,
    config: configDebug,
    server: serverDebug,
    error: (namespace: string, error: any) => {
        const errorDebug = debug(`app:error:${namespace}`);
        errorDebug(error);
        if (error instanceof Error) {
            errorDebug('Stack:', error.stack);
        }
        // Also log to console in production
        if (process.env.NODE_ENV === 'production') {
            console.error(`[${namespace}]`, error);
        }
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
        nodeVersion: process.version
    };
} 
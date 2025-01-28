import debug from 'debug';

// Create namespaced debuggers
const dbDebug = debug('app:db');
const redisDebug = debug('app:redis');
const configDebug = debug('app:config');
const serverDebug = debug('app:server');

// Always enable debuggers
debug.enable('app:*');

// Production logger that uses console.log
const productionLogger = (namespace: string, ...args: any[]) => {
    console.log(`[${namespace}]`, ...args);
};

export const debugLog = {
    db: process.env.NODE_ENV === 'production' ? (...args: any[]) => productionLogger('db', ...args) : dbDebug,
    redis: process.env.NODE_ENV === 'production' ? (...args: any[]) => productionLogger('redis', ...args) : redisDebug,
    config: process.env.NODE_ENV === 'production' ? (...args: any[]) => productionLogger('config', ...args) : configDebug,
    server: process.env.NODE_ENV === 'production' ? (...args: any[]) => productionLogger('server', ...args) : serverDebug,
    error: (namespace: string, error: any) => {
        if (process.env.NODE_ENV === 'production') {
            console.error(`[${namespace}]`, error);
            if (error instanceof Error) {
                console.error(`[${namespace}] Stack:`, error.stack);
            }
        } else {
            const errorDebug = debug(`app:error:${namespace}`);
            errorDebug(error);
            if (error instanceof Error) {
                errorDebug('Stack:', error.stack);
            }
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
        nodeVersion: process.version,
        debugEnabled: debug.enabled('app:*')
    };
} 
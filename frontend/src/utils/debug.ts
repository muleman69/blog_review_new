// Debug levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
  error?: Error;
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 100;

  constructor() {
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Promise', 'Unhandled rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });

    // Capture resource load errors
    window.addEventListener('error', (event) => {
      if (event.target && 'tagName' in event.target) {
        this.error('Resource', `Failed to load ${(event.target as HTMLElement).tagName}`, {
          src: (event.target as HTMLElement).getAttribute('src'),
          href: (event.target as HTMLElement).getAttribute('href')
        });
      }
    }, true);
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private addLog(level: LogLevel, component: string, message: string, data?: any, error?: Error) {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      component,
      message,
      data,
      error
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Always console log in development
    if (process.env.NODE_ENV === 'development') {
      console[level](
        `[${entry.timestamp}] [${level.toUpperCase()}] [${component}] ${message}`,
        data || '',
        error || ''
      );
    }
  }

  debug(component: string, message: string, data?: any) {
    this.addLog('debug', component, message, data);
  }

  info(component: string, message: string, data?: any) {
    this.addLog('info', component, message, data);
  }

  warn(component: string, message: string, data?: any) {
    this.addLog('warn', component, message, data);
  }

  error(component: string, message: string, error?: any) {
    this.addLog('error', component, message, undefined, error instanceof Error ? error : new Error(String(error)));
  }

  // Network request tracking
  logRequest(method: string, url: string, options?: RequestInit) {
    const requestId = Math.random().toString(36).substring(7);
    this.debug('Network', `Request ${requestId} started`, { method, url, options });
    
    return {
      requestId,
      logResponse: (response: Response) => {
        this.debug('Network', `Request ${requestId} completed`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
      },
      logError: (error: any) => {
        this.error('Network', `Request ${requestId} failed`, error);
      }
    };
  }

  // Get all logs for debugging
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }
}

export const debugLogger = new DebugLogger(); 
/**
 * Structured Logging Utility
 *
 * Provides consistent logging across the application with proper log levels,
 * context, and formatting.
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/app/lib/logger';
 *
 * logger.info('User started focus session', { taskId, duration: 60 });
 * logger.error('Failed to save task', error, { taskId, operation: 'save' });
 * logger.debug('Session state updated', { sessionId, isActive: true });
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private minLevel: LogLevel = this.isDevelopment ? 'debug' : 'info';

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.minLevel];
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      ...(context && { context }),
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    if (this.isDevelopment) {
      // Pretty console output for development
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];

      const color = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[34m', // Blue
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
      }[level];

      const reset = '\x1b[0m';

      console[level === 'debug' ? 'log' : level](
        `${emoji} ${color}[${level.toUpperCase()}]${reset} ${message}`,
        context || '',
        error || ''
      );
    } else {
      // Structured JSON for production (ready for log aggregation services)
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Log debug information (development only by default)
   * Use for detailed troubleshooting information
   */
  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  /**
   * Log informational messages
   * Use for general application flow (user actions, state changes)
   */
  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  /**
   * Log warnings
   * Use for recoverable issues or deprecated features
   */
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  /**
   * Log errors
   * Use for unrecoverable errors or exceptions
   */
  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, context, error);
  }

  /**
   * Set minimum log level
   * Useful for temporarily increasing verbosity for debugging
   */
  setMinLevel(level: LogLevel) {
    this.minLevel = level;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for mocking in tests
export { Logger };

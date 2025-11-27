// Logger Setup
// Strukturiertes Logging mit Winston

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

// Log-Level aus Environment Variable oder Default
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Log-Format für Development (farbig, lesbar)
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

// Log-Format für Production (JSON, strukturiert)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Transports
const transports: winston.transport[] = [
  // Console Transport (immer aktiv)
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  }),
];

// File Transports (nur in Production oder wenn LOG_TO_FILE gesetzt ist)
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
  const logsDir = path.resolve(rootDir, 'logs');
  
  // Error Logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined Logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Logger erstellen
export const logger = winston.createLogger({
  level: logLevel,
  format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  transports,
  // Keine Exceptions/Rejections loggen in Tests
  exceptionHandlers: process.env.NODE_ENV === 'test' ? [] : transports,
  rejectionHandlers: process.env.NODE_ENV === 'test' ? [] : transports,
});

// Helper Functions für verschiedene Log-Levels
export const log = {
  error: (message: string, meta?: Record<string, unknown>) => {
    logger.error(message, meta);
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    logger.warn(message, meta);
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    logger.info(message, meta);
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    logger.debug(message, meta);
  },
};

// Export default logger für direkten Zugriff
export default logger;


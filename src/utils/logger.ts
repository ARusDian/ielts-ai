// utils/logger.ts
import { createLogger, format, transports } from 'winston';
import path from 'path';
import fs from 'fs';

// Define log directory and file paths
const logDirectory: string = path.join(process.cwd(), 'logs');
const errorLogFile: string = path.join(logDirectory, 'error-log.txt');
const infoLogFile: string = path.join(logDirectory, 'info-log.txt');

// Create logs directory if it does not exist
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

// Configure the logger with both error and info transports
const logger = createLogger({
    level: 'info', // Log info and above (info, error)
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [
        // Log errors to error-log.txt
        new transports.File({
            filename: errorLogFile,
            level: 'error', // Only log errors
        }),
        // Log info and above (including errors) to info-log.txt
        new transports.File({
            filename: infoLogFile,
            level: 'info', // Log info and above
        }),
        // Optionally log to console as well
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
            ),
        })
    ],
});

export default logger;

// utils/logger.ts
import { createLogger, format, transports } from 'winston';
import path from 'path';
import fs from 'fs';

// Define log directory and file path
const logDirectory: string = path.join(process.cwd(), 'logs');
const logFile: string = path.join(logDirectory, 'error-log.txt');

// Create logs directory if it does not exist
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

// Configure the logger
const logger = createLogger({
    level: 'error', // Log only errors
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [
        new transports.File({
            filename: logFile, // Log to error-log.txt
            level: 'error',    // Only log errors
        })
    ],
});

export default logger;

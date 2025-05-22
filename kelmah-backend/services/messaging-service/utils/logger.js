/**
 * Logger utility
 * Configures Winston logger for the messaging service
 */

const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Define colors for each log level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Add colors to Winston
winston.addColors(colors);

// Define the format for the timestamp
const timestampFormat = winston.format.timestamp({
  format: 'YYYY-MM-DD HH:mm:ss'
});

// Define the format of the log message
const format = winston.format.combine(
  timestampFormat,
  winston.format.printf((info) => {
    return `${info.timestamp} [${info.level}]: ${info.message}`;
  })
);

// Define which transports to use for the logger
const transports = [
  // Console transport for all logs
    new winston.transports.Console({
      format: winston.format.combine(
      winston.format.colorize({ all: true }),
      format
    )
  }),
  
  // File transport for error logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format
  }),
  
  // File transport for all logs
    new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format
  })
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports
});

module.exports = logger; 
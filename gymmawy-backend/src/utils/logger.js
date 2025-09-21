import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Request logger middleware
export const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  const logEntry = {
    timestamp,
    method,
    url,
    ip,
    userAgent,
    statusCode: res.statusCode
  };
  
  // Log to console
  console.log(`[${timestamp}] ${method} ${url} - ${ip} - ${userAgent}`);
  
  // Log to file
  const logFile = path.join(logsDir, 'requests.log');
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  
  next();
};

// Error logger middleware
export const errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  const errorEntry = {
    timestamp,
    method,
    url,
    ip,
    userAgent,
    error: {
      message: err.message,
      stack: err.stack,
      status: err.status || 500
    }
  };
  
  // Log to console
  console.error(`[${timestamp}] ERROR ${method} ${url} - ${ip} - ${err.message}`);
  
  // Log to file
  const errorFile = path.join(logsDir, 'errors.log');
  fs.appendFileSync(errorFile, JSON.stringify(errorEntry) + '\n');
  
  next(err);
};

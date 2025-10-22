import fs from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LOG_FILES = 5; // Keep 5 rotated files
const LOG_RETENTION_DAYS = 30; // Keep logs for 30 days

/**
 * Rotate log file if it exceeds max size
 */
export function rotateLogFile(logFilePath) {
  try {
    const stats = fs.statSync(logFilePath);
    
    if (stats.size > MAX_LOG_SIZE) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedPath = `${logFilePath}.${timestamp}`;
      
      // Rename current file to rotated version
      fs.renameSync(logFilePath, rotatedPath);
      
      // Create new empty log file
      fs.writeFileSync(logFilePath, '');
      
      console.log(`[LOG_ROTATION] Rotated log file: ${path.basename(logFilePath)}`);
      
      // Clean up old rotated files
      cleanupOldLogs(logFilePath);
    }
  } catch (error) {
    console.error('[LOG_ROTATION] Error rotating log file:', error.message);
  }
}

/**
 * Clean up old rotated log files
 */
function cleanupOldLogs(originalLogPath) {
  try {
    const logDir = path.dirname(originalLogPath);
    const logFileName = path.basename(originalLogPath);
    const files = fs.readdirSync(logDir);
    
    // Find all rotated files for this log
    const rotatedFiles = files
      .filter(file => file.startsWith(`${logFileName}.`))
      .map(file => ({
        name: file,
        path: path.join(logDir, file),
        stats: fs.statSync(path.join(logDir, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime); // Sort by modification time, newest first
    
    // Keep only the most recent files
    if (rotatedFiles.length > MAX_LOG_FILES) {
      const filesToDelete = rotatedFiles.slice(MAX_LOG_FILES);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`[LOG_ROTATION] Deleted old log file: ${file.name}`);
      });
    }
    
    // Delete files older than retention period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - LOG_RETENTION_DAYS);
    
    rotatedFiles.forEach(file => {
      if (file.stats.mtime < cutoffDate) {
        fs.unlinkSync(file.path);
        console.log(`[LOG_ROTATION] Deleted expired log file: ${file.name}`);
      }
    });
    
  } catch (error) {
    console.error('[LOG_ROTATION] Error cleaning up old logs:', error.message);
  }
}

/**
 * Initialize log rotation for all log files
 */
export function initializeLogRotation() {
  const logFiles = ['requests.log', 'errors.log'];
  
  logFiles.forEach(logFile => {
    const logPath = path.join(logsDir, logFile);
    
    // Check if log file exists and rotate if needed
    if (fs.existsSync(logPath)) {
      rotateLogFile(logPath);
    }
  });
  
  // Set up periodic cleanup (daily at 2 AM)
  const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours
  setInterval(() => {
    console.log('[LOG_ROTATION] Running daily log cleanup...');
    logFiles.forEach(logFile => {
      const logPath = path.join(logsDir, logFile);
      if (fs.existsSync(logPath)) {
        cleanupOldLogs(logPath);
      }
    });
  }, cleanupInterval);
}

/**
 * Get log file size in MB
 */
export function getLogFileSize(logFileName) {
  try {
    const logPath = path.join(logsDir, logFileName);
    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath);
      return (stats.size / (1024 * 1024)).toFixed(2);
    }
    return 0;
  } catch (error) {
    console.error('[LOG_ROTATION] Error getting log file size:', error.message);
    return 0;
  }
}

/**
 * Get log statistics
 */
export function getLogStats() {
  const stats = {
    requests: {
      size: getLogFileSize('requests.log'),
      count: 0
    },
    errors: {
      size: getLogFileSize('errors.log'),
      count: 0
    }
  };
  
  // Count log entries (approximate)
  try {
    const requestsPath = path.join(logsDir, 'requests.log');
    if (fs.existsSync(requestsPath)) {
      const content = fs.readFileSync(requestsPath, 'utf8');
      stats.requests.count = (content.match(/\n/g) || []).length;
    }
    
    const errorsPath = path.join(logsDir, 'errors.log');
    if (fs.existsSync(errorsPath)) {
      const content = fs.readFileSync(errorsPath, 'utf8');
      stats.errors.count = (content.match(/\n/g) || []).length;
    }
  } catch (error) {
    console.error('[LOG_ROTATION] Error counting log entries:', error.message);
  }
  
  return stats;
}

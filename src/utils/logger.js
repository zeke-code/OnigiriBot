const winston = require('winston');
const fs = require('fs');

// Log file paths
const errorLogPath = 'error.log';
const combinedLogPath = 'combined.log';

// Function to reset log files
const resetLogFile = (filePath) => {
  fs.writeFileSync(filePath, ''); // Overwrites the file with empty content
};

// Reset log files at startup
resetLogFile(errorLogPath);
resetLogFile(combinedLogPath);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.errors({stack: true}),
      winston.format.splat(),
      winston.format.json(),
  ),
  defaultMeta: {service: 'OnigiriBot'},
  transports: [
    new winston.transports.File({filename: errorLogPath, level: 'error'}),
    new winston.transports.File({filename: combinedLogPath}),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;

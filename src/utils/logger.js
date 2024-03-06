const winston = require('winston');
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const errorLogPath = path.join(__dirname, '../../logs/error.log');
const combinedLogPath = path.join(__dirname, '../../logs/combined.log');

const resetLogFile = (filePath) => {
  fs.writeFileSync(filePath, '');
};
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

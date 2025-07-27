import winston from "winston";

export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
        }),
        new winston.transports.File({
          filename: "logs/combined.log",
        }),
      ],
    });
  }

  info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  error(message: string, error?: any) {
    this.logger.error(message, error);
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any) {
    this.logger.debug(message, meta);
  }
}

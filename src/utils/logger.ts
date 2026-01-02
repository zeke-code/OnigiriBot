import winston from "winston";

const isProduction = process.env.NODE_ENV === "production";

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaString = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : "";
    return `${timestamp} [${level}]: ${message} ${stack || ""} ${metaString}`;
  }),
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isProduction ? prodFormat : devFormat,
  }),
];

const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  defaultMeta: { service: "onigiribot" },
  transports,
});

export default logger;

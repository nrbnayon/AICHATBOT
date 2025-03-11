"use strict";
// src/shared/logger.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = __importDefault(require("../config"));
// Define log format
const { combine, timestamp, label, printf } = winston_1.default.format;
const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});
// Create a console-only logger for Vercel environment
const logger = winston_1.default.createLogger({
    level: config_1.default.node_env === 'development' ? 'debug' : 'info',
    format: combine(label({ label: 'AI-CHATBOT' }), timestamp(), myFormat),
    transports: [new winston_1.default.transports.Console()],
});
exports.logger = logger;
// Create error logger (also console-only for Vercel)
const errorLogger = winston_1.default.createLogger({
    level: 'error',
    format: combine(label({ label: 'AI-CHATBOT-ERROR' }), timestamp(), myFormat),
    transports: [new winston_1.default.transports.Console()],
});
exports.errorLogger = errorLogger;
// import path from 'path';
// import DailyRotateFile from 'winston-daily-rotate-file';
// const { createLogger, format, transports } = require('winston');
// const { combine, timestamp, label, printf } = format;
// const myFormat = printf(
//   ({
//     level,
//     message,
//     label,
//     timestamp,
//   }: {
//     level: string;
//     message: string;
//     label: string;
//     timestamp: Date;
//   }) => {
//     const date = new Date(timestamp);
//     const hour = date.getHours();
//     const minutes = date.getMinutes();
//     const seconds = date.getSeconds();
//     return `${date.toDateString()} ${hour}:${minutes}:${seconds} [${label}] ${level}: ${message}`;
//   }
// );
// const logger = createLogger({
//   level: 'info',
//   format: combine(label({ label: 'AiChatBot' }), timestamp(), myFormat),
//   transports: [
//     new transports.Console(),
//     new DailyRotateFile({
//       filename: path.join(
//         process.cwd(),
//         'winston',
//         'success',
//         '%DATE%-success.log'
//       ),
//       datePattern: 'DD-MM-YYYY-HH',
//       maxSize: '20m',
//       maxFiles: '1d',
//     }),
//   ],
// });
// const errorLogger = createLogger({
//   level: 'error',
//   format: combine(label({ label: 'AiChatBot' }), timestamp(), myFormat),
//   transports: [
//     new transports.Console(),
//     new DailyRotateFile({
//       filename: path.join(
//         process.cwd(),
//         'winston',
//         'error',
//         '%DATE%-error.log'
//       ),
//       datePattern: 'DD-MM-YYYY-HH',
//       maxSize: '20m',
//       maxFiles: '1d',
//     }),
//   ],
// });
// export { errorLogger, logger };

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = __importDefault(require("colors"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const DB_1 = __importDefault(require("./DB"));
const logger_1 = require("./shared/logger");
// Uncaught exception handler
process.on('uncaughtException', error => {
    logger_1.errorLogger.error('UnhandleException Detected', error);
    process.exit(1);
});
// Unhandled rejection handler
process.on('unhandledRejection', error => {
    logger_1.errorLogger.error('Unhandled Rejection Detected', error);
    process.exit(1);
});
// SIGTERM handler
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM IS RECEIVED');
});
// Connect to database (works in both serverless and development)
let isConnected = false;
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    if (isConnected) {
        logger_1.logger.info('MongoDB is already connected');
        return;
    }
    try {
        yield mongoose_1.default.connect(config_1.default.database.mongodb_uri);
        isConnected = true;
        logger_1.logger.info(colors_1.default.green('🚀 Database connected successfully'));
        // Only seed admin in development environment
        if (process.env.NODE_ENV !== 'production') {
            (0, DB_1.default)();
        }
    }
    catch (error) {
        logger_1.errorLogger.error(colors_1.default.red('🤢 Failed to connect Database'), error);
    }
});
// Connect to database
connectDB();
// Start server only in development environment
if (process.env.NODE_ENV !== 'production') {
    const port = typeof config_1.default.port === 'number' ? config_1.default.port : Number(config_1.default.port);
    app_1.default.listen(port, config_1.default.ip_address, () => {
        logger_1.logger.info(colors_1.default.yellow(`♻️   Application listening on port: ${config_1.default.port}`));
    });
}
exports.default = app_1.default;

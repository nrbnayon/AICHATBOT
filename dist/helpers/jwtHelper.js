"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtHelper = void 0;
// src\helpers\jwtHelper.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const createToken = (payload, secret, expireTime) => {
    const options = {
        expiresIn: expireTime,
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
const verifyToken = (token, secret) => {
    try {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (error) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid token');
    }
};
const createAccessToken = (payload) => {
    if (!config_1.default.jwt.secret) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'JWT secret is not defined');
    }
    return createToken(payload, config_1.default.jwt.secret, config_1.default.jwt.expire_in);
};
const createRefreshToken = (payload) => {
    if (!config_1.default.jwt.refresh_secret) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'JWT refresh secret is not defined');
    }
    return createToken(payload, config_1.default.jwt.refresh_secret, config_1.default.jwt.refresh_expires_in);
};
exports.jwtHelper = {
    createToken,
    verifyToken,
    createAccessToken,
    createRefreshToken,
};

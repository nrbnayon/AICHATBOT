"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtHelper = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const createToken = (payload, secret, expireTime) => {
    const options = { expiresIn: expireTime };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
const verifyToken = (token, secret) => {
    try {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (error) {
        console.error('JWT verification failed:', error);
        return null;
    }
};
exports.jwtHelper = { createToken, verifyToken };

// src\helpers\jwtHelper.ts
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

const createToken = (
  payload: object,
  secret: string,
  expireTime: string
): string => {
  const options: SignOptions = { expiresIn: expireTime as SignOptions['expiresIn'] };
  return jwt.sign(payload, secret, options);
};

const verifyToken = (token: string, secret: string): JwtPayload | null => {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

export const jwtHelper = { createToken, verifyToken };

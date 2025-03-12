// src\helpers\jwtHelper.ts
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import config from '../config';
import ApiError from '../errors/ApiError';
import { StatusCodes } from 'http-status-codes';

const createToken = (
  payload: object,
  secret: string,
  expireTime: string
): string => {
  const options: SignOptions = {
    expiresIn: expireTime as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, secret, options);
};

const verifyToken = (token: string, secret: string): JwtPayload | null => {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token');
  }
};

const createAccessToken = (payload: object): string => {
  if (!config.jwt.secret) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'JWT secret is not defined'
    );
  }
  return createToken(payload, config.jwt.secret, config.jwt.expire_in);
};

const createRefreshToken = (payload: object): string => {
  if (!config.jwt.refresh_secret) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'JWT refresh secret is not defined'
    );
  }
  return createToken(
    payload,
    config.jwt.refresh_secret,
    config.jwt.refresh_expires_in
  );
};

export const jwtHelper = {
  createToken,
  verifyToken,
  createAccessToken,
  createRefreshToken,
};

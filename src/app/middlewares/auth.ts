import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import config from '../../config';
import ApiError from '../../errors/ApiError';
import { jwtHelper } from '../../helpers/jwtHelper';
import { User } from '../modules/user/user.model';

const auth =
  (...roles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenWithBearer = req.headers.authorization;
      const refreshToken = req.cookies?.refreshToken;

      if (!tokenWithBearer?.startsWith('Bearer ')) {
        throw new ApiError(
          StatusCodes.UNAUTHORIZED,
          'Invalid or missing token'
        );
      }
      const accessToken = tokenWithBearer.split(' ')[1];
      try {
        const verifyUser = jwtHelper.verifyToken(
          accessToken,
          config.jwt.secret as string
        ) as JwtPayload;

        req.user = verifyUser;

        if (roles.length && !roles.includes(verifyUser.role)) {
          throw new ApiError(
            StatusCodes.FORBIDDEN,
            "You don't have permission to access this API"
          );
        }

        return next();
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === 'TokenExpiredError' &&
          refreshToken
        ) {
          try {
            const decodedRefresh = jwt.verify(
              refreshToken,
              config.jwt.refresh_secret as string
            ) as JwtPayload;

            const user = await User.findById(decodedRefresh.id);
            if (!user) {
              throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not found');
            }

            const newAccessToken = jwtHelper.createToken(
              {
                id: user._id,
                role: user.role,
                email: user.email,
                name: user.name,
              },
              config.jwt.secret as string,
              config.jwt.expire_in as string
            );
            res.setHeader('New-Access-Token', newAccessToken);
            req.user = jwtHelper.verifyToken(
              newAccessToken,
              config.jwt.secret as string
            ) as JwtPayload;

            if (roles.length && !roles.includes(user.role)) {
              throw new ApiError(
                StatusCodes.FORBIDDEN,
                "You don't have permission to access this API"
              );
            }

            return next();
          } catch (refreshError) {
            throw new ApiError(
              StatusCodes.UNAUTHORIZED,
              'Session expired, please log in again'
            );
          }
        }

        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid access token');
      }
    } catch (error) {
      next(error);
    }
  };

export default auth;

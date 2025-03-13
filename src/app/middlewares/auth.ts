import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import config from '../../config';
import ApiError from '../../errors/ApiError';
import { jwtHelper } from '../../helpers/jwtHelper';
import { User } from '../modules/user/user.model';
import { USER_ROLES, USER_STATUS } from '../../enums/common';

export interface AuthRequest extends Request {
  user: {
    userId: string;
    role: USER_ROLES;
    email: string;
    name: string;
  };
}

const auth =
  (...roles: USER_ROLES[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Look for token in both cookies and Authorization header
      const accessToken =
        req.cookies?.accessToken ||
        (req.headers.authorization?.startsWith('Bearer ')
          ? req.headers.authorization.substring(7)
          : undefined);

      console.log('Auth middleware accessed, token present:', !!accessToken);
      console.log('Cookies received:', req.cookies);
      console.log('Authorization header:', req.headers.authorization);

      if (!accessToken) {
        throw new ApiError(
          StatusCodes.UNAUTHORIZED,
          'Invalid or missing token'
        );
      }

      try {
        // Verify the access token
        const decoded = jwtHelper.verifyToken<{
          userId: string;
          role: USER_ROLES;
          email: string;
          name: string;
        }>(accessToken, config.jwt.secret);

        console.log('Token decoded successfully:', decoded);

        // Check if the user exists and is active
        const user = await User.findById(decoded.userId);
        if (!user || user.status !== USER_STATUS.ACTIVE) {
          console.log('User check failed:', {
            userExists: !!user,
            userStatus: user?.status,
          });
          throw new ApiError(
            StatusCodes.UNAUTHORIZED,
            'User not found or inactive'
          );
        }

        // Check role permissions
        if (roles.length && !roles.includes(decoded.role)) {
          console.log('Role check failed:', {
            requiredRoles: roles,
            userRole: decoded.role,
          });
          throw new ApiError(
            StatusCodes.FORBIDDEN,
            "You don't have permission to access this API"
          );
        }

        // Attach user info to request
        (req as AuthRequest).user = decoded;
        console.log('User authenticated successfully:', decoded);
        return next();
      } catch (error) {
        console.log('Token verification failed:', (error as Error).message);
        // Handle expired access token
        if (error instanceof jwt.TokenExpiredError) {
          const refreshToken = req.cookies?.refreshToken;
          console.log(
            'Access token expired, checking refresh token:',
            !!refreshToken
          );
          if (!refreshToken) {
            throw new ApiError(
              StatusCodes.UNAUTHORIZED,
              'Refresh token required'
            );
          }

          try {
            // Verify refresh token
            const decodedRefresh = jwtHelper.verifyToken<{
              userId: string;
              role: USER_ROLES;
              email: string;
              name: string;
            }>(refreshToken, config.jwt.refresh_secret);

            console.log('Refresh token decoded successfully:', decodedRefresh);

            // Check if the user exists and is active
            const user = await User.findById(decodedRefresh.userId);
            if (!user || user.status !== USER_STATUS.ACTIVE) {
              console.log('User check with refresh token failed:', {
                userExists: !!user,
                userStatus: user?.status,
              });
              throw new ApiError(
                StatusCodes.UNAUTHORIZED,
                'User not found or inactive'
              );
            }

            // Check role permissions
            if (roles.length && !roles.includes(user.role)) {
              console.log('Role check with refresh token failed:', {
                requiredRoles: roles,
                userRole: user.role,
              });
              throw new ApiError(
                StatusCodes.FORBIDDEN,
                "You don't have permission to access this API"
              );
            }

            // Generate new access token
            const newAccessToken = jwtHelper.createToken(
              {
                userId: user._id.toString(),
                role: user.role,
                email: user.email,
                name: user.name,
              },
              config.jwt.secret,
              config.jwt.expire_in
            );

            console.log('New access token generated');

            // Set new access token in cookie
            res.cookie('accessToken', newAccessToken, {
              httpOnly: true,
              secure: config.node_env === 'production',
              sameSite: config.node_env === 'production' ? 'none' : 'lax',
              maxAge: 24 * 60 * 60 * 1000, // 24 hours
            });

            // Attach user info to request
            (req as AuthRequest).user = {
              userId: user._id.toString(),
              role: user.role,
              email: user.email,
              name: user.name,
            };

            console.log(
              'User authenticated with refresh token:',
              decodedRefresh
            );
            return next();
          } catch (refreshError) {
            console.log(
              'Refresh token verification failed:',
              (refreshError as Error).message
            );
            throw new ApiError(
              StatusCodes.UNAUTHORIZED,
              'Invalid refresh token'
            );
          }
        }
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid access token');
      }
    } catch (error) {
      console.log('Authentication middleware error:', (error as Error).message);
      next(error);
    }
  };

export default auth;

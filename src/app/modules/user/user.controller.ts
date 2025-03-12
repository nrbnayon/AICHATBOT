// src\app\modules\user\user.controller.ts
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';

const googleLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await UserService.googleLoginIntoDB(req.body);

      // Set JWT token in HTTP-only cookie
      res.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Login successful using Google authentication',
        data: result.user,
      });
    } catch (error) {
      next(error);
    }
  }
);

const microsoftLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await UserService.microsoftLoginIntoDB(req.body);

      res.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Login successful using Microsoft authentication',
        data: result.user,
      });
    } catch (error) {
      next(error);
    }
  }
);

const yahooLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await UserService.yahooLoginIntoDB(req.body);

      res.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Login successful using Yahoo authentication',
        data: result.user,
      });
    } catch (error) {
      next(error);
    }
  }
);

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.updateProfile(req.user?.userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile updated successfully',
    data: result,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  await UserService.logout(req.user?.userId);
  res.clearCookie('token');

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Logged out successfully',
    data: null,
  });
});

const getCurrentUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.getCurrentUser(req.user?.userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User retrieved successfully',
    data: user,
  });
});

const updateSubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.updateSubscription(
    req.user?.userId,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Subscription updated successfully',
    data: result,
  });
});

export const UserController = {
  googleLogin,
  microsoftLogin,
  yahooLogin,
  updateProfile,
  logout,
  getCurrentUser,
  updateSubscription,
};

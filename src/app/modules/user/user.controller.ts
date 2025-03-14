// src\app\modules\user\user.controller.ts
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';
import config from '../../../config';
import { AuthRequest } from '../../middlewares/auth';
import { jwtHelper } from '../../../helpers/jwtHelper';
import ApiError from '../../../errors/ApiError';

// Explicitly type cookieOptions to match Express CookieOptions
interface CookieOptions {
  httpOnly: boolean;
  secure: true;
  sameSite: 'none';
  maxAge?: number;
}
const setCookies = (
  res: Response,
  accessToken: string,
  refreshToken?: string
) => {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  };

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
};
const fetchEmails = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.userId;

  // Get provider from user record, not from query parameter
  const user = await UserService.getCurrentUser(userId);
  const provider = user.authProvider;

  console.log("Getting emails from user's provider:", provider);

  let emails;
  switch (provider) {
    case 'google':
      emails = await UserService.fetchGmailEmails(userId);
      break;
    case 'microsoft':
      emails = await UserService.fetchOutlookEmails(userId);
      break;
    case 'yahoo':
      emails = await UserService.fetchYahooEmails(userId);
      break;
    default:
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid provider');
  }

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: `Emails fetched successfully from ${provider}`,
    data: emails,
  });
});

const googleCallback = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  console.log('Google callback triggered, user:', user);

  if (!user) {
    console.log('No user in request after Google auth');
    return res.redirect(
      `${config.frontend.url}/login?error=${encodeURIComponent(
        'Authentication failed'
      )}`
    );
  }

  console.log('Google auth successful for user:', user.email);

  const accessToken = jwtHelper.createToken(
    {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      authProvider: user.authProvider,
    },
    config.jwt.secret,
    config.jwt.expire_in
  );

  const refreshToken = jwtHelper.createToken(
    {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      authProvider: user.authProvider,
    },
    config.jwt.refresh_secret,
    config.jwt.refresh_expires_in
  );

  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  };

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours,
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  console.log('Auth cookies set, redirecting to dashboard');
  return res.redirect(
    `${config.frontend.url}/login?token=${encodeURIComponent(
      accessToken
    )}&success=${encodeURIComponent('Google authentication successful')}`
  );
});

const microsoftCallback = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  console.log('Microsoft callback triggered, user:', user);

  if (!user) {
    console.log('No user in request after Microsoft auth');
    return res.redirect(
      `${config.frontend.url}/login?error=${encodeURIComponent(
        'Authentication failed'
      )}`
    );
  }

  const accessToken = jwtHelper.createToken(
    {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      authProvider: user.authProvider,
    },
    config.jwt.secret,
    config.jwt.expire_in
  );

  const refreshToken = jwtHelper.createToken(
    {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      authProvider: user.authProvider,
    },
    config.jwt.refresh_secret,
    config.jwt.refresh_expires_in
  );

  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  };

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours,
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  console.log('Auth cookies set, redirecting to dashboard');
  return res.redirect(
    `${config.frontend.url}/login?token=${encodeURIComponent(
      accessToken
    )}&success=${encodeURIComponent('Microsoft authentication successful')}`
  );
});

const yahooCallback = catchAsync(async (req: Request, res: Response) => {
  const { code } = req.query;
  console.log('Yahoo callback triggered, code:', code);

  if (!code) {
    console.log('Authorization code missing');
    return res.redirect(
      `${config.frontend.url}/login?error=${encodeURIComponent(
        'Authorization code missing'
      )}`
    );
  }

  try {
    const result = await UserService.yahooLoginIntoDB({
      code: code.toString(),
    });

    console.log('Yahoo auth successful, setting cookies');

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    };

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    console.log('Auth cookies set, redirecting to dashboard');
    return res.redirect(
      `${config.frontend.url}/login?token=${encodeURIComponent(
        result.accessToken
      )}&success=${encodeURIComponent('Yahoo authentication successful')}`
    );
  } catch (error) {
    console.log(
      'Yahoo auth failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return res.redirect(
      `${config.frontend.url}/login?error=${encodeURIComponent(
        error instanceof Error ? error.message : 'Authentication failed'
      )}`
    );
  }
});

const yahooLogin = catchAsync(async (req: Request, res: Response) => {
  console.log('Initiating Yahoo login');
  const yahooAuthUrl = `https://api.login.yahoo.com/oauth2/request_auth?client_id=${config.oauth.yahoo.client_id}&response_type=code&redirect_uri=${config.oauth.yahoo.redirect_uri}&scope=openid email profile mail-r`;
  res.redirect(yahooAuthUrl);
});

const localLogin = catchAsync(async (req: Request, res: Response) => {
  console.log('Local login attempt:', req.body.email);
  const result = await UserService.localLoginIntoDB(req.body);

  console.log('Local login successful, setting cookies');
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  };

  res.cookie('accessToken', result.accessToken, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  if (result.refreshToken) {
    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  console.log('Local login response sent');
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Login successful',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  console.log('Logout attempt for user:', authReq.user?.userId);
  await UserService.logout(authReq.user?.userId);

  console.log('Clearing auth cookies');
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  };

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);

  console.log('Logout successful');
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Logged out successfully',
    data: null,
  });
});

const getCurrentUser = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  console.log('Getting current user for ID:', authReq.user?.userId);
  const user = await UserService.getCurrentUser(authReq.user?.userId);
  console.log('Current user retrieved:', user.email);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User retrieved successfully',
    data: user,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  console.log('Refresh token attempt');
  const result = await UserService.refreshToken(refreshToken);

  console.log('Setting new access token cookie');
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  };

  res.cookie('accessToken', result.accessToken, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  console.log('Token refresh successful');
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Token refreshed successfully',
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  console.log('Profile update attempt for user:', authReq.user?.userId);
  const result = await UserService.updateProfile(
    authReq.user?.userId,
    req.body
  );
  console.log('Profile updated successfully');
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile updated successfully',
    data: result,
  });
});

const updateSubscription = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  console.log('Subscription update attempt for user:', authReq.user?.userId);
  const result = await UserService.updateSubscription(
    authReq.user?.userId,
    req.body
  );
  console.log('Subscription updated successfully');
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Subscription updated successfully',
    data: result,
  });
});

export const UserController = {
  googleCallback,
  microsoftCallback,
  yahooLogin,
  yahooCallback,
  localLogin,
  refreshToken,
  logout,
  getCurrentUser,
  updateProfile,
  updateSubscription,
  fetchEmails,
};

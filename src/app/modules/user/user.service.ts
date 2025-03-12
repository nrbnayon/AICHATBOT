// src\app\modules\user\user.service.ts
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import ApiError from '../../../errors/ApiError';
import { jwtHelper } from '../../../helpers/jwtHelper';
import config from '../../../config';
import { AUTH_PROVIDER, USER_STATUS } from '../../../enums/common';
import { IUser } from './user.interface';
import { User } from './user.model';
import { google } from 'googleapis';
import axios from 'axios';
import { encryptionHelper } from '../../../helpers/encryptionHelper';

// OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  config.oauth.google.client_id,
  config.oauth.google.client_secret,
  config.oauth.google.redirect_uri
);

const refreshGoogleToken = async (userId: string) => {
  const user = await User.findById(userId).select('+refreshToken');
  if (!user || !user.refreshToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'No refresh token available');
  }

  try {
    const decryptedToken = encryptionHelper.decrypt(user.refreshToken);
    oauth2Client.setCredentials({ refresh_token: decryptedToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

    user.googleAccessToken = credentials.access_token
      ? encryptionHelper.encrypt(credentials.access_token)
      : undefined;

    if (credentials.refresh_token) {
      user.refreshToken = encryptionHelper.encrypt(credentials.refresh_token);
    }

    await user.save();
    return credentials.access_token;
  } catch (error) {
    console.error('Token refresh error:', error);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to refresh token'
    );
  }
};

const googleLoginIntoDB = async (payload: any) => {
  const { code } = payload;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const { data } = await oauth2.userinfo.get();

    if (!data.email) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Email not provided by Google'
      );
    }

    // Check if user exists with this email
    let user = await User.isExistUserByEmail(data.email);

    if (user) {
      // Update existing user's Google credentials
      user.googleId = data.id ?? undefined;
      user.googleAccessToken = tokens.access_token
        ? encryptionHelper.encrypt(tokens.access_token)
        : undefined;

      if (tokens.refresh_token) {
        user.refreshToken = tokens.refresh_token
          ? encryptionHelper.encrypt(tokens.refresh_token)
          : undefined;
      }
      user.authProvider = AUTH_PROVIDER.GOOGLE;
      user.lastSync = new Date(); // Update lastSync
      await user.save();
    } else {
      // Create new user with encrypted tokens
      user = await User.create({
        email: data.email,
        name: data.name,
        image: data.picture,
        authProvider: AUTH_PROVIDER.GOOGLE,
        googleId: data.id,
        googleAccessToken: tokens.access_token
          ? encryptionHelper.encrypt(tokens.access_token)
          : undefined,
        refreshToken: tokens.refresh_token
          ? encryptionHelper.encrypt(tokens.refresh_token)
          : undefined,
        verified: true,
        status: USER_STATUS.ACTIVE,
        lastSync: new Date(),
      });
    }

    // Generate JWT token
    const accessToken = jwtHelper.createToken(
      { userId: user._id },
      config.jwt.secret as string,
      config.jwt.expire_in as string
    );

    return {
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      },
    };
  } catch (error) {
    console.error('Authentication error:', error);
    if (axios.isAxiosError(error)) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to authenticate with provider: ${
          error.response?.data?.error || error.message
        }`
      );
    }
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to authenticate with provider: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};

const refreshMicrosoftToken = async (userId: string) => {
  const user = await User.findById(userId).select('+refreshToken');
  if (!user || !user.refreshToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'No refresh token available');
  }

  try {
    const decryptedToken = encryptionHelper.decrypt(user.refreshToken);

    // Request new access token using refresh token
    const tokenResponse = await axios.post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      new URLSearchParams({
        client_id: config.oauth.microsoft.client_id as string,
        client_secret: config.oauth.microsoft.client_secret as string,
        refresh_token: decryptedToken,
        grant_type: 'refresh_token',
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Update tokens in database
    user.microsoftAccessToken = tokenResponse.data.access_token
      ? encryptionHelper.encrypt(tokenResponse.data.access_token)
      : undefined;

    if (tokenResponse.data.refresh_token) {
      user.refreshToken = encryptionHelper.encrypt(
        tokenResponse.data.refresh_token
      );
    }

    user.lastSync = new Date();
    await user.save();
    return tokenResponse.data.access_token;
  } catch (error) {
    console.error('Microsoft token refresh error:', error);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to refresh Microsoft token'
    );
  }
};

const refreshYahooToken = async (userId: string) => {
  const user = await User.findById(userId).select('+refreshToken');
  if (!user || !user.refreshToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'No refresh token available');
  }

  try {
    const decryptedToken = encryptionHelper.decrypt(user.refreshToken);

    // Request new access token using refresh token
    const tokenResponse = await axios.post(
      'https://api.login.yahoo.com/oauth2/get_token',
      new URLSearchParams({
        client_id: config.oauth.yahoo.client_id as string,
        client_secret: config.oauth.yahoo.client_secret as string,
        refresh_token: decryptedToken,
        grant_type: 'refresh_token',
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Update tokens in database
    user.yahooAccessToken = tokenResponse.data.access_token
      ? encryptionHelper.encrypt(tokenResponse.data.access_token)
      : undefined;

    if (tokenResponse.data.refresh_token) {
      user.refreshToken = encryptionHelper.encrypt(
        tokenResponse.data.refresh_token
      );
    }

    user.lastSync = new Date();
    await user.save();
    return tokenResponse.data.access_token;
  } catch (error) {
    console.error('Yahoo token refresh error:', error);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to refresh Yahoo token'
    );
  }
};

const microsoftLoginIntoDB = async (payload: any) => {
  const { code } = payload;

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      new URLSearchParams({
        client_id: config.oauth.microsoft.client_id as string,
        client_secret: config.oauth.microsoft.client_secret as string,
        code,
        redirect_uri: config.oauth.microsoft.redirect_uri as string,
        grant_type: 'authorization_code',
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Get user info from Microsoft Graph API
    const userResponse = await axios.get(
      'https://graph.microsoft.com/v1.0/me',
      {
        headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
      }
    );

    const { id, mail, displayName } = userResponse.data;

    if (!mail) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Email not provided by Microsoft'
      );
    }

    // Check if user exists
    let user = await User.isExistUserByEmail(mail);

    if (user) {
      // Update existing user's Microsoft credentials
      user.microsoftId = id;
      user.microsoftAccessToken = encryptionHelper.encrypt(
        tokenResponse.data.access_token
      );
      if (tokenResponse.data.refresh_token) {
        user.refreshToken = encryptionHelper.encrypt(
          tokenResponse.data.refresh_token
        );
      }
      user.authProvider = AUTH_PROVIDER.MICROSOFT;
      user.lastSync = new Date();
      await user.save();
    } else {
      // Create new user with encrypted tokens
      user = await User.create({
        email: mail,
        name: displayName,
        authProvider: AUTH_PROVIDER.MICROSOFT,
        microsoftId: id,
        microsoftAccessToken: encryptionHelper.encrypt(
          tokenResponse.data.access_token
        ),
        refreshToken: tokenResponse.data.refresh_token
          ? encryptionHelper.encrypt(tokenResponse.data.refresh_token)
          : undefined,
        verified: true,
        status: USER_STATUS.ACTIVE,
        lastSync: new Date(),
      });
    }

    // Generate JWT token
    const accessToken = jwtHelper.createToken(
      { userId: user._id },
      config.jwt.secret as string,
      config.jwt.expire_in as string
    );

    return {
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      },
    };
  } catch (error) {
    console.error('Authentication error:', error);
    if (axios.isAxiosError(error)) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to authenticate with provider: ${
          error.response?.data?.error || error.message
        }`
      );
    }
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to authenticate with provider: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};

const yahooLoginIntoDB = async (payload: any) => {
  const { code } = payload;

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post(
      'https://api.login.yahoo.com/oauth2/get_token',
      new URLSearchParams({
        client_id: config.oauth.yahoo.client_id as string,
        client_secret: config.oauth.yahoo.client_secret as string,
        code,
        redirect_uri: config.oauth.yahoo.redirect_uri as string,
        grant_type: 'authorization_code',
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Get user info
    const userResponse = await axios.get(
      'https://api.login.yahoo.com/openid/v1/userinfo',
      {
        headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
      }
    );

    const { sub, email, name } = userResponse.data;

    if (!email) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Email not provided by Yahoo'
      );
    }

    // Check if user exists
    let user = await User.isExistUserByEmail(email);

    if (user) {
      // Update existing user's Yahoo credentials
      user.yahooId = sub;
      user.yahooAccessToken = encryptionHelper.encrypt(
        tokenResponse.data.access_token
      );
      if (tokenResponse.data.refresh_token) {
        user.refreshToken = encryptionHelper.encrypt(
          tokenResponse.data.refresh_token
        );
      }
      user.authProvider = AUTH_PROVIDER.YAHOO;
      user.lastSync = new Date();
      await user.save();
    } else {
      // Create new user with encrypted tokens
      user = await User.create({
        email,
        name,
        authProvider: AUTH_PROVIDER.YAHOO,
        yahooId: sub,
        yahooAccessToken: encryptionHelper.encrypt(
          tokenResponse.data.access_token
        ),
        refreshToken: tokenResponse.data.refresh_token
          ? encryptionHelper.encrypt(tokenResponse.data.refresh_token)
          : undefined,
        verified: true,
        status: USER_STATUS.ACTIVE,
        lastSync: new Date(),
      });
    }

    // Generate JWT token
    const accessToken = jwtHelper.createToken(
      { userId: user._id },
      config.jwt.secret as string,
      config.jwt.expire_in as string
    );

    return {
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      },
    };
  } catch (error) {
    console.error('Authentication error:', error);
    if (axios.isAxiosError(error)) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to authenticate with provider: ${
          error.response?.data?.error || error.message
        }`
      );
    }
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to authenticate with provider: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};

const updateProfile = async (userId: string, profileData: Partial<IUser>) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // Only allow updating specific fields
  const allowedUpdates = [
    'name',
    'phone',
    'address',
    'country',
    'gender',
    'dateOfBirth',
  ] as const;

  // Create a type-safe version of the allowed updates
  type AllowedUpdateKeys = (typeof allowedUpdates)[number];

  // Filter out any fields that aren't in allowedUpdates
  const filteredData = Object.keys(profileData).reduce((acc, key) => {
    if (allowedUpdates.includes(key as AllowedUpdateKeys)) {
      // Type assertion to handle the index signature issue
      (acc as any)[key] = profileData[key as keyof typeof profileData];
    }
    return acc;
  }, {} as Partial<IUser>);

  // Update user with filtered data
  Object.assign(user, filteredData);

  // Update lastSync timestamp
  user.lastSync = new Date();

  await user.save();
  return user;
};

const logout = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // Clear OAuth tokens
  user.googleAccessToken = undefined;
  user.microsoftAccessToken = undefined;
  user.yahooAccessToken = undefined;
  user.refreshToken = undefined;
  user.lastSync = new Date();
  await user.save();

  return null;
};

const getCurrentUser = async (userId: string) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return user;
};

// In updateSubscription method
const updateSubscription = async (userId: string, subscriptionData: any) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // Define plan types with type safety
  type SubscriptionPlan = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';

  // If plan is changing, update end date accordingly
  if (
    subscriptionData.plan &&
    subscriptionData.plan !== user.subscription.plan
  ) {
    // Calculate new end date based on plan with type-safe index
    const endDateMap: Record<SubscriptionPlan, Date> = {
      FREE: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      BASIC: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      PRO: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      ENTERPRISE: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
    };

    subscriptionData.startDate = new Date();
    subscriptionData.endDate =
      endDateMap[subscriptionData.plan as SubscriptionPlan];
    subscriptionData.status = 'ACTIVE';
  }

  user.subscription = {
    ...user.subscription,
    ...subscriptionData,
  };

  user.lastSync = new Date();
  await user.save();
  return user;
};

export const UserService = {
  googleLoginIntoDB,
  microsoftLoginIntoDB,
  yahooLoginIntoDB,
  refreshGoogleToken,
  refreshMicrosoftToken,
  refreshYahooToken,
  updateProfile,
  logout,
  getCurrentUser,
  updateSubscription,
};

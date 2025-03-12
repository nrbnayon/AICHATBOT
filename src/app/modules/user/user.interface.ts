import { Document, Model } from 'mongoose';
import {
  AUTH_PROVIDER,
  USER_GENDER,
  USER_ROLES,
  USER_STATUS,
} from '../../../enums/common';

export type IUserSubscription = {
  plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  autoRenew: boolean;
};

export interface IUser extends Document {
  _id: string;
  role: USER_ROLES;
  name: string;
  email: string;
  authProvider: AUTH_PROVIDER;
  image?: string;
  phone?: string;
  password?: string;
  address?: string;

  // OAuth IDs and tokens
  googleId?: string;
  microsoftId?: string;
  yahooId?: string;
  googleAccessToken?: string;
  microsoftAccessToken?: string;
  yahooAccessToken?: string;
  refreshToken?: string;

  // Additional user info
  country?: string;
  status: USER_STATUS;
  verified: boolean;
  gender: USER_GENDER;
  dateOfBirth: Date;
  isActive?: boolean;
  lastActiveAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  lastSync: Date;

  // Subscription info
  subscription: IUserSubscription;
}

export type UserModal = {
  isExistUserById(id: string): Promise<IUser | null>;
  isExistUserByEmail(email: string): Promise<IUser | null>;
  isExistUserByProvider(
    provider: AUTH_PROVIDER,
    providerId: string
  ): Promise<IUser | null>;
} & Model<IUser>;

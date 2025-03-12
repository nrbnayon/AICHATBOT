// src\app\modules\user\user.model.ts
import { model, Schema } from 'mongoose';
import {
  AUTH_PROVIDER,
  USER_GENDER,
  USER_ROLES,
  USER_STATUS,
} from '../../../enums/common';
import { IUser, UserModal } from './user.interface';

const userSubscriptionSchema = new Schema({
  plan: {
    type: String,
    enum: ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'],
    default: 'FREE',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
    default: 'ACTIVE',
  },
  autoRenew: {
    type: Boolean,
    default: true,
  },
});

const userSchema = new Schema<IUser, UserModal>(
  {
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    authProvider: {
      type: String,
      enum: Object.values(AUTH_PROVIDER),
      required: true,
    },
    image: String,
    phone: String,
    password: {
      type: String,
      select: 0,
    },
    address: String,

    // OAuth fields
    googleId: {
      type: String,
      sparse: true,
    },
    microsoftId: {
      type: String,
      sparse: true,
    },
    yahooId: {
      type: String,
      sparse: true,
    },
    googleAccessToken: {
      type: String,
      select: 0,
    },
    microsoftAccessToken: {
      type: String,
      select: 0,
    },
    yahooAccessToken: {
      type: String,
      select: 0,
    },
    refreshToken: {
      type: String,
      select: 0,
    },

    country: String,
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    gender: {
      type: String,
      enum: Object.values(USER_GENDER),
    },
    dateOfBirth: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActiveAt: Date,
    lastSync: {
      type: Date,
      default: Date.now,
    },
    subscription: {
      type: userSubscriptionSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.googleAccessToken;
        delete ret.microsoftAccessToken;
        delete ret.yahooAccessToken;
        delete ret.refreshToken;
        return ret;
      },
    },
  }
);

// Static methods
userSchema.statics.isExistUserById = async function (
  id: string
): Promise<IUser | null> {
  return await this.findById(id);
};

userSchema.statics.isExistUserByEmail = async function (
  email: string
): Promise<IUser | null> {
  return await this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.isExistUserByProvider = async function (
  provider: AUTH_PROVIDER,
  providerId: string
): Promise<IUser | null> {
  const query: any = {};
  switch (provider) {
    case AUTH_PROVIDER.GOOGLE:
      query.googleId = providerId;
      break;
    case AUTH_PROVIDER.MICROSOFT:
      query.microsoftId = providerId;
      break;
    case AUTH_PROVIDER.YAHOO:
      query.yahooId = providerId;
      break;
  }
  return await this.findOne(query);
};

export const User = model<IUser, UserModal>('User', userSchema);

// src\app\modules\user\user.validation.ts
import { z } from 'zod';
import {
  USER_GENDER,
} from '../../../enums/common';

// Common validation rules
const emailSchema = z
  .string({
    required_error: 'Email is required',
  })
  .email('Invalid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must not exceed 255 characters')
  .transform(val => val.toLowerCase().trim());

const nameSchema = z
  .string({
    required_error: 'Name is required',
  })
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')
  .trim();

const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional();

const addressSchema = z
  .string()
  .max(500, 'Address must not exceed 500 characters')
  .optional();

const countrySchema = z
  .string()
  .min(2, 'Country must be at least 2 characters')
  .max(100, 'Country must not exceed 100 characters')
  .optional();

const dateSchema = z
  .string()
  .refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid date format (expected ISO 8601)',
  })
  .transform(val => new Date(val))
  .optional();

// OAuth login schema
const oauthLoginSchema = z.object({
  body: z.object({
    code: z.string({
      required_error: 'Authorization code is required',
    }),
  }),
});

// Update profile schema
const updateProfileSchema = z.object({
  body: z
    .object({
      name: nameSchema.optional(),
      phone: phoneSchema,
      address: addressSchema,
      country: countrySchema,
      gender: z
        .enum([...Object.values(USER_GENDER)] as [string, ...string[]])
        .optional(),
      dateOfBirth: dateSchema,
    })
    .strict(),
});

// Update subscription schema
const updateSubscriptionSchema = z.object({
  body: z
    .object({
      plan: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']),
      autoRenew: z.boolean().optional(),
    })
    .strict(),
});

export const UserValidation = {
  oauthLoginSchema,
  updateProfileSchema,
  updateSubscriptionSchema,
};

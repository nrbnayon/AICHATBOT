"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidation = void 0;
// src\app\modules\user\user.validation.ts
const zod_1 = require("zod");
const common_1 = require("../../../enums/common");
// Common validation rules
const emailSchema = zod_1.z
    .string({
    required_error: 'Email is required',
})
    .email('Invalid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must not exceed 255 characters')
    .transform(val => val.toLowerCase().trim());
const nameSchema = zod_1.z
    .string({
    required_error: 'Name is required',
})
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim();
const phoneSchema = zod_1.z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional();
const addressSchema = zod_1.z
    .string()
    .max(500, 'Address must not exceed 500 characters')
    .optional();
const countrySchema = zod_1.z
    .string()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country must not exceed 100 characters')
    .optional();
const dateSchema = zod_1.z
    .string()
    .refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid date format (expected ISO 8601)',
})
    .transform(val => new Date(val))
    .optional();
// OAuth login schema
const oauthLoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string({
            required_error: 'Authorization code is required',
        }),
    }),
});
// Update profile schema
const updateProfileSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        name: nameSchema.optional(),
        phone: phoneSchema,
        address: addressSchema,
        country: countrySchema,
        gender: zod_1.z
            .enum([...Object.values(common_1.USER_GENDER)])
            .optional(),
        dateOfBirth: dateSchema,
    })
        .strict(),
});
// Update subscription schema
const updateSubscriptionSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        plan: zod_1.z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']),
        autoRenew: zod_1.z.boolean().optional(),
    })
        .strict(),
});
exports.UserValidation = {
    oauthLoginSchema,
    updateProfileSchema,
    updateSubscriptionSchema,
};

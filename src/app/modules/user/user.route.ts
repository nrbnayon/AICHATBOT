// src\app\modules\user\user.route.ts
import express from 'express';
import { UserController } from './user.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserValidation } from './user.validation';
import {
  apiLimiter,
  authLimiter,
} from '../../middlewares/rateLimit.middleware';
import { USER_ROLES } from '../../../enums/common';

const router = express.Router();

// OAuth routes
router.post(
  '/auth/google',
  authLimiter,
  validateRequest(UserValidation.oauthLoginSchema),
  UserController.googleLogin
);

router.post(
  '/auth/microsoft',
  authLimiter,
  validateRequest(UserValidation.oauthLoginSchema),
  UserController.microsoftLogin
);

router.post(
  '/auth/yahoo',
  authLimiter,
  validateRequest(UserValidation.oauthLoginSchema),
  UserController.yahooLogin
);

// User management routes
router.get(
  '/me',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  apiLimiter,
  UserController.getCurrentUser
);

router.patch(
  '/profile',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  apiLimiter,
  validateRequest(UserValidation.updateProfileSchema),
  UserController.updateProfile
);

router.post('/logout', auth(), apiLimiter, UserController.logout);

// Subscription management
router.patch(
  '/subscription',
  auth(USER_ROLES.USER),
  apiLimiter,
  validateRequest(UserValidation.updateSubscriptionSchema),
  UserController.updateSubscription
);

export const UserRoutes = router;

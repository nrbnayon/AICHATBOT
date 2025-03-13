// src/app/modules/user/user.route.ts
import { UserController } from './user.controller';
import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserValidation } from './user.validation';
import { USER_ROLES } from '../../../enums/common';
import passport from '../../../config/passport';
import {
  apiLimiter,
  authLimiter,
} from '../../middlewares/rateLimit.middleware';
import config from '../../../config';

const router = express.Router();

// OAuth Routes
router.get(
  '/google/login',
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/gmail.readonly',
    ],
    session: true,
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${config.frontend.url}/login?error=Google authentication failed`,
    session: true,
  }),
  UserController.googleCallback
);

router.get(
  '/microsoft/login',
  passport.authenticate('microsoft', {
    scope: ['user.read', 'Mail.Read'],
    session: true,
  })
);

router.get(
  '/microsoft/callback',
  passport.authenticate('microsoft', {
    failureRedirect: `${config.frontend.url}/login?error=Microsoft authentication failed`,
    session: true,
  }),
  UserController.microsoftCallback
);

// Yahoo OAuth
router.get('/yahoo/login', UserController.yahooLogin);
router.get('/yahoo/callback', UserController.yahooCallback);

// Local Authentication Routes
router.post(
  '/login',
  authLimiter,
  validateRequest(UserValidation.loginZodSchema),
  UserController.localLogin
);

router.post(
  '/refresh-token',
  validateRequest(UserValidation.refreshTokenZodSchema),
  UserController.refreshToken
);

router.post('/logout', auth(), apiLimiter, UserController.logout);

// Protected Routes
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

router.patch(
  '/subscription',
  auth(USER_ROLES.USER),
  apiLimiter,
  validateRequest(UserValidation.updateSubscriptionSchema),
  UserController.updateSubscription
);

// Email Access Routes
router.get(
  '/emails',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  apiLimiter,
  UserController.fetchEmails
);

export const UserRoutes = router;

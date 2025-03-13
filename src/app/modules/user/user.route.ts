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
  '/google-login',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: true,
  })
);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${config.frontend.url}/login?error=Google authentication failed`,
    session: true,
  }),
  UserController.googleCallback
);

router.get(
  '/microsoft-login',
  passport.authenticate('microsoft', {
    scope: ['user.read', 'user.read.all', 'mail.read'],
    session: true,
  })
);

router.get(
  '/auth/microsoft/callback',
  passport.authenticate('microsoft', {
    failureRedirect: `${config.frontend.url}/login?error=Microsoft authentication failed`,
    session: true,
  }),
  UserController.microsoftCallback
);

// Yahoo OAuth
router.get('/yahoo-login', UserController.yahooLogin);
router.get('/auth/yahoo/callback', UserController.yahooCallback);

// Local Authentication Routes
router.post(
  '/auth/login',
  authLimiter,
  validateRequest(UserValidation.loginZodSchema),
  UserController.localLogin
);

router.post(
  '/auth/refresh-token',
  validateRequest(UserValidation.refreshTokenZodSchema),
  UserController.refreshToken
);

router.post('/auth/logout', auth(), apiLimiter, UserController.logout);

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

export const UserRoutes = router;

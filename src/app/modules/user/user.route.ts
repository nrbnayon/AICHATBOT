import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/common';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import getFilePath from '../../../shared/getFilePath';
import {
  apiLimiter,
  authLimiter,
} from '../../middlewares/rateLimit.middleware';

const router = express.Router();

/**
 * User Management Routes
 * ===========================================
 * Handles all user-related operations including:
 * - User registration
 * - Profile management
 * - Admin user management
 * - Online status tracking
 */

/**
 * User Registration
 * -------------------------------------------
 * Public routes for user registration and setup
 */

/**
 * @route   POST /users/create-user
 * @desc    Register a new user with profile image
 * @access  Public
 * @rateLimit 5 attempts per 10 minutes
 */
router.post(
  '/create-user',

  async (req: Request, res: Response, next: NextFunction) => {
    res.send(
      '<h1 style="text-align:center; color:#A55FEF; font-family:Verdana;">Hey Frontend Developer, How can I assist you today!</h1>'
    );
  }
);

export const UserRoutes = router;

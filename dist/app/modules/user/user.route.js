"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
// src\app\modules\user\user.route.ts
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("./user.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_validation_1 = require("./user.validation");
const rateLimit_middleware_1 = require("../../middlewares/rateLimit.middleware");
const router = express_1.default.Router();
// OAuth routes
router.post('/auth/google', rateLimit_middleware_1.authLimiter, (0, validateRequest_1.default)(user_validation_1.UserValidation.oauthLoginSchema), user_controller_1.UserController.googleLogin);
router.post('/auth/microsoft', rateLimit_middleware_1.authLimiter, (0, validateRequest_1.default)(user_validation_1.UserValidation.oauthLoginSchema), user_controller_1.UserController.microsoftLogin);
router.post('/auth/yahoo', rateLimit_middleware_1.authLimiter, (0, validateRequest_1.default)(user_validation_1.UserValidation.oauthLoginSchema), user_controller_1.UserController.yahooLogin);
// User management routes
router.get('/me', (0, auth_1.default)(), rateLimit_middleware_1.apiLimiter, user_controller_1.UserController.getCurrentUser);
router.patch('/profile', (0, auth_1.default)(), rateLimit_middleware_1.apiLimiter, (0, validateRequest_1.default)(user_validation_1.UserValidation.updateProfileSchema), user_controller_1.UserController.updateProfile);
router.post('/logout', (0, auth_1.default)(), rateLimit_middleware_1.apiLimiter, user_controller_1.UserController.logout);
// Subscription management
router.patch('/subscription', (0, auth_1.default)(), rateLimit_middleware_1.apiLimiter, (0, validateRequest_1.default)(user_validation_1.UserValidation.updateSubscriptionSchema), user_controller_1.UserController.updateSubscription);
exports.UserRoutes = router;

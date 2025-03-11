"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
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
router.post('/create-user', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.send('<h1 style="text-align:center; color:#A55FEF; font-family:Verdana;">Hey Frontend Developer, How can I assist you today!</h1>');
}));
exports.UserRoutes = router;

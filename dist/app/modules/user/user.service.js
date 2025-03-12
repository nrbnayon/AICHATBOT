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
exports.UserService = void 0;
// src\app\modules\user\user.service.ts
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const jwtHelper_1 = require("../../../helpers/jwtHelper");
const config_1 = __importDefault(require("../../../config"));
const common_1 = require("../../../enums/common");
const user_model_1 = require("./user.model");
const googleapis_1 = require("googleapis");
const axios_1 = __importDefault(require("axios"));
const encryptionHelper_1 = require("../../../helpers/encryptionHelper");
// OAuth2 client setup
const oauth2Client = new googleapis_1.google.auth.OAuth2(config_1.default.oauth.google.client_id, config_1.default.oauth.google.client_secret, config_1.default.oauth.google.redirect_uri);
const refreshGoogleToken = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select('+refreshToken');
    if (!user || !user.refreshToken) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'No refresh token available');
    }
    try {
        const decryptedToken = encryptionHelper_1.encryptionHelper.decrypt(user.refreshToken);
        oauth2Client.setCredentials({ refresh_token: decryptedToken });
        const { credentials } = yield oauth2Client.refreshAccessToken();
        user.googleAccessToken = credentials.access_token
            ? encryptionHelper_1.encryptionHelper.encrypt(credentials.access_token)
            : undefined;
        if (credentials.refresh_token) {
            user.refreshToken = encryptionHelper_1.encryptionHelper.encrypt(credentials.refresh_token);
        }
        yield user.save();
        return credentials.access_token;
    }
    catch (error) {
        console.error('Token refresh error:', error);
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to refresh token');
    }
});
const googleLoginIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { code } = payload;
    try {
        const { tokens } = yield oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        const oauth2 = googleapis_1.google.oauth2({ auth: oauth2Client, version: 'v2' });
        const { data } = yield oauth2.userinfo.get();
        if (!data.email) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Email not provided by Google');
        }
        // Check if user exists with this email
        let user = yield user_model_1.User.isExistUserByEmail(data.email);
        if (user) {
            // Update existing user's Google credentials
            user.googleId = (_a = data.id) !== null && _a !== void 0 ? _a : undefined;
            user.googleAccessToken = tokens.access_token
                ? encryptionHelper_1.encryptionHelper.encrypt(tokens.access_token)
                : undefined;
            if (tokens.refresh_token) {
                user.refreshToken = tokens.refresh_token
                    ? encryptionHelper_1.encryptionHelper.encrypt(tokens.refresh_token)
                    : undefined;
            }
            user.authProvider = common_1.AUTH_PROVIDER.GOOGLE;
            user.lastSync = new Date(); // Update lastSync
            yield user.save();
        }
        else {
            // Create new user with encrypted tokens
            user = yield user_model_1.User.create({
                email: data.email,
                name: data.name,
                image: data.picture,
                authProvider: common_1.AUTH_PROVIDER.GOOGLE,
                googleId: data.id,
                googleAccessToken: tokens.access_token
                    ? encryptionHelper_1.encryptionHelper.encrypt(tokens.access_token)
                    : undefined,
                refreshToken: tokens.refresh_token
                    ? encryptionHelper_1.encryptionHelper.encrypt(tokens.refresh_token)
                    : undefined,
                verified: true,
                status: common_1.USER_STATUS.ACTIVE,
                lastSync: new Date(),
            });
        }
        // Generate JWT token
        const accessToken = jwtHelper_1.jwtHelper.createToken({ userId: user._id }, config_1.default.jwt.secret, config_1.default.jwt.expire_in);
        return {
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                image: user.image,
            },
        };
    }
    catch (error) {
        console.error('Authentication error:', error);
        if (axios_1.default.isAxiosError(error)) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to authenticate with provider: ${((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) || error.message}`);
        }
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to authenticate with provider: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
const refreshMicrosoftToken = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select('+refreshToken');
    if (!user || !user.refreshToken) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'No refresh token available');
    }
    try {
        const decryptedToken = encryptionHelper_1.encryptionHelper.decrypt(user.refreshToken);
        // Request new access token using refresh token
        const tokenResponse = yield axios_1.default.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', new URLSearchParams({
            client_id: config_1.default.oauth.microsoft.client_id,
            client_secret: config_1.default.oauth.microsoft.client_secret,
            refresh_token: decryptedToken,
            grant_type: 'refresh_token',
        }).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        // Update tokens in database
        user.microsoftAccessToken = tokenResponse.data.access_token
            ? encryptionHelper_1.encryptionHelper.encrypt(tokenResponse.data.access_token)
            : undefined;
        if (tokenResponse.data.refresh_token) {
            user.refreshToken = encryptionHelper_1.encryptionHelper.encrypt(tokenResponse.data.refresh_token);
        }
        user.lastSync = new Date();
        yield user.save();
        return tokenResponse.data.access_token;
    }
    catch (error) {
        console.error('Microsoft token refresh error:', error);
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to refresh Microsoft token');
    }
});
const refreshYahooToken = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select('+refreshToken');
    if (!user || !user.refreshToken) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'No refresh token available');
    }
    try {
        const decryptedToken = encryptionHelper_1.encryptionHelper.decrypt(user.refreshToken);
        // Request new access token using refresh token
        const tokenResponse = yield axios_1.default.post('https://api.login.yahoo.com/oauth2/get_token', new URLSearchParams({
            client_id: config_1.default.oauth.yahoo.client_id,
            client_secret: config_1.default.oauth.yahoo.client_secret,
            refresh_token: decryptedToken,
            grant_type: 'refresh_token',
        }).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        // Update tokens in database
        user.yahooAccessToken = tokenResponse.data.access_token
            ? encryptionHelper_1.encryptionHelper.encrypt(tokenResponse.data.access_token)
            : undefined;
        if (tokenResponse.data.refresh_token) {
            user.refreshToken = encryptionHelper_1.encryptionHelper.encrypt(tokenResponse.data.refresh_token);
        }
        user.lastSync = new Date();
        yield user.save();
        return tokenResponse.data.access_token;
    }
    catch (error) {
        console.error('Yahoo token refresh error:', error);
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to refresh Yahoo token');
    }
});
const microsoftLoginIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { code } = payload;
    try {
        // Exchange code for tokens
        const tokenResponse = yield axios_1.default.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', new URLSearchParams({
            client_id: config_1.default.oauth.microsoft.client_id,
            client_secret: config_1.default.oauth.microsoft.client_secret,
            code,
            redirect_uri: config_1.default.oauth.microsoft.redirect_uri,
            grant_type: 'authorization_code',
        }).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        // Get user info from Microsoft Graph API
        const userResponse = yield axios_1.default.get('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
        });
        const { id, mail, displayName } = userResponse.data;
        if (!mail) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Email not provided by Microsoft');
        }
        // Check if user exists
        let user = yield user_model_1.User.isExistUserByEmail(mail);
        if (user) {
            // Update existing user's Microsoft credentials
            user.microsoftId = id;
            user.microsoftAccessToken = encryptionHelper_1.encryptionHelper.encrypt(tokenResponse.data.access_token);
            if (tokenResponse.data.refresh_token) {
                user.refreshToken = encryptionHelper_1.encryptionHelper.encrypt(tokenResponse.data.refresh_token);
            }
            user.authProvider = common_1.AUTH_PROVIDER.MICROSOFT;
            user.lastSync = new Date();
            yield user.save();
        }
        else {
            // Create new user with encrypted tokens
            user = yield user_model_1.User.create({
                email: mail,
                name: displayName,
                authProvider: common_1.AUTH_PROVIDER.MICROSOFT,
                microsoftId: id,
                microsoftAccessToken: encryptionHelper_1.encryptionHelper.encrypt(tokenResponse.data.access_token),
                refreshToken: tokenResponse.data.refresh_token
                    ? encryptionHelper_1.encryptionHelper.encrypt(tokenResponse.data.refresh_token)
                    : undefined,
                verified: true,
                status: common_1.USER_STATUS.ACTIVE,
                lastSync: new Date(),
            });
        }
        // Generate JWT token
        const accessToken = jwtHelper_1.jwtHelper.createToken({ userId: user._id }, config_1.default.jwt.secret, config_1.default.jwt.expire_in);
        return {
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                image: user.image,
            },
        };
    }
    catch (error) {
        console.error('Authentication error:', error);
        if (axios_1.default.isAxiosError(error)) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to authenticate with provider: ${((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || error.message}`);
        }
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to authenticate with provider: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
const yahooLoginIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { code } = payload;
    try {
        // Exchange code for tokens
        const tokenResponse = yield axios_1.default.post('https://api.login.yahoo.com/oauth2/get_token', new URLSearchParams({
            client_id: config_1.default.oauth.yahoo.client_id,
            client_secret: config_1.default.oauth.yahoo.client_secret,
            code,
            redirect_uri: config_1.default.oauth.yahoo.redirect_uri,
            grant_type: 'authorization_code',
        }).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        // Get user info
        const userResponse = yield axios_1.default.get('https://api.login.yahoo.com/openid/v1/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
        });
        const { sub, email, name } = userResponse.data;
        if (!email) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Email not provided by Yahoo');
        }
        // Check if user exists
        let user = yield user_model_1.User.isExistUserByEmail(email);
        if (user) {
            // Update existing user's Yahoo credentials
            user.yahooId = sub;
            user.yahooAccessToken = encryptionHelper_1.encryptionHelper.encrypt(tokenResponse.data.access_token);
            if (tokenResponse.data.refresh_token) {
                user.refreshToken = encryptionHelper_1.encryptionHelper.encrypt(tokenResponse.data.refresh_token);
            }
            user.authProvider = common_1.AUTH_PROVIDER.YAHOO;
            user.lastSync = new Date();
            yield user.save();
        }
        else {
            // Create new user with encrypted tokens
            user = yield user_model_1.User.create({
                email,
                name,
                authProvider: common_1.AUTH_PROVIDER.YAHOO,
                yahooId: sub,
                yahooAccessToken: encryptionHelper_1.encryptionHelper.encrypt(tokenResponse.data.access_token),
                refreshToken: tokenResponse.data.refresh_token
                    ? encryptionHelper_1.encryptionHelper.encrypt(tokenResponse.data.refresh_token)
                    : undefined,
                verified: true,
                status: common_1.USER_STATUS.ACTIVE,
                lastSync: new Date(),
            });
        }
        // Generate JWT token
        const accessToken = jwtHelper_1.jwtHelper.createToken({ userId: user._id }, config_1.default.jwt.secret, config_1.default.jwt.expire_in);
        return {
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                image: user.image,
            },
        };
    }
    catch (error) {
        console.error('Authentication error:', error);
        if (axios_1.default.isAxiosError(error)) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to authenticate with provider: ${((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || error.message}`);
        }
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to authenticate with provider: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
const updateProfile = (userId, profileData) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    // Only allow updating specific fields
    const allowedUpdates = [
        'name',
        'phone',
        'address',
        'country',
        'gender',
        'dateOfBirth',
    ];
    // Filter out any fields that aren't in allowedUpdates
    const filteredData = Object.keys(profileData).reduce((acc, key) => {
        if (allowedUpdates.includes(key)) {
            // Type assertion to handle the index signature issue
            acc[key] = profileData[key];
        }
        return acc;
    }, {});
    // Update user with filtered data
    Object.assign(user, filteredData);
    // Update lastSync timestamp
    user.lastSync = new Date();
    yield user.save();
    return user;
});
const logout = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    // Clear OAuth tokens
    user.googleAccessToken = undefined;
    user.microsoftAccessToken = undefined;
    user.yahooAccessToken = undefined;
    user.refreshToken = undefined;
    user.lastSync = new Date();
    yield user.save();
    return null;
});
const getCurrentUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select('-password');
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    return user;
});
// In updateSubscription method
const updateSubscription = (userId, subscriptionData) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    // If plan is changing, update end date accordingly
    if (subscriptionData.plan &&
        subscriptionData.plan !== user.subscription.plan) {
        // Calculate new end date based on plan with type-safe index
        const endDateMap = {
            FREE: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            BASIC: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            PRO: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            ENTERPRISE: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
        };
        subscriptionData.startDate = new Date();
        subscriptionData.endDate =
            endDateMap[subscriptionData.plan];
        subscriptionData.status = 'ACTIVE';
    }
    user.subscription = Object.assign(Object.assign({}, user.subscription), subscriptionData);
    user.lastSync = new Date();
    yield user.save();
    return user;
});
exports.UserService = {
    googleLoginIntoDB,
    microsoftLoginIntoDB,
    yahooLoginIntoDB,
    refreshGoogleToken,
    refreshMicrosoftToken,
    refreshYahooToken,
    updateProfile,
    logout,
    getCurrentUser,
    updateSubscription,
};

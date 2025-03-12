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
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
// src\app\modules\user\user.model.ts
const mongoose_1 = require("mongoose");
const common_1 = require("../../../enums/common");
const userSubscriptionSchema = new mongoose_1.Schema({
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
    stripeCustomerId: {
        type: String,
    },
    stripeSubscriptionId: {
        type: String,
    },
    dailyRequests: {
        type: Number,
        default: 0,
    },
    dailyTokens: {
        type: Number,
        default: 0,
    },
    lastRequestDate: {
        type: Date,
    },
    autoRenew: {
        type: Boolean,
        default: true,
    },
});
const userSchema = new mongoose_1.Schema({
    role: {
        type: String,
        enum: Object.values(common_1.USER_ROLES),
        default: common_1.USER_ROLES.USER,
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
        enum: Object.values(common_1.AUTH_PROVIDER),
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
        enum: Object.values(common_1.USER_STATUS),
        default: common_1.USER_STATUS.ACTIVE,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    gender: {
        type: String,
        enum: Object.values(common_1.USER_GENDER),
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
}, {
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
});
// Static methods
userSchema.statics.isExistUserById = function (id) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.findById(id);
    });
};
userSchema.statics.isExistUserByEmail = function (email) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.findOne({ email: email.toLowerCase() });
    });
};
userSchema.statics.isExistUserByProvider = function (provider, providerId) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = {};
        switch (provider) {
            case common_1.AUTH_PROVIDER.GOOGLE:
                query.googleId = providerId;
                break;
            case common_1.AUTH_PROVIDER.MICROSOFT:
                query.microsoftId = providerId;
                break;
            case common_1.AUTH_PROVIDER.YAHOO:
                query.yahooId = providerId;
                break;
        }
        return yield this.findOne(query);
    });
};
exports.User = (0, mongoose_1.model)('User', userSchema);

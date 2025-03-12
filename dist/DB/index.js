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
const colors_1 = __importDefault(require("colors"));
const user_model_1 = require("../app/modules/user/user.model");
const config_1 = __importDefault(require("../config"));
const common_1 = require("../enums/common");
const logger_1 = require("../shared/logger");
const superUser = {
    name: 'Nayon',
    role: common_1.USER_ROLES.ADMIN,
    email: config_1.default.admin.email,
    password: config_1.default.admin.password,
    image: '',
    verified: true,
};
const seedAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    const isExistSuperAdmin = yield user_model_1.User.findOne({
        role: common_1.USER_ROLES.ADMIN,
    });
    const isExistEmail = yield user_model_1.User.findOne({
        email: config_1.default.admin.email,
    });
    if (!isExistSuperAdmin && !isExistEmail) {
        yield user_model_1.User.create(superUser);
        logger_1.logger.info(colors_1.default.green('✔  Admin created successfully!'));
    }
    else if (isExistEmail && !isExistSuperAdmin) {
        logger_1.logger.info(colors_1.default.yellow('⚠️  Admin email already exists with different role!'));
    }
    else {
        logger_1.logger.info(colors_1.default.blue('ℹ️  Admin already exists, skipping creation'));
    }
});
exports.default = seedAdmin;

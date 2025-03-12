"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_PLAN = exports.USER_GENDER = exports.USER_STATUS = exports.AUTH_PROVIDER = exports.USER_ROLES = void 0;
var USER_ROLES;
(function (USER_ROLES) {
    USER_ROLES["ADMIN"] = "ADMIN";
    USER_ROLES["USER"] = "USER";
})(USER_ROLES || (exports.USER_ROLES = USER_ROLES = {}));
var AUTH_PROVIDER;
(function (AUTH_PROVIDER) {
    AUTH_PROVIDER["GOOGLE"] = "google";
    AUTH_PROVIDER["MICROSOFT"] = "microsoft";
    AUTH_PROVIDER["YAHOO"] = "yahoo";
    AUTH_PROVIDER["LOCAL"] = "local";
})(AUTH_PROVIDER || (exports.AUTH_PROVIDER = AUTH_PROVIDER = {}));
var USER_STATUS;
(function (USER_STATUS) {
    USER_STATUS["ACTIVE"] = "active";
    USER_STATUS["DEACTIVATE"] = "deactivate";
    USER_STATUS["DELETE"] = "delete";
    USER_STATUS["BLOCK"] = "block";
    USER_STATUS["PENDING"] = "pending";
    USER_STATUS["INACTIVE"] = "inactive";
    USER_STATUS["APPROVED"] = "approved";
})(USER_STATUS || (exports.USER_STATUS = USER_STATUS = {}));
var USER_GENDER;
(function (USER_GENDER) {
    USER_GENDER["MALE"] = "male";
    USER_GENDER["FEMALE"] = "female";
    USER_GENDER["BOTH"] = "both";
    USER_GENDER["OTHERS"] = "others";
})(USER_GENDER || (exports.USER_GENDER = USER_GENDER = {}));
var USER_PLAN;
(function (USER_PLAN) {
    USER_PLAN["FREE"] = "free";
    USER_PLAN["BASIC"] = "basic";
    USER_PLAN["PREMIUM"] = "premium";
    USER_PLAN["ENTERPRISE"] = "enterprise";
})(USER_PLAN || (exports.USER_PLAN = USER_PLAN = {}));

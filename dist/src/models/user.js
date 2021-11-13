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
const mongoose_1 = require("mongoose");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userSchema = new mongoose_1.Schema({
    userName: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String },
    emailStudent: { type: String },
}, {
    timestamps: true,
});
userSchema.methods.createNewJWT = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const newJWT = jwt.sign({ username: this.userName }, process.env.ACCESS_TOKEN_SECRET, {
            algorithm: "HS256",
            type: "JWT",
            expires: "7200",
        });
        return newJWT;
    });
};
userSchema.methods.encryptPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    const salt = yield bcryptjs.genSalt(10);
    return yield bcryptjs.hash(password, salt);
});
userSchema.methods.matchPassword = function (password) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcryptjs.compare(password, this.password);
    });
};
const user = (0, mongoose_1.model)("user", userSchema);
exports.default = user;

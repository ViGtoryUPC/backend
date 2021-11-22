"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tokenSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        red: "user",
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
});
const Token = (0, mongoose_1.model)("token", tokenSchema);
exports.default = Token;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.headersController = void 0;
const jwt = require("jsonwebtoken");
const headersController = (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, POST, PUT, PATCH, DELETE");
    next();
};
exports.headersController = headersController;
exports.default = exports.headersController;

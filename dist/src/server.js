"use strict";
// @ts-check
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const path = require("path");
const routes_1 = __importDefault(require("./routes"));
//Inits
const app = express();
//Settings
app.set("port", process.env.PORT || 4000);
app.set("views", path.join(__dirname, "views"));
//Middlewares
app.use(express.urlencoded({ extended: false }));
//Global Variables
//Routes
app.use(routes_1.default);
//Static Files
app.use(express.static(path.join(__dirname, "public")));
module.exports = app;

"use strict";
// @ts-check
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const path = require("path");
//Inits
const app = express();
//Settings
app.set("port", process.env.PORT || 4000);
app.set("views", path.join(__dirname, "views"));
//Middlewares
app.use(express.urlencoded({ extended: false }));
//Global Variables
//Routes
app.use(require("./routes/userRoutes"));
//Static Files
app.use(express.static(path.join(__dirname, "public")));
module.exports = app;

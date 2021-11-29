// @ts-check

import express = require("express");
import path = require("path");
import { Request, Response, NextFunction } from "express";
import rutes from "./routes";
import grau from "./models/grau";

//Inits
const app = express();
const Grau = new grau();
Grau.insertGraus();

//Settings
app.set("port", process.env.PORT || 4000);
app.set("views", path.join(__dirname, "views"));

//Middlewares
app.use(express.urlencoded({ extended: false }));

//Global Variables

//Routes
app.use(rutes);

//Static Files
app.use(express.static(path.join(__dirname, "public")));

module.exports = app;

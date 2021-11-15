// @ts-check

import express = require("express");
import path = require("path");
import { Request, Response, NextFunction } from "express";
import rutes from "./routes";

//const cors = require("cors");

//Inits
const app = express();

//app.use(cors());

/*const headersController = (req: Request, res: Response, next: NextFunction) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	);
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, OPTIONS, POST, PUT, PATCH, DELETE"
	);
	next();
};*/

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

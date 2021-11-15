import { Request, Response, NextFunction } from "express";
const jwt = require("jsonwebtoken");

export const headersController = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
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
};

export default headersController;

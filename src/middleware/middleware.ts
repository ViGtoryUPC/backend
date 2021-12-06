import { Request, Response, NextFunction } from "express";
const jwt = require("jsonwebtoken");
import user from "../models/user";

const headersController = (req: Request, res: Response, next: NextFunction) => {
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

const validateJWT = (req: any, res: Response, next: NextFunction) => {
	if (
		req.originalUrl == "/user/signIn" ||
		req.originalUrl == "/user/signUp" ||
		req.originalUrl.startsWith("/user/emailVerification")
	) {
		next();
		return;
	}

	const authHeader = req.headers.authorization;

	if (authHeader) {
		jwt.verify(
			authHeader,
			process.env.ACCESS_TOKEN_SECRET,
			(err: any, user: any) => {
				if (err) {
					return res
						.status(403)
						.send("No s'ha pogut validar la sessio.");
				}
				res.locals.user = user;
				next();
			}
		);
	} else res.status(401).send("No s'ha rebut cap JWT");
};

export { headersController, validateJWT };

import { Request, Response, NextFunction } from "express";
import user from "../models/user";
const jwt = require("jsonwebtoken");

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
		req.originalUrl == "/grau/getAllGraus" ||
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
			async (err: any, username: any) => {
				if (err) {
					return res
						.status(403)
						.send("No s'ha pogut validar la sessio.");
				}
				//Comprovem que existeix un usuari per aquest JWT
				const usuari = await user.findOne({
					userName: username.username,
				});
				if (usuari == null) {
					return res
						.status(403)
						.send("No s'ha pogut validar la sessio.");
				}
				res.locals.user = username;
				res.locals.isStudent = usuari.emailStudentConfirmed;
				next();
			}
		);
	} else res.status(401).send("No s'ha rebut cap JWT");
};

export { headersController, validateJWT };

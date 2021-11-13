import { RequestHandler, Request, Response } from "express";
import user from "../models/user";

function hasLowerCase(str: String): Boolean {
	return str.toUpperCase() != str;
}

function hasUpperCase(str: String): Boolean {
	return str.toLowerCase() != str;
}

function hasNumbers(str: string): Boolean {
	return /\d/.test(str);
}

function validateEmail(str: string): Boolean {
	var re = /\S+@\S+\.\S+/;
	return re.test(str);
}

const signUp: RequestHandler = async (req: Request, res: Response) => {
	const errors = [];
	console.log(req.body);
	try {
		const { username, password, confirmPassword, email } = req.body;

		if (password != confirmPassword) {
			errors.push({ text: "Passwords don't match." });
		}
		if (password.length < 8) {
			errors.push({ text: "Password under 8 characters." });
		}
		if (
			!hasLowerCase(password) ||
			!hasUpperCase(password) ||
			!hasNumbers(password)
		) {
			errors.push({
				text: "Password must contain at least one uppercase, one lowercase and a number.",
			});
		}
		if (!validateEmail(email)) {
			errors.push({
				text: "Email not valid.",
			});
		}
		if (errors.length > 0) {
			res.send(errors);
		} else {
			const emailUser = await user.findOne({ email: email });
			if (emailUser) {
				errors.push({ text: "Email already exists." });
			}
			const usernameUser = await user.findOne({ userName: username });
			if (usernameUser) {
				errors.push({ text: "Username already exists." });
			}
			if (errors.length > 0) {
				res.send(errors);
			} else {
				const newUser = new user({
					userName: username,
					password: password,
					email: email,
				});
				newUser.password = await newUser.encryptPassword(password);
				await newUser.save();
				res.send("SignUp Success");
			}
		}
	} catch (error) {
		console.log(error);
		errors.push({ text: "Something is missing." });
		res.send(errors);
	}
};

const signIn: RequestHandler = async (req: Request, res: Response) => {
	const errors = [];
	try {
		const { username, password } = req.body;
		console.log(username);
		const usuari = await user.findOne({ userName: username });
		console.log(usuari);
		if (!usuari) {
			return res.status(401).send("User doesn't exist.");
		}
		const match = await usuari.matchPassword(password);
		if (!match) {
			return res.status(401).send("Password is incorrect");
		}

		const newJWT = await usuari.createNewJWT();
		return res.send({
			jwt: newJWT,
			text: "Login Successful",
		});
	} catch {
		errors.push({ text: "Something is missing." });
		res.send(errors);
	}
};

export { signUp, signIn };

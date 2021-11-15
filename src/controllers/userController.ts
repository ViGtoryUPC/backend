import { RequestHandler, Request, Response } from "express";
import user from "../models/user";
const nodemailer = require("nodemailer");

function validateUserCharacters(str: string): Boolean {
	return /^[a-zA-Z0-9_\-\.]+$/.test(str);
}

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

async function sendConfirmationEmail(email: String) {
	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: "gerard.planas1998@gmail.com",
			pass: "",
		},
	});

	const info = await transporter.sendMail({
		from: "gerard.planas1998@gmail.com",
		to: email,
		subject: "alo presidente",
		text: "alolaol",
		html: "<b>Hello world?</b>",
	});
	console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

const signUp: RequestHandler = async (req: Request, res: Response) => {
	const errors = [];
	console.log(req.body);
	try {
		const { username, password, confirmPassword, email, degree } = req.body;
		if (username.length < 2 || username.length > 32) {
			errors.push({
				text: "El nom d'usuari té menys de 2 caràcters o més de 32.",
			});
		}
		if (!validateUserCharacters(username)) {
			errors.push({
				text: "El teu nom d'usuari només pot contenir caràcters [a-z, A-Z, 0-9, _, -, .].",
			});
		}
		if (password != confirmPassword) {
			errors.push({ text: "Les contrasenyes no coincideixen." });
		}
		if (password.length < 8 || password.length > 32) {
			errors.push({
				text: "La contrasenya té menys de 8 caràcters o més de 32.",
			});
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
				text: "El email no és vàlid.",
			});
		}
		if (errors.length > 0) {
			res.send(errors);
		} else {
			const emailUser = await user.findOne({ email: email });
			if (emailUser) {
				errors.push({ text: "Aquest email ja està en ús." });
			}
			const usernameUser = await user.findOne({ userName: username });
			if (usernameUser) {
				errors.push({ text: "Aquest nom d'usuari ja està en ús." });
			}
			if (errors.length > 0) {
				res.send(errors);
			} else {
				//await sendConfirmationEmail("gerard.planas1998@gmail.com");
				const newUser = new user({
					userName: username,
					password: password,
					email: email,
					degree: degree,
				});
				newUser.password = await newUser.encryptPassword(password);
				await newUser.save();
				res.status(201).send("SignUp Success");
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
		return res.status(201).send({
			jwt: newJWT,
			text: "Login Successful",
		});
	} catch {
		errors.push({ text: "Something is missing." });
		res.send(errors);
	}
};

export { signUp, signIn };

import { RequestHandler, Request, Response } from "express";
import user from "../models/user";
import Token from "../models/token";
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

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

function isStudentMail(email: String): Boolean {
	if (email.endsWith("@estudiantat.upc.edu")) {
		return true;
	} else return false;
}

async function sendConfirmationEmail(email: String, usuari: any) {
	try {
		const emailToken = jwt.sign(
			{ usuari: usuari },
			process.env.EMAIL_SECRET,
			{
				expiresIn: "1h",
			}
		);

		let token = await new Token({
			userId: usuari._id,
			token: emailToken,
		}).save();

		let url: String;

		if (isStudentMail(email))
			url = `http://ViGtory.ddnsfree.com:27018/user/emailVerification/${usuari.id}/${token.token}/1`;
		else
			url = `http://ViGtory.ddnsfree.com:27018/user/emailVerification/${usuari.id}/${token.token}/0`;
		const transporter = nodemailer.createTransport({
			service: "Gmail",
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASSWORD,
			},
		});
		await transporter.sendMail({
			to: email,
			subject: "Confirma el teu Correu.",
			html: `Siusplau, entra a aquest link per a confirmar el teu correu: <a href="${url}">Verifica</a>`,
		});
	} catch (e) {
		console.log(e);
	}
}

const emailValidation: RequestHandler = async (req: Request, res: Response) => {
	console.log("entro emailValidation :V");
	try {
		const usuari = await user.findOne({ _id: req.params.id });
		if (!usuari) return res.status(400).send("Link not valid");

		const token = await Token.findOne({
			userId: usuari._id,
			token: req.params.token,
		});
		if (!token) return res.status(400).send("Link not valid");

		if (req.params.student === "0")
			await user.updateOne({ _id: usuari._id, emailConfirmed: true });
		else
			await user.updateOne({
				_id: usuari._id,
				emailStudentConfirmed: true,
			});

		await Token.findByIdAndRemove(token._id);

		res.send("Email Verificat, pots tancar aquesta pestanya.");
	} catch (e) {
		res.send("error");
	}
};

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
			let emailUser: String;
			if (isStudentMail(email)) {
				emailUser = await user.findOne({ emailStudent: email });
			} else {
				emailUser = await user.findOne({ email: email });
			}
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
				let newUser;
				if (isStudentMail(email)) {
					newUser = new user({
						userName: username,
						password: password,
						emailStudent: email,
						degree: degree,
					});
				} else {
					newUser = new user({
						userName: username,
						password: password,
						email: email,
						degree: degree,
					});
				}
				await sendConfirmationEmail(email, newUser);
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
		const usuari = await user.findOne({ userName: username });
		if (!usuari) {
			return res.status(401).send("User doesn't exist.");
		}
		const match = await usuari.matchPassword(password);
		if (!match) {
			return res.status(401).send("Password is incorrect.");
		}
		if (!usuari.emailConfirmed && !usuari.emailStudentConfirmed) {
			return res.status(401).send("Confirm your email.");
		}
		const newJWT = await usuari.createNewJWT();
		console.log(`Login:${usuari.userName}`);
		return res.status(201).send({
			jwt: newJWT,
			text: "Login Successful",
		});
	} catch {
		errors.push({ text: "Something is missing." });
		res.send(errors);
	}
};

export { signUp, signIn, emailValidation };

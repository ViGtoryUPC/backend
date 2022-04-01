import { RequestHandler, Request, Response } from "express";
import user from "../models/user";
import Token from "../models/token";
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

//------------------------------------
//
//		PRIVATS
//
//------------------------------------

function validateUserCharacters(str: string): Boolean {
	return /^[a-zA-Z0-9_\-\.]+$/.test(str);
}

function hasLowerCase(str: String): Boolean {
	return str.toUpperCase() != str;
}

function hasUpperCase(str: String): Boolean {
	return str.toLowerCase() != str;
}

function hasNumbers(str: any): Boolean {
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

function checkPasswordFormat(password: String, confirmPassword: String) {
	let errors: Array<string> = [];
	if (password != confirmPassword) {
		errors.push("Les contrasenyes no coincideixen.");
	}
	if (password.length < 8 || password.length > 32) {
		errors.push("La contrasenya té menys de 8 caràcters o més de 32.");
	}
	if (
		!hasLowerCase(password) ||
		!hasUpperCase(password) ||
		!hasNumbers(password)
	) {
		errors.push(
			"La contrasenya ha de tenir com a mínim una majúscula, una minúscula i un número."
		);
	}
	return errors;
}

async function sendConfirmationEmail(
	email: String,
	usuari: any,
	modified: boolean
) {
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
			url = `${process.env.SERVER}/user/emailVerification/${usuari.id}/${token.token}/1/0`;
		else {
			if (modified) {
				url = `${process.env.SERVER}/user/emailVerification/${usuari.id}/${token.token}/0/1`;
			} else {
				url = `${process.env.SERVER}/user/emailVerification/${usuari.id}/${token.token}/0/0`;
			}
		}

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

//------------------------------------
//
//		PUBLICS
//
//------------------------------------

const emailValidation: RequestHandler = async (req: Request, res: Response) => {
	try {
		const usuari = await user.findOne({ _id: req.params.id });
		if (!usuari) return res.status(400).send({ error: "Link no vàlid" });

		const token = await Token.findOne({
			userId: usuari._id,
			token: req.params.token,
		});
		if (!token) return res.status(400).send({ error: "Link no vàlid" });

		if (req.params.student === "0") {
			if (req.params.modified === "0") {
				await user.findByIdAndUpdate(usuari._id, {
					emailConfirmed: true,
				});
			} else {
				await user.findByIdAndUpdate(usuari._id, {
					email: usuari.newEmail,
				});
			}
		} else {
			await user.findByIdAndUpdate(usuari._id, {
				emailStudentConfirmed: true,
			});
		}
		await Token.findByIdAndRemove(token._id);
		await await user.findByIdAndUpdate(usuari._id, {
			$unset: { newEmail: "" },
		});

		res.status(200).send("Email Verificat, pots tancar aquesta pestanya.");
	} catch (e) {
		res.status(500).send({ error: e });
	}
};

const signUp: RequestHandler = async (req: Request, res: Response) => {
	let errors: Array<string> = [];
	let errorsaux: Array<string> = [];
	console.log(req.body);
	try {
		const { username, password, confirmPassword, email, degree } = req.body;
		if (username.length < 2 || username.length > 32) {
			errors.push("El nom d'usuari té menys de 2 caràcters o més de 32.");
		}
		if (!validateUserCharacters(username)) {
			errors.push(
				"El teu nom d'usuari només pot contenir caràcters [a-z, A-Z, 0-9, _, -, .]."
			);
		}
		errorsaux = checkPasswordFormat(password, confirmPassword);
		errors = errors.concat(errorsaux);
		if (!validateEmail(email)) {
			errors.push("El email no és vàlid.");
		}
		if (errors.length > 0) {
			return res.status(401).send({
				error: errors,
			});
		} else {
			let emailUser: String;
			if (isStudentMail(email)) {
				emailUser = await user.findOne({ emailStudent: email });
			} else {
				emailUser = await user.findOne({ email: email });
			}
			if (emailUser) {
				errors.push("Aquest email ja està en ús.");
			}
			const usernameUser = await user.findOne({ userName: username });
			if (usernameUser) {
				errors.push("Aquest nom d'usuari ja està en ús.");
			}
			if (!degree) {
				errors.push("Grau d'interès no pot ser buit.");
			}
			if (errors.length > 0) {
				return res.status(403).send({
					error: errors,
				});
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
				await sendConfirmationEmail(email, newUser, false);
				newUser.password = await newUser.encryptPassword(password);
				await newUser.save();
				return res.status(201).send({
					text: "T'has registrat correctament, valida el teu Email",
				});
			}
		}
	} catch (error) {
		errors.push("Falta alguna cosa.");
		res.status(401).send({ error: errors.join("\n") });
	}
};

const signIn: RequestHandler = async (req: Request, res: Response) => {
	try {
		const { username, password } = req.body;
		const usuari = await user.findOne({ userName: username });
		if (!usuari) {
			return res.status(401).send({ error: "L'usuari no existeix." });
		}
		const match = await usuari.matchPassword(password);
		if (!match) {
			return res
				.status(401)
				.send({ error: "La contrasenya és incorrecta." });
		}
		if (!usuari.emailConfirmed && !usuari.emailStudentConfirmed) {
			return res.status(401).send({ error: "Valida el teu Email." });
		}
		const newJWT = await usuari.createNewJWT();
		console.log(`Login:${usuari.userName}`);
		return res.status(201).send({
			jwt: newJWT,
			text: "Login correcte",
			usuari: usuari.userName,
		});
	} catch {
		res.status(401).send({ error: "Falta alguna cosa." });
	}
};

const modificarGrau: RequestHandler = async (req: Request, res: Response) => {
	try {
		await user.findOneAndUpdate(
			{ userName: res.locals.user.username },
			{
				degree: req.body.grau,
			}
		);
		return res.status(200).send({
			text: "Grau d'interès canviat.",
			usuari: res.locals.user.username,
		});
	} catch (error) {
		res.status(401).send({ error: error });
	}
};

const modificarPassword: RequestHandler = async (
	req: Request,
	res: Response
) => {
	try {
		let errors: Array<string> = [];
		let errorsaux: Array<string> = [];
		const usuari = await user.findOne({
			userName: res.locals.user.username,
		});
		const match = await usuari.matchPassword(req.body.password);
		if (!match) {
			errors.push("La contrasenya actual no coincideix.");
		}
		errorsaux = checkPasswordFormat(
			req.body.newPassword,
			req.body.confirmPassword
		);
		errors = errors.concat(errorsaux);
		if (errors.length > 0) {
			return res.status(401).send({
				error: errors.join("\n"),
				usuari: res.locals.user.username,
			});
		}
		const password = await usuari.encryptPassword(req.body.newPassword);
		await user.findOneAndUpdate(
			{ userName: res.locals.user.username },
			{
				password: password,
			}
		);
		return res.status(200).send({
			text: "Contrasenya canviada",
			usuari: res.locals.user.username,
		});
	} catch (error) {
		res.send({ error: error });
	}
};

const getInfoUsuari: RequestHandler = async (req: Request, res: Response) => {
	const usuari = await user.findOne({
		userName: res.locals.user.username,
	});
	res.status(200).send({
		email: usuari.email,
		emailConfirmed: usuari.emailConfirmed,
		emailStudent: usuari.emailStudent,
		emailStudentConfirmed: usuari.emailStudentConfirmed,
		grauInteres: usuari.degree,
		usuari: res.locals.user.username,
	});
};

const afegirSegonCorreu: RequestHandler = async (
	req: Request,
	res: Response
) => {
	const usuari = await user.findOne({
		userName: res.locals.user.username,
	});
	let email: string = req.body.email;
	if (!validateEmail(email)) {
		return res.status(401).send({
			error: "L'email no es vàlid.",
		});
	}
	if (
		(isStudentMail(email) && usuari.emailStudent != null) ||
		(!isStudentMail(email) && usuari.email != null)
	) {
		return res.status(401).send({
			error: "L'usuari ja té un email d'aquest tipus.",
		});
	}
	if (isStudentMail(email)) {
		await user.findOneAndUpdate(
			{ userName: res.locals.user.username },
			{
				emailStudent: email,
			}
		);
	} else {
		await user.findOneAndUpdate(
			{ userName: res.locals.user.username },
			{
				email: email,
			}
		);
	}
	await sendConfirmationEmail(email, usuari, false);
	return res.status(201).send({ text: "Email afegit, siusplau valida'l." });
};

const modificarCorreu: RequestHandler = async (req: Request, res: Response) => {
	const usuari = await user.findOne({
		userName: res.locals.user.username,
	});
	let email: string = req.body.email;
	if (!validateEmail(email)) {
		return res.status(401).send({
			error: "L'email no és vàlid.",
		});
	}
	if (usuari.newEmail != null) {
		await Token.findOneAndDelete({ userId: usuari._id });
	}
	await user.findOneAndUpdate(
		{ userName: res.locals.user.username },
		{
			newEmail: email,
		}
	);
	await sendConfirmationEmail(email, usuari, true);
	return res
		.status(201)
		.send({ text: "Email modificat, siusplau valida'l." });
};

export {
	signUp,
	signIn,
	emailValidation,
	modificarGrau,
	modificarPassword,
	getInfoUsuari,
	afegirSegonCorreu,
	modificarCorreu,
};

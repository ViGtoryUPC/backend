"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailValidation = exports.signIn = exports.signUp = void 0;
const user_1 = __importDefault(require("../models/user"));
const token_1 = __importDefault(require("../models/token"));
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
function validateUserCharacters(str) {
    return /^[a-zA-Z0-9_\-\.]+$/.test(str);
}
function hasLowerCase(str) {
    return str.toUpperCase() != str;
}
function hasUpperCase(str) {
    return str.toLowerCase() != str;
}
function hasNumbers(str) {
    return /\d/.test(str);
}
function validateEmail(str) {
    var re = /\S+@\S+\.\S+/;
    return re.test(str);
}
function isStudentMail(email) {
    if (email.endsWith("@estudiantat.upc.edu")) {
        return true;
    }
    else
        return false;
}
function sendConfirmationEmail(email, usuari) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const emailToken = jwt.sign({ usuari: usuari }, process.env.EMAIL_SECRET, {
                expiresIn: "1h",
            });
            let token = yield new token_1.default({
                userId: usuari._id,
                token: emailToken,
            }).save();
            let url;
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
            yield transporter.sendMail({
                to: email,
                subject: "Confirma el teu Correu.",
                html: `Siusplau, entra a aquest link per a confirmar el teu correu: <a href="${url}">Verifica</a>`,
            });
        }
        catch (e) {
            console.log(e);
        }
    });
}
const emailValidation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("entro emailValidation :V");
    try {
        const usuari = yield user_1.default.findOne({ _id: req.params.id });
        if (!usuari)
            return res.status(400).send("Link not valid");
        const token = yield token_1.default.findOne({
            userId: usuari._id,
            token: req.params.token,
        });
        if (!token)
            return res.status(400).send("Link not valid");
        if (req.params.student === "0")
            yield user_1.default.updateOne({ _id: usuari._id, emailConfirmed: true });
        else
            yield user_1.default.updateOne({
                _id: usuari._id,
                emailStudentConfirmed: true,
            });
        yield token_1.default.findByIdAndRemove(token._id);
        res.send("Email Verificat, pots tancar aquesta pestanya.");
    }
    catch (e) {
        res.send("error");
    }
});
exports.emailValidation = emailValidation;
const signUp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (!hasLowerCase(password) ||
            !hasUpperCase(password) ||
            !hasNumbers(password)) {
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
        }
        else {
            let emailUser;
            if (isStudentMail(email)) {
                emailUser = yield user_1.default.findOne({ emailStudent: email });
            }
            else {
                emailUser = yield user_1.default.findOne({ email: email });
            }
            if (emailUser) {
                errors.push({ text: "Aquest email ja està en ús." });
            }
            const usernameUser = yield user_1.default.findOne({ userName: username });
            if (usernameUser) {
                errors.push({ text: "Aquest nom d'usuari ja està en ús." });
            }
            if (errors.length > 0) {
                res.send(errors);
            }
            else {
                let newUser;
                if (isStudentMail(email)) {
                    newUser = new user_1.default({
                        userName: username,
                        password: password,
                        emailStudent: email,
                        degree: degree,
                    });
                }
                else {
                    newUser = new user_1.default({
                        userName: username,
                        password: password,
                        email: email,
                        degree: degree,
                    });
                }
                yield sendConfirmationEmail(email, newUser);
                newUser.password = yield newUser.encryptPassword(password);
                yield newUser.save();
                res.status(201).send("SignUp Success");
            }
        }
    }
    catch (error) {
        console.log(error);
        errors.push({ text: "Something is missing." });
        res.send(errors);
    }
});
exports.signUp = signUp;
const signIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = [];
    try {
        const { username, password } = req.body;
        const usuari = yield user_1.default.findOne({ userName: username });
        if (!usuari) {
            return res.status(401).send("User doesn't exist.");
        }
        const match = yield usuari.matchPassword(password);
        if (!match) {
            return res.status(401).send("Password is incorrect.");
        }
        if (!usuari.emailConfirmed && !usuari.emailStudentConfirmed) {
            return res.status(401).send("Confirm your email.");
        }
        const newJWT = yield usuari.createNewJWT();
        console.log(`Login:${usuari.userName}`);
        return res.status(201).send({
            jwt: newJWT,
            text: "Login Successful",
        });
    }
    catch (_a) {
        errors.push({ text: "Something is missing." });
        res.send(errors);
    }
});
exports.signIn = signIn;

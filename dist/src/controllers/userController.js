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
exports.signIn = exports.signUp = void 0;
const user_1 = __importDefault(require("../models/user"));
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
const signUp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (!hasLowerCase(password) ||
            !hasUpperCase(password) ||
            !hasNumbers(password)) {
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
        }
        else {
            const emailUser = yield user_1.default.findOne({ email: email });
            if (emailUser) {
                errors.push({ text: "Email already exists." });
            }
            const usernameUser = yield user_1.default.findOne({ userName: username });
            if (usernameUser) {
                errors.push({ text: "Username already exists." });
            }
            if (errors.length > 0) {
                res.send(errors);
            }
            else {
                const newUser = new user_1.default({
                    userName: username,
                    password: password,
                    email: email,
                });
                newUser.password = yield newUser.encryptPassword(password);
                yield newUser.save();
                res.send("SignUp Success");
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
    console.log(req.body);
    const errors = [];
    try {
        const { username, password } = req.body;
        const usuari = yield user_1.default.findOne({ username });
        console.log(typeof usuari.password);
        if (!usuari) {
            return res.status(401).send("User doesn't exist.");
        }
        const passOK = usuari.matchPassword(password);
        if (!passOK) {
            return res.status(401).send("Password is incorrect");
        }
        const newJWT = usuari.createNewJWT();
        return res.send({
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

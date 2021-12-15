import { Schema, model } from "mongoose";
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new Schema(
	{
		userName: { type: String, required: true },
		password: { type: String, required: true },
		email: { type: String },
		newEmail: { type: String },
		emailConfirmed: { type: Boolean, default: false },
		emailStudent: { type: String },
		emailStudentConfirmed: { type: Boolean, default: false },
		degree: { type: Number },
		votes: [
			{
				votat: String,
				vote: Number,
			},
		],
	},
	{
		timestamps: true,
	}
);

userSchema.methods.createNewJWT = async function () {
	const newJWT = await jwt.sign(
		{ username: this.userName },
		process.env.ACCESS_TOKEN_SECRET,
		{
			algorithm: "HS256",
		}
	);
	return newJWT;
};

userSchema.methods.encryptPassword = async (password) => {
	const salt = await bcryptjs.genSalt(10);
	return await bcryptjs.hash(password, salt);
};

userSchema.methods.matchPassword = async function (password) {
	return await bcryptjs.compare(password, this.password);
};

const user = model("user", userSchema);

export default user;

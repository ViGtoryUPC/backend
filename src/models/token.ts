import { Schema, model } from "mongoose";

const tokenSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		red: "user",
		required: true,
	},
	token: {
		type: String,
		required: true,
	},
});

const Token = model("token", tokenSchema);

export default Token;

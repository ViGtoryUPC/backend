import { Schema, model } from "mongoose";

const aportacioSchema = new Schema(
	{
		userName: { type: String, required: true },
		title: { type: String, required: true },
		body: { type: String },
		votes: { type: Number, required: true, default: 0 },
		comentaris: { type: Number, required: true, default: 0 },
		sigles_ud: { type: String, required: true },
		editat: { type: Boolean, required: true, default: false },
		graus: [
			{
				codi_programa: { type: Number },
			},
		],
	},
	{
		timestamps: true,
	}
);

const aportacio = model("aportacion", aportacioSchema);

export default aportacio;

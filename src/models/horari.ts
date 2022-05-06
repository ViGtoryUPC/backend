import { Schema, model } from "mongoose";

const horariSchema = new Schema(
	{
		anyaca: { type: Number, required: true },
		quadri: { type: Number, required: true },
		codgrup: { type: String, required: true },
		codass: { type: Number, required: true },
		dia: { type: Number, required: true },
		h_i: { type: String, required: true },
		h_f: { type: String, required: true },
		tpla: { type: String, required: true }, //L-> LAB   T-> Teoria
		setmana: { type: Number, required: true },
		ordre: { type: Number, required: true },
		id: { type: Number, required: true },
		sigles_ud: { type: String, required: true },
		nom: { type: String, required: true },
		grau: { type: String, required: true },
	},
	{
		timestamps: true,
	}
);

const horari = model("horari", horariSchema);

export default horari;

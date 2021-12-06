import { Schema, model } from "mongoose";

const assignaturaSchema = new Schema({
	nucli_id: { type: Number, required: true, unique: true },
	codi_programa: { type: Number, required: true },
	nom: { type: String, required: true },
	sigles_ud: { type: String, required: true },
	tipus: { type: String, required: true },
});

const assignatura = model("assignatures", assignaturaSchema);

export default assignatura;

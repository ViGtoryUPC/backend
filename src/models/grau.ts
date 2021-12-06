import { Schema, model } from "mongoose";

const grauSchema = new Schema({
	nom: { type: String, required: true, unique: true },
	codi_programa: { type: Number, required: true, unique: true },
});

const grau = model("grau", grauSchema);

export default grau;

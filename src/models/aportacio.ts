import { Schema, model } from "mongoose";
import { getAllAportacionsForAssignatura } from "src/controllers/aportacioController";

const aportacioSchema = new Schema(
	{
		userName: { type: String, required: true },
		title: { type: String, required: true },
		body: { type: String, required: true },
		votes: { type: Number, required: true, default: 0 },
		sigles_ud: { type: String, required: true }, //Tenen la funció de definir el tema de la aportació.
	},
	{
		timestamps: true,
	}
);

const aportacio = model("aportacion", aportacioSchema);

export default aportacio;

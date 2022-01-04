import { Schema, model } from "mongoose";

const assignaturaSchema = new Schema({
	nucli_id: { type: Number, required: true, unique: true },
	codi_programa: { type: Number, required: true },
	nom: { type: String, required: true },
	sigles_ud: { type: String, required: true },
	tipus: { type: String, required: true },
	dificultat: { type: Number, required: true, default: 0 },
	professorat: { type: Number, required: true, default: 0 },
	interesant: { type: Number, required: true, default: 0 },
	feina: { type: Number, required: true, default: 0 },
	vots: { type: Number, required: true, default: 0 },

	//TODO:
	//
	//ELS VALORS DE DIFICULTAT, FEINA... PASEN A SER LA SUMA TOTAL DE TOTS ELS VOTS, PER TANT LA MITJANA LA TREIEM CADA COP FENT
	//DIFICULTAT/VOTS.
	//S'HA DE GUARDAR EL QUE HA VOTAT EL USUARI PER CADA CAMP JUNT AMB L'ASSIGNATURA VOTADA, JA QUE SI ES MODIFICA EL VOT,
	//S'HA DE RESTAR EL VOT ACTUAL A LA SUMA TOTAL DELS VOTS, PER SUMARLI EL NOU VALOR QUE VE DEL FRONT.
	//
});

const assignatura = model("assignatures", assignaturaSchema);

export default assignatura;

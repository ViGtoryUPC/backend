import { Schema, model } from "mongoose";

const comentariSchema = new Schema(
	{
		userName: { type: String, required: true },
		aportacio: {
			type: Schema.Types.ObjectId,
			ref: "aportacio",
			required: true,
		},
		body: { type: String, required: true },
		parent: {
			type: Schema.Types.ObjectId,
			ref: "comentari",
			required: false,
		},
		esborrat: { type: Boolean, required: true, default: false },
		votes: { type: Number, required: true, default: 0 },
	},
	{
		timestamps: true,
	}
);

const comentari = model("comentari", comentariSchema);

export default comentari;

import { Schema, model } from "mongoose";

const aportacioSchema = new Schema(
	{
		userName: { type: String, required: true },
        body: { type: String, required: true},
        parent: { type: Schema.Types.ObjectId, red: "aportacio" },
	},
	{
		timestamps: true,
	}
);


const aportacio = model("aportacio", aportacioSchema);

export default aportacio;
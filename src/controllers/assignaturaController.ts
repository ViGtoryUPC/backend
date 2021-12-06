import { RequestHandler, Request, Response } from "express";
import assignatura from "../models/assignatura";

//------------------------------------
//
//		PUBLICS
//
//------------------------------------

const getAssignatures: RequestHandler = async (req: Request, res: Response) => {
	let grau: Number = req.body.grau;
	const assignatures = await assignatura
		.find({ codi_programa: grau })
		.select({
			nom: 1,
			sigles_ud: 1,
			tipus: 1,
			_id: 0,
		});
	if (assignatures.length == 0) {
		return res.status(401).send({
			text: "No existeix aquest grau.",
		});
	} else {
		return res.status(200).send({
			assignatures: assignatures,
		});
	}
};

export { getAssignatures };

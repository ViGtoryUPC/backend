import { RequestHandler, Request, Response } from "express";
import assignatura from "../models/assignatura";
import user from "../models/user";

//------------------------------------
//
//		PUBLICS
//
//------------------------------------

const getAssignatures: RequestHandler = async (req: Request, res: Response) => {
	let username: String = res.locals.user.username;
	const usuari = await user.findOne({ userName: username });
	const assignatures = await assignatura
		.find({ codi_programa: usuari.degree })
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

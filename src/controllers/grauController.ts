import { RequestHandler, Request, Response } from "express";
import grau from "../models/grau";

//------------------------------------
//
//		PUBLICS
//
//------------------------------------

const getAllGraus: RequestHandler = async (req: Request, res: Response) => {
	const graus = await grau
		.find()
		.select({ nom: 1, codi_programa: 1, _id: 0 });
	res.status(200).send({
		graus: graus,
	});
};

export { getAllGraus };

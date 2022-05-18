import { RequestHandler, Request, Response } from "express";
import horari from "../models/horari";
import user from "../models/user";

//------------------------------------
//
//		PUBLICS
//
//------------------------------------

const getHorarisAssignatures: RequestHandler = async (
	req: Request,
	res: Response
) => {
	let username: String = res.locals.user.username;
	const usuari = await user.findOne({ userName: username });
	let horaris;
	let grauUser: String;
	switch (usuari.degree) {
		case 1339:
			grauUser = "I";
			break;
		case 683:
			grauUser = "K";
			break;
		case 682:
			grauUser = "M";
			break;
		case 681:
			grauUser = "E";
			break;
		case 666:
			grauUser = "D";
			break;
		default:
			grauUser = "I";
			break;
	}
	if (grauUser == "I") {
		horaris = await horari.find({ grau: grauUser }).select({
			anyaca: 1,
			quadri: 1,
			codgrup: 1,
			dia: 1,
			h_i: 1,
			h_f: 1,
			tpla: 1,
			setmana: 1,
			ordre: 1,
			sigles_ud: 1,
			nom: 1,
			grau: 1,
			codaul: 1,
			_id: 0,
		});
	} else {
		horaris = await horari
			.find({ $or: [{ grau: grauUser }, { grau: "N" }] })
			.select({
				anyaca: 1,
				quadri: 1,
				codgrup: 1,
				dia: 1,
				h_i: 1,
				h_f: 1,
				tpla: 1,
				setmana: 1,
				ordre: 1,
				sigles_ud: 1,
				nom: 1,
				grau: 1,
				_id: 0,
			});
	}

	if (horaris.length == 0) {
		return res.status(401).send({
			error: "Error al recuperar els horaris",
		});
	} else {
		return res.status(200).send({
			horaris: horaris,
		});
	}
};

export { getHorarisAssignatures };

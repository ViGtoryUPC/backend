import { RequestHandler, Request, Response } from "express";
import aportacio from "../models/aportacio";
import user from "../models/user";
import grau from "../models/grau";
import comentari from "../models/comentari";
import fs from "fs";
import { zip } from "zip-a-folder";
import assignatura from "../models/assignatura";

//------------------------------------
//
//		PUBLICS
//
//------------------------------------

const newAportacio: RequestHandler = async (req: Request, res: Response) => {
	let username: String = res.locals.user.username;
	const usuari = await user.findOne({ userName: username });

	if (!usuari.emailStudentConfirmed) {
		return res
			.status(401)
			.send(
				"Verifica un correu d'estudiant per poder afegir aportacions!"
			);
	}
	let titol: String = req.body.titol;
	let body: String = req.body.body;
	let sigles_ud: String = req.body.sigles_ud;

	const graus = await assignatura
		.find({
			sigles_ud: sigles_ud,
		})
		.select({
			codi_programa: 1,
			_id: 0,
		});

	let newAportacio: any;
	newAportacio = new aportacio({
		userName: username,
		title: titol,
		body: body,
		sigles_ud: sigles_ud,
	});
	graus.forEach(function (grau: any) {
		newAportacio.graus.push(grau);
	});

	await newAportacio.save(function (err: any, apo: any) {
		return res.status(201).send({
			text: "Aportació creada",
			IdAportacio: apo.id,
		});
	});
};

const getAportacions: RequestHandler = async (req: Request, res: Response) => {
	const pagina: number = parseInt(req.body.pagina);
	const limit: number = parseInt(req.body.limit);
	let username: String = res.locals.user.username;
	let usernameFind: String = req.body.usernameFind;
	let busca: string = req.body.busca;
	let sigles_ud: String = req.body.sigles_ud;
	let ordre: Number = req.body.ordre; //0-Data 1-Vots
	let criteri: Number = req.body.criteri; //1-Ascendent -1-Descendent

	let filtre: any = {};
	if (usernameFind != undefined) filtre.userName = usernameFind;
	if (sigles_ud != undefined) filtre.sigles_ud = sigles_ud;
	if (busca != undefined) filtre.title = { $regex: new RegExp(busca, "i") };

	const startIndex: number = (pagina - 1) * limit;
	const endIndex: number = pagina * limit;

	let numDocuments: Number = await aportacio.countDocuments(filtre).exec();

	if (numDocuments == 0) {
		return res.status(401).send({
			text: "No existeixen aportacions per aquesta assignatura.",
		});
	}
	let seguent = {};
	let anterior = {};
	if (endIndex < numDocuments) {
		seguent = {
			pagina: pagina + 1,
			limit: limit,
		};
	}

	if (startIndex > 0) {
		anterior = {
			pagina: pagina - 1,
			limit: limit,
		};
	}
	try {
		let aportacions;
		if (ordre == 0) {
			aportacions = await aportacio
				.find(filtre)
				.sort({ createdAt: criteri })
				.limit(limit)
				.skip(startIndex)
				.select({
					userName: 1,
					title: 1,
					votes: 1,
					sigles_ud: 1,
					createdAt: 1,
				})
				.lean();
		} else {
			aportacions = await aportacio
				.find(filtre)
				.sort({ votes: criteri })
				.limit(limit)
				.skip(startIndex)
				.select({
					userName: 1,
					title: 1,
					votes: 1,
					sigles_ud: 1,
					createdAt: 1,
				})
				.lean();
		}
		let votsUsuari: any = await user
			.find({
				userName: username,
			})
			.select({
				votes: 1,
			});
		votsUsuari = JSON.parse(JSON.stringify(votsUsuari))[0].votes;
		aportacions.forEach(function (aporta: any) {
			votsUsuari.forEach(function (votUsuari: any) {
				if (aporta._id == votUsuari.votat) {
					aporta.votUsuari = votUsuari.vote;
				}
			});
		});
		return res.status(200).send({
			aportacions: aportacions,
			anterior: anterior,
			seguent: seguent,
		});
	} catch (e) {
		return res.status(500).send({
			error: e,
		});
	}
};

const getAportacio: RequestHandler = async (req: Request, res: Response) => {
	let aportacioId: String = req.body._id;
	let username: String = res.locals.user.username;
	const targetAportacio = await aportacio
		.find({ _id: aportacioId })
		.select({
			userName: 1,
			title: 1,
			body: 1,
			votes: 1,
			createdAt: 1,
		})
		.lean();
	if (targetAportacio.length == 0) {
		return res.status(401).send({
			text: "No existeix aquesta aportació.",
		});
	} else {
		let votUsuari: any = await user.find(
			{
				userName: username,
				votes: { $elemMatch: { votat: aportacioId } },
			},
			{ votes: { $elemMatch: { votat: aportacioId } } }
		);
		try {
			votUsuari = JSON.parse(JSON.stringify(votUsuari))[0].votes[0].vote;
		} catch {
			votUsuari = 0;
		}
		targetAportacio[0].votacioUser = votUsuari;
		return res.status(200).send({
			aportacio: targetAportacio,
		});
	}
};

const voteAportacio: RequestHandler = async (req: Request, res: Response) => {
	let username: String = res.locals.user.username;
	let aportacioId: String = req.body.aportacioId;
	let vot: number = req.body.vote;
	if (!res.locals.isStudent) {
		return res.status(401).send({
			text: "Has de verificar un correu d'estudiant per poder votar!",
		});
	}
	const targetAportacio = await aportacio.find({ _id: aportacioId });
	if (targetAportacio.length == 0) {
		return res.status(401).send({
			text: "No existeix aquesta aportació.",
		});
	}

	let votUsuari = await user.find(
		{
			userName: username,
			votes: { $elemMatch: { votat: aportacioId } },
		},
		{ votes: { $elemMatch: { votat: aportacioId } } }
	);
	if (votUsuari.length == 0) {
		//Si l'usuari encara no ha votat en aquella aportacio:

		if (vot == 1 || vot == -1) {
			await aportacio.findByIdAndUpdate(aportacioId, {
				$inc: { votes: vot },
			});
			await user.findOneAndUpdate(
				{ userName: username },
				{
					$push: {
						votes: {
							aportacio: aportacioId,
							votat: aportacioId,
							vote: vot,
						},
					},
				}
			);
			return res.status(200).send({
				text: "Vot registrat",
				vot: vot,
			});
		} else {
			return res.status(401).send({
				text: "Vot no vàlid",
			});
		}
	} else {
		//Si l'usuari ja ha votat:
		let votFinal: number;
		let votUsuariAux: number = JSON.parse(JSON.stringify(votUsuari))[0]
			.votes[0].vote;
		if (vot == 1) {
			if (votUsuariAux == 1) {
				await aportacio.findByIdAndUpdate(aportacioId, {
					$inc: { votes: -1 },
				});
				await user.findOneAndUpdate(
					{ userName: username },
					{
						$pull: { votes: { votat: aportacioId } },
					}
				);
				votFinal = 0;
			} else {
				await aportacio.findByIdAndUpdate(aportacioId, {
					$inc: { votes: 2 },
				});
				await user.findOneAndUpdate(
					{
						userName: username,
						votes: { $elemMatch: { votat: aportacioId } },
					},
					{
						$set: { "votes.$.vote": 1 },
					}
				);
				votFinal = 1;
			}
		} else if (vot == -1) {
			if (votUsuariAux == 1) {
				await aportacio.findByIdAndUpdate(aportacioId, {
					$inc: { votes: -2 },
				});
				await user.findOneAndUpdate(
					{
						userName: username,
						votes: { $elemMatch: { votat: aportacioId } },
					},
					{
						$set: { "votes.$.vote": -1 },
					}
				);
				votFinal = -1;
			} else {
				await aportacio.findByIdAndUpdate(aportacioId, {
					$inc: { votes: 1 },
				});
				await user.findOneAndUpdate(
					{ userName: username },
					{
						$pull: { votes: { votat: aportacioId } },
					}
				);
				votFinal = 0;
			}
		} else {
			return res.status(401).send({
				text: "Vot no vàlid",
			});
		}
		return res.status(200).send({
			text: "Vot modificat",
			vot: votFinal,
		});
	}
};

const addFile: RequestHandler = async (req: Request, res: Response) => {
	let aportacioId: string = req.body.aportacioId;
	let username: string = res.locals.user.username;

	if (aportacioId.length == 24 && aportacioId.match(/^[0-9a-fA-F]{24}$/)) {
		const aportacioExists = await aportacio.findOne({
			userName: username,
			_id: aportacioId,
		});
		if (!aportacioExists) {
			fs.rmSync("./public/files/" + aportacioId, { recursive: true });
			return res.status(401).send({
				text: "Aportació no vàlida",
			});
		}
	} else {
		fs.rmSync("./public/files/" + aportacioId, { recursive: true });
		return res.status(401).send({
			text: "Aportació no vàlida",
		});
	}
	return res.send({
		text: "Fitxer Afegit",
	});
};

const deleteAportacio: RequestHandler = async (req: Request, res: Response) => {
	let username: String = res.locals.user.username;
	let aportacioId: String = req.body.aportacioId;

	try {
		const aportacioToDelete = await aportacio.findById({
			_id: aportacioId,
		});
		const borrat = await aportacio.findOneAndRemove({
			_id: aportacioToDelete,
			userName: username,
		});
		if (borrat == null) {
			return res.status(401).send({
				text: "Aportació no vàlida",
			});
		} else {
			await comentari.deleteMany({
				aportacio: borrat,
			});
			await user.updateMany(
				{
					votes: { $elemMatch: { aportacio: aportacioId } },
				},
				{
					$pull: { votes: { aportacio: aportacioId } },
				}
			);
			fs.rmSync("./public/files/" + aportacioId, { recursive: true });
			return res.status(200).send({
				text: "Aportació borrada",
			});
		}
	} catch (e) {
		return res.status(500).send({
			error: e,
		});
	}
};

const getFileNamesAportacio: RequestHandler = async (
	req: Request,
	res: Response
) => {
	let aportacioId: String = req.body.aportacioId;
	try {
		if (
			aportacioId.length == 24 &&
			aportacioId.match(/^[0-9a-fA-F]{24}$/)
		) {
			const aportacioExists = await aportacio.findOne({
				_id: aportacioId,
			});
			if (!aportacioExists) {
				return res.status(401).send({
					text: "Aportació no vàlida",
				});
			}
		} else {
			return res.status(401).send({
				text: "Aportació no vàlida",
			});
		}
		const folder: string = "./public/files/" + aportacioId;
		let fitxers: string[] = [];
		await fs.readdir(folder, (err, files) => {
			files.forEach((file) => {
				fitxers.push(file);
			});
			return res.status(200).send({
				files: fitxers,
			});
		});
	} catch (e) {
		return res.status(500).send({
			error: e,
		});
	}
};

const downloadFile: RequestHandler = async (req: Request, res: Response) => {
	let aportacioId: String = req.body.aportacioId;
	let nomFitxer: String = req.body.nomFitxer;
	try {
		if (
			aportacioId.length == 24 &&
			aportacioId.match(/^[0-9a-fA-F]{24}$/)
		) {
			const aportacioExists = await aportacio.findOne({
				_id: aportacioId,
			});
			if (!aportacioExists) {
				return res.status(401).send({
					text: "Aportació no vàlida",
				});
			}
		} else {
			return res.status(401).send({
				text: "Aportació no vàlida",
			});
		}
		if (fs.existsSync("./public/files/" + aportacioId + "/" + nomFitxer)) {
			const fitxer: string =
				"./public/files/" + aportacioId + "/" + nomFitxer;
			res.download(fitxer);
		} else {
			return res.status(401).send({
				error: "El fitxer no existeix.",
			});
		}
	} catch (e) {
		return res.status(500).send({
			error: e,
		});
	}
};

const downloadAllFiles: RequestHandler = async (
	req: Request,
	res: Response
) => {
	let aportacioId: String = req.body.aportacioId;
	try {
		if (
			aportacioId.length == 24 &&
			aportacioId.match(/^[0-9a-fA-F]{24}$/)
		) {
			const aportacioExists = await aportacio.findOne({
				_id: aportacioId,
			});
			if (!aportacioExists) {
				return res.status(401).send({
					text: "Aportació no vàlida",
				});
			}
		} else {
			return res.status(401).send({
				text: "Aportació no vàlida",
			});
		}
		console.log("a");
		await zip(
			"./public/files/" + aportacioId,
			"./public/files/" + aportacioId + ".zip"
		);
		res.download("./public/files/" + aportacioId + ".zip", function () {
			fs.unlinkSync("./public/files/" + aportacioId + ".zip");
		});
	} catch (e) {
		return res.status(500).send({
			error: e,
		});
	}
};

const deleteAllAportacionsForUser: RequestHandler = async (
	req: Request,
	res: Response
) => {
	let username: String = res.locals.user.username;
	try {
		if (
			(await aportacio.countDocuments({ userName: username }).exec()) != 0
		) {
			await aportacio.deleteMany({ userName: username });
			return res.status(200).send({
				text: "Aportacions esborrades.",
			});
		} else {
			return res.status(401).send({
				text: "L'usuari no té cap aportació.",
			});
		}
	} catch (e) {
		return res.status(500).send({
			error: e,
		});
	}
};

export {
	newAportacio,
	getAportacions,
	getAportacio,
	voteAportacio,
	deleteAportacio,
	addFile,
	getFileNamesAportacio,
	downloadFile,
	downloadAllFiles,
	deleteAllAportacionsForUser,
};

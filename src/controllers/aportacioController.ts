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
		return res.status(401).send({
			error: "Verifica un correu d'estudiant per poder afegir aportacions!",
		});
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
	const pagina: number = parseInt(req.query.pagina as string);
	const limit: number = parseInt(req.query.limit as string);
	let username: string = res.locals.user.username;
	let usernameFind: string = req.query.usernameFind as string;
	let busca: string = req.query.busca as string;
	let sigles_ud: string = req.query.sigles_ud as string;
	let ordre: number = parseInt(req.query.ordre as string); //1-Ascendent -1-Descendent
	let criteri: number = parseInt(req.query.criteri as string); //0-Data 1-Vots

	let filtre: any = {};
	if (usernameFind != undefined) filtre.userName = usernameFind;
	if (sigles_ud != undefined) filtre.sigles_ud = sigles_ud;
	if (busca != undefined) filtre.title = { $regex: new RegExp(busca, "i") };

	if (Object.keys(filtre).length == 0) {
		filtre.graus = {
			$elemMatch: { codi_programa: res.locals.grauInteres },
		};
	}
	const startIndex: number = (pagina - 1) * limit;
	const endIndex: number = pagina * limit;

	let numDocuments: Number = await aportacio.countDocuments(filtre).exec();

	if (numDocuments == 0) {
		return res.status(200).send({
			text: "No existeixen aportacions per aquest criteri de cerca.",
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
		if (criteri == 0) {
			aportacions = await aportacio
				.find(filtre)
				.sort({ createdAt: ordre })
				.limit(limit)
				.skip(startIndex)
				.select({
					userName: 1,
					title: 1,
					body: 1,
					votes: 1,
					editat: 1,
					comentaris: 1,
					sigles_ud: 1,
					createdAt: 1,
				})
				.lean();
		} else {
			aportacions = await aportacio
				.find(filtre)
				.sort({ votes: ordre })
				.limit(limit)
				.skip(startIndex)
				.select({
					userName: 1,
					title: 1,
					body: 1,
					votes: 1,
					editat: 1,
					comentaris: 1,
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
		aportacions.forEach(async function (aporta: any) {
			if (fs.existsSync("./public/files/" + aporta._id)) {
				const folder: string = "./public/files/" + aporta._id;
				let fitxers: string[] = [];
				let folderFiles = fs.readdirSync(folder, {
					withFileTypes: true,
				});
				folderFiles.forEach((file) => {
					fitxers.push(file.name);
				});
				aporta.fitxers = fitxers;
			}
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
			numAportacions: numDocuments,
		});
	} catch (e) {
		return res.status(500).send({
			error: e,
		});
	}
};

const getAportacio: RequestHandler = async (req: Request, res: Response) => {
	let aportacioId: string = req.query._id as string;
	let username: string = res.locals.user.username;
	if (aportacioId.length != 24 && !aportacioId.match(/^[0-9a-fA-F]{24}$/)) {
		return res.status(401).send({
			error: "No existeix aquesta aportació.",
		});
	}
	const targetAportacio = await aportacio
		.find({ _id: aportacioId })
		.select({
			userName: 1,
			title: 1,
			body: 1,
			votes: 1,
			editat: 1,
			comentaris: 1,
			sigles_ud: 1,
			createdAt: 1,
		})
		.lean();
	if (targetAportacio.length == 0) {
		return res.status(401).send({
			error: "No existeix aquesta aportació.",
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
		targetAportacio[0].votUsuari = votUsuari;
		if (fs.existsSync("./public/files/" + aportacioId)) {
			const folder: string = "./public/files/" + aportacioId;
			let fitxers: string[] = [];
			let folderFiles = fs.readdirSync(folder, {
				withFileTypes: true,
			});
			folderFiles.forEach((file) => {
				fitxers.push(file.name);
			});
			targetAportacio[0].fitxers = fitxers;
		}
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
			error: "Has de verificar un correu d'estudiant per poder votar!",
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
				error: "Vot no vàlid",
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
				error: "Vot no vàlid",
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
				error: "Aportació no vàlida",
			});
		}
	} else {
		fs.rmSync("./public/files/" + aportacioId, { recursive: true });
		return res.status(401).send({
			error: "Aportació no vàlida",
		});
	}
	return res.status(200).send({
		text: "Fitxer Afegit",
	});
};

const editAportacio: RequestHandler = async (req: Request, res: Response) => {
	let aportacioId: string = req.body.aportacioId;
	let username: string = res.locals.user.username;
	let newBody: string = req.body.newBody;

	if (aportacioId.length == 24 && aportacioId.match(/^[0-9a-fA-F]{24}$/)) {
		const targetAportacio = await aportacio.findOne({
			userName: username,
			_id: aportacioId,
		});
		if (!targetAportacio) {
			return res.status(401).send({
				error: "Aportació no vàlida",
			});
		}
		try {
			await aportacio.findOneAndUpdate(
				{
					_id: aportacioId,
				},
				{
					body: newBody,
					editat: true,
				}
			);
			return res.status(200).send({
				text: "Aportació modificada",
				newBody: newBody,
			});
		} catch (e) {
			return res.status(500).send({
				error: e,
			});
		}
	} else {
		return res.status(401).send({
			error: "Aportació no vàlida",
		});
	}
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
				error: "Aportació no vàlida",
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
			if (fs.existsSync("./public/files/" + aportacioId))
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

const downloadFile: RequestHandler = async (req: Request, res: Response) => {
	let aportacioId: string = req.query.aportacioId as string;
	let nomFitxer: string = req.query.nomFitxer as string;
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
					error: "Aportació no vàlida",
				});
			}
		} else {
			return res.status(401).send({
				error: "Aportació no vàlida",
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
	let aportacioId: string = req.query.aportacioId as string;
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
					error: "Aportació no vàlida",
				});
			}
		} else {
			return res.status(401).send({
				error: "Aportació no vàlida",
			});
		}
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
				error: "L'usuari no té cap aportació.",
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
	downloadFile,
	downloadAllFiles,
	deleteAllAportacionsForUser,
	editAportacio,
};

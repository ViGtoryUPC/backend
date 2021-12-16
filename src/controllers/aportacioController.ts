import { RequestHandler, Request, Response } from "express";
import { Number } from "mongoose";
import aportacio from "../models/aportacio";
import user from "../models/user";

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

	let newAportacio;
	newAportacio = new aportacio({
		userName: username,
		title: titol,
		body: body,
		sigles_ud: sigles_ud,
	});
	await newAportacio.save(function (err: any, apo: any) {
		return res.status(201).send({
			text: "Aportació creada",
			IdAportacio: apo.id,
		});
	});
};

const getAllAportacionsForAssignatura: RequestHandler = async (
	req: Request,
	res: Response
) => {
	const pagina: number = parseInt(req.body.pagina);
	const limit: number = parseInt(req.body.limit);
	let username: String = res.locals.user.username;
	let sigles_ud: String = req.body.sigles_ud;

	const startIndex: number = (pagina - 1) * limit;
	const endIndex: number = pagina * limit;

	if (
		(await aportacio.countDocuments({ sigles_ud: sigles_ud }).exec()) == 0
	) {
		return res.status(401).send({
			text: "No existeixen aportacions per aquesta assignatura.",
		});
	}

	let seguent = {};
	let anterior = {};

	if (
		endIndex <
		(await aportacio.countDocuments({ sigles_ud: sigles_ud }).exec())
	) {
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
		const aportacions = await aportacio
			.find({ sigles_ud: sigles_ud })
			.limit(limit)
			.skip(startIndex)
			.select({
				userName: 1,
				title: 1,
				votes: 1,
				createdAt: 1,
			})
			.lean();

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
		if (vot == 1) {
			await aportacio.findByIdAndUpdate(aportacioId, {
				$inc: { votes: 1 },
			});
			await user.findOneAndUpdate(username, {
				$push: { votes: { votat: aportacioId, vote: vot } },
			});
			return res.status(200).send({
				text: "Vot registrat",
			});
		} else if (vot == -1) {
			await aportacio.findByIdAndUpdate(aportacioId, {
				$inc: { votes: -1 },
			});
			await user.findOneAndUpdate(username, {
				$push: { votes: { votat: aportacioId, vote: vot } },
			});
			return res.status(200).send({
				text: "Vot registrat",
			});
		} else {
			return res.status(401).send({
				text: "Vot no vàlid",
			});
		}
	} else {
		//Si l'usuari ja ha votat:
		let votUsuariAux: number = JSON.parse(JSON.stringify(votUsuari))[0]
			.votes[0].vote;
		if (vot == 1) {
			if (votUsuariAux == 1) {
				await aportacio.findByIdAndUpdate(aportacioId, {
					$inc: { votes: -1 },
				});
				await user.findOneAndUpdate(username, {
					$pull: { votes: { votat: aportacioId } },
				});
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
			} else {
				await aportacio.findByIdAndUpdate(aportacioId, {
					$inc: { votes: 1 },
				});
				await user.findOneAndUpdate(username, {
					$pull: { votes: { votat: aportacioId } },
				});
			}
		} else {
			return res.status(401).send({
				text: "Vot no vàlid",
			});
		}
		return res.status(200).send({
			text: "Vot modificat",
		});
	}
};

export {
	newAportacio,
	getAllAportacionsForAssignatura,
	getAportacio,
	voteAportacio,
};

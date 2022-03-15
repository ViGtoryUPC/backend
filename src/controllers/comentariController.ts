import { RequestHandler, Request, Response } from "express";
import comentari from "../models/comentari";
import user from "../models/user";

//------------------------------------
//
//		PUBLICS
//
//------------------------------------

const newComentari: RequestHandler = async (req: Request, res: Response) => {
	let username: String = res.locals.user.username;
	const usuari = await user.findOne({ userName: username });

	if (!usuari.emailStudentConfirmed) {
		return res
			.status(401)
			.send(
				"Verifica un correu d'estudiant per poder afegir comentaris!"
			);
	}
	let idAportacio: String = req.body.idAportacio;
	let body: String = req.body.body;
	let idParent: String = req.body.idParent;

	let newComentari;

	if (idParent == null) {
		newComentari = new comentari({
			userName: username,
			aportacio: idAportacio,
			body: body,
		});
	} else {
		newComentari = new comentari({
			userName: username,
			aportacio: idAportacio,
			body: body,
			parent: idParent,
		});
	}
	await newComentari.save(function (err: any, com: any) {
		return res.status(201).send({
			text: "Comentari creat",
			IdComentari: com.id,
		});
	});
};

const getComentaris: RequestHandler = async (req: Request, res: Response) => {
	let idAportacio: String = req.body.idAportacio;
	let username: String = res.locals.user.username;
	if (idAportacio.length == 24) {
		const comentaris = await comentari
			.find({ aportacio: idAportacio })
			.sort({ createdAt: 1 })
			.select({
				userName: 1,
				aportacio: 1,
				body: 1,
				esborrat: 1,
				parent: 1,
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
		comentaris.forEach(function (comenta: any) {
			votsUsuari.forEach(function (votUsuari: any) {
				if (comenta._id == votUsuari.votat) {
					comenta.votUsuari = votUsuari.vote;
				}
			});
		});

		return res.status(200).send({
			comentaris: comentaris,
		});
	} else {
		return res.status(401).send({
			text: "id no vàlid.",
		});
	}
};

const deleteComentari: RequestHandler = async (req: Request, res: Response) => {
	let username: string = res.locals.user.username;
	let comentariId: string = req.body.comentariId;
	try {
		const comentariBorrat = await comentari.findOneAndUpdate(
			{
				_id: comentariId,
				userName: username,
			},
			{ $set: { body: "<comentari esborrat>", esborrat: true } }
		);
		return res.status(200).send({
			comentari: comentariBorrat,
		});
	} catch (e) {
		return res.status(500).send({
			error: e,
		});
	}
};

const voteComentari: RequestHandler = async (req: Request, res: Response) => {
	let username: String = res.locals.user.username;
	let comentariId: String = req.body.comentariId;
	let aportacioId: String = req.body.aportacioId;
	let vot: number = req.body.vote;
	if (!res.locals.isStudent) {
		return res.status(401).send({
			text: "Has de verificar un correu d'estudiant per poder votar!",
		});
	}
	const targetAportacio = await comentari.find({ _id: comentariId });
	if (targetAportacio.length == 0) {
		return res.status(401).send({
			text: "No existeix aquest comentari.",
		});
	}

	let votUsuari = await user.find(
		{
			userName: username,
			votes: { $elemMatch: { votat: comentariId } },
		},
		{ votes: { $elemMatch: { votat: comentariId } } }
	);
	if (votUsuari.length == 0) {
		//Si l'usuari encara no ha votat en aquella aportacio:
		if (vot == 1 || vot == -1) {
			await comentari.findByIdAndUpdate(comentariId, {
				$inc: { votes: vot },
			});
			await user.findOneAndUpdate(
				{ userName: username },
				{
					$push: {
						votes: {
							aportacio: aportacioId,
							votat: comentariId,
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
				await comentari.findByIdAndUpdate(comentariId, {
					$inc: { votes: -1 },
				});
				await user.findOneAndUpdate(
					{ userName: username },
					{
						$pull: { votes: { votat: comentariId } },
					}
				);
				votFinal = 0;
			} else {
				await comentari.findByIdAndUpdate(comentariId, {
					$inc: { votes: 2 },
				});
				await user.findOneAndUpdate(
					{
						userName: username,
						votes: { $elemMatch: { votat: comentariId } },
					},
					{
						$set: { "votes.$.vote": 1 },
					}
				);
				votFinal = 1;
			}
		} else if (vot == -1) {
			if (votUsuariAux == 1) {
				await comentari.findByIdAndUpdate(comentariId, {
					$inc: { votes: -2 },
				});
				await user.findOneAndUpdate(
					{
						userName: username,
						votes: { $elemMatch: { votat: comentariId } },
					},
					{
						$set: { "votes.$.vote": -1 },
					}
				);
				votFinal = -1;
			} else {
				await comentari.findByIdAndUpdate(comentariId, {
					$inc: { votes: 1 },
				});
				await user.findOneAndUpdate(
					{ userName: username },
					{
						$pull: { votes: { votat: comentariId } },
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

export { newComentari, getComentaris, voteComentari, deleteComentari };

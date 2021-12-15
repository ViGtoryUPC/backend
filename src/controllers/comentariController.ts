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
	const pagina: number = parseInt(req.body.pagina);
	const limit: number = parseInt(req.body.limit);
	let username: String = res.locals.user.username;
	if (idAportacio.length == 24) {
		const comentaris = await comentari
			.find({ aportacio: idAportacio })
			.sort({ createdAt: 1 })
			.select({
				userName: 1,
				aportacio: 1,
				body: 1,
				parent: 1,
				votes: 1,
				createdAt: 1,
			});
		
		} else {
			return res.status(200).send({
				comentaris: comentaris,
			});
		}
	} else {
		return res.status(401).send({
			text: "id no vàlid.",
		});
	}
};

const voteComentari: RequestHandler = async (req: Request, res: Response) => {
	let username: String = res.locals.user.username;
	let comentariId: String = req.body.comentariId;
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
		if (vot == 1) {
			await comentari.findByIdAndUpdate(comentariId, {
				$inc: { votes: 1 },
			});
			await user.findOneAndUpdate(username, {
				$push: { votes: { votat: comentariId, vote: vot } },
			});
			return res.status(200).send({
				text: "Vot registrat",
			});
		} else if (vot == -1) {
			await comentari.findByIdAndUpdate(comentariId, {
				$inc: { votes: -1 },
			});
			await user.findOneAndUpdate(username, {
				$push: { votes: { votat: comentariId, vote: vot } },
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
				await comentari.findByIdAndUpdate(comentariId, {
					$inc: { votes: -1 },
				});
				await user.findOneAndUpdate(username, {
					$pull: { votes: { votat: comentariId } },
				});
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
			} else {
				await comentari.findByIdAndUpdate(comentariId, {
					$inc: { votes: 1 },
				});
				await user.findOneAndUpdate(username, {
					$pull: { votes: { votat: comentariId } },
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

export { newComentari, getComentaris, voteComentari };

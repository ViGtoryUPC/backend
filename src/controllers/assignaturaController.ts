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

const voteAssignatura: RequestHandler = async (req: Request, res: Response) => {
	let username: String = res.locals.user.username;
	let assignaturaId = req.body.assignaturaId;
	let votDificultat = req.body.votDificultat;
	let votProfessorat = req.body.votProfessorat;
	let votInteresant = req.body.votInteresant;
	let votFeina = req.body.votFeina;
	if (!res.locals.isStudent) {
		res.status(401).send({
			text: "Verifica un correu d'estudiant per a poder valorar assignatures.",
		});
	}
	let searchAssignatura = await assignatura.find({
		sigles_ud: assignaturaId,
	});
	if (searchAssignatura.length == 0) {
		return res.status(401).send({
			text: "No existeix aquesta aportació.",
		});
	}
	let votUsuari = await user.find(
		{
			userName: username,
			votesAssignatures: { $elemMatch: { assignatura: assignaturaId } },
		},
		{ votesAssignatures: { $elemMatch: { assignatura: assignaturaId } } }
	);
	if (votUsuari.length != 0) {
		res.status(401).send({
			text: "Aquest usuari ja ha valorat aquesta assignatura",
		});
	} else {
		try {
			await user.findOneAndUpdate(
				{ userName: username },
				{
					$push: {
						votesAssignatures: {
							assignatura: assignaturaId,
						},
					},
				}
			);
			const firstVote = await assignatura
				.findOne({
					sigles_ud: assignaturaId,
				})
				.select({
					dificultat: 1,
				});
			if (firstVote.dificultat == 0) {
				await assignatura.updateMany(
					{ sigles_ud: assignaturaId },
					{
						$set: {
							dificultat: votDificultat,
							professorat: votProfessorat,
							interesant: votInteresant,
							feina: votFeina,
						},
						$inc: {
							vots: 1,
						},
					}
				);
			} else {
				let votsActuals = await assignatura
					.findOne({ sigles_ud: assignaturaId })
					.select({
						dificultat: 1,
						professorat: 1,
						interesant: 1,
						feina: 1,
						vots: 1,
					});
				let nouDificultat =
					votsActuals.dificultat *
						(votsActuals.vots / (votsActuals.vots + 1)) +
					votDificultat / (votsActuals.vots + 1);
				let nouProfessorat =
					votsActuals.professorat *
						(votsActuals.vots / (votsActuals.vots + 1)) +
					votProfessorat / (votsActuals.vots + 1);
				let nouInteresant =
					votsActuals.interesant *
						(votsActuals.vots / (votsActuals.vots + 1)) +
					votInteresant / (votsActuals.vots + 1);
				let nouFeina =
					votsActuals.feina *
						(votsActuals.vots / (votsActuals.vots + 1)) +
					votFeina / (votsActuals.vots + 1);

				await assignatura.updateMany(
					{
						sigles_ud: assignaturaId,
					},
					{
						$set: {
							dificultat: nouDificultat,
							professorat: nouProfessorat,
							interesant: nouInteresant,
							feina: nouFeina,
						},
						$inc: {
							vots: 1,
						},
					}
				);
			}
			res.status(200).send({
				text: "Valoració afegida",
			});
		} catch (e) {
			res.status(500).send({
				error: e,
			});
		}
	}
};

const getVotesAssignatura: RequestHandler = async (
	req: Request,
	res: Response
) => {
	let username: String = res.locals.user.username;
	let assignaturaId = req.body.assignaturaId;
	let searchAssignatura = await assignatura.find({
		sigles_ud: assignaturaId,
	});
	if (searchAssignatura.length == 0) {
		return res.status(401).send({
			text: "No existeix aquesta aportació.",
		});
	}
	try {
		let votsActuals = await assignatura
			.findOne({ sigles_ud: assignaturaId })
			.select({
				dificultat: 1,
				professorat: 1,
				interesant: 1,
				feina: 1,
				vots: 1,
			});
		let votUsuari: any = await user.find(
			{
				userName: username,
				votesAssignatures: {
					$elemMatch: { assignatura: assignaturaId },
				},
			},
			{ votes: { $elemMatch: { assignatura: assignaturaId } } }
		);
		try {
			votUsuari = JSON.parse(JSON.stringify(votUsuari));
		} catch {
			votUsuari = 0;
		}
		if (votUsuari.length != 0) votUsuari = 1;
		else votUsuari = 0;
		res.status(200).send({
			dificultat: votsActuals.dificultat,
			professorat: votsActuals.professorat,
			interesant: votsActuals.interesant,
			feina: votsActuals.feina,
			vots: votsActuals.vots,
			votUsuari: votUsuari,
		});
	} catch (e) {
		res.status(500).send({
			error: e,
		});
	}
};
export { getAssignatures, voteAssignatura, getVotesAssignatura };

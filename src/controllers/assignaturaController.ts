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
	try {
		if (votUsuari.length == 0) {
			//Si l'usuari encara no ha votat aquella assignatura
			await user.findOneAndUpdate(
				{ userName: username },
				{
					$push: {
						votesAssignatures: {
							assignatura: assignaturaId,
							votDificultat: votDificultat,
							votProfessorat: votProfessorat,
							votInteresant: votInteresant,
							votFeina: votFeina,
						},
					},
				}
			);
			await assignatura.updateMany(
				{ sigles_ud: assignaturaId },
				{
					$inc: {
						dificultat: votDificultat,
						professorat: votProfessorat,
						interesant: votInteresant,
						feina: votFeina,
						vots: 1,
					},
				}
			);
			res.status(200).send({
				text: "Valoració afegida",
			});
		} else {
			let votsUsuari = await user.find(
				{
					userName: username,
					votesAssignatures: {
						$elemMatch: { assignatura: assignaturaId },
					},
				},
				{
					votesAssignatures: {
						$elemMatch: { assignatura: assignaturaId },
					},
				}
			);
			await assignatura.updateMany(
				{ sigles_ud: assignaturaId },
				{
					$inc: {
						dificultat: -JSON.parse(JSON.stringify(votsUsuari))[0]
							.votesAssignatures[0].votDificultat,
						professorat: -JSON.parse(JSON.stringify(votsUsuari))[0]
							.votesAssignatures[0].votProfessorat,
						interesant: -JSON.parse(JSON.stringify(votsUsuari))[0]
							.votesAssignatures[0].votInteresant,
						feina: -JSON.parse(JSON.stringify(votsUsuari))[0]
							.votesAssignatures[0].votFeina,
					},
				}
			);
			await assignatura.updateMany(
				{ sigles_ud: assignaturaId },
				{
					$inc: {
						dificultat: votDificultat,
						professorat: votProfessorat,
						interesant: votInteresant,
						feina: votFeina,
					},
				}
			);
			await user.findOneAndUpdate(
				{
					userName: username,
					votesAssignatures: {
						$elemMatch: { assignatura: assignaturaId },
					},
				},
				{
					$set: {
						"votesAssignatures.$.votDificultat": votDificultat,
						"votesAssignatures.$.votProfessorat": votProfessorat,
						"votesAssignatures.$.votInteresant": votInteresant,
						"votesAssignatures.$.votFeina": votFeina,
					},
				}
			);
			res.status(200).send({
				text: "Valoració Modificada",
			});
		}
	} catch (e) {
		res.status(500).send({
			error: e,
		});
	}
};

const getVotesAssignatura: RequestHandler = async (
	req: Request,
	res: Response
) => {
	let username: string = res.locals.user.username as string;
	let assignaturaId: string = req.query.assignaturaId as string;
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
			{
				votesAssignatures: {
					$elemMatch: { assignatura: assignaturaId },
				},
			}
		);
		try {
			votUsuari = JSON.parse(JSON.stringify(votUsuari));
			if (votUsuari.length == 0) votUsuari = [];
			else votUsuari = votUsuari[0].votesAssignatures[0];
		} catch {
			votUsuari = 0;
		}
		res.status(200).send({
			dificultat: votsActuals.dificultat / votsActuals.vots,
			professorat: votsActuals.professorat / votsActuals.vots,
			interesant: votsActuals.interesant / votsActuals.vots,
			feina: votsActuals.feina / votsActuals.vots,
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

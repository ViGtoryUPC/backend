import fs from "fs";
import multer from "multer";

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		let aportacio = req.body.aportacioId;
		const dir = "./public/files/" + aportacio;
		fs.exists(dir, (exist) => {
			if (!exist) {
				return fs.mkdir(dir, (error) => cb(error, dir));
			}
			return cb(null, dir);
		});
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	},
});
export default multer({ storage });

import fs from "fs";
import multer from "multer";

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		let aportacio = req.body.aportacioId;
		const dir = "./public/files/" + aportacio;
		fs.exists(dir, (exist) => {
			if (!exist) {
				return fs.mkdir(dir, (error) => {
					if (error && error.code === "EEXIST"){
						return cb(null, dir);
					}
					else
						cb(error, dir);
				});
			}
			return cb(null, dir);
		});
	},
	filename: (req, file, cb) => {
		//console.log(file.originalname);
		cb(null, file.originalname);
	},
});
export default multer({ storage });

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

mongoose
	.connect(MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then((db: any) => console.log("Database is connected"))
	.catch((err: any) => console.log(err));

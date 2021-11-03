// @ts-check

import express = require("express");
import path = require("path");

//Inits
const app = express();

//Settings
app.set("port", process.env.PORT || 4000);
app.set("views", path.join(__dirname, "views"));

//Middlewares
app.use(express.urlencoded({ extended: false }));

//Global Variables

//Routes
app.get("/", (req, res) => {
	res.send("helloWorld");
});
//Static Files
app.use(express.static(path.join(__dirname, "public")));

module.exports = app;

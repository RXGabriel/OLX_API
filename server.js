const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fileupload = require("express-fileupload");
const apiRoutes = require("./src/routes");

require("dotenv").config();

mongoose.connect(process.env.DATABASE_URL);
mongoose.Promise = global.Promise;
mongoose.connection.on("error", (error) => {
  console.log("ERRO: ", error.message);
});

const server = express();
server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(fileupload());

server.use(express.static(__dirname + "/public"));

server.use("/", apiRoutes);

server.listen(process.env.PORT, () => {
  console.log(`Servidor rodando no endereço: ${process.env.BASE}`);
});

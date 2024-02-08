import dotenv from "dotenv";
import express from "express";
import { json, urlencoded } from "express";
import mongoose from "mongoose";
import cors from "cors";
import fileUpload from "express-fileupload";
import path from "path";

dotenv.config();

mongoose.connect(process.env.DATABASE_URL);

const connection = mongoose.connection;
connection.on("error", (error) => {
  console.log("ERRO: ", error.message);
});

const server = express();
server.use(cors());
server.use(json());
server.use(urlencoded({ extended: true }));
server.use(fileUpload());

const __dirname = path.resolve();
server.use(express.static(path.join(__dirname, "public")));

server.get("/ping", (req, res) => {
  res.json({ pong: true });
});

server.listen(process.env.PORT, () => {
  console.log(`Servidor rodando no endereço: ${process.env.BASE}`);
});

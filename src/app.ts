import express, { Express } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";

// Configuring env vars
dotenv.config();

// Project Config
export const config = {
  port: Number(process.env.PORT),
  checksum: process.env.CHECKSUM,
  codeId: Number(process.env.CODE_ID),
  privateKey: process.env.PRIVATE_KEY,
  stytchProjectId: process.env.STYTCH_PROJECT_ID,
  stytchSecret: process.env.STYTCH_SECRET,
  stytchAPIUrl: process.env.STYTCH_API_URL,
};

// Basic express setup
const app: Express = express();

// Importing routes
var v1Jwt = require("./api/routes/instantiateContractJwt");
var v1Arb = require("./api/routes/instantiateContractArb");
var v1genSessionJwt = require("./api/routes/generateSessionJwt");

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use("/api/v1/jwt-account", v1Jwt);
app.use("/api/v1/arb-account", v1Arb);
app.use("/api/v1/session", v1genSessionJwt);

// Run the server
app.listen(process.env.PORT, () => {
  console.log(
    `⚡️[server]: Server is running at http://localhost:${process.env.PORT}`
  );
});

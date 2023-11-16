import express, { Express } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import * as stytch from "stytch";

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

// Initialize Stytch client
export const stytchClient = new stytch.Client({
  project_id: config.stytchProjectId || "",
  secret: config.stytchSecret || "",
  env: config.stytchAPIUrl,
});

// Basic express setup
const app: Express = express();

// Importing routes
var v1Healthz = require("./api/routes/healthz");
var v1JwtAccounts = require("./api/routes/jwt-accounts");
var v1ArbAccounts = require("./api/routes/arb-accounts");
var v1Otps = require("./api/routes/otps");
var v1Sessions = require("./api/routes/sessions");

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use("/api/v1/healthz", v1Healthz);
app.use("/api/v1/jwt-accounts", v1JwtAccounts);
app.use("/api/v1/arb-accounts", v1ArbAccounts);
app.use("/api/v1/otps", v1Otps);
app.use("/api/v1/sessions", v1Sessions);

// Run the server
app.listen(process.env.PORT, () => {
  console.log(
    `⚡️[server]: Server is running at http://localhost:${process.env.PORT}`
  );
});

import express, {Express, Request, Response, NextFunction} from "express";
import logger from './lib/logger';
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import * as stytch from "stytch";
import {buildClient} from "./modules/utils";
import {awsConfig} from "./modules/aws";

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

// Request logging middleware
function logRequest(req: Request, res: Response, next: NextFunction) {
    logger.info(`${req.method} ${req.url}`);
    next();
}

app.use(logRequest);

// Error logging middleware
function logError(err: Error, req: Request, res: Response, next: NextFunction) {
    logger.error(`${err.message}`);
    next(err);
}

app.use(logError);

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
export const httpClient = app.listen(process.env.PORT, async () => {
    logger.info(`⚡️Server is running at http://localhost:${config.port}`);

    const [client, signer] = await buildClient(config.privateKey || "");
    const account = await client.getAccount(signer.address);
    if (!account) {
        throw new Error(
            `Account '${signer.address}' does not exist on chain. Send some tokens there before trying to query sequence.`
        );
    }

    logger.info({"xion": {"address": account.address, "sequence": account.sequence}});
    logger.info({"aws": {"region": awsConfig.region, "sqs": awsConfig.sqs}})
});

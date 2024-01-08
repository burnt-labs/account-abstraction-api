import * as stytch from "stytch";
import {config} from "./config";

export const stytchClient = new stytch.Client({
    project_id: config.stytchProjectId || "",
    secret: config.stytchSecret || "",
    env: config.stytchAPIUrl,
});

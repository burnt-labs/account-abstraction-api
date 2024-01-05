import { Router } from "express";

import * as stytch from "stytch";

import { config } from "../../app";
import logger from "../../lib/logger";

const router = Router();

// Initialize Stytch client
const stytchClient = new stytch.Client({
  project_id: config.stytchProjectId || "",
  secret: config.stytchSecret || "",
  env: config.stytchAPIUrl,
});

router.post("/generate", async (req, res) => {
  try {
    const { session_token, transaction_hash } = req.body;

    // Validate the input
    if (!session_token || !transaction_hash) {
      const err = {
        error: "Missing session_token or transaction_hash",
      };
      logger.error(err);
      return res.status(400).json(err);
    }

    const { session_jwt } = await stytchClient.sessions.authenticate({
      session_token,
      session_duration_minutes: 60 * 24 * 30,
      session_custom_claims: {
        transaction_hash,
      },
    });

    return res.status(200).json({ session_jwt });
  } catch (error: any) {
    const err = {
      message: "An error occurred while generating the JWT",
      error: error.message,
    }
    logger.error(err);
    return res.status(500).json(err);
  }
});

module.exports = router;

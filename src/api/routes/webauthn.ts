import { Router } from "express";
import { stytchClient } from "../../app";
import { PropertyRequiredError } from "../../lib/errors";

const router = Router();

router.post("/register-start", async (req, res) => {
  let validationErrors = [];
  const { user_id, domain } = req.body;
  if (!user_id) {
    const error = new PropertyRequiredError("user_id");
    validationErrors.push(error);
  }

  if (!domain) {
    const error = new PropertyRequiredError("domain");
    validationErrors.push(error);
  }

  if (validationErrors.length >= 1) {
    return res.status(400).json({
      error: {
        message: "Missing Properties",
        errors: validationErrors,
      },
    });
  }

  try {
    const response = await stytchClient.webauthn.registerStart({
      user_id,
      domain,
    });
    return res.status(200).json({ data: response });
  } catch (error) {
    return res
      .status(500)
      .json({ error: { message: "Something went wrong", errors: error } });
  }
});

router.post("/register", async (req, res) => {
  let validationErrors = [];
  const { user_id, public_key_credential } = req.body;
  if (!user_id) {
    const error = new PropertyRequiredError("user_id");
    validationErrors.push(error);
  }

  if (!public_key_credential) {
    const error = new PropertyRequiredError("public_key_credential");
    validationErrors.push(error);
  }

  if (validationErrors.length >= 1) {
    return res.status(400).json({
      error: {
        message: "Missing Properties",
        errors: validationErrors,
      },
    });
  }

  try {
    const response = await stytchClient.webauthn.register({
      user_id,
      public_key_credential,
      session_duration_minutes: 60,
    });
    return res.status(200).json({ data: response });
  } catch (error) {
    return res
      .status(500)
      .json({ error: { message: "Something went wrong", errors: error } });
  }
});

router.post("/authenticate-start", async (req, res) => {
  let validationErrors = [];
  const { domain } = req.body;
  if (!domain) {
    const error = new PropertyRequiredError("domain");
    validationErrors.push(error);
  }

  if (validationErrors.length >= 1) {
    return res.status(400).json({
      error: {
        message: "Missing Properties",
        errors: validationErrors,
      },
    });
  }

  try {
    const response = await stytchClient.webauthn.authenticateStart({
      domain,
    });
    return res.status(200).json({ data: response });
  } catch (error) {
    return res
      .status(500)
      .json({ error: { message: "Something went wrong", errors: error } });
  }
});

router.post("/authenticate", async (req, res) => {
  let validationErrors = [];
  const { public_key_credential } = req.body;
  if (!public_key_credential) {
    const error = new PropertyRequiredError("public_key_credential");
    validationErrors.push(error);
  }

  if (validationErrors.length >= 1) {
    return res.status(400).json({
      error: {
        message: "Missing Properties",
        errors: validationErrors,
      },
    });
  }

  try {
    const response = await stytchClient.webauthn.authenticate({
      public_key_credential,
      session_duration_minutes: 60,
    });
    return res.status(200).json({ data: response });
  } catch (error) {
    return res
      .status(500)
      .json({ error: { message: "Something went wrong", errors: error } });
  }
});

module.exports = router;

import { Router } from "express";
import { stytchClient } from "../../app";

const router = Router();

router.post("/authenticate", async (req, res) => {
  const {
    session_token,
    session_duration_minutes,
    session_jwt,
    session_custom_claims,
  } = req.body;

  try {
    const response = await stytchClient.sessions.authenticate({
      session_jwt,
      session_token,
      session_duration_minutes,
      session_custom_claims,
    });
    return res.status(200).json({ data: response });
  } catch (error) {
    return res
      .status(500)
      .json({ error: { message: "Something went wrong", errors: [error] } });
  }
});

module.exports = router;

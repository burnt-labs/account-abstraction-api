import {Router} from "express";
import {stytchClient} from "../../app";
import logger from "../../lib/logger";

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
        return res.status(200).json({data: response});
    } catch (error) {
        const err = {error: {message: "Something went wrong", errors: [error]}}
        logger.error(err)
        return res
            .status(500)
            .json(err);
    }
});

module.exports = router;

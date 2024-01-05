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

    /*
    "error_type":"too_many_session_arguments",
    "error_message":"Please include at most one of session_token, session_jwt, or intermediate_session_token
        in an authenticate request, not multiple."
     */
    let data;
    if(session_token) {
        data = {
            session_token,
            session_duration_minutes,
            session_custom_claims,
        }
    } else {
        data = {
            session_jwt,
            session_duration_minutes,
            session_custom_claims,
        }
    }

    try {
        const response = await stytchClient.sessions.authenticate(data);
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

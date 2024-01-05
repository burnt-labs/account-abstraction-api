import {Router} from "express";
import {stytchClient} from "../../app";
import logger from "../../lib/logger";
import {PropertyRequiredError} from "../../lib/errors";

const router = Router();

router.post("/authenticate", async (req, res) => {
    const {
        session_token,
        session_jwt,
        session_duration_minutes,
        session_custom_claims,
    } = req.body;

    let validationErrors = [];
    if (!session_token && !session_jwt) {
        const error = new PropertyRequiredError("one of session_token or session_jwt is required");
        validationErrors.push(error);
    }
    if (!session_duration_minutes) {
        const error = new PropertyRequiredError("session_duration_minutes");
        validationErrors.push(error);
    }
    if (!session_custom_claims) {
        const error = new PropertyRequiredError("session_custom_claims");
        validationErrors.push(error);
    }

    if (validationErrors.length >= 1) {
        const err = {
            message: "Missing Properties",
            errors: validationErrors,
        }
        logger.error(err)
        return res.status(400).json({
            error: err
        });
    }

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

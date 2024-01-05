import {Router} from "express";
import {stytchClient} from "../../app";
import {PropertyRequiredError} from "../../lib/errors";
import logger from "../../lib/logger";

const router = Router();

router.post("/login-or-create", async (req, res) => {
    let validationErrors = [];
    const {email} = req.body;
    if (!email) {
        const error = new PropertyRequiredError("email");
        validationErrors.push(error);
    }

    if (validationErrors.length >= 1) {
        const err = {
            message: "Missing Properties",
            errors: validationErrors,
        }
        logger.error(err);
        return res.status(400).json({
            error: err
        });
    }

    try {
        const response = await stytchClient.otps.email.loginOrCreate({
            email,
        });
        return res.status(200).json({data: response});
    } catch (error) {
        const err = {error: {message: "Something went wrong", errors: [error]}}
        logger.error(err);
        return res
            .status(500)
            .json(err);
    }
});

router.post("/authenticate", async (req, res) => {
    let validationErrors = [];
    const {otp, methodId} = req.body;
    if (!otp) {
        const error = new PropertyRequiredError("otp");
        validationErrors.push(error);
    }

    if (!methodId) {
        const error = new PropertyRequiredError("methodId");
        validationErrors.push(error);
    }

    if (validationErrors.length >= 1) {
        const err = {
            message: "Missing Properties",
            errors: validationErrors,
        }
        logger.error(err);
        return res.status(400).json({
            error: err,
        });
    }

    try {
        const response = await stytchClient.otps.authenticate({
            code: otp,
            method_id: methodId,
            session_duration_minutes: 60,
        });
        return res.status(200).json({data: response});
    } catch (error) {
        const err = {error: {message: "Something went wrong", errors: [error]}}
        logger.error(err);
        return res
            .status(500)
            .json(err);
    }
});

module.exports = router;

import { Router } from "express";
import { decodeJwt } from "jose";
import Long from "long";

import { instantiate2Address } from "@cosmjs/cosmwasm-stargate";
import { sha256 } from "@cosmjs/crypto";

import { buildClient } from "../../modules/utils";
import { MsgRegisterAccount } from "../../interfaces/generated/abstractaccount/v1/tx";
import { config, stytchClient } from "../../app";
import { PropertyRequiredError } from "../../lib/errors";
import { submitQueue } from "../../lib/submit-queue";
interface IRequestBody {
  salt: string;
  session_jwt: string;
  session_token: string;
}

const router = Router();
const encoder = new TextEncoder();

router.post("/create", async (req, res) => {
  try {
    let validationErrors = [];
    const { salt, session_token } = req.body as IRequestBody;

    if (!salt) {
      const error = new PropertyRequiredError("salt");
      validationErrors.push(error);
    }

    if (!session_token) {
      const error = new PropertyRequiredError("session_token");
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

    const checksum = config.checksum;
    const codeId = config.codeId;
    const privateKey = config.privateKey;

    if (!checksum || !codeId || !privateKey) {
      return res.status(500).json({
        error: {
          message: "Internal Server Error",
          cause: "Missing environment variables",
        },
      });
    }

    const [signingCosmWasmClient, accountData, signer, signArb] =
      await buildClient(privateKey);

    const encodedSalt = encoder.encode(salt);
    let byteArray = new Uint8Array(32);

    for (let i = 0; i < checksum.length; i += 2) {
      byteArray[i / 2] = parseInt(checksum.substring(i, i + 2), 16);
    }

    const addy = instantiate2Address(
      byteArray,
      accountData.address,
      encodedSalt,
      "xion"
    );

    const { session_jwt: signature } = await stytchClient.sessions.authenticate(
      {
        session_token: session_token,
        session_duration_minutes: 60 * 24 * 30,
        session_custom_claims: {
          transaction_hash: Buffer.from(sha256(Buffer.from(addy))).toString(
            "base64"
          ),
        },
      }
    );
    const { aud, sub } = decodeJwt(signature);

    const initiateContractMsg = {
      id: 0,
      authenticator: {
        Jwt: {
          aud: Array.isArray(aud) ? aud[0] : aud,
          sub,
        },
      },
      signature: Buffer.from(signature).toString("base64"),
    };

    const registerAccountMsg: MsgRegisterAccount = {
      sender: accountData.address,
      codeId: Long.fromNumber(codeId),
      msg: Buffer.from(JSON.stringify(initiateContractMsg)),
      funds: [],
      salt: Buffer.from(encodedSalt),
    };

    const result = await submitQueue.push({ msg: registerAccountMsg });
    return res.status(201).json({
      transactionHash: result
    });
  } catch (error) {
    return res.status(500).json({
      error: {
        message: "Something went wrong",
        errors: [{ message: (error as Error).message }],
      },
    });
  }
});

module.exports = router;

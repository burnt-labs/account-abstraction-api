import { Router } from "express";
import { decodeJwt } from "jose";
import Long from "long";
import * as stytch from "stytch";

import { instantiate2Address } from "@cosmjs/cosmwasm-stargate";
import { sha256 } from "@cosmjs/crypto";
import { GasPrice } from "@cosmjs/stargate";
import { sleep } from "@cosmjs/utils";

import { buildClient } from "../../modules/utils";
import { burntChainInfo } from "../../modules/chain-info";
import { AAClient } from "../../modules/client";
import { MsgRegisterAccount } from "../../interfaces/generated/abstractaccount/v1/tx";
import { config } from "../../app";

interface IRequestBody {
  salt: string;
  session_jwt: string;
  session_token: string;
}

const router = Router();
const encoder = new TextEncoder();

// Initialize Stytch client
const stytchClient = new stytch.Client({
  project_id: config.stytchProjectId || "",
  secret: config.stytchSecret || "",
  env: config.stytchAPIUrl,
});

router.post("/create", async (req, res) => {
  try {
    const { salt, session_token } = req.body as IRequestBody;

    if (!salt) {
      return res.status(400).json({
        error: "Missing salt",
      });
    }

    if (!session_token) {
      return res.status(400).json({
        error: "Missing session_token",
      });
    }

    const checksum = config.checksum;
    const codeId = config.codeId;
    const privateKey = config.privateKey;

    if (!checksum || !codeId || !privateKey) {
      return res.status(500).json({
        error: "Missing environment variables",
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

    const accountClient = await AAClient.connectWithSigner(
      burntChainInfo.rpc,
      signer,
      {
        gasPrice: GasPrice.fromString("10uxion"),
      }
    );

    const registerAccountMsg: MsgRegisterAccount = {
      sender: accountData.address,
      codeId: Long.fromNumber(codeId),
      msg: Buffer.from(JSON.stringify(initiateContractMsg)),
      funds: [],
      salt: Buffer.from(encodedSalt),
    };

    const result = await accountClient.registerAbstractAccount(
      registerAccountMsg
    );

    await sleep(1000);

    return res.status(200).json({ message: "Account registered", result });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred", error: (error as Error).message });
  }
});

module.exports = router;

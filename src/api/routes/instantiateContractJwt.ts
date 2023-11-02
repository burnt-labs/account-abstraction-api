import { Router } from 'express';

const router = Router();

import { buildClient } from "../../modules/utils";

import { decodeJwt } from "jose";

import { instantiate2Address } from "@cosmjs/cosmwasm-stargate";
import { coin } from "@cosmjs/stargate";
import { burntChainInfo } from "../../modules/chain-info";

import { AAClient } from "../../modules/client";
import { MsgRegisterAccount } from "../../interfaces/generated/abstractaccount/v1/tx";

import * as stytch from "stytch";
import { sleep } from "@cosmjs/utils";
import { sha256 } from "@cosmjs/crypto";
import { authStytch } from "../../modules/auth-stych";
import Long from "long";
import config from '../../config';

interface IRequestBody {
  salt: string;
}

// Initialize Stytch client
const stytchClient = new stytch.Client({
  project_id: config.stytchProjectId || "",
  secret: config.stytchSecret || "",
  env: config.stytchAPIUrl,
});

const encoder = new TextEncoder();

router.post("instantiateContractJwt", async (req, res) => {
  try {
    const checksum = config.checksum;
    const codeId = config.codeId;
    const privateKey = config.privateKey

    if (!checksum || !codeId || !privateKey) {
      return res.status(400).json({
        error: "Missing environment variables",
      });
    }

    const { salt } = req.body as IRequestBody;

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

    const session = await authStytch(); // assuming authStytch is imported or defined
    const { aud, sub } = await decodeJwt(session.session_jwt);

    const { session_jwt: signature } = await stytchClient.sessions.authenticate(
      {
        session_token: session.session_token,
        session_duration_minutes: 60 * 24 * 30,
        session_custom_claims: {
          transaction_hash: Buffer.from(sha256(Buffer.from(addy))).toString(
            "base64"
          ),
        },
      }
    );

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
      signer
    );

    const registerAccountMsg: MsgRegisterAccount = {
      sender: accountData.address,
      codeId: Long.fromNumber(codeId),
      msg: Buffer.from(JSON.stringify(initiateContractMsg)),
      funds: [coin(1, "uxion")],
      salt: Buffer.from(salt),
    };

    await sleep(10000); // This was in your original code

    const result =
      await accountClient.registerAbstractAccount(registerAccountMsg);

    res.status(200).json({ message: "Account registered", result });
  } catch (error) {
    res.status(500).json({ error: "An error occurred", details: error });
  }
});


export default router;

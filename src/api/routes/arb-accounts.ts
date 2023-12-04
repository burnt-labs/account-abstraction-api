import { Router } from "express";
import Long from "long";

import { instantiate2Address } from "@cosmjs/cosmwasm-stargate";
import { coin } from "@cosmjs/stargate";

import { buildClient, verifySignature } from "../../modules/utils";
import { burntChainInfo } from "../../modules/chain-info";
import { AAClient } from "../../modules/client";
import { config } from "../../app";
import { PropertyRequiredError } from "../../lib/errors";

const router = Router();
const encoder = new TextEncoder();

interface IRequestBody {
  signArbSig: string; // Signature from signArb function
  salt: string;
}

router.post("/create", async (req, res) => {
  try {
    let validationErrors = [];
    const { signArbSig, salt } = req.body as IRequestBody;

    if (!salt) {
      const error = new PropertyRequiredError("salt");
      validationErrors.push(error);
    }

    if (!signArbSig) {
      const error = new PropertyRequiredError("signArbSig");
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

    const encodedSalt = encoder.encode(req.body.salt);
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

    const message = Buffer.from(encoder.encode(addy));

    const publicKey = Buffer.from(accountData.pubkey).toString("base64");

    const isValid = await verifySignature(message, signArbSig, publicKey);
    if (!isValid) {
      return res.status(400).json({
        error: "Invalid signature",
      });
    }

    const initiateContractMsg = {
      id: 0,
      authenticator: {
        Secp256K1: {
          pubkey: publicKey,
        },
      },
      signature: signArbSig,
    };

    const accountClient = await AAClient.connectWithSigner(
      burntChainInfo.rpc,
      signer,
      {
          broadcastPollIntervalMs: 1000,
      }
    );
    const registerAccountMsg = {
      sender: accountData.address,
      codeId: Long.fromNumber(codeId),
      msg: Buffer.from(JSON.stringify(initiateContractMsg)),
      funds: [coin(1, "uxion")],
      salt: Buffer.from(salt),
    };

    const result = await accountClient.registerAbstractAccount(
      registerAccountMsg
    );

    return res.status(201).json(result);
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

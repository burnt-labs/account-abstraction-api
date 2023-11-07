import { Router } from "express";
import Long from "long";

import { instantiate2Address } from "@cosmjs/cosmwasm-stargate";
import { coin } from "@cosmjs/stargate";

import { buildClient, verifySignature } from "../../modules/utils";
import { burntChainInfo } from "../../modules/chain-info";
import { AAClient } from "../../modules/client";
import { config } from "../../app";

const router = Router();
const encoder = new TextEncoder();

interface IRequestBody {
  signArbSig: string; // Signature from signArb function
  salt: string;
}

router.post("/create", async (req, res) => {
  try {
    const { signArbSig, salt } = req.body as IRequestBody;

    if (!signArbSig) {
      throw new Error("Missing signArbSig");
    }

    if (!salt) {
      throw new Error("Missing salt");
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
      signer
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

    return res.status(200).json({ message: "Account registered", result });
  } catch (error) {
    return res.status(500).json({
      error: "An error occurred.",
      details: error,
    });
  }
});

module.exports = router;

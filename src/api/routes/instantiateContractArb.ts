import { Router } from 'express';

const router = Router();

import { instantiate2Address } from "@cosmjs/cosmwasm-stargate";
import { coin } from "@cosmjs/stargate";
import Long from "long";

import {
  buildClient,
  verifySignature,
} from "../../modules/utils";
import { burntChainInfo } from "../../modules/chain-info";
import { AAClient } from "../../modules/client";
import config from '../../config';

const encoder = new TextEncoder();

interface IRequestBody {
  signArbSig: string; // Signature from signArb function
  salt: string;
}

router.post("instantiateContractArb", async (req, res) => {
  try {
    const checksum = config.checksum;
    const codeId = config.codeId;
    const privateKey = config.privateKey

    if (!checksum || !codeId || !privateKey) {
      return res.status(400).json({
        error: "Missing environment variables",
      });
    }

    const [signingCosmWasmClient, accountData, signer, signArb] =
      await buildClient(privateKey);
    const { signArbSig, salt } = req.body as IRequestBody;

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

    const result =
      await accountClient.registerAbstractAccount(registerAccountMsg);

    res.status(200).json({ message: "Account registered", result });
  } catch (error) {
    res.status(500).json({
      error: "An error occurred.",
      details: error,
    });
  }
});


export default router;

import { Account } from "@cosmjs/stargate";
import { Any } from "../interfaces/generated/google/protobuf/any";
import { BaseAccount } from "cosmjs-types/cosmos/auth/v1beta1/auth";
import { decodePubkey } from "@cosmjs/proto-signing";
import { type Pubkey } from "@cosmjs/amino";
import { Uint64 } from "@cosmjs/math";
import crypto from "crypto";
import {
  AccountData,
  DirectSecp256k1Wallet,
  OfflineDirectSigner,
} from "@cosmjs/proto-signing";
import { AbstractAccount } from "../interfaces/generated/abstractaccount/v1/account";
import { assert } from "@cosmjs/utils";
import { accountFromAny } from "@cosmjs/stargate/build/accounts";
import { Hash, PrivKeySecp256k1 } from "@keplr-wallet/crypto";
import { makeADR36AminoSignDoc, serializeSignDoc } from "@keplr-wallet/cosmos";
import { fromHex } from "@cosmjs/encoding";
import { burntChainInfo } from "./chain-info";
import { AAClient } from "./client";

export type SignArbFn = (message: string | Uint8Array) => Promise<string>;

function signArbFn(address: string, privateKey: string) {
  const cryptoPrivKey = new PrivKeySecp256k1(fromHex(privateKey));

  return async (message: string | Uint8Array): Promise<string> => {
    const signDoc = makeADR36AminoSignDoc(address, message);
    const serializedSignDoc = serializeSignDoc(signDoc);
    const digest = Hash.sha256(serializedSignDoc);

    const signature = cryptoPrivKey.signDigest32(digest);
    return Buffer.from(
      new Uint8Array([...signature.r, ...signature.s])
    ).toString("base64");
  };
}

function accountFromBaseAccount(input: BaseAccount) {
  const { address, pubKey, accountNumber, sequence } = input;
  let pubkey: Pubkey | null = null;
  if (pubKey) {
    pubkey = decodePubkey(pubKey);
  }
  return {
    address: address,
    pubkey: pubkey,
    accountNumber: Uint64.fromString(accountNumber.toString()).toNumber(),
    sequence: Uint64.fromString(sequence.toString()).toNumber(),
  };
}

/**
 * Custom implementation of AccountParser. This is supposed to support the most relevant
 * common Cosmos SDK account types and AbstractAccount account types.
 * @param input encoded account from the chain
 * @returns decoded account
 */
export function customAccountFromAny(input: Any): Account {
  const { typeUrl, value } = input;
  switch (typeUrl) {
    case "/abstractaccount.v1.AbstractAccount": {
      const abstractAccount = AbstractAccount.decode(value);
      assert(abstractAccount);
      return accountFromBaseAccount(abstractAccount);
    }
    default:
      return accountFromAny(input);
  }
}

export async function buildClient(
  key: string
): Promise<[AAClient, AccountData, OfflineDirectSigner, SignArbFn]> {
  const signer: OfflineDirectSigner = await DirectSecp256k1Wallet.fromKey(
    fromHex(key),
    burntChainInfo.bech32Config.bech32PrefixAccAddr
  );

  const [accountData] = await signer.getAccounts();
  const client = await AAClient.connectWithSigner(burntChainInfo.rpc, signer);

  const signArb = signArbFn(accountData.address, key);

  // Unsure if the signer is will ever be needed directly, but it's here if needed.
  return [client, accountData, signer, signArb];
}

export async function verifySignature(
  message: Buffer,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    const verify = crypto.createVerify("sha256");
    verify.update(message);
    verify.end();

    const publicKeyBuffer = Buffer.from(publicKey, "base64"); // Assuming the publicKey is in base64 format
    return verify.verify(
      { key: publicKeyBuffer, format: "der", type: "pkcs1" },
      signature,
      "base64"
    );
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

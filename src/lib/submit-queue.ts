import type {queueAsPromised} from "fastq";
import * as fastq from "fastq";
import {MsgRegisterAccount} from "../interfaces/generated/abstractaccount/v1/tx";
import {AAClient} from "../modules/client";
import {burntChainInfo} from "../modules/chain-info";
import {GasPrice} from "@cosmjs/stargate";
import {config} from "../modules/config";
import {DirectSecp256k1Wallet, OfflineDirectSigner} from "@cosmjs/proto-signing";
import {fromHex} from "@cosmjs/encoding";
import logger from "./logger";
import {awsConfig} from "../modules/aws";

type Task = {
    msg: MsgRegisterAccount
}

export const submitQueue: queueAsPromised<Task> = fastq.promise(asyncWorker, 1)


let signer: OfflineDirectSigner | undefined;

async function asyncWorker({msg}: Task): Promise<string> {
    const privateKey = config.privateKey;
    if (!privateKey) {
        throw new Error("Missing private key");
    }

    if (!signer) {
        signer = await DirectSecp256k1Wallet.fromKey(
            fromHex(privateKey),
            burntChainInfo.bech32Config.bech32PrefixAccAddr
        );
    }

    const accounts = await signer.getAccounts();
    const address = accounts[0].address;

    let attempt = 0;
    let delayMs = parseInt(awsConfig.sqs.backoffDelayMs);
    while (attempt < parseInt(awsConfig.sqs.backoffMaxAttempts)) {
        try {
            const sequence = await getCurrentSequenceNumber(address, signer);
            logger.info({"attempt": attempt, "address": address, "sequence": sequence});

            const client = await AAClient.connectWithSigner(
                burntChainInfo.rpc,
                signer,
                {
                    gasPrice: GasPrice.fromString("0uxion"),
                    sequence: sequence,
                }
            );

            return await client.registerAbstractAccount(msg);
        } catch (error) {
            if (isSequenceMismatchError(error)) {
                attempt++;
                logger.warn({"attempt": attempt, "address": address, "error": error, "delay": `${delayMs}ms`});
                await new Promise(resolve => setTimeout(resolve, delayMs));
                delayMs *= 2; // Increase delay for next attempt
            } else {
                throw error; // Rethrow other errors immediately
            }
        }
    }

    throw new Error('Exceeded maximum retry attempts for transaction submission');
}

export const getCurrentSequenceNumber = async (address: string, signer: OfflineDirectSigner): Promise<number> => {
    const client = await AAClient.connectWithSigner(burntChainInfo.rpc, signer);
    const account = await client.getAccount(address);
    if (!account) {
        throw new Error(`Account '${address}' not found.`);
    }
    return account.sequence;
};

export const isSequenceMismatchError = (error: any): boolean => {
    const message = (error as Error).message
    return message.includes('account sequence mismatch');
};

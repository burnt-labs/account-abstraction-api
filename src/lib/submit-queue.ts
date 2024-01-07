import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import {MsgRegisterAccount} from "../interfaces/generated/abstractaccount/v1/tx";
import {AAClient} from "../modules/client";
import {burntChainInfo} from "../modules/chain-info";
import {GasPrice} from "@cosmjs/stargate";
import {config} from "../app";
import {DirectSecp256k1Wallet, OfflineDirectSigner} from "@cosmjs/proto-signing";
import {fromHex} from "@cosmjs/encoding";
import logger from "./logger";
type Task = {
    msg: MsgRegisterAccount
}

export const submitQueue: queueAsPromised<Task> = fastq.promise(asyncWorker, 1)


let signer: OfflineDirectSigner | undefined;
async function asyncWorker ({msg }: Task): Promise<string> {
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

    const sequence = await getCurrentSequenceNumber(address, signer);
    logger.info(`address: ${address} sequence ${sequence}`);

    const client = await AAClient.connectWithSigner(
        burntChainInfo.rpc,
        signer,
        {
            gasPrice: GasPrice.fromString("0uxion"),
            sequence,
        }
    );

    // This does not poll for the tx to be included in a block
    return await client.registerAbstractAccount(
        msg
    );
}

export const getCurrentSequenceNumber = async (address: string, signer: OfflineDirectSigner): Promise<number> => {
    const client = await AAClient.connectWithSigner(burntChainInfo.rpc, signer);
    const account = await client.getAccount(address);
    if (!account) {
        throw new Error(`Account '${address}' not found.`);
    }
    return account.sequence;
};

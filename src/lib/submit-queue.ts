import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import {MsgRegisterAccount} from "../interfaces/generated/abstractaccount/v1/tx";
import {AAClient} from "../modules/client";
import {burntChainInfo} from "../modules/chain-info";
import {GasPrice} from "@cosmjs/stargate";
import {getNextSequenceNumber} from "./sequence-number-generator";
import {config} from "../app";
import {DirectSecp256k1Wallet, OfflineDirectSigner} from "@cosmjs/proto-signing";
import {fromHex} from "@cosmjs/encoding";
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
    const accountClient = await AAClient.connectWithSigner(
        burntChainInfo.rpc,
        signer,
        {
            gasPrice: GasPrice.fromString("0uxion"),
            ...getNextSequenceNumber(),
        }
    );

    // This does not poll for the tx to be included in a block
    return await accountClient.registerAbstractAccount(
        msg
    );
}

import type {queueAsPromised} from "fastq";
import * as fastq from "fastq";
import {MsgRegisterAccount} from "../interfaces/generated/abstractaccount/v1/tx";
import {AAClient} from "../modules/client";
import {burntChainInfo} from "../modules/chain-info";
import {GasPrice} from "@cosmjs/stargate";
import {getNextSequenceNumber} from "./sequence-number-generator";
import {config} from "../app";
import {
    DirectSecp256k1HdWallet,
    DirectSecp256k1HdWalletOptions,
    DirectSecp256k1Wallet,
    OfflineDirectSigner
} from "@cosmjs/proto-signing";
import {fromHex} from "@cosmjs/encoding";
import {stringToPath} from "@cosmjs/crypto";

type Task = {
    msg: MsgRegisterAccount
}

export const submitQueue: queueAsPromised<Task> = fastq.promise(asyncWorker, 1)


let signer: OfflineDirectSigner;

async function asyncWorker({msg}: Task): Promise<string> {
    const privateKey = config.privateKey;
    const mnemonic = config.mnemonic;
    const options: DirectSecp256k1HdWalletOptions = {
        bip39Password: "",
        hdPaths: [stringToPath(burntChainInfo.hdPath)],
        prefix: burntChainInfo.bech32Config.bech32PrefixAccAddr,
    }

    if (!privateKey && !mnemonic) {
        throw new Error("One of privateKey or mnemonic must be set");
    }

    if (privateKey && mnemonic) {
        throw new Error("Only one of privateKey or mnemonic must be set");
    }

    if (privateKey) {
        if (!signer) {
            signer = await DirectSecp256k1Wallet.fromKey(
                fromHex(privateKey),
                burntChainInfo.bech32Config.bech32PrefixAccAddr
            );
        }
    }

    if (mnemonic) {
        if (!signer) {
            signer = await DirectSecp256k1HdWallet.fromMnemonic(
                mnemonic,
                options,
            );
        }
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

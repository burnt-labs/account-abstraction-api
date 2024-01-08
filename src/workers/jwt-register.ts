import {deleteMessages, fetchMessages, getQueueDepth} from "../lib/aws-sqs";
import logger from "../lib/logger";
import { awsConfig } from "../modules/aws";
import { buildClient } from "../modules/utils";
import { config } from "../modules/config";
import { MsgRegisterAccount } from "../interfaces/generated/abstractaccount/v1/tx";
import { submitQueue } from "../lib/submit-queue";
import { Message } from "@aws-sdk/client-sqs";

(async function () {
    logger.info("🛠️Worker started");

    const [client, signer] = await buildClient(config.privateKey || "");
    const account = await client.getAccount(signer.address);
    if (!account) {
        throw new Error(`Account '${signer.address}' does not exist on chain. Send some tokens there before trying to query sequence.`);
    }

    logger.info({"xion": {"address": account.address, "sequence": account.sequence}});
    logger.info({"aws": {"region": awsConfig.region, "sqs": awsConfig.sqs}});

    while (true) {
        try {
            await getQueueDepth();
            const messages: Message[] = await fetchMessages();
            for (const message of messages) {
                if (message.Body) {
                    const decodedBody = Buffer.from(message.Body, 'base64').toString();
                    let parsedObj = JSON.parse(decodedBody);

                    const parsedMsg: MsgRegisterAccount = {
                        sender: parsedObj.sender,
                        codeId: parsedObj.codeId,
                        msg: Buffer.from(parsedObj.msg, 'base64'),
                        funds: parsedObj.funds,
                        salt: Buffer.from(parsedObj.salt, 'base64'),
                    };

                    const txHash = await submitQueue.push({ msg: parsedMsg });
                    logger.info({"txHash": txHash});

                    await deleteMessages([message]);
                }
            }
        } catch (error) {
            const err = (error as Error)
            logger.error({"error": err});
        }
    }
})();

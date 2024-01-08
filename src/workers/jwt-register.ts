import {deleteMessages, fetchMessages} from "../lib/aws-sqs";
import logger from "../lib/logger";
import {awsConfig} from "../modules/aws";
import {buildClient} from "../modules/utils";
import {config} from "../modules/config";


(async function () {
    logger.info("Worker started");

    const [client, signer] = await buildClient(config.privateKey || "");
    const account = await client.getAccount(signer.address);
    if (!account) {
        throw new Error(
            `Account '${signer.address}' does not exist on chain. Send some tokens there before trying to query sequence.`
        );
    }

    logger.info({"xion": {"address": account.address, "sequence": account.sequence}});
    logger.info({"aws": {"region": awsConfig.region, "sqs": awsConfig.sqs}})

    while (true) {
        try {
            const messages = await fetchMessages();
            for (const message of messages) {
                logger.info({"message_id": message.MessageId});
            }
            const del = await deleteMessages(messages);
        } catch (error) {
            logger.error({"error": error});
        }
    }
})();

import {awsConfig} from "../modules/aws";
import {SendMessageCommand, SQSClient} from "@aws-sdk/client-sqs";
import logger from "./logger";

const sqs = new SQSClient({
    region: awsConfig.region,
    endpoint: awsConfig.sqs.endpoint,
    credentials: awsConfig.credentials,
});

export const sendMessage = async (messageBody: any) => {
    const command = new SendMessageCommand({
        QueueUrl: awsConfig.sqs.queueUrl,
        MessageBody: JSON.stringify(messageBody),
    });

    const response = await sqs.send(command);
    logger.info({"sqs.send": response});

    return response;
};

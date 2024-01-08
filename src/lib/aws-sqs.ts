import {awsConfig} from "../modules/aws";
import {DeleteMessageBatchCommand, ReceiveMessageCommand, SendMessageCommand, SQSClient} from "@aws-sdk/client-sqs";
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

export const fetchMessages = async () => {
    const response = await sqs.send(
        new ReceiveMessageCommand({
            MaxNumberOfMessages: awsConfig.sqs.maxFetchMessages,
            QueueUrl: awsConfig.sqs.queueUrl,
            WaitTimeSeconds: awsConfig.sqs.maxWaitSeconds,
            VisibilityTimeout: awsConfig.sqs.visibilityTimeoutSeconds,
        }),
    );

    if (response.Messages && response.Messages.length > 0) {
        logger.info({"sqs.receive": `${response.Messages.length} message(s)`});
        return response.Messages;
    }

    return [];
};

export const deleteMessages = async (messages: any) => {
    if(messages.length === 0) {
        return;
    }

    const response = await sqs.send(
        new DeleteMessageBatchCommand({
            Entries: messages.map((message: any) => ({
                Id: message.MessageId,
                ReceiptHandle: message.ReceiptHandle,
            })),
            QueueUrl: awsConfig.sqs.queueUrl,
        }),
    );

    logger.info({"sqs.delete": response});

    return response;
};

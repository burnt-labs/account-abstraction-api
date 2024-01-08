import {awsConfig} from "../modules/aws";
import {
    DeleteMessageBatchCommand,
    GetQueueAttributesCommand,
    ReceiveMessageCommand,
    SendMessageCommand,
    SQSClient,
} from "@aws-sdk/client-sqs";
import logger from "./logger";

const sqs = new SQSClient({
    region: awsConfig.region,
    endpoint: awsConfig.sqs.endpoint,
});

export const sendMessage = async (message: Uint8Array) => {
    const base64Message = Buffer.from(message).toString('base64');
    const command = new SendMessageCommand({
        QueueUrl: awsConfig.sqs.queueUrl,
        MessageBody: base64Message,
    });

    const response = await sqs.send(command);
    logger.info({"sqs.send": response});

    return response;
};

export const fetchMessages = async () => {
    const response = await sqs.send(
        new ReceiveMessageCommand({
            MaxNumberOfMessages: parseInt(awsConfig.sqs.maxFetchMessages),
            QueueUrl: awsConfig.sqs.queueUrl,
            WaitTimeSeconds: parseInt(awsConfig.sqs.waitTimeSeconds),
            VisibilityTimeout: parseInt(awsConfig.sqs.visibilityTimeout),
        }),
    );

    if (response.Messages && response.Messages.length > 0) {
        logger.info({"sqs.receive": `${response.Messages.length} message(s)`});
        return response.Messages;
    }

    return [];
};

export const deleteMessages = async (messages: any) => {
    if (messages.length === 0) {
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

export const getQueueDepth = async () => {
    const response = await sqs.send(
        new GetQueueAttributesCommand({ // GetQueueAttributesRequest
            QueueUrl: awsConfig.sqs.queueUrl, // required
            AttributeNames: [ // AttributeNameList
                "ApproximateNumberOfMessages",
                "ApproximateNumberOfMessagesNotVisible",
            ],
        })
    );

    if (response.Attributes) {
        logger.info({
            "sqs.depth": {
                "total": response.Attributes.ApproximateNumberOfMessages,
                "not_visible": response.Attributes.ApproximateNumberOfMessagesNotVisible,
            }
        });
    }
}
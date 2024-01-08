export const awsConfig = {
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
    },
    sqs: {
        endpoint: process.env.AWS_SQS_ENDPOINT || "http://localstack:4566",
        queueUrl: process.env.AWS_SQS_QUEUE_URL ||  "http://localstack:4566/000000000000/testq",
    }
};

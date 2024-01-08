export const awsConfig = {
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        roleArn: process.env.AWS_ROLE_ARN,
        webIdToken: process.env.AWS_WEB_IDENTITY_TOKEN_FILE,
    },
    sqs: {
        endpoint: process.env.AWS_SQS_ENDPOINT || "http://localstack:4566", // https://{service}.{region}.amazonaws.com
        maxFetchMessages: process.env.AWS_SQS_MAX_FETCH_MESSAGES || "1",
        waitTimeSeconds: process.env.AWS_SQS_WAIT_TIME_SECONDS || "5",
        queueUrl: process.env.AWS_SQS_QUEUE_URL || "http://localstack:4566/000000000000/testq",
        backoffMaxAttempts: process.env.AWS_SQS_BACKOFF_MAX_ATTEMPTS || "3",
        backoffDelayMs: process.env.AWS_SQS_BACKOFF_DELAY_MS || "1000",
        visibilityTimeout: process.env.AWS_SQS_VISIBILITY_TIMEOUT || "30",
    }
};

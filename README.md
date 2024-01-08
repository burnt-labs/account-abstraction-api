# Account Abstraction API

An Express API containing two endpoints for account abstraction utilized by Xion.

## Prerequisites

- Node.js (v14 or newer is recommended)
- npm (comes with Node.js)



## Setup

1. Clone the repository to your local machine:
   ```bash
   git clone <repository-url>
   cd account-abstraction-api
   ```

2. Install the project dependencies:
   ```bash
   npm install
   ```

### Development

1. To run the project in development mode, use the following command which will start the server with nodemon to automatically reload the server on file changes:
    ```bash
    npm run dev
    ```

### Building and Running in Production

1. Build the Project:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm start
   ```

This will compile the TypeScript code into JavaScript and place it in the dist directory, then start the server from the compiled dist/server.js file.


## Endpoints

1. **Instantiate Contract w/ JWT**:
   - Description: Allows clients to instantiate an account using a JWT as a signer.
   - Route: `/api/{apiVersion}/instantiateContractJwt`
   - Method: POST
   - Body parameters: 
     - `salt`: Random value for hashing.

2. **Instantiate Contract w/ Arbitrary Signer**:
   - Description: Allows clients to instantiate an account using an arbitrary signer.
   - Route: `/api/{apiVersion}/instantiateContractArb`
   - Method: POST
   - Body parameters: 
     -  `salt`: Random value for hashing.
     -  `signArbSig`: Signature for the arbitrary signer.

## Environment Variables

The application uses the following environment variables:

- `CHECKSUM`: Used to ensure data validity.
- `CODE_ID`: ID for verifying smart contract.
- `PORT`: Port where the application runs.
- `PRIVATE_KEY`: String for encrypting data.
- `STYTCH_API_URL`: Base URL for Stytch API.
- `STYTCH_PROJECT_ID`: ID for Stytch project.
- `STYTCH_SECRET`: Secret token to authenticate Stytch requests.

## Using localstack for development

[localstack](https://github.com/localstack/localstack) helps us mock AWS services for local development.

```bash
docker compose up localstack
```

### AWS SQS

```bash
# create queue
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name my-test-queue
# get queue url
aws --endpoint-url=http://localhost:4566 sqs get-queue-url --queue-name <queue-name>
# list queue
aws --endpoint-url=http://localhost:4566 sqs list-queues
# send message
aws --endpoint-url=http://localhost:4566 sqs send-message --queue-url <queue-url> --message-body <message>
# receive message
aws --endpoint-url=http://localhost:4566 sqs receive-message --queue-url <queue-url>
# purge queue
aws --endpoint-url=http://localhost:4566 sqs purge-queue --queue-url <queue-url>
# delete queue
aws --endpoint-url=http://localhost:4566 sqs delete-queue --queue-url <queue-url>
# set attributes
aws --endpoint-url=http://localhost:4566 sqs set-queue-attributes --queue-url=<queue-url> --attributes file://<file-name>.json
# get attributes
aws --endpoint-url=http://localhost:4566 sqs  get-queue-attributes --queue-url=<queue-url>
```

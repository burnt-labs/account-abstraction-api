#!/usr/bin/env bash
set -euxo pipefail

create_queue() {
    local Q=$1
    awslocal --endpoint-url=http://localhost:4566 sqs \
      create-queue \
      --queue-name ${Q} \
      --region ${AWS_REGION} \
      --attributes VisibilityTimeout=30
}

create_queue "testq"

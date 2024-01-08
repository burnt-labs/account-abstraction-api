#!/usr/bin/env bash
set -euo pipefail

if [[ $HOSTNAME =~ ([0-9]+)$ ]]; then
    export ORDINAL=${BASH_REMATCH[1]}
    echo "***"
    echo "This is pod number $ORDINAL in the StatefulSet."
    echo "***"
else
    echo "Could not determine the ordinal number."
fi

varname="PKEY_$ORDINAL"
#/bin/sleep infinity
export PRIVATE_KEY="${!varname}" && npm run worker:jwt-register

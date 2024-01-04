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

export varname="MNEMONIC_$ORDINAL"
if [ -z "$varname" ]; then
    echo "Env var $varname is not set."
else
    echo "Env var $varname is set."
fi

#/bin/sleep infinity
npm run start

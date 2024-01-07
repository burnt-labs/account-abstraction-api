import http from 'k6/http';
import {check} from 'k6';
import {uuidv4} from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import {burntConfig, logErrorResponse} from "./utils.js";

function generateSalt() {
    const timestamp = Date.now();
    const randomElement = uuidv4();
    return `salt-${timestamp}-${randomElement}`;
}

export function createJwtAccount(sessionToken) {
    const jwtAccountsUrl = `${burntConfig.baseUrl}/jwt-accounts/create`;

    const salt = generateSalt();
    const payload = JSON.stringify({
        salt: salt,
        session_token: sessionToken
    });

    const headers = {
        'Content-Type': 'application/json',
    };

    const res = http.post(jwtAccountsUrl, payload, {headers});
    let transactionHash = null;

    if (!check(res, {'jwt-account creation successful': (r) => r.status === 201})) {
        logErrorResponse(res);
    } else {
        transactionHash = JSON.parse(res.body).transactionHash;
    }

    return transactionHash;
}

import {sleep} from 'k6';
import {authenticateUser, deleteUser, getOrCreateUser, stytchConfig} from './helpers/stytch.js';
import {createJwtAccount} from "./helpers/aa-jwt-accounts-create.js";
import {authenticateSession} from "./helpers/aa-sessions-authenticate.js";

export const options = {
    stages: [
        {duration: '3m', target: 100},  // Ramp up to 100 users over 3m
        {duration: '1m', target: 100},  // Stay at 100 users for 1m
        {duration: '1m', target: 0},   // Ramp down to 0 users over 1m
    ],
};

export default function () {
    const userEmail = `loadtest+${__VU}-${__ITER}@test.com`;
    const userPassword = `${__ENV.STYTCH_PASSWD}`;  // Common password for simplicity

    // stytch calls
    const userId = getOrCreateUser(userEmail, userPassword, false);
    const sess = authenticateUser(userEmail, userPassword);

    // aa-api calls
    const txHash = createJwtAccount(sess.sessionToken)
    const sessionData = authenticateSession(
        sess.sessionToken,
        sess.sessionJwt,
        stytchConfig.stytchSessionDurationMinutes,
        {transaction_hash: txHash}
    );

    // cleanup
    deleteUser(userId);
    sleep(1);
}

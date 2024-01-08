import {sleep} from 'k6';
import {authenticateUser, deleteUser, getOrCreateUser} from './helpers/stytch.js';
import {createJwtAccount} from "./helpers/aa-jwt-accounts-create.js";

export const options = {
    stages: [
        {duration: '1m', target: 20},  // Ramp up to 20 users over 1m
        {duration: '1m', target: 20},  // Stay at 20 users for 1m
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

    // cleanup
    deleteUser(userId);
    sleep(1);
}

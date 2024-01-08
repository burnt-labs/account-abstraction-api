import http from 'k6/http';
import {check, sleep} from 'k6';
import encoding from 'k6/encoding';
import {logErrorResponse} from "./utils.js";

export const stytchConfig = {
    stytchProjectId: `${__ENV.STYTCH_PROJECT_ID}`,
    stytchSecret: `${__ENV.STYTCH_SECRET}`,
    stytchAPIUrl: `${__ENV.STYTCH_API_URL}`,
    stytchSessionDurationMinutes: 5,
};

export function getOrCreateUser(email, password, search = true) {
    const searchUserUrl = `${stytchConfig.stytchAPIUrl}/users/search`;
    const createUserUrl = `${stytchConfig.stytchAPIUrl}/passwords`;
    const credentials = `${stytchConfig.stytchProjectId}:${stytchConfig.stytchSecret}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encoding.b64encode(credentials)}`
    };

    if(search) {
        const searchPayload = JSON.stringify({
            limit: 1,
            query: {
                operator: "AND",
                operands: [
                    {
                        filter_name: "email_address",
                        filter_value: [email]
                    }
                ]
            }
        });
        const searchRes = http.post(searchUserUrl, searchPayload, {headers});
        if (!check(searchRes, {'searched user successfully': (r) => r.status === 200})) {
            logErrorResponse(searchRes);
            return null;
        }

        const searchResults = JSON.parse(searchRes.body).results;
        if (searchResults.length > 0) {
            return searchResults[0].user_id;
        }
    }

    // User not found, create the user
    const createPayload = JSON.stringify({email, password});
    const createRes = http.post(createUserUrl, createPayload, {headers});
    if (!check(createRes, {'created user successfully': (r) => r.status === 200})) {
        logErrorResponse(createRes);
        return null;
    }

    return JSON.parse(createRes.body).user_id;
}

export function authenticateUser(email, password) {
    const authUrl = `${stytchConfig.stytchAPIUrl}/passwords/authenticate`;
    const credentials = `${stytchConfig.stytchProjectId}:${stytchConfig.stytchSecret}`;
    const payload = JSON.stringify({
        email: email,
        password: password,
        session_duration_minutes: stytchConfig.stytchSessionDurationMinutes
    });

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encoding.b64encode(credentials)}`
    };

    const res = http.post(authUrl, payload, {headers});
    if (!check(res, {'authenticated user successfully': (r) => r.status === 200})) {
        logErrorResponse(res);
        return null;
    }

    sleep(1);

    const responseBody = JSON.parse(res.body);
    return {
        sessionToken: responseBody.session_token,
        sessionId: responseBody.session.session_id,
        sessionJwt: responseBody.session_jwt,
    };
}


export function getSessionsForUser(userId, sessionId) {
    const sessionsUrl = `${stytchConfig.stytchAPIUrl}/sessions?user_id=${encodeURIComponent(userId)}`;
    const credentials = `${stytchConfig.stytchProjectId}:${stytchConfig.stytchSecret}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encoding.b64encode(credentials)}`
    };

    const res = http.get(sessionsUrl, {headers});
    if (!check(res, {'got sessions successfully': (r) => r.status === 200})) {
        logErrorResponse(res);
        return null;
    }

    const sessions = JSON.parse(res.body).sessions;
    if (Array.isArray(sessions)) {
        const session = sessions.find(s => s.session_id === sessionId);
        if (!session) {
            console.error(`Session ID ${sessionId} not found for user ${userId}`);
        }
    }

    return sessions;
}

export function deleteUser(userId) {
    const deleteUserUrl = `${stytchConfig.stytchAPIUrl}/users/${userId}`;
    const credentials = `${stytchConfig.stytchProjectId}:${stytchConfig.stytchSecret}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encoding.b64encode(credentials)}`
    };

    const res = http.del(deleteUserUrl, null, {headers});
    if (!check(res, {'deleted user successfully': (r) => r.status === 200})) {
        logErrorResponse(res);
    }
}

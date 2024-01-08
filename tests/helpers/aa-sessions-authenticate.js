import http from 'k6/http';
import {check} from 'k6';
import {burntConfig, logErrorResponse} from "./utils.js";

export function authenticateSession(sessionToken, sessionJwt, sessionDurationMinutes, sessionCustomClaims) {
    const authenticateUrl = `${burntConfig.baseUrl}/sessions/authenticate`;
    const payload = JSON.stringify({
        session_token: sessionToken,
        session_jwt: sessionJwt,
        session_duration_minutes: sessionDurationMinutes,
        session_custom_claims: sessionCustomClaims
    });

    const headers = {
        'Content-Type': 'application/json',
    };

    const res = http.post(authenticateUrl, payload, {headers});
    if (!check(res, {'authenticated session successfully': (r) => r.status === 200})) {
        logErrorResponse(res);
        return null;
    }

    return JSON.parse(res.body).data;
}

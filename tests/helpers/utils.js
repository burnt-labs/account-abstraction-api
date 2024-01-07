export const burntConfig = {
    baseUrl: `${__ENV.XION_AA_API_URL}` || 'https://aa.xion-testnet-1.burnt.com/api/v1',
}

export function logErrorResponse(response) {
    console.error(`Request failed: ${response.status} ${response.statusText}`);
    console.error(`Response body: ${response.body}`);
}

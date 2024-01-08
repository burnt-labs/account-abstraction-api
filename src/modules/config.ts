export const config = {
    port: Number(process.env.PORT),
    checksum: process.env.CHECKSUM,
    codeId: Number(process.env.CODE_ID),
    privateKey: process.env.PRIVATE_KEY,
    stytchProjectId: process.env.STYTCH_PROJECT_ID,
    stytchSecret: process.env.STYTCH_SECRET,
    stytchAPIUrl: process.env.STYTCH_API_URL,
};

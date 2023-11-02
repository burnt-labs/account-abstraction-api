export interface IEnvironmentConfig {
    port: number;
    checksum: string | undefined;
    codeId: number | undefined;
    privateKey: string | undefined;
    stytchProjectId: string | undefined;
    stytchSecret: string | undefined;
    stytchAPIUrl: string | undefined;
}

export interface IFullConfig extends IEnvironmentConfig {
    apiPrefix: string;
}



  
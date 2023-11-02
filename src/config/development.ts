import { IEnvironmentConfig } from "../interfaces/config.interface";

// We can provide default values for dev environment here.
const developmentConfig: IEnvironmentConfig = {
    port: 3000,
    checksum: "",
    codeId: 4,
    privateKey: "0x0",
    stytchProjectId: "",
    stytchSecret: "",
    stytchAPIUrl: "",
};

export default developmentConfig;
  
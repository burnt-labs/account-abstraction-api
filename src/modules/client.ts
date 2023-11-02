import { GeneratedType, Registry, OfflineSigner } from "@cosmjs/proto-signing";
import {
  defaultRegistryTypes,
  DeliverTxResponse,
  SigningStargateClient,
  SigningStargateClientOptions,
} from "@cosmjs/stargate";
import { Tendermint37Client } from "@cosmjs/tendermint-rpc";
import { MsgRegisterAccount } from "../interfaces/generated/abstractaccount/v1/tx";
import {
  abstractAccountTypes,
  MsgRegisterAccountEncodeObject,
  typeUrlMsgRegisterAccount,
} from "./messages";
import { customAccountFromAny } from "./utils";

export const AADefaultRegistryTypes: ReadonlyArray<[string, GeneratedType]> = [
  ...defaultRegistryTypes,
  ...abstractAccountTypes,
];

function createDefaultRegistry(): Registry {
  return new Registry(AADefaultRegistryTypes);
}

export class AAClient extends SigningStargateClient {
  public static async connectWithSigner(
    endpoint: string,
    signer: OfflineSigner,
    options: SigningStargateClientOptions = {}
  ): Promise<AAClient> {
    const tmClient = await Tendermint37Client.connect(endpoint);
    return new AAClient(tmClient, signer, {
      registry: createDefaultRegistry(),
      ...options,
      accountParser: customAccountFromAny,
    });
  }

  protected constructor(
    tmClient: Tendermint37Client | undefined,
    signer: OfflineSigner,
    options: SigningStargateClientOptions
  ) {
    super(tmClient, signer, options);
  }
  public async registerAbstractAccount(
    msg: MsgRegisterAccount
  ): Promise<DeliverTxResponse> {
    const { sender } = msg;
    const createMsg: MsgRegisterAccountEncodeObject = {
      typeUrl: typeUrlMsgRegisterAccount,
      value: msg,
    };
    return this.signAndBroadcast(sender, [createMsg], "auto");
  }
}

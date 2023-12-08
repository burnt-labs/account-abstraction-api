import { GeneratedType, Registry, OfflineSigner } from "@cosmjs/proto-signing";
import {
  defaultRegistryTypes,
  DeliverTxResponse,
  SequenceResponse,
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
import RWLock from "rwlock";

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

  public async getSequence(address: string): Promise<SequenceResponse> {
    const account = await this.getAccount(address);
    if (!account) {
      throw new Error(
        `Account '${address}' does not exist on chain. Send some tokens there before trying to query sequence.`
      );
    }
    let sequence = 0;
    const lock = new RWLock();
    lock.readLock("readSequence", (release) => {
      // @ts-ignore
      sequence = globalThis.sequenceNumber;
      lock.writeLock("writeSequence", (release) => {
        // @ts-ignore
        globalThis.sequenceNumber += 1;
        release();
      });
      release();
    });
    return {
      accountNumber: account.accountNumber,
      sequence,
    };
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

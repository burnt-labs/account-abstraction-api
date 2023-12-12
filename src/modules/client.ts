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

export const AADefaultRegistryTypes: ReadonlyArray<[string, GeneratedType]> = [
  ...defaultRegistryTypes,
  ...abstractAccountTypes,
];

function createDefaultRegistry(): Registry {
  return new Registry(AADefaultRegistryTypes);
}

export class AAClient extends SigningStargateClient {
  protected accountNumber ;
  protected sequence ;

  public static async connectWithSigner(
    endpoint: string,
    signer: OfflineSigner,
    options: SigningStargateClientOptions  & {
      sequence?: number,
      accountNumber?: number,
    } = {}
  ): Promise<AAClient> {
    const tmClient = await Tendermint37Client.connect(endpoint);
    console.log(options.sequence);

    return new AAClient(tmClient, signer, {
      registry: createDefaultRegistry(),
      ...options,
      accountParser: customAccountFromAny,
    });
  }

  protected constructor(
    tmClient: Tendermint37Client | undefined,
    signer: OfflineSigner,
    {
      accountNumber,
      sequence,
      ...options
    } :SigningStargateClientOptions & {
      sequence?: number,
      accountNumber?: number,
      }
  ) {
    super(tmClient, signer, options);
    if(sequence) {
      this.sequence = sequence;
    }
    if(accountNumber) {
      this.accountNumber = accountNumber;
    }
  }

  public async getSequence(address: string): Promise<SequenceResponse> {
    // If we have the sequence and account number, we can return it directly to avoid a query
    if(this.sequence && this.accountNumber) {
      return {
        accountNumber: this.accountNumber,
        sequence: this.sequence
      };
    }

    const account = await this.getAccount(address);
    if (!account) {
      throw new Error(
        `Account '${address}' does not exist on chain. Send some tokens there before trying to query sequence.`
      );
    }

    return {
      accountNumber: account.accountNumber,
      sequence: account.sequence,
    };
  }

  public async registerAbstractAccount(
    msg: MsgRegisterAccount
  ): Promise<string> {
    const { sender } = msg;
    const createMsg: MsgRegisterAccountEncodeObject = {
      typeUrl: typeUrlMsgRegisterAccount,
      value: msg,
    };
    // Hardcode fee to avoid a simulate call
    return this.signAndBroadcastSync(sender, [createMsg], {
      amount: [{ denom: "uxion‘", amount: "0" }],
      gas: "343093",
    });
  }
}

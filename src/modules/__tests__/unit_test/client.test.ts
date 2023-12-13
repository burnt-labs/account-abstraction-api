import { AAClient } from "../../client";
import { MsgRegisterAccount } from "../../../interfaces/generated/abstractaccount/v1/tx";
import Long from "long";
import { submitQueue } from "../../../lib/submit-queue";
import { buildClient } from "../../utils";
import { config } from "dotenv";
import { httpClient } from "../../../app";
config();

const mockRegisterAccount = jest.fn((msg) => Promise.resolve(msg));
jest
  .spyOn(AAClient.prototype, "registerAbstractAccount")
  .mockImplementation((msg) => mockRegisterAccount(msg));

describe("make sure no race condition in sequence number", () => {
  it("should increment sequence number", async () => {
    const registerAccountMsg: MsgRegisterAccount = {
      sender: "sender",
      codeId: Long.fromNumber(1),
      msg: Uint8Array.from(Buffer.from("some msg")),
      funds: [],
      salt: Buffer.from("1"),
    };
    const [client, signer] = await buildClient(process.env.PRIVATE_KEY || "");
    const account = await client.getAccount(signer.address);
    if (!account) {
      throw new Error(
        `Account '${signer.address}' does not exist on chain. Send some tokens there before trying to query sequence.`
      );
    }

    const requestArray = Array.from(Array(20).keys());
    const requests = requestArray.map((key) =>
      submitQueue.push({
        msg: {
          ...registerAccountMsg,
          codeId: Long.fromNumber(key),
        },
      })
    );
    await Promise.all(requests);
    const lastSequence = account.sequence - 1; // The sequence number before the requests

    for (const res of mockRegisterAccount.mock.calls[0]) {
      if (res.sequence === undefined || res.sequence < lastSequence) {
        // this is the case before the generator is set
        continue;
      }
      expect(res.sequence).toBe(lastSequence + 1);
    }
    httpClient.close();
  });
});

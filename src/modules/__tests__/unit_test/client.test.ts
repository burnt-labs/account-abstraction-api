import { config } from "dotenv";
import RWLock from "rwlock";
import { buildClient } from "../../utils";
config();

describe("make sure no race condition in sequence number", () => {
  it("should increment sequence number", async () => {
    const [client, signer] = await buildClient(process.env.PRIVATE_KEY || "");
    const account = await client.getAccount(signer.address);
    if (!account) {
      throw new Error(
        `Account '${signer.address}' does not exist on chain. Send some tokens there before trying to query sequence.`
      );
    }
    const lock = new RWLock();
    lock.writeLock("writeSequence", (release) => {
      // @ts-ignore - typescript doesn't know about globalThis
      // we set the sequence number on startup and read from here when we need it
      globalThis["sequenceNumber"] = account.sequence;
      release();
    });
    const { sequence: sequence2 } = await client.getSequence(signer.address);
    expect(
      //@ts-ignore
      globalThis.sequenceNumber
    ).toBe(sequence2 + 1);
  });
  // concurrent calls to getSequence should not return the same sequence number
  it("should not return the same sequence number", async () => {
    const [client, signer] = await buildClient(process.env.PRIVATE_KEY || "");
    const account = await client.getAccount(signer.address);
    if (!account) {
      throw new Error(
        `Account '${signer.address}' does not exist on chain. Send some tokens there before trying to query sequence.`
      );
    }
    const lock = new RWLock();
    lock.writeLock("writeSequence", (release) => {
      // @ts-ignore - typescript doesn't know about globalThis
      // we set the sequence number on startup and read from here when we need it
      globalThis["sequenceNumber"] = account.sequence;
      release();
    });

    const requestArray = Array.from(Array(20).keys());
    const requests = requestArray.map(() => client.getSequence(signer.address));
    const result = await Promise.all(requests);

    const seenSequences = new Map<number, boolean>();
    const maxSequence = account.sequence + requestArray.length;

    result.forEach(({ sequence }) => {
      expect(sequence).toBeDefined();
      expect(seenSequences.get(sequence)).toBeUndefined();
      seenSequences.set(sequence, true);
      expect(sequence).toBeLessThanOrEqual(maxSequence);
    });
  });
});

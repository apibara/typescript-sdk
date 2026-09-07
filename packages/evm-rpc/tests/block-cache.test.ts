import type { RpcBlock } from "viem";
import { describe, expect, it } from "vitest";
import { EvmRpcStream, type ViemRpcClient } from "../src/stream-config";

function rpcBlock(blockNumber: number): RpcBlock {
  const hex = (n: number) => `0x${n.toString(16)}` as const;
  const hash = (n: number) =>
    `0x${n.toString(16).padStart(64, "0")}` as `0x${string}`;

  return {
    number: hex(blockNumber),
    hash: hash(blockNumber),
    parentHash: hash(blockNumber - 1),
    sha3Uncles: hash(0),
    miner: `0x${"11".repeat(20)}`,
    stateRoot: hash(0),
    transactionsRoot: hash(0),
    receiptsRoot: hash(0),
    logsBloom: `0x${"00".repeat(256)}`,
    difficulty: "0x0",
    gasLimit: "0x1c9c380",
    gasUsed: "0x0",
    timestamp: "0x68bc0000",
    extraData: "0x",
    mixHash: hash(0),
    nonce: "0x0000000000000000",
    baseFeePerGas: "0x1",
    size: "0x100",
    totalDifficulty: "0x0",
    transactions: [],
    uncles: [],
  } as unknown as RpcBlock;
}

/** Records every JSON-RPC method the stream asks for. */
function recordingClient(): ViemRpcClient & { calls: string[] } {
  const calls: string[] = [];

  return {
    calls,
    // biome-ignore lint/suspicious/noExplicitAny: test double
    request: (async ({ method, params }: any) => {
      calls.push(method);

      if (method === "eth_getBlockByNumber") {
        const [tag] = params;
        return rpcBlock(tag === "latest" ? 100 : Number(tag));
      }

      if (method === "eth_getBlockByHash") {
        const [hash] = params;
        return rpcBlock(Number.parseInt(hash.slice(2), 16));
      }

      throw new Error(`unexpected method ${method}`);
      // biome-ignore lint/suspicious/noExplicitAny: test double
    }) as any,
  };
}

describe("EvmRpcStream block reuse", () => {
  it("serves a header by hash from the block the head refresh already fetched", async () => {
    const client = recordingClient();
    const stream = new EvmRpcStream(client);

    const head = await stream.fetchCursor({ blockTag: "latest" });
    if (head === null) {
      throw new Error("expected a head block");
    }
    expect(head.blockNumber).toBe(100n);
    expect(client.calls).toEqual(["eth_getBlockByNumber"]);

    // This is what the stream does on every poll where the head carries no
    // matching logs, and it asks for the block it just saw.
    const { data } = await stream.fetchHeaderByHash({
      blockHash: head.blockHash,
    });

    expect(data.block?.header.blockNumber).toBe(100n);
    expect(data.block?.header.blockHash).toBe(head.blockHash);

    // No second request: still just the one head refresh.
    expect(client.calls).toEqual(["eth_getBlockByNumber"]);
  });

  it("falls back to eth_getBlockByHash for a block it has not seen", async () => {
    const client = recordingClient();
    const stream = new EvmRpcStream(client);

    await stream.fetchCursor({ blockTag: "latest" });
    client.calls.length = 0;

    await stream.fetchHeaderByHash({
      blockHash: `0x${(55).toString(16).padStart(64, "0")}`,
    });

    expect(client.calls).toEqual(["eth_getBlockByHash"]);
  });

  it("does not grow without bound", async () => {
    const client = recordingClient();
    const stream = new EvmRpcStream(client);

    for (let blockNumber = 0; blockNumber < 200; blockNumber++) {
      await stream.fetchCursor({ blockNumber: BigInt(blockNumber) });
    }

    // The oldest blocks have been evicted, so asking for one costs a request.
    client.calls.length = 0;
    await stream.fetchHeaderByHash({
      blockHash: `0x${(0).toString(16).padStart(64, "0")}`,
    });
    expect(client.calls).toEqual(["eth_getBlockByHash"]);

    // The most recent ones are still there.
    client.calls.length = 0;
    await stream.fetchHeaderByHash({
      blockHash: `0x${(199).toString(16).padStart(64, "0")}`,
    });
    expect(client.calls).toEqual([]);
  });
});

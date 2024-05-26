import { Address, B256 } from "./common";
import * as proto from "./proto";

export type Filter = {
  header?: HeaderFilter;
  logs?: LogFilter[];
};

export const Filter = {
  encode(filter: Filter): Uint8Array {
    const message = Filter.fromJSON(filter);
    return proto.filter.Filter.encode(message).finish();
  },

  fromJSON(message: Filter): proto.filter.Filter {
    const header = message.header
      ? HeaderFilter.fromJSON(message.header)
      : undefined;

    const logs = (message.logs ?? []).map(LogFilter.fromJSON);

    return {
      header,
      logs,
      withdrawals: [],
      transactions: [],
    };
  },
};

export type HeaderFilter = {
  always?: boolean;
};

export const HeaderFilter = {
  fromJSON(message: HeaderFilter): proto.filter.HeaderFilter {
    return {
      always: message.always,
    };
  },
};

export type LogFilter = {
  address?: Address;
  topics?: (B256 | null)[];

  strict?: boolean;
  includeTransaction?: boolean;
  includeReceipt?: boolean;
};

export const LogFilter = {
  fromJSON(message: LogFilter): proto.filter.LogFilter {
    const address = message.address
      ? Address.fromJSON(message.address)
      : undefined;

    const topics = (message.topics ?? []).map((topic) => {
      if (topic === null) return { value: undefined };
      const value = B256.fromJSON(topic);
      return { value };
    });

    return {
      address,
      topics,
      strict: message.strict,
      includeTransaction: message.includeTransaction,
      includeReceipt: message.includeReceipt,
    };
  },
};

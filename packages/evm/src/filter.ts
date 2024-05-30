import type { Encodable } from "@apibara/protocol";
import { Address, B256 } from "./common";
import * as proto from "./proto";

export type FilterConfig = {
  header?: HeaderFilterConfig;
  logs?: LogFilterConfig[];
};

export type HeaderFilterConfig = {
  always?: boolean;
};

export type LogFilterConfig = {
  address?: Address;
  topics?: (B256 | null)[];

  strict?: boolean;
  includeTransaction?: boolean;
  includeReceipt?: boolean;
};

export function filter(config: FilterConfig) {
  return new Filter(config);
}

export class Filter implements Encodable {
  constructor(private _: FilterConfig = {}) {}

  toProto(): proto.filter.Filter {
    const header = this._.header
      ? new HeaderFilter(this._.header).toProto()
      : undefined;

    const logs = (this._.logs ?? []).map((log) => new LogFilter(log).toProto());

    return {
      header,
      logs,
      withdrawals: [],
      transactions: [],
    };
  }

  encode(): Uint8Array {
    const message = this.toProto();
    return proto.filter.Filter.encode(message).finish();
  }
}

export class HeaderFilter {
  constructor(private _: HeaderFilterConfig = {}) {}

  toProto(): proto.filter.HeaderFilter {
    return {
      always: this._.always,
    };
  }
}

export class LogFilter {
  constructor(private _: LogFilterConfig) {}

  toProto(): proto.filter.LogFilter {
    const address = this._.address
      ? Address.toProto(this._.address)
      : undefined;

    const topics = (this._.topics ?? []).map((topic) => {
      if (topic === null) return { value: undefined };
      const value = B256.toProto(topic);
      return { value };
    });

    return {
      address,
      topics,
      strict: this._.strict,
      includeTransaction: this._.includeTransaction,
      includeReceipt: this._.includeReceipt,
    };
  }
}

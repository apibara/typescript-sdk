import type { Codec } from "./codec";
import { StreamDataRequest, StreamDataResponse } from "./stream";

/** Configure a DNA stream. */
export class StreamConfig<TFilter, TBlock> {
  private request;
  private response;

  constructor(
    private filter: Codec<TFilter, Uint8Array>,
    private block: Codec<TBlock | null, Uint8Array>,
    public mergeFilter: (a: TFilter, b: TFilter) => TFilter,
    public name: string,
  ) {
    this.request = StreamDataRequest(this.filter);
    this.response = StreamDataResponse(this.block);
  }

  /** Filter schema. */
  get Filter() {
    return this.filter;
  }

  /** Block schema. */
  get Block() {
    return this.block;
  }

  /** Stream data request schema. */
  get Request() {
    return this.request;
  }

  /** Stream data response schema. */
  get Response() {
    return this.response;
  }
}

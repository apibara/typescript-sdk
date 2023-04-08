import { v1alpha2 } from './proto'

/**
 * Helper functions to create Ethereum data filters.
 */
export const Filter = {
  /**
   * Creates the root filter object.
   */
  create: () => new FilterBuilder(),

  /**
   * Creates an log filter.
   */
  log: () => new LogFilter(),
}

export class FilterBuilder {
  private inner: v1alpha2.Filter

  constructor() {
    this.inner = new v1alpha2.Filter()
  }

  /**
   * Include header in the returned data.
   *
   * If the `weak` flag is set, the block header will be included only if any
   * other filter matches.
   * If the `rlp` flag is set, the block header will contain its RLP encoding.
   */
  withHeader(args?: { weak?: boolean; rlp?: boolean }) {
    const { weak, rlp } = args ?? {}
    this.inner.header = { weak, rlp }
    return this
  }

  /**
   * Include log data. Use an empty filter to include all logs.
   */
  addLog(
    filterOrBuilder:
      | IEncodable<v1alpha2.ILogFilter>
      | ((builder: LogFilter) => IEncodable<v1alpha2.ILogFilter>)
  ) {
    this.inner.logs.push(createFilter(filterOrBuilder, () => new LogFilter()))
    return this
  }

  /**
   * Returns the filter in encoded form, ready to be added to a request.
   */
  encode(): Uint8Array {
    return v1alpha2.Filter.encode(this.inner).finish()
  }

  /**
   * Returns the filter as a plain object.
   */
  toObject(): v1alpha2.IFilter {
    return this.inner
  }
}

export interface IEncodable<T> {
  encode(): T
}

export class LogFilter implements IEncodable<v1alpha2.ILogFilter> {
  private inner: v1alpha2.ILogFilter

  constructor() {
    this.inner = {}
  }

  /**
   * Filter by address emitting the log.
   */
  withAddress(address: v1alpha2.IH160) {
    this.inner.address = address
    return this
  }

  /**
   * Filter by topics.
   */
  withTopics(topics: v1alpha2.IH256[]) {
    this.inner.topics = topics.map((t) => ({ choices: [t] }))
    return this
  }

  encode(): v1alpha2.ILogFilter {
    return this.inner
  }
}

function createFilter<T, B>(
  filterOrBuilder: IEncodable<T> | ((builder: B) => IEncodable<T>),
  mk: () => B
) {
  let filter
  if (typeof filterOrBuilder === 'function') {
    filter = filterOrBuilder(mk())
  } else {
    filter = filterOrBuilder
  }
  return filter.encode()
}

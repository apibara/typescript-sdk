/** Track data rate using high precision timers. */
export class RateGauge {
  private interval: number;
  private prev?: bigint;
  private rateMs?: number;
  private var: number;

  constructor(intervalSeconds: number) {
    // Convert seconds to milliseconds.
    this.interval = intervalSeconds * 1_000;
    this.var = 0;
  }

  public record(items: number) {
    // Compute the exponential moving average of the rate.
    const prev = this.prev;
    const now = process.hrtime.bigint();
    this.prev = now;

    if (!prev) {
      return;
    }

    const deltaMs = Number(now - prev) / 1_000_000;
    // rate in items/ms.
    const rateMs = items / deltaMs;

    if (this.rateMs === undefined) {
      this.rateMs = rateMs;
      this.var = 0;
      return;
    }

    const alpha = 1 - Math.exp(-deltaMs / this.interval);
    this.rateMs = alpha * rateMs + (1 - alpha) * this.rateMs;

    const diff = rateMs - this.rateMs;
    const incr = alpha * diff;
    this.var = (1 - alpha) * (this.var + incr * diff);
  }

  /** Returns the average rate per second. */
  public average() {
    if (this.rateMs === undefined) {
      return undefined;
    }
    return this.rateMs * 1_000;
  }

  /** Returns the variance. */
  public variance() {
    return this.var;
  }
}

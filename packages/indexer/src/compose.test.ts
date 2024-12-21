import { describe, expect, it } from "vitest";
import { type MiddlewareFunction, type NextFunction, compose } from "./compose";

type C = {
  bag: Record<string, unknown>;
  finalized: boolean;
};

type MiddlewareTuple = MiddlewareFunction<C>;

describe("compose", () => {
  async function a(context: C, next: NextFunction) {
    context.bag.log = "log";
    await next();
  }

  async function b(context: C, next: NextFunction) {
    await next();
    context.bag.headers = "custom-header";
  }

  async function c(context: C, next: NextFunction) {
    context.bag.xxx = "yyy";
    await next();
    context.bag.zzz = context.bag.xxx;
  }

  async function handler(context: C, next: NextFunction) {
    context.bag.log = `${context.bag.log} message`;
    await next();
    context.bag.message = "new response";
  }

  const middleware: MiddlewareTuple[] = [];

  middleware.push(a);
  middleware.push(b);
  middleware.push(c);
  middleware.push(handler);

  it("composes", async () => {
    const context: C = {
      bag: {},
      finalized: false,
    };

    const composed = compose<C>(middleware);
    await composed(context);

    expect(context.bag.log).toBeDefined();
    expect(context.bag.log).toBe("log message");
    expect(context.bag.headers).toBe("custom-header");
    expect(context.bag.xxx).toBe("yyy");
    expect(context.bag.zzz).toBe("yyy");
    expect(context.finalized).toBe(false);
  });

  it("accepts a next function", async () => {
    const context: C = {
      bag: {},
      finalized: false,
    };

    const composed = compose<C>(middleware);
    await composed(context, async () => {
      context.finalized = true;
    });

    expect(context.bag.log).toBeDefined();
    expect(context.bag.log).toBe("log message");
    expect(context.bag.headers).toBe("custom-header");
    expect(context.bag.xxx).toBe("yyy");
    expect(context.bag.zzz).toBe("yyy");
    expect(context.finalized).toBe(true);
  });
});

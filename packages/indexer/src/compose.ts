/*
 * MIT License
 *
 * Copyright (c) 2021 - present, Yusuke Wada and Hono contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import type { IndexerContext } from "./context";

export type NextFunction = () => Promise<void>;
export type MiddlewareFunction<C> = (
  context: C,
  next: NextFunction,
) => Promise<void>;

export function compose<C extends IndexerContext>(
  middleware: MiddlewareFunction<C>[],
): (context: C, next?: NextFunction) => Promise<void> {
  return (context, next) => {
    let index = -1;

    return dispatch(0);

    /// Dispatch the middleware functions.
    async function dispatch(i: number): Promise<void> {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;

      let handler: MiddlewareFunction<C> | undefined;

      if (i >= middleware.length) {
        if (next) {
          await next();
        }

        return;
      }

      if (middleware[i]) {
        handler = middleware[i];
      } else {
        handler = i === middleware.length ? next : undefined;
      }

      if (!handler) {
        throw new Error("Handler not found");
      }

      await handler(context, () => dispatch(i + 1));
    }
  };
}

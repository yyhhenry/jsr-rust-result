import { assert, assertEquals } from "@std/assert";
import {
  anyhow,
  err,
  execAsyncFn,
  execFn,
  fin,
  ok,
  type Result,
  wrapAsyncFn,
  wrapFn,
} from "./mod.ts";

Deno.test("new Result", () => {
  {
    const v = fin();
    assert(v.isOk());
    assertEquals(v.ok, true);
    assertEquals(v.v, undefined);
    assertEquals(v.isErr(), false);
  }
  {
    const v = ok(42);
    assert(v.isOk());
    assertEquals(v.ok, true);
    assertEquals(v.v, 42);
    assertEquals(v.isErr(), false);
  }
  {
    const v = anyhow("an error occurred");
    assert(v.isErr());
    assertEquals(v.ok, false);
    assertEquals(v.e, new Error("an error occurred"));
    assertEquals(v.isOk(), false);
  }
  {
    const v = err(new SyntaxError("syntax error"));
    assert(v.isErr());
    assertEquals(v.ok, false);
    assertEquals(v.e, new SyntaxError("syntax error"));
    assertEquals(v.isOk(), false);
  }
});

Deno.test("unwrap & expect", () => {
  const okRes = ok(42);
  assertEquals(okRes.unwrap(), 42);
  assertEquals(okRes.expect("should not reach here"), 42);
  try {
    okRes.unwrapErr();
    throw new Error("should not reach here");
  } catch (e) {
    assert(e instanceof Error);
    assertEquals(e.message, "called `unwrapErr()` on an `Ok` value");
  }
  try {
    okRes.expectErr("we expect an error here");
    throw new Error("should not reach here");
  } catch (e) {
    assert(e instanceof Error);
    assertEquals(e.message, "we expect an error here");
  }

  const errRes = anyhow("an error occurred");
  assertEquals(errRes.unwrapErr().message, "an error occurred");
  assertEquals(
    errRes.expectErr("should not reach here").message,
    "an error occurred",
  );
  try {
    errRes.unwrap();
    throw new Error("should not reach here");
  } catch (e) {
    assert(e instanceof Error);
    assertEquals(e.message, "an error occurred");
  }
  try {
    errRes.expect("we expect a value here");
    throw new Error("should not reach here");
  } catch (e) {
    assert(e instanceof Error);
    assertEquals(e.message, "we expect a value here");
  }
});

Deno.test("fin", () => {
  function doNothing(): Result {
    return fin();
  }
  const result = doNothing();
  assertEquals(result, ok(undefined));
});

Deno.test("match", () => {
  const okResult: Result<number, Error> = ok(10);
  const okValue = okResult.match(
    (v) => v * 2,
    () => {
      throw new Error("unexpected");
    },
  );
  assertEquals(okValue, 20);

  const errResult: Result<number, Error> = anyhow("an error occurred");
  const errValue = errResult.match(
    () => {
      throw new Error("unexpected");
    },
    (e) => e.message,
  );
  assertEquals(errValue, "an error occurred");
});

Deno.test("map & mapErr", () => {
  {
    const a: Result<number, Error> = ok(10);
    const b = a.map((v) => v * 2);
    assertEquals(b, ok(20));
  }

  {
    const a: Result<number, Error> = anyhow("an error occurred");
    const b = a.map((v) => v * 2);
    assertEquals(b, anyhow("an error occurred"));
  }

  {
    const a: Result<number, Error> = ok(10);
    const b = a.mapErr((e) => new Error(`new error: ${e.message}`));
    assertEquals(b, ok(10));
  }

  {
    const a: Result<number, Error> = anyhow("an error occurred");
    const b = a.mapErr((e) => new Error(`new error: ${e.message}`));
    assertEquals(b, anyhow("new error: an error occurred"));
  }
});

Deno.test("unwrapOr & unwrapOrElse", () => {
  {
    const v: Result<number, Error> = ok(10);
    assertEquals(v.unwrapOr(0), 10);
    assertEquals(v.unwrapOrElse(() => 0), 10);
  }

  {
    const a: Result<number, Error> = anyhow("an error occurred");
    assertEquals(a.unwrapOr(0), 0);
    assertEquals(a.unwrapOrElse(() => 0), 0);
  }
});

Deno.test("andThen & orElse", () => {
  {
    const a: Result<number, Error> = ok(10);
    const b = a.andThen((v) => ok(v * 2));
    assertEquals(b, ok(20));
  }

  {
    const a: Result<number, Error> = anyhow("an error occurred");
    const b = a.andThen((v) => ok(v * 2));
    assertEquals(b, anyhow("an error occurred"));
  }

  {
    const a: Result<number, Error> = ok(10);
    const b = a.orElse(() => anyhow("another error occurred"));
    assertEquals(b, ok(10));
  }

  {
    const a: Result<number, Error> = anyhow("an error occurred");
    const b = a.orElse(() => anyhow("another error occurred"));
    assertEquals(b, anyhow("another error occurred"));
  }
});

Deno.test("execFn & execAsyncFn", async () => {
  {
    const v = execFn(() => 42);
    assertEquals(v, ok(42));
  }

  {
    const v = execFn(() => {
      throw new Error("an error occurred");
    });
    assertEquals(v, anyhow("an error occurred"));
  }

  {
    const v = await execAsyncFn(() => Promise.resolve(42));
    assertEquals(v, ok(42));
  }

  {
    const v = await execAsyncFn(() =>
      Promise.reject(new Error("an error occurred"))
    );
    assertEquals(v, anyhow("an error occurred"));
  }
});

Deno.test("wrapFn & wrapAsyncFn", async () => {
  function asyncSleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  {
    const fn = wrapFn((a: number, b: number) => a + b);
    assertEquals(fn(1, 2), ok(3));
  }

  {
    const fn = wrapFn((a: number, b: number) => {
      const x = a + b;
      throw new Error(`an error occurred while x = ${x}`);
    });
    assertEquals(fn(1, 2), anyhow("an error occurred"));
  }

  {
    const fn = wrapAsyncFn(async (a: number, b: number) => {
      await asyncSleep(10);
      return a + b;
    });
    assertEquals(await fn(1, 2), ok(3));
  }

  {
    const fn = wrapAsyncFn(async (a: number, b: number) => {
      const x = a + b;
      await asyncSleep(10);
      throw new Error(`an error occurred while x = ${x}`);
    });
    assertEquals(await fn(1, 2), anyhow("an error occurred"));
  }
});

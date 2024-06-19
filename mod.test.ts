import { assertEquals } from "jsr:@std/assert";
import { anyhow, ok, Result, safely, safelyAsync } from "./mod.ts";

// This should pass type check
function genResult(genError: boolean): Result<number, Error> {
  if (genError) {
    return anyhow("calc(): error occurred");
  }
  return ok(42);
}

Deno.test("generate result and unwrap", () => {
  // This should pass type check
  genResult(true);
  genResult(false);

  const okResult: Result<number, Error> = ok(42);
  assertEquals(okResult.isOk(), true);
  assertEquals(okResult.isErr(), false);

  // This should pass type check
  if (okResult.isOk()) {
    assertEquals(okResult.unwrap(), 42);
  }
  // This should pass type check
  if (!okResult.isErr()) {
    assertEquals(okResult.unwrap(), 42);
  }
  assertEquals(okResult.unwrapOr(0), 42);
  assertEquals(
    okResult.unwrapOrElse(() => 0),
    42,
  );

  // Inferred
  const okResult2 = ok("Hello World");
  assertEquals(okResult2.unwrap(), "Hello World");

  const errResult: Result<number, Error> = anyhow("an error occurred");
  assertEquals(errResult.isOk(), false);
  assertEquals(errResult.isErr(), true);

  // This should pass type check
  if (errResult.isErr()) {
    assertEquals(errResult.unwrapErr().message, "an error occurred");
  }
  // This should pass type check
  if (!errResult.isOk()) {
    assertEquals(errResult.unwrapErr().message, "an error occurred");
  }
  assertEquals(errResult.unwrapOr(0), 0);

  const errResult2: Result<number, Error> = anyhow("42");
  assertEquals(
    errResult2.unwrapOrElse((e) => +e.message),
    42,
  );
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

Deno.test("map and mapErr", () => {
  const okResult: Result<number, Error> = ok(10);
  const mappedOkResult = okResult.map((v) => v * 2);
  assertEquals(mappedOkResult.isOk() && mappedOkResult.unwrap(), 20);

  const errResult: Result<number, Error> = anyhow("an error occurred");
  const mappedErrResult = errResult.map((v) => v * 2);
  assertEquals(
    mappedErrResult.isErr() && mappedErrResult.unwrapErr().message,
    "an error occurred",
  );

  const okResult2: Result<number, Error> = ok(10);
  const mappedOkResult2 = okResult2.mapErr((e) => new Error(e.message + "!"));
  assertEquals(mappedOkResult2.isOk() && mappedOkResult2.unwrap(), 10);

  const errResult2: Result<number, Error> = anyhow("an error occurred");
  const mappedErrResult2 = errResult2.mapErr(
    (e) => new Error(e.message + "!"),
  );
  assertEquals(
    mappedErrResult2.isErr() && mappedErrResult2.unwrapErr().message,
    "an error occurred!",
  );
});

Deno.test("andThen", () => {
  const okResult: Result<number, Error> = ok(10);
  const andThenOkResult = okResult.andThen((v) => ok(v * 2));
  assertEquals(andThenOkResult.isOk() && andThenOkResult.unwrap(), 20);

  const errResult: Result<number, Error> = anyhow("an error occurred");
  const andThenErrResult = errResult.andThen((v) => ok(v * 2));
  assertEquals(
    andThenErrResult.isErr() && andThenErrResult.unwrapErr().message,
    "an error occurred",
  );

  const okResult2: Result<number, Error> = ok(10);
  const andThenOkResult2 = okResult2.andThen(() => anyhow("an error occurred"));
  assertEquals(
    andThenOkResult2.isErr() && andThenOkResult2.unwrapErr().message,
    "an error occurred",
  );

  const errResult2: Result<number, Error> = anyhow("an error occurred");
  const andThenErrResult2 = errResult2.andThen(() => anyhow("42"));
  assertEquals(
    andThenErrResult2.isErr() && andThenErrResult2.unwrapErr().message,
    "an error occurred",
  );
});

Deno.test("safely", async () => {
  const safeJsonParse = (json: string): Result<unknown, Error> =>
    safely(() => JSON.parse(json));
  const result = safeJsonParse('{"a": 1}');
  assertEquals(result.unwrapOr(null), { a: 1 });

  const invalidJson = "invalid json";
  let errStr = "";
  try {
    JSON.parse(invalidJson);
  } catch (e) {
    if (e instanceof Error) {
      errStr = e.message;
    }
  }
  const result2 = safeJsonParse(invalidJson);
  assertEquals(result2.isErr(), true);
  assertEquals(result2.isErr() && result2.unwrapErr().message, errStr);

  const asyncJsonParse = (s: string): Promise<unknown> =>
    Promise.resolve(JSON.parse(s));

  const safeAsyncJsonParse = (s: string): Promise<Result<unknown, Error>> =>
    safelyAsync(() => asyncJsonParse(s));

  const result3 = await safeAsyncJsonParse('{"a": 1}');
  assertEquals(result3.isOk() && result3.unwrap(), { a: 1 });

  const result4 = await safeAsyncJsonParse(invalidJson);
  assertEquals(result4.isErr() && result4.unwrapErr().message, errStr);
});

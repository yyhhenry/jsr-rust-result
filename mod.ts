/**
 * @module
 *
 * Rust-like error handling in TypeScript.
 *
 * @example
 * ```ts
 * import { ok, err, anyhow, safely } from "@yyhhenry/rust-result";
 *
 * const safeJsonParse = (s: string) => safely(() => JSON.parse(s));
 *
 * const result = safeJsonParse('{"a": 1}');
 * // Or
 * // const result = safeJsonParse('{"a": 1');
 * console.log(result.isOk() ? result.unwrap() : result.unwrapErr().message);
 * // It's safe to call unwrap() method in TypeScript,
 * // since it's only available when the type is narrowed to Ok.
 * ```
 */

/**
 * Result type inspired by Rust's Result type.
 * - Try isOk() and isErr() to check the state of the instance.
 * - Use match() to handle the value or error.
 * - Use map() and mapErr() to transform the value or error.
 * - Use unwrapOr() and unwrapOrElse() to get the value or a default value.
 * - Use andThen() to chain the Result.
 * - Use unwrap() to get the value, and unwrapErr() to get the error.
 *
 * For unwrap() and unwrapErr(), they are safe to call in TypeScript,
 * since they are only available when the type is narrowed to Ok or Err, like:
 * - Inside a conditional statement that checks isOk() or isErr() (also !isOk() or !isErr()).
 * - Directly after the Result instance is created by ok(), err(), or anyhow().
 */
export type Result<T, E extends Error> = Ok<T, E> | Err<T, E>;
class ResultBase<T, E extends Error> {
  isOk(): this is Ok<T, E> {
    return this instanceof Ok;
  }
  isErr(): this is Err<T, E> {
    return this instanceof Err;
  }
  match<U>(ok: (v: T) => U, err: (e: E) => U): U {
    if (this.isOk()) {
      return ok(this.unwrap());
    } else if (this.isErr()) {
      return err(this.unwrapErr());
    } else {
      throw new Error("Invalid state of Result instance");
    }
  }
  map<U>(f: (v: T) => U): Result<U, E> {
    return this.match<Result<U, E>>(
      (v) => ok(f(v)),
      (e) => err(e),
    );
  }
  mapErr<F extends Error>(f: (e: E) => F): Result<T, F> {
    return this.match<Result<T, F>>(
      (v) => ok(v),
      (e) => err(f(e)),
    );
  }
  unwrapOr(v: T): T {
    return this.match<T>(
      (v) => v,
      () => v,
    );
  }
  unwrapOrElse(f: (e: E) => T): T {
    return this.match<T>(
      (v) => v,
      (e) => f(e),
    );
  }
  andThen<U>(f: (v: T) => Result<U, E>): Result<U, E> {
    return this.match<Result<U, E>>(
      (v) => f(v),
      (e) => err(e),
    );
  }
}
class Ok<T, E extends Error> extends ResultBase<T, E> {
  private value: T;
  constructor(value: T) {
    super();
    this.value = value;
  }
  unwrap(): T {
    return this.value;
  }
}
class Err<T, E extends Error> extends ResultBase<T, E> {
  private error: E;
  constructor(error: E) {
    super();
    this.error = error;
  }
  unwrapErr(): E {
    return this.error;
  }
}

/**
 * Create a new Ok instance.
 */
export function ok<T>(value: T): Ok<T, never> {
  return new Ok(value);
}
/**
 * Create a new Err instance.
 */
export function err<E extends Error>(error: E): Err<never, E> {
  return new Err(error);
}
/**
 * Create a new Err instance from error message.
 */
export function anyhow(s: string): Err<never, Error> {
  return err(new Error(s));
}

/**
 * Function to convert an unknown value to an specific Error instance.
 */
export type ToError<E extends Error> = (e: unknown) => E;
/**
 * Convert an unknown value to an Error instance.
 * @param e Unknown error value.
 * @returns Error instance.
 */
export function toError(e: unknown): Error {
  if (e instanceof Error) {
    return e;
  } else {
    return new Error(String(e));
  }
}
/**
 * Run throwable function and return a Result instance.
 * @param toErr Function to convert an unknown value to an Error instance.
 * @param f Throwable function.
 */
export function safelyWith<E extends Error, ToErr extends ToError<E>, T>(
  toErr: ToErr,
  f: () => T,
): Result<T, E> {
  try {
    return ok(f());
  } catch (e) {
    return err(toErr(e));
  }
}
/**
 * Run throwable function and return a Result<T, Error> instance.
 * @param f Throwable function.
 * @returns Result instance.
 */
export function safely<T>(f: () => T): Result<T, Error> {
  return safelyWith(toError, f);
}
/**
 * Run throwable async function and return a Result instance.
 * @param toErr Function to convert an unknown value to an Error instance.
 * @param f Throwable async function.
 * @returns Promise of Result instance.
 */
export async function safelyAsyncWith<
  E extends Error,
  ToErr extends ToError<E>,
  T,
>(toErr: ToErr, f: () => Promise<T>): Promise<Result<Awaited<T>, E>> {
  try {
    const value = await f();
    return ok(value);
  } catch (e) {
    return err(toErr(e));
  }
}
/**
 * Run throwable async function and return a Result<T, Error> instance.
 * @param f Throwable async function.
 * @returns Promise of Result instance.
 */
export function safelyAsync<T>(
  f: () => Promise<T>,
): Promise<Result<Awaited<T>, Error>> {
  return safelyAsyncWith(toError, f);
}

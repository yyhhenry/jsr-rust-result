/**
 * Represents a panic error, which is a type of error that occurs when the program encounters an unexpected condition.
 * This class extends the built-in `Error` class.
 *
 * @remarks
 * This error is used to indicate a critical failure that should not be recovered from.
 *
 * @example
 * ```typescript
 * panic("Division by zero");
 * ```
 */
export class Panic extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Panic";
  }
}
/**
 * Throws a `Panic` error with the provided message.
 *
 * @param message - The message to include in the `Panic` error.
 * @throws {Panic} Always throws a `Panic` error with the provided message.
 */
export function panic(message: string): never {
  throw new Panic(message);
}

/**
 * Interface representing a set of functions for handling `Result` types.
 *
 * @template T - The type of the value in the `Ok` variant.
 * @template E - The type of the error in the `Err` variant. Defaults to `Error`.
 */
export interface ResultFunctions<T, E = Error> {
  /**
   * Checks if the `Result` is an `Ok` variant.
   */
  isOk(): this is Ok<T> & ResultFunctions<T, E>;
  /**
   * Checks if the `Result` is an `Err` variant.
   */
  isErr(): this is Err<E> & ResultFunctions<T, E>;
  /**
   * Unwraps the value contained in the `Ok` variant.
   * @returns The value contained in the `Ok` variant.
   * @throws {Panic} If the `Result` is an `Err` variant.
   */
  expect(msg: string): T;
  /**
   * Unwraps the error contained in the `Err` variant.
   * @returns The error contained in the `Err` variant.
   * @throws {Panic} If the `Result` is an `Ok` variant.
   */
  expectErr(msg: string): E;
  /**
   * Unwraps the value contained in the `Ok` variant.
   * @returns The value contained in the `Ok` variant.
   *
   * @remarks
   * It throws the error contained in the `Err` variant.
   * Panics if error is not an instance of `Error`.
   */
  unwrap(): T;
  /**
   * Unwraps the error contained in the `Err` variant.
   * @returns The error contained in the `Err` variant.
   *
   * @remarks
   * Panics if the `Result` is an `Ok` variant.
   */
  unwrapErr(): E;
  /**
   * Matches the `Result` against the provided functions and returns the result of the matching function.
   * @typeparam U - The type of the value returned by the matching function.
   * @param ok - The function to be called if the `Result` is an `Ok` variant.
   * @param err - The function to be called if the `Result` is an `Err` variant.
   * @returns The result of the matching function.
   */
  match<U>(ok: (v: T) => U, err: (e: E) => U): U;
  /**
   * Unwraps the value contained in the `Ok` variant, or returns a default value.
   * @param def - The default value to return if the `Result` is an `Err` variant.
   * @returns The value contained in the `Ok` variant, or the default value.
   */
  unwrapOr(def: T): T;
  /**
   * Unwraps the value contained in the `Ok` variant, or computes a default value.
   * @param fn - The function to be called to compute the default value.
   * @returns The value contained in the `Ok` variant, or the computed default value.
   */
  unwrapOrElse(fn: (e: E) => T): T;
  /**
   * Maps the value contained in the `Ok` variant to a new value using the provided function.
   * @typeparam U - The type of the value contained in the new `Ok` variant.
   * @param fn - The function to be applied to the value contained in the `Ok` variant.
   * @returns A new `Result` with the mapped value in the `Ok` variant, or the original `Err` variant.
   */
  map<U>(fn: (t: T) => U): Result<U, E>;
  /**
   * Maps the error contained in the `Err` variant to a new error using the provided function.
   * @typeparam F - The type of the error contained in the new `Err` variant.
   * @param fn - The function to be applied to the error contained in the `Err` variant.
   * @returns A new `Result` with the original `Ok` variant and the mapped error in the `Err` variant.
   */
  mapErr<F>(fn: (e: E) => F): Result<T, F>;
  /**
   * Maps the value contained in the `Ok` variant to a new `Result` using the provided function.
   * @typeparam U - The type of the value contained in the new `Ok` variant.
   * @param fn - The function to be applied to the value contained in the `Ok` variant.
   * @returns A new `Result` with the mapped value in the `Ok` variant, or the original `Err` variant.
   */
  andThen<U>(fn: (t: T) => Result<U, E>): Result<U, E>;
  /**
   * Maps the error contained in the `Err` variant to a new `Result` using the provided function.
   * @typeparam F - The type of the error contained in the new `Err` variant.
   * @param fn - The function to be applied to the error contained in the `Err` variant.
   * @returns A new `Result` with the original `Ok` variant and the mapped error in the `Err` variant.
   */
  orElse<F>(fn: (e: E) => Result<T, F>): Result<T, F>;
}

/**
 * Represents a successful result with a value of type `T`.
 * @template T - The type of the value in the `Ok` variant.
 */
export type Ok<T> = {
  readonly ok: true;
  v: T;
};
/**
 * Represents an error result with an error of type `E`.
 * @template E - The type of the error in the `Err` variant.
 */
export type Err<E> = {
  readonly ok: false;
  e: E;
};
/**
 * Represents a `Result` type that can be either an `Ok` variant with a value of type `T`, or an `Err` variant with an error of type `E`.
 */
export type Result<T = undefined, E = Error> =
  & (
    | Ok<T>
    | Err<E>
  )
  & ResultFunctions<T, E>;

/**
 * Creates an `Ok` result object containing the provided value.
 */
export function ok<T, E = Error>(v: T): Result<T, E> {
  return new OkObject(v);
}
/**
 * Creates an `Ok` result object containing `undefined`.
 */
export function fin<E = Error>(): Result<undefined, E> {
  return ok(undefined);
}
/**
 * Creates an `Err` result object containing the provided error.
 */
export function err<T, E = Error>(e: E): Result<T, E> {
  return new ErrObject(e);
}

/**
 * Creates an `Err` instance containing an `Error` with the provided message.
 *
 * @param message - The error message to be included in the `Error` instance.
 * @returns An `Err` instance containing the created `Error`.
 */
export function anyhow<T>(message: string): Result<T, Error> {
  return err(new Error(message));
}
export function execFn<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn());
  } catch (e) {
    return e instanceof Error ? err(e) : anyhow(String(e));
  }
}
export async function execAsyncFn<T>(
  fn: () => Promise<T>,
): Promise<Result<Awaited<T>, Error>> {
  try {
    return ok(await fn());
  } catch (e) {
    return e instanceof Error ? err(e) : anyhow(String(e));
  }
}
export function wrapFn<Args extends unknown[], T>(
  fn: (...args: Args) => T,
): (...args: Args) => Result<T, Error> {
  return (...args) => execFn(() => fn(...args));
}
export function wrapAsyncFn<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>,
): (...args: Args) => Promise<Result<Awaited<T>, Error>> {
  return (...args) => execAsyncFn(() => fn(...args));
}

// Implementation

/**
 * The implementation of the ResultFunctions interface.
 */
class ResultObject<T, E> implements ResultFunctions<T, E> {
  isOk(): this is Ok<T> & ResultFunctions<T, E> {
    return this instanceof OkObject;
  }
  isErr(): this is Err<E> & ResultFunctions<T, E> {
    return this instanceof ErrObject;
  }
  expect(msg: string): T {
    if (this.isOk()) {
      return this.v;
    }
    panic(msg);
  }
  expectErr(msg: string): E {
    if (this.isErr()) {
      return this.e;
    }
    panic(msg);
  }
  unwrap(): T {
    return this.unwrapOrElse((e) => {
      if (e instanceof Error) {
        throw e;
      }
      panic("called `unwrap()` on an `Err` value");
    });
  }
  unwrapErr(): E {
    return this.expectErr("called `unwrapErr()` on an `Ok` value");
  }
  match<U>(ok: (v: T) => U, err: (e: E) => U): U {
    if (this.isOk()) {
      return ok(this.v);
    } else if (this.isErr()) {
      return err(this.e);
    } else {
      panic("unreachable: unknown variant of Result");
    }
  }
  unwrapOr(def: T): T {
    return this.match<T>((v) => v, () => def);
  }
  unwrapOrElse(fn: (e: E) => T): T {
    return this.match<T>((v) => v, (e) => fn(e));
  }
  map<U>(fn: (t: T) => U): Result<U, E> {
    return this.match<Result<U, E>>((v) => ok(fn(v)), (e) => err(e));
  }
  mapErr<F>(fn: (e: E) => F): Result<T, F> {
    return this.match<Result<T, F>>((v) => ok(v), (e) => err(fn(e)));
  }
  andThen<U>(fn: (t: T) => Result<U, E>): Result<U, E> {
    return this.match<Result<U, E>>((v) => fn(v), (e) => err(e));
  }
  orElse<F>(fn: (e: E) => Result<T, F>): Result<T, F> {
    return this.match<Result<T, F>>((v) => ok(v), (e) => fn(e));
  }
}
/**
 * Implementation of the `Ok` variant of the `Result` type.
 */
class OkObject<T, E> extends ResultObject<T, E> implements Ok<T> {
  readonly ok = true;
  constructor(public v: T) {
    super();
  }
}
/**
 * Implementation of the `Err` variant of the `Result` type.
 */
class ErrObject<T, E> extends ResultObject<T, E> implements Err<E> {
  readonly ok = false;
  constructor(public e: E) {
    super();
  }
}

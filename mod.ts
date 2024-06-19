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
      return ok(this.value);
    } else if (this.isErr()) {
      return err(this.error);
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
  value: T;
  constructor(value: T) {
    super();
    this.value = value;
  }
  unwrap(): T {
    return this.value;
  }
}
class Err<T, E extends Error> extends ResultBase<T, E> {
  error: E;
  constructor(error: E) {
    super();
    this.error = error;
  }
  unwrapErr(): E {
    return this.error;
  }
}

// Constructors

export function ok<T>(value: T): Ok<T, never> {
  return new Ok(value);
}
export function err<E extends Error>(error: E): Err<never, E> {
  return new Err(error);
}
export function anyhow(s: string): Err<never, Error> {
  return err(new Error(s));
}

// Safely Helpers

export type ToError<E extends Error> = (e: unknown) => E;

export function toError(e: unknown): Error {
  if (e instanceof Error) {
    return e;
  } else {
    return new Error(String(e));
  }
}
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
export function safely<T>(f: () => T): Result<T, Error> {
  return safelyWith(toError, f);
}
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
export function safelyAsync<T>(
  f: () => Promise<T>,
): Promise<Result<Awaited<T>, Error>> {
  return safelyAsyncWith(toError, f);
}

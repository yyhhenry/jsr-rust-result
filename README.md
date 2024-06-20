# @yyhhenry/rust-result

Rust-like error handling in TypeScript.

Provides `Result<T, E>` and `Ok<T>` and `Err<E>` types.

## Installation

```sh
deno add @yyhhenry/rust-result
# or in Node.js
pnpm dlx jsr add @yyhhenry/rust-result
```

## Usage

```ts
import { ok, err, anyhow, safely } from "@yyhhenry/rust-result";
const safeJsonParse = (s: string) => safely(() => JSON.parse(s));
const result = safeJsonParse('{"a": 1}');
// Or
// const result = safeJsonParse('{"a": 1');
console.log(result.isOk() ? result.unwrap() : result.unwrapErr().message);
// It's safe to call unwrap() method in TypeScript,
// since it's only available when the type is narrowed to Ok.
```

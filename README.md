# @yyhhenry/rust-result

Rust-like error handling in TypeScript.

## Installation

```sh
deno add jsr:@yyhhenry/rust-result
# or
pnpm dlx jsr add @yyhhenry/rust-result
```

## Usage

```ts
import { wrapFn } from "@yyhhenry/rust-result";
const safeJsonParse = wrapFn(JSON.parse);

function parseAndLog(text: string) {
  const res = safeJsonParse(text);
  res.map((v) => JSON.stringify(v)).match(
    (v) => console.log(`Ok: ${v}`),
    (e) => console.log(`Error (caught): ${e.message}`),
  );
}

// Ok: {"a":1}
parseAndLog(`{
  "a": 1
}`);

// Error (caught): Expected ',' or '}' after property value in JSON at position 9 (line 1 column 10)
parseAndLog(`{ "a": 1 `);
```

## Development

We prefer VSCode with the following settings:

```json
{
  "[typescript]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  }
}
```

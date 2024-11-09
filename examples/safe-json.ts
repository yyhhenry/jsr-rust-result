import { wrapFn } from "@yyhhenry/rust-result";
const safeJsonParse = wrapFn(JSON.parse);

function parseAndLog(text: string) {
  const res = safeJsonParse(text);
  if (res.isOk()) {
    console.log(`Parsed: ${JSON.stringify(res.v)}`);
  } else {
    console.log(`Error: ${res.e.message}`);
  }
}

// Parsed: {"a":1}
parseAndLog(`{
  "a": 1
}`);

// Error: Expected property name or '}' in JSON at position 2 (line 1 column 3)
parseAndLog(`{ "a": 1 `);

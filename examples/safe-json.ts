import { safely } from "@yyhhenry/rust-result";
const safeJsonParse = (s: string) => safely(() => JSON.parse(s));

// true { a: 1 }
const okRes = safeJsonParse('{"a": 1}');
console.log(
  okRes.isOk(),
  okRes.isOk() ? okRes.unwrap() : okRes.unwrapErr().message,
);

// false Expected ',' or '}' after property value in JSON at position 7 (line 1 column 8)
const errRes = safeJsonParse('{"a": 1');
console.log(
  errRes.isOk(),
  errRes.isOk() ? errRes.unwrap() : errRes.unwrapErr().message,
);

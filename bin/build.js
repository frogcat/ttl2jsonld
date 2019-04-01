const peg = require("pegjs");
const fs = require("fs");
const parser = peg.generate(fs.readFileSync(process.argv[2], "UTF-8"), {
  output: "source",
  format: "commonjs"
}).replace("function peg$parsePN_CHARS_BASE() {",
  `function peg$parsePN_CHARS_BASE() {
    var cp = input.codePointAt(peg$currPos);
    if(0x10000 <= cp && cp <= 0xeffff) {
      peg$currPos+=2;
      return String.fromCodePoint(cp);
    }
`
);

console.log(parser);

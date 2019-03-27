const fs = require("fs");
const parse = require("../ttl2jsonld").parse;
const json = parse(fs.readFileSync(process.argv[2], "UTF-8"));
console.log(JSON.stringify(json, null, 2));

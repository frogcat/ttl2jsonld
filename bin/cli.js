#!/usr/bin/env node

const fs = require("fs");
const readline = require('readline');
const parse = require("../ttl2jsonld").parse;

const rl = readline.createInterface({
  input: process.argv[2] ? fs.createReadStream(process.argv[2], 'UTF-8') : process.stdin,
  crlfDelay: Infinity
});

const lines = [];
rl.on('line', (line) => {
  lines.push(line);
}).on('close', () => {
  const turtle = lines.join("\n");
  const json = parse(turtle);
  console.log(JSON.stringify(json, null, 2));
});

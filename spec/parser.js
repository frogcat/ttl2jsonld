const parse = require("../ttl2jsonld").parse;
const ParserJsonld = require('@rdfjs/parser-jsonld');
const stringToStream = require('string-to-stream');

module.exports = {
  parse: function(ttl, baseIRI, options) {
    return new Promise((resolve, reject) => {
      try {
        const jsonld = parse(ttl, {
          baseIRI: baseIRI
        });
        const input = stringToStream(JSON.stringify(jsonld));
        const parserJsonld = new ParserJsonld();
        const output = parserJsonld.import(input);
        const quads = [];
        output.on('data', quad => {
          quads.push(quad);
        }).on('error', err => {
          reject(err);
        }).on('end', () => {
          resolve(quads);
        });
      } catch (e) {
        reject(e);
      }
    });
  }
};

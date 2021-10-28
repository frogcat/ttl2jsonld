const parse = require("../ttl2jsonld").parse;
const JsonLdParser = require("jsonld-streaming-parser").JsonLdParser;

module.exports = {
  parse: function(ttl, baseIRI, options) {
    return new Promise((resolve, reject) => {
      try {
        const jsonld = parse(ttl, {
          baseIRI: baseIRI
        });
        const output = new JsonLdParser();
        const quads = [];
        output.on('data', quad => {
          quads.push(quad);
        }).on('error', err => {
          reject(err);
        }).on('end', () => {
          resolve(quads);
        });
        output.write(JSON.stringify(jsonld));
        output.end();
      } catch (e) {
        reject(e);
      }
    });
  }
};

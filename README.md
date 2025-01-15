# @frogcat/ttl2jsonld

Turtle to JSON-LD converter for node.js and browser, no library dependencies.

## Demo

Online demo is available [here](https://frogcat.github.io/ttl2jsonld/demo/).

With this converter, you can obtain `Output JSON-LD` from `Input Turtle`, as shown in [JSON-LD 1.0 Specification](https://www.w3.org/TR/json-ld/#turtle) .

### Input Turtle

```example66.ttl
@prefix foaf: <http://xmlns.com/foaf/0.1/> .

<http://manu.sporny.org/about#manu> a foaf:Person;
  foaf:name "Manu Sporny";
  foaf:homepage <http://manu.sporny.org/> .
```

### Output JSON-LD

```exampl67.json
{
  "@context": {
    "foaf": "http://xmlns.com/foaf/0.1/"
  },
  "@id": "http://manu.sporny.org/about#manu",
  "@type": "foaf:Person",
  "foaf:name": "Manu Sporny",
  "foaf:homepage": { "@id": "http://manu.sporny.org/" }
}
```

## Install

### node.js

```a.sh
$ npm install @frogcat/ttl2jsonld
```

### browser

```a.html
<script src="https://frogcat.github.io/ttl2jsonld/ttl2jsonld.js"></script>
```

## Usage

### node.js

You can write your own code.

```example.js
const ttl2jsonld = require('@frogcat/ttl2jsonld').parse;

const ttl = `@prefix foaf: <http://xmlns.com/foaf/0.1/> .

<http://manu.sporny.org/about#manu> a foaf:Person;
  foaf:name "Manu Sporny";
  foaf:homepage <http://manu.sporny.org/> .
`;

const jsonld = ttl2jsonld(ttl);

console.log(JSON.stringify(jsonld,null,2));

```

Command line interface is also available.

```cli.sh
$ npm install @frogcat/ttl2jsonld
$ ttl2jsonld {input_turtle} > {output_jsonld}
or
$ cat {input_turtle} | ttl2jsonld > {output_jsonld}
```

### browser

This converter is exported to `ttl2jsonld` global object. Call `ttl2jsonld.parse(ttl)` to perform conversion.

```example.html
<!-- include ttl2jsonld.js -->
<script src="https://frogcat.github.io/ttl2jsonld/ttl2jsonld.js"></script>

<!-- run script -->
<script>
const ttl = `@prefix foaf: <http://xmlns.com/foaf/0.1/> .

<http://manu.sporny.org/about#manu> a foaf:Person;
  foaf:name "Manu Sporny";
  foaf:homepage <http://manu.sporny.org/> .
`;

const jsonld = ttl2jsonld.parse(ttl);

console.log(JSON.stringify(jsonld,null,2));
</script>

```

## API

Given `turtle_string`, `ttl2jsonld.parse` returns JSON Object.

```a.js
var json_object = ttl2jsonld.parse(turtle_string);
```

When you want to pass baseIRI, give second argument like this.

```a.js
var json_object = ttl2jsonld.parse(turtle_string, {
  baseIRI : "http://example.org/"
});
```

## For developers

### building

- Build with [PEG.js](https://pegjs.org/).
- Main code is `spec/ttl2jsonld.pegjs`.
- When you edit code, run `npm run build` to generate `ttl2jsonld.js`.

### testing

- Tested with [rdf-test-suite](https://www.npmjs.com/package/rdf-test-suite) and <https://w3c.github.io/rdf-tests/rdf/rdf11/rdf-turtle/manifest.ttl> .
- Currently 298 / 301 tests succeeded.
- Run `npm run spec-turtle` to start rdr-test-suite.
- Other miscellaneous tests are located in `test/test.js`, `npm run test` to run.

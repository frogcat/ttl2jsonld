const ttl2json = require("../ttl2jsonld").parse;
const test = require("node:test");
const assert = require("node:assert");

test("ttl2json:issue-4", () => {
  assert.deepStrictEqual(
    ttl2json(`@prefix test: <#> .`),
    { "@graph": [] },
    "@prefix with non abolute IRI must not be appear in jsonld's @context (<#>)",
  );

  assert.deepStrictEqual(
    ttl2json(`@prefix test: </#> .`),
    { "@graph": [] },
    "@prefix with non abolute IRI must not be appear in jsonld's @context (</#>)",
  );

  assert.deepStrictEqual(
    ttl2json(`@prefix test: </#> .
test:subject a <http://example.org/object> .`),
    {
      "@id": "/#subject",
      "@type": "http://example.org/object",
    },
    "subject",
  );

  assert.deepStrictEqual(
    ttl2json(`@prefix test: </#> .
    <http://example.org/subject> a test:object .`),
    {
      "@id": "http://example.org/subject",
      "@type": "/#object",
    },
    "object",
  );
});

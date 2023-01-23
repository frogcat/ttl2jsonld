const ttl2json = require("../ttl2jsonld").parse;
const test = require("tape");

test("ttl2json:issue-4", (t) => {
  t.deepEqual(
    ttl2json(`@prefix test: <#> .`),
    { "@graph": [] },
    "@prefix with non abolute IRI must not be appear in jsonld's @context (<#>)"
  );

  t.deepEqual(
    ttl2json(`@prefix test: </#> .`),
    { "@graph": [] },
    "@prefix with non abolute IRI must not be appear in jsonld's @context (</#>)"
  );

  t.deepEqual(
    ttl2json(`@prefix test: </#> .
test:subject a <http://example.org/object> .`),
    {
      "@id": "/#subject",
      "@type": "http://example.org/object",
    },
    "subject"
  );

  t.deepEqual(
    ttl2json(`@prefix test: </#> .
    <http://example.org/subject> a test:object .`),
    {
      "@id": "http://example.org/subject",
      "@type": "/#object",
    },
    "object"
  );

  t.end();
});

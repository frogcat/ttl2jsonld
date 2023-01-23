const ttl2json = require("../ttl2jsonld").parse;
const test = require("tape");

test("ttl2json:basic", (t) => {
  t.deepEqual(
    ttl2json(`<I> <http://xmlns.com/foaf/0.1/name> "Bob".`),
    {
      "@id": "I",
      "http://xmlns.com/foaf/0.1/name": "Bob",
    },
    "triple"
  );

  t.deepEqual(
    ttl2json(`
    <I> <http://xmlns.com/foaf/0.1/name> "Bob".
    <You> <http://xmlns.com/foaf/0.1/name> "Candy".
    `),
    {
      "@graph": [
        {
          "@id": "I",
          "http://xmlns.com/foaf/0.1/name": "Bob",
        },
        {
          "@id": "You",
          "http://xmlns.com/foaf/0.1/name": "Candy",
        },
      ],
    },
    "triples"
  );

  t.deepEqual(
    ttl2json(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@graph": [],
    },
    "prefix"
  );

  t.deepEqual(
    ttl2json(`@prefix f.o.a.f: <http://xmlns.com/foaf/0.1/> .`),
    {
      "@context": {
        "f.o.a.f": "http://xmlns.com/foaf/0.1/",
      },
      "@graph": [],
    },
    "prefix with dot"
  );

  t.throws(() => ttl2json(`@prefix foaf.: <http://xmlns.com/foaf/0.1/> .`), "prefix ends with dot");

  t.deepEqual(
    ttl2json(`@prefix : <http://xmlns.com/foaf/0.1/> .`),
    {
      "@context": {
        0: "http://xmlns.com/foaf/0.1/",
      },
      "@graph": [],
    },
    "default prefix"
  );
  t.deepEqual(
    ttl2json(`
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  @prefix skos: <http://www.w3.org/2004/02/skos/core#> .
  `),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
        skos: "http://www.w3.org/2004/02/skos/core#",
      },
      "@graph": [],
    },
    "prefixes"
  );
  t.deepEqual(
    ttl2json(`
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
<I> <http://xmlns.com/foaf/0.1/name> "Bob".
`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@id": "I",
      "http://xmlns.com/foaf/0.1/name": "Bob",
    },
    "triple and prefix"
  );

  t.deepEqual(
    ttl2json(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .
  <I> foaf:name "Bob".
  `),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@id": "I",
      "foaf:name": "Bob",
    },
    "prefixed name"
  );

  t.deepEqual(
    ttl2json(`
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  <I> <http://xmlns.com/foaf/0.1/name> "Bob".
  @prefix skos: <http://www.w3.org/2004/02/skos/core#> .
  <You> <http://xmlns.com/foaf/0.1/name> "Candy".
  `),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
        skos: "http://www.w3.org/2004/02/skos/core#",
      },
      "@graph": [
        {
          "@id": "I",
          "http://xmlns.com/foaf/0.1/name": "Bob",
        },
        {
          "@id": "You",
          "http://xmlns.com/foaf/0.1/name": "Candy",
        },
      ],
    },
    "multiple graph"
  );

  t.deepEqual(
    ttl2json(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .

    <http://manu.sporny.org/about#manu> a foaf:Person;
      foaf:name "Manu Sporny";
      foaf:homepage <http://manu.sporny.org/> .`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@id": "http://manu.sporny.org/about#manu",
      "@type": "foaf:Person",
      "foaf:name": "Manu Sporny",
      "foaf:homepage": {
        "@id": "http://manu.sporny.org/",
      },
    },
    "EXAMPLE 66: A set of statements serialized in Turtle"
  );

  t.deepEqual(
    ttl2json(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .
  <I> foaf:name "ねこ","Cat"@en .`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@id": "I",
      "foaf:name": [
        "ねこ",
        {
          "@value": "Cat",
          "@language": "en",
        },
      ],
    },
    "Object list"
  );

  t.end();
});

test("ttl2json:spec", (t) => {
  t.deepEqual(
    ttl2json(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@graph": [],
    },
    "[4] prefixID"
  );

  t.deepEqual(
    ttl2json(`@base <http://example.org/> .`),
    {
      "@context": {
        "@base": "http://example.org/",
      },
      "@graph": [],
    },
    "[5] base"
  );

  t.deepEqual(
    ttl2json(`BASE <http://example.org/>`),
    {
      "@context": {
        "@base": "http://example.org/",
      },
      "@graph": [],
    },
    "[5s] sparqlBase"
  );

  t.deepEqual(
    ttl2json(`PREFIX foaf: <http://xmlns.com/foaf/0.1/>`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@graph": [],
    },
    "[6s] sparqlPrefix"
  );

  t.end();
});

test("ttl2json:literal", (t) => {
  t.deepEqual(
    ttl2json(`<I> <http://example.org/name> "Bob".`),
    {
      "@id": "I",
      "http://example.org/name": "Bob",
    },
    "string"
  );

  t.deepEqual(
    ttl2json(`<I> <http://example.org/name> 'Bob'.`),
    {
      "@id": "I",
      "http://example.org/name": "Bob",
    },
    "single quote string"
  );

  t.deepEqual(
    ttl2json(`<I> <http://example.org/name> """Bob""".`),
    {
      "@id": "I",
      "http://example.org/name": "Bob",
    },
    "long quote string"
  );

  t.deepEqual(
    ttl2json(`<I> <http://example.org/name> '''Bob'''.`),
    {
      "@id": "I",
      "http://example.org/name": "Bob",
    },
    "long single quote string"
  );

  t.deepEqual(
    ttl2json(`<I> <http://example.org/name> "Bob"@en.`),
    {
      "@id": "I",
      "http://example.org/name": {
        "@value": "Bob",
        "@language": "en",
      },
    },
    "language tag 1"
  );

  t.deepEqual(
    ttl2json(`<I> <http://example.org/name> "山田"@ja.`),
    {
      "@id": "I",
      "http://example.org/name": {
        "@value": "山田",
        "@language": "ja",
      },
    },
    "language tag 2"
  );

  t.deepEqual(
    ttl2json(`<I> <http://example.org/name> "ヤマダ"@ja-Hrkt.`),
    {
      "@id": "I",
      "http://example.org/name": {
        "@value": "ヤマダ",
        "@language": "ja-Hrkt",
      },
    },
    "language tag 3"
  );

  t.deepEqual(
    ttl2json(`<I> <http://example.org/age> 12.`),
    {
      "@id": "I",
      "http://example.org/age": 12,
    },
    "integer 1"
  );
  t.deepEqual(
    ttl2json(`<I> <http://example.org/age> +12.`),
    {
      "@id": "I",
      "http://example.org/age": {
        "@value": "+12",
        "@type": "http://www.w3.org/2001/XMLSchema#integer",
      },
    },
    "integer 2"
  );
  t.deepEqual(
    ttl2json(`<I> <http://example.org/age> -12.`),
    {
      "@id": "I",
      "http://example.org/age": -12,
    },
    "integer 3"
  );

  t.deepEqual(
    ttl2json(`<I> <http://example.org/height> 123.4.`),
    {
      "@id": "I",
      "http://example.org/height": {
        "@value": "123.4",
        "@type": "http://www.w3.org/2001/XMLSchema#decimal",
      },
    },
    "decimal 1"
  );
  t.deepEqual(
    ttl2json(`<I> <http://example.org/height> +123.4.`),
    {
      "@id": "I",
      "http://example.org/height": {
        "@value": "+123.4",
        "@type": "http://www.w3.org/2001/XMLSchema#decimal",
      },
    },
    "decimal 2"
  );
  t.deepEqual(
    ttl2json(`<I> <http://example.org/height> -123.4.`),
    {
      "@id": "I",
      "http://example.org/height": {
        "@value": "-123.4",
        "@type": "http://www.w3.org/2001/XMLSchema#decimal",
      },
    },
    "decimal 3"
  );
  t.deepEqual(
    ttl2json(`<I> <http://example.org/height> 0.123.`),
    {
      "@id": "I",
      "http://example.org/height": {
        "@value": "0.123",
        "@type": "http://www.w3.org/2001/XMLSchema#decimal",
      },
    },
    "decimal 4"
  );
  t.deepEqual(
    ttl2json(`<I> <http://example.org/height> +0.123.`),
    {
      "@id": "I",
      "http://example.org/height": {
        "@value": "+0.123",
        "@type": "http://www.w3.org/2001/XMLSchema#decimal",
      },
    },
    "decimal 5"
  );
  t.deepEqual(
    ttl2json(`<I> <http://example.org/height> -0.123.`),
    {
      "@id": "I",
      "http://example.org/height": {
        "@value": "-0.123",
        "@type": "http://www.w3.org/2001/XMLSchema#decimal",
      },
    },
    "decimal 6"
  );
  t.deepEqual(
    ttl2json(`<I> <http://example.org/height> .123.`),
    {
      "@id": "I",
      "http://example.org/height": {
        "@value": ".123",
        "@type": "http://www.w3.org/2001/XMLSchema#decimal",
      },
    },
    "decimal 7"
  );
  t.deepEqual(
    ttl2json(`<I> <http://example.org/height> +.123.`),
    {
      "@id": "I",
      "http://example.org/height": {
        "@value": "+.123",
        "@type": "http://www.w3.org/2001/XMLSchema#decimal",
      },
    },
    "decimal 8"
  );
  t.deepEqual(
    ttl2json(`<I> <http://example.org/height> -.123.`),
    {
      "@id": "I",
      "http://example.org/height": {
        "@value": "-.123",
        "@type": "http://www.w3.org/2001/XMLSchema#decimal",
      },
    },
    "decimal 9"
  );

  t.deepEqual(
    ttl2json(`<I> <http://example.org/height> 4.2E9.`),
    {
      "@id": "I",
      "http://example.org/height": {
        "@value": "4.2E9",
        "@type": "http://www.w3.org/2001/XMLSchema#double",
      },
    },
    "double 1"
  );
  t.deepEqual(
    ttl2json(`<I> <http://example.org/height> -4.2E9.`),
    {
      "@id": "I",
      "http://example.org/height": {
        "@value": "-4.2E9",
        "@type": "http://www.w3.org/2001/XMLSchema#double",
      },
    },
    "double 2"
  );
  t.deepEqual(
    ttl2json(`<I> <http://example.org/height> 4.2E-9.`),
    {
      "@id": "I",
      "http://example.org/height": {
        "@value": "4.2E-9",
        "@type": "http://www.w3.org/2001/XMLSchema#double",
      },
    },
    "double 3"
  );
  t.deepEqual(
    ttl2json(`<I> <http://example.org/height> -4.2E-9.`),
    {
      "@id": "I",
      "http://example.org/height": {
        "@value": "-4.2E-9",
        "@type": "http://www.w3.org/2001/XMLSchema#double",
      },
    },
    "double 4"
  );

  t.deepEqual(
    ttl2json(`<I> <http://example.org/alive> true.`),
    {
      "@id": "I",
      "http://example.org/alive": true,
    },
    "boolean 1"
  );
  t.deepEqual(
    ttl2json(`<I> <http://example.org/alive> false.`),
    { "@id": "I", "http://example.org/alive": false },
    "boolean 2"
  );

  t.end();
});

test("ttl2json:predicate", (t) => {
  t.deepEqual(
    ttl2json(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .
  <I> <http://xmlns.com/foaf/0.1/name> "Bob".`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@id": "I",
      "http://xmlns.com/foaf/0.1/name": "Bob",
    },
    "iri"
  );
  t.deepEqual(
    ttl2json(`
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
<I> foaf:name "Bob".
`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@id": "I",
      "foaf:name": "Bob",
    },
    "prefixed name"
  );

  t.deepEqual(
    ttl2json(`
  @prefix : <http://xmlns.com/foaf/0.1/> .
<I> :name "Bob".
`),
    {
      "@context": {
        0: "http://xmlns.com/foaf/0.1/",
      },
      "@id": "I",
      "0:name": "Bob",
    },
    "prefixed name (zero-length)"
  );
  t.end();
});

test("ttl2json:blank node", (t) => {
  t.deepEqual(
    ttl2json(`
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
[] foaf:name "Bob".
`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "foaf:name": "Bob",
    },
    "subject unlabeled"
  );

  t.deepEqual(
    ttl2json(`
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
_:alice foaf:name "Alice".
`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@id": "_:alice",
      "foaf:name": "Alice",
    },
    "subject labeled"
  );

  t.deepEqual(
    ttl2json(`
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
_:my.name.is foaf:name "Alice".
`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@id": "_:my.name.is",
      "foaf:name": "Alice",
    },
    "label with dot"
  );

  t.throws(
    () =>
      ttl2json(`
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
_:my.name.is. foaf:name "Alice".
`),
    "label ends with dot"
  );

  t.deepEqual(
    ttl2json(`
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
<I> foaf:know _:alice .
`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@id": "I",
      "foaf:know": {
        "@id": "_:alice",
      },
    },
    "object labeled"
  );
  t.deepEqual(
    ttl2json(`
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
<I> foaf:know [] .
`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@id": "I",
      "foaf:know": {},
    },
    "object unlabeled"
  );
  t.end();
});

test("ttl2json:collection", (t) => {
  t.deepEqual(
    ttl2json(`
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
(<I> <You>) a foaf:Person .
`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#first": {
        "@id": "I",
      },
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": {
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#first": {
          "@id": "You",
        },
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": {
          "@id": "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil",
        },
      },
      "@type": "foaf:Person",
    },
    "subject"
  );

  t.deepEqual(
    ttl2json(`
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
() a foaf:Person .
`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@id": "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil",
      "@type": "foaf:Person",
    },
    "empty subject"
  );

  t.deepEqual(
    ttl2json(`
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
<I> foaf:know (<You> <Cat>) .
`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@id": "I",
      "foaf:know": {
        "@list": [
          {
            "@id": "You",
          },
          {
            "@id": "Cat",
          },
        ],
      },
    },
    "object"
  );

  t.deepEqual(
    ttl2json(`
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
<I> foaf:know ((<You> <Cat>)) .
`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@id": "I",
      "foaf:know": {
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#first": {
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#first": {
            "@id": "You",
          },
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": {
            "http://www.w3.org/1999/02/22-rdf-syntax-ns#first": {
              "@id": "Cat",
            },
            "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": {
              "@id": "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil",
            },
          },
        },
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": {
          "@id": "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil",
        },
      },
    },
    "nested object"
  );
  t.end();
});

test("ttl2json:blankNodePropertyList", (t) => {
  t.deepEqual(
    ttl2json(`
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
<I> foaf:know [ foaf:name "Bob"] .
`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@id": "I",
      "foaf:know": {
        "foaf:name": "Bob",
      },
    },
    "object"
  );
  t.deepEqual(
    ttl2json(`
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
[ foaf:name "Bob" ; a foaf:Person ] .
`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@type": "foaf:Person",
      "foaf:name": "Bob",
    },
    "subject"
  );

  t.deepEqual(
    ttl2json(`
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
[ foaf:name "Bob"] .
`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "foaf:name": "Bob",
    },
    "subject"
  );
  t.end();
});

test("ttl2json:NOTE", (t) => {
  t.throws(
    () => ttl2jsonld(`@prefix foaf.: <http://xmlns.com/foaf/0.1/> .`),
    "@prefix での namespace prefix が . で終わるのは NG なので例外をスローすること"
  );

  t.doesNotThrow(
    () =>
      ttl2json(`
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
<I> a foaf:Person.
`),
    {},
    "prefixed name の直後に triple 終端の . が来る場合はエラーにならないこと"
  );
  t.end();
});

test("ttl2json:suites", (t) => {
  t.deepEqual(
    ttl2json(`<http://a.example/\u0073> <http://a.example/p> <http://a.example/o> .`),
    {
      "@id": "http://a.example/\u0073",
      "http://a.example/p": {
        "@id": "http://a.example/o",
      },
    },
    "IRI_with_four_digit_numeric_escape.ttl"
  );

  t.deepEqual(
    ttl2json(`<http://a.example/\U00000073> <http://a.example/p> <http://a.example/o> .`),
    {
      "@id": "http://a.example/U00000073",
      "http://a.example/p": {
        "@id": "http://a.example/o",
      },
    },
    "IRI_with_eight_digit_numeric_escape.ttl"
  );

  t.doesNotThrow(
    () =>
      ttl2json(`# In-scope base URI is <http://w3c.github.io/rdf-tests/turtle/turtle-subm-27.ttl> at this point
  <a1> <b1> <c1> .
  @base <http://example.org/ns/> .
  # In-scope base URI is http://example.org/ns/ at this point
  <a2> <http://example.org/ns/b2> <c2> .
  @base <foo/> .
  # In-scope base URI is http://example.org/ns/foo/ at this point
  <a3> <b3> <c3> .
  @prefix : <bar#> .
  :a4 :b4 :c4 .
  @prefix : <http://example.org/ns2#> .
  :a5 :b5 :c5 .
  `),
    "comment"
  );

  t.deepEqual(
    ttl2json(`@prefix : <http://example.org/stuff/1.0/> .
  :a :b ( ) .
  `),
    {
      "@context": {
        0: "http://example.org/stuff/1.0/",
      },
      "@id": "0:a",
      "0:b": {
        "@list": [],
      },
    },
    "blank collection"
  );

  t.deepEqual(
    ttl2json(`@prefix : <http://www.w3.org/2013/TurtleTests/> .
  :s :p1 :o1 ;
     :p2 :o2 ;;
     .
  `),
    {
      "@context": {
        0: "http://www.w3.org/2013/TurtleTests/",
      },
      "@id": "0:s",
      "0:p1": {
        "@id": "0:o1",
      },
      "0:p2": {
        "@id": "0:o2",
      },
    },
    "blank predicate/object"
  );

  t.deepEqual(
    ttl2json(`@prefix : <http://www.w3.org/2013/TurtleTests/> .
  : : : .
  `),
    {
      "@context": {
        0: "http://www.w3.org/2013/TurtleTests/",
      },
      "@id": "0:",
      "0:": {
        "@id": "0:",
      },
    },
    "odd 1"
  );

  t.deepEqual(
    ttl2json(`@prefix p: <http://a.example/> .
  <http://a.example/s> <http://a.example/p> p:#comment
  .
  `),
    {
      "@context": {
        p: "http://a.example/",
      },
      "@id": "http://a.example/s",
      "http://a.example/p": {
        "@id": "p:",
      },
    },
    "odd 2"
  );
  //t.deepEqual(ttl2json(``), {}, "");
  t.end();
});

test("ttl2json:https://www.w3.org/TR/json-ld/#turtle", (t) => {
  t.deepEqual(
    ttl2json(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .

<http://manu.sporny.org/about#manu> a foaf:Person;
  foaf:name "Manu Sporny";
  foaf:homepage <http://manu.sporny.org/> .`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@id": "http://manu.sporny.org/about#manu",
      "@type": "foaf:Person",
      "foaf:name": "Manu Sporny",
      "foaf:homepage": {
        "@id": "http://manu.sporny.org/",
      },
    },
    "Prefix definitions"
  );

  t.deepEqual(
    ttl2json(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .

  <http://manu.sporny.org/about#manu>
    a foaf:Person;
    foaf:name "Manu Sporny";
    foaf:knows [ a foaf:Person; foaf:name "Gregg Kellogg" ] .`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@id": "http://manu.sporny.org/about#manu",
      "@type": "foaf:Person",
      "foaf:name": "Manu Sporny",
      "foaf:knows": {
        "@type": "foaf:Person",
        "foaf:name": "Gregg Kellogg",
      },
    },
    "Embedding"
  );

  t.deepEqual(
    ttl2json(`@prefix ex: <http://example.com/vocab#> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
  
  <http://example.com/>
    ex:numbers "14"^^xsd:integer, "2.78E0"^^xsd:double ;
    ex:booleans "true"^^xsd:boolean, "false"^^xsd:boolean .
  `),
    {
      "@context": {
        ex: "http://example.com/vocab#",
      },
      "@id": "http://example.com/",
      "ex:numbers": [14, 2.78],
      "ex:booleans": [true, false],
    },
    "Conversion of native data types"
  );

  t.deepEqual(
    ttl2json(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .

  <http://example.org/people#joebob> a foaf:Person;
    foaf:name "Joe Bob";
    foaf:nick ( "joe" "bob" "jaybee" ) .`),
    {
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
      },
      "@id": "http://example.org/people#joebob",
      "@type": "foaf:Person",
      "foaf:name": "Joe Bob",
      "foaf:nick": {
        "@list": ["joe", "bob", "jaybee"],
      },
    },
    "Lists"
  );
  t.end();
});

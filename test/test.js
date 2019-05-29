const parse = require("../ttl2jsonld").parse;
const ttl2json = function(ttl) {
  try {
    return parse(ttl);
  } catch (e) {
    const fmt = (i, x) => ("" + i).length < x ? fmt("0" + i, x) : ("" + i);
    if (e.location) {
      const p = e.location.start.offset;
      const q = e.location.end.offset;
      const x = ttl.substring(0, p) +
        "【" + ttl.substring(p, q) + "】" +
        ttl.substring(q);
      e.message += "\n" + x.split("\n").map((a, i) => `${fmt(i+1,3)} : ${a}`).join("\n");
    }
    throw e;
  }
};
const expect = require('chai').expect;

describe('ttl2json', () => {

  describe('basic', () => {

    it('triple', () => {
      expect(ttl2json(`<I> <http://xmlns.com/foaf/0.1/name> "Bob".`)).deep.equal({
        "@id": "I",
        "http://xmlns.com/foaf/0.1/name": "Bob"
      });
    });

    it('triples', () => {
      expect(ttl2json(`
<I> <http://xmlns.com/foaf/0.1/name> "Bob".
<You> <http://xmlns.com/foaf/0.1/name> "Candy".
`)).deep.equal({
        "@graph": [{
          "@id": "I",
          "http://xmlns.com/foaf/0.1/name": "Bob"
        }, {
          "@id": "You",
          "http://xmlns.com/foaf/0.1/name": "Candy"
        }]
      });
    });

    it('prefix', () => {
      expect(ttl2json(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@graph": []
      });
    });

    it('prefix with dot', () => {
      expect(ttl2json(`@prefix f.o.a.f: <http://xmlns.com/foaf/0.1/> .`)).deep.equal({
        "@context": {
          "f.o.a.f": "http://xmlns.com/foaf/0.1/"
        },
        "@graph": []
      });
    });

    it('prefix ends with dot', () => {
      expect(function() {
        ttl2json(`@prefix foaf.: <http://xmlns.com/foaf/0.1/> .`);
      }).to.throw();
    });

    it('default prefix', () => {
      expect(ttl2json(`@prefix : <http://xmlns.com/foaf/0.1/> .`)).deep.equal({
        "@context": {
          "0": "http://xmlns.com/foaf/0.1/"
        },
        "@graph": []
      });
    });

    it('prefixes', () => {
      expect(ttl2json(`
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/",
          "skos": "http://www.w3.org/2004/02/skos/core#"
        },
        "@graph": []
      });
    });


    it('triple and prefix', () => {
      expect(ttl2json(`
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .
<I> <http://xmlns.com/foaf/0.1/name> "Bob".
`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@id": "I",
        "http://xmlns.com/foaf/0.1/name": "Bob"
      });
    });

    it('prefixed name', () => {
      expect(ttl2json(`
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .
<I> foaf:name "Bob".
`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@id": "I",
        "foaf:name": "Bob"
      });
    });

    it('multiple graph', () => {
      expect(ttl2json(`
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
<I> <http://xmlns.com/foaf/0.1/name> "Bob".
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
<You> <http://xmlns.com/foaf/0.1/name> "Candy".
`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/",
          "skos": "http://www.w3.org/2004/02/skos/core#"
        },
        "@graph": [{
          "@id": "I",
          "http://xmlns.com/foaf/0.1/name": "Bob"
        }, {
          "@id": "You",
          "http://xmlns.com/foaf/0.1/name": "Candy"
        }]
      });
    });

    it('EXAMPLE 66: A set of statements serialized in Turtle', () => {
      expect(ttl2json(`
    @prefix foaf: <http://xmlns.com/foaf/0.1/> .

    <http://manu.sporny.org/about#manu> a foaf:Person;
      foaf:name "Manu Sporny";
      foaf:homepage <http://manu.sporny.org/> .`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@id": "http://manu.sporny.org/about#manu",
        "@type": "foaf:Person",
        "foaf:name": "Manu Sporny",
        "foaf:homepage": {
          "@id": "http://manu.sporny.org/"
        }
      });
    });

    it('Object list', () => {
      expect(ttl2json(`
    @prefix foaf: <http://xmlns.com/foaf/0.1/> .
    <I> foaf:name "ねこ","Cat"@en .`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@id": "I",
        "foaf:name": ["ねこ", {
          "@value": "Cat",
          "@language": "en"
        }]
      });
    });

  });

  describe('spec', () => {

    it('[4] prefixID', () => {
      expect(ttl2json(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@graph": []
      });
    });

    it('[5] base', () => {
      expect(ttl2json(`@base <http://example.org/> .`)).deep.equal({
        "@context": {
          "@base": "http://example.org/"
        },
        "@graph": []
      });
    });

    it('[5s] sparqlBase', () => {
      expect(ttl2json(`BASE <http://example.org/>`)).deep.equal({
        "@context": {
          "@base": "http://example.org/"
        },
        "@graph": []
      });
    });

    it('[6s] sparqlPrefix', () => {
      expect(ttl2json(`PREFIX foaf: <http://xmlns.com/foaf/0.1/>`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@graph": []
      });
    });

  });

  describe('literal', () => {

    it('string', () => {
      expect(ttl2json(`<I> <http://example.org/name> "Bob".`)).deep.equal({
        "@id": "I",
        "http://example.org/name": "Bob"
      });
    });

    it('single quote string', () => {
      expect(ttl2json(`<I> <http://example.org/name> 'Bob'.`)).deep.equal({
        "@id": "I",
        "http://example.org/name": "Bob"
      });
    });

    it('long quote string', () => {
      expect(ttl2json(`<I> <http://example.org/name> """Bob""".`)).deep.equal({
        "@id": "I",
        "http://example.org/name": "Bob"
      });
    });

    it('long single quote string', () => {
      expect(ttl2json(`<I> <http://example.org/name> '''Bob'''.`)).deep.equal({
        "@id": "I",
        "http://example.org/name": "Bob"
      });
    });


    it('language tag', () => {
      expect(ttl2json(`<I> <http://example.org/name> "Bob"@en.`)).deep.equal({
        "@id": "I",
        "http://example.org/name": {
          "@value": "Bob",
          "@language": "en"
        }
      });
      expect(ttl2json(`<I> <http://example.org/name> "山田"@ja.`)).deep.equal({
        "@id": "I",
        "http://example.org/name": {
          "@value": "山田",
          "@language": "ja"
        }
      });
      expect(ttl2json(`<I> <http://example.org/name> "ヤマダ"@ja-Hrkt.`)).deep.equal({
        "@id": "I",
        "http://example.org/name": {
          "@value": "ヤマダ",
          "@language": "ja-Hrkt"
        }
      });
    });

    it('integer', () => {
      expect(ttl2json(`<I> <http://example.org/age> 12.`)).deep.equal({
        "@id": "I",
        "http://example.org/age": 12
      });
      expect(ttl2json(`<I> <http://example.org/age> +12.`)).deep.equal({
        "@id": "I",
        "http://example.org/age": 12
      });
      expect(ttl2json(`<I> <http://example.org/age> -12.`)).deep.equal({
        "@id": "I",
        "http://example.org/age": -12
      });
    });

    it('decimal', () => {
      expect(ttl2json(`<I> <http://example.org/height> 123.4.`)).deep.equal({
        "@id": "I",
        "http://example.org/height": {
          "@value": "123.4",
          "@type": "http://www.w3.org/2001/XMLSchema#decimal"
        }
      });
      expect(ttl2json(`<I> <http://example.org/height> +123.4.`)).deep.equal({
        "@id": "I",
        "http://example.org/height": {
          "@value": "+123.4",
          "@type": "http://www.w3.org/2001/XMLSchema#decimal"
        }
      });
      expect(ttl2json(`<I> <http://example.org/height> -123.4.`)).deep.equal({
        "@id": "I",
        "http://example.org/height": {
          "@value": "-123.4",
          "@type": "http://www.w3.org/2001/XMLSchema#decimal"
        }
      });
      expect(ttl2json(`<I> <http://example.org/height> 0.123.`)).deep.equal({
        "@id": "I",
        "http://example.org/height": {
          "@value": "0.123",
          "@type": "http://www.w3.org/2001/XMLSchema#decimal"
        }
      });
      expect(ttl2json(`<I> <http://example.org/height> +0.123.`)).deep.equal({
        "@id": "I",
        "http://example.org/height": {
          "@value": "+0.123",
          "@type": "http://www.w3.org/2001/XMLSchema#decimal"
        }
      });
      expect(ttl2json(`<I> <http://example.org/height> -0.123.`)).deep.equal({
        "@id": "I",
        "http://example.org/height": {
          "@value": "-0.123",
          "@type": "http://www.w3.org/2001/XMLSchema#decimal"
        }
      });
      expect(ttl2json(`<I> <http://example.org/height> .123.`)).deep.equal({
        "@id": "I",
        "http://example.org/height": {
          "@value": ".123",
          "@type": "http://www.w3.org/2001/XMLSchema#decimal"
        }
      });
      expect(ttl2json(`<I> <http://example.org/height> +.123.`)).deep.equal({
        "@id": "I",
        "http://example.org/height": {
          "@value": "+.123",
          "@type": "http://www.w3.org/2001/XMLSchema#decimal"
        }
      });
      expect(ttl2json(`<I> <http://example.org/height> -.123.`)).deep.equal({
        "@id": "I",
        "http://example.org/height": {
          "@value": "-.123",
          "@type": "http://www.w3.org/2001/XMLSchema#decimal"
        }
      });
    });

    it('double', () => {
      expect(ttl2json(`<I> <http://example.org/height> 4.2E9.`)).deep.equal({
        "@id": "I",
        "http://example.org/height": {
          "@value": "4.2E9",
          "@type": "http://www.w3.org/2001/XMLSchema#double"
        }
      });
      expect(ttl2json(`<I> <http://example.org/height> -4.2E9.`)).deep.equal({
        "@id": "I",
        "http://example.org/height": {
          "@value": "-4.2E9",
          "@type": "http://www.w3.org/2001/XMLSchema#double"
        }
      });
      expect(ttl2json(`<I> <http://example.org/height> 4.2E-9.`)).deep.equal({
        "@id": "I",
        "http://example.org/height": {
          "@value": "4.2E-9",
          "@type": "http://www.w3.org/2001/XMLSchema#double"
        }
      });
      expect(ttl2json(`<I> <http://example.org/height> -4.2E-9.`)).deep.equal({
        "@id": "I",
        "http://example.org/height": {
          "@value": "-4.2E-9",
          "@type": "http://www.w3.org/2001/XMLSchema#double"
        }
      });
    });

    it('boolean', () => {
      expect(ttl2json(`<I> <http://example.org/alive> true.`)).deep.equal({
        "@id": "I",
        "http://example.org/alive": true
      });
      expect(ttl2json(`<I> <http://example.org/alive> false.`)).deep.equal({
        "@id": "I",
        "http://example.org/alive": false
      });
    });
  });

  describe('predicate', () => {

    it('iri', () => {
      expect(ttl2json(`
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  <I> <http://xmlns.com/foaf/0.1/name> "Bob".
`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@id": "I",
        "http://xmlns.com/foaf/0.1/name": "Bob"
      });
    });

    it('prefixed name', () => {
      expect(ttl2json(`
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  <I> foaf:name "Bob".
`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@id": "I",
        "foaf:name": "Bob"
      });
    });

    it('prefixed name (zero-length)', () => {
      expect(ttl2json(`
        @prefix : <http://xmlns.com/foaf/0.1/> .
  <I> :name "Bob".
`)).deep.equal({
        "@context": {
          "0": "http://xmlns.com/foaf/0.1/"
        },
        "@id": "I",
        "0:name": "Bob"
      });
    });

  });

  describe('blank node', () => {

    it('subject unlabeled', () => {
      expect(ttl2json(`
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  [] foaf:name "Bob".
`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "foaf:name": "Bob"
      });
    });

    it('subject labeled', () => {
      expect(ttl2json(`
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  _:alice foaf:name "Alice".
`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@id": "_:alice",
        "foaf:name": "Alice"
      });
    });

    it('label with dot', () => {
      expect(ttl2json(`
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  _:my.name.is foaf:name "Alice".
`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@id": "_:my.name.is",
        "foaf:name": "Alice"
      });
    });

    it('label ends with dot', () => {
      expect(() => ttl2json(`
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  _:my.name.is. foaf:name "Alice".
`)).to.throw();
    });

    it('object labeled', () => {
      expect(ttl2json(`
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  <I> foaf:know _:alice .
`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@id": "I",
        "foaf:know": {
          "@id": "_:alice"
        }
      });
    });

    it('object unlabeled', () => {
      expect(ttl2json(`
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  <I> foaf:know [] .
`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@id": "I",
        "foaf:know": {}
      });
    });


  });


  describe('collection', () => {

    it('subject', () => {
      expect(ttl2json(`
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  (<I> <You>) a foaf:Person .
`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#first": {
          "@id": "I",
        },
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": {
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#first": {
            "@id": "You"
          },
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": {
            "@id": "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil"
          }
        },
        "@type": "foaf:Person"
      });
    });

    it('empty subject', () => {
      expect(ttl2json(`
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  () a foaf:Person .
`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@id": "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil",
        "@type": "foaf:Person"
      });
    });

    it('object', () => {
      expect(ttl2json(`
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  <I> foaf:know (<You> <Cat>) .
`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@id": "I",
        "foaf:know": {
          "@list": [{
            "@id": "You",
          }, {
            "@id": "Cat"
          }]
        }
      });
    });

    it('nested object', () => {
      expect(ttl2json(`
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  <I> foaf:know ((<You> <Cat>)) .
`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@id": "I",
        "foaf:know": {
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#first": {
            "http://www.w3.org/1999/02/22-rdf-syntax-ns#first": {
              "@id": "You"
            },
            "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": {
              "http://www.w3.org/1999/02/22-rdf-syntax-ns#first": {
                "@id": "Cat"
              },
              "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": {
                "@id": "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil"
              },
            }
          },
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": {
            "@id": "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil"
          }
        }
      });
    });

  });

  describe('blankNodePropertyList', () => {

    it('object', () => {
      expect(ttl2json(`
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  <I> foaf:know [ foaf:name "Bob"] .
`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@id": "I",
        "foaf:know": {
          "foaf:name": "Bob"
        }
      });
    });

    it('subject', () => {
      expect(ttl2json(`
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  [ foaf:name "Bob" ; a foaf:Person ] .
`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@type": "foaf:Person",
        "foaf:name": "Bob"
      });
    });

    it('subject', () => {
      expect(ttl2json(`
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  [ foaf:name "Bob"] .
`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "foaf:name": "Bob"
      });
    });

  });


  describe('NOTE', () => {
    it('@prefix での namespace prefix が . で終わるのは NG なので例外をスローすること', () => {
      expect(function() {
        ttl2json(`@prefix foaf.: <http://xmlns.com/foaf/0.1/> .`);
      }).to.throw();
    });

    it('prefixed name の直後に triple 終端の . が来る場合はエラーにならないこと', () => {
      expect(function() {
        ttl2json(`
          @prefix foaf: <http://xmlns.com/foaf/0.1/> .
    <I> a foaf:Person.
`);
      }).not.to.throw();
    });

  });

  describe('suites', () => {
    it('IRI_with_four_digit_numeric_escape.ttl', () => {
      expect(ttl2json(`<http://a.example/\u0073> <http://a.example/p> <http://a.example/o> .`)).to.deep.equal({
        "@id": "http://a.example/\u0073",
        "http://a.example/p": {
          "@id": "http://a.example/o"
        }
      });
    });

    it('IRI_with_eight_digit_numeric_escape.ttl', () => {
      expect(ttl2json(`<http://a.example/\U00000073> <http://a.example/p> <http://a.example/o> .`)).to.deep.equal({
        "@id": "http://a.example/\U00000073",
        "http://a.example/p": {
          "@id": "http://a.example/o"
        }
      });
    });

    it('comment', () => {
      expect(function() {
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
`)
      }).not.to.throw();
    });
    it('blank collection', () => {
      expect(ttl2json(`@prefix : <http://example.org/stuff/1.0/> .
:a :b ( ) .
`)).deep.equal({
        "@context": {
          "0": "http://example.org/stuff/1.0/"
        },
        "@id": "0:a",
        "0:b": {
          "@list": []
        }
      });
    });

    it('blank predicate/object', () => {
      expect(ttl2json(`@prefix : <http://www.w3.org/2013/TurtleTests/> .
:s :p1 :o1 ;
   :p2 :o2 ;;
   .
`)).deep.equal({
        "@context": {
          "0": "http://www.w3.org/2013/TurtleTests/"
        },
        "@id": "0:s",
        "0:p1": {
          "@id": "0:o1"
        },
        "0:p2": {
          "@id": "0:o2"
        }
      });
    });

    it('odd', () => {
      expect(ttl2json(
        `@prefix : <http://www.w3.org/2013/TurtleTests/> .
: : : .
`
      )).deep.equal({
        "@context": {
          "0": "http://www.w3.org/2013/TurtleTests/"
        },
        "@id": "0:",
        "0:": {
          "@id": "0:"
        }
      });
    });

    it('odd', () => {
      expect(ttl2json(
        `@prefix p: <http://a.example/> .
<http://a.example/s> <http://a.example/p> p:#comment
.
`
      )).deep.equal({
        "@context": {
          "p": "http://a.example/"
        },
        "@id": "http://a.example/s",
        "http://a.example/p": {
          "@id": "p:"
        }
      });
    });


  });

  describe('https://www.w3.org/TR/json-ld/#turtle', () => {

    it('Prefix definitions', () => {
      expect(ttl2json(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .

<http://manu.sporny.org/about#manu> a foaf:Person;
  foaf:name "Manu Sporny";
  foaf:homepage <http://manu.sporny.org/> .`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@id": "http://manu.sporny.org/about#manu",
        "@type": "foaf:Person",
        "foaf:name": "Manu Sporny",
        "foaf:homepage": {
          "@id": "http://manu.sporny.org/"
        }
      });
    });

    it('Embedding', () => {
      expect(ttl2json(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .

    <http://manu.sporny.org/about#manu>
      a foaf:Person;
      foaf:name "Manu Sporny";
      foaf:knows [ a foaf:Person; foaf:name "Gregg Kellogg" ] .`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@id": "http://manu.sporny.org/about#manu",
        "@type": "foaf:Person",
        "foaf:name": "Manu Sporny",
        "foaf:knows": {
          "@type": "foaf:Person",
          "foaf:name": "Gregg Kellogg"
        }
      });
    });

    it('Conversion of native data types', () => {
      expect(ttl2json(`@prefix ex: <http://example.com/vocab#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<http://example.com/>
  ex:numbers "14"^^xsd:integer, "2.78E0"^^xsd:double ;
  ex:booleans "true"^^xsd:boolean, "false"^^xsd:boolean .
`)).deep.equal({
        "@context": {
          "ex": "http://example.com/vocab#"
        },
        "@id": "http://example.com/",
        "ex:numbers": [14, 2.78],
        "ex:booleans": [true, false]
      });
    });

    it('Lists', () => {
      expect(ttl2json(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .

<http://example.org/people#joebob> a foaf:Person;
  foaf:name "Joe Bob";
  foaf:nick ( "joe" "bob" "jaybee" ) .`)).deep.equal({
        "@context": {
          "foaf": "http://xmlns.com/foaf/0.1/"
        },
        "@id": "http://example.org/people#joebob",
        "@type": "foaf:Person",
        "foaf:name": "Joe Bob",
        "foaf:nick": {
          "@list": ["joe", "bob", "jaybee"]
        }
      });
    });

  });
});

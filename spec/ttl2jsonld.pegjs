{
  var isBrowser=new Function("try {return this===window;}catch(e){ return false;}");
  var URL = isBrowser() ? window.URL : require("url").URL;
  var isIRI = function(a){return a.match(/^[a-z](.*?):(.+?)/g);};
  function createObject(property,value){var a={};a[property]=value;return a;}
  var context = {
    base : [],
    data : {},
    addBase : function(uri){
      if(context.base.length===0){
        context.base.push(uri);
        return;
      }
      const last = context.base[context.base.length-1];
      if(last!==uri) context.base.push(new URL(uri,last).toString());
    },
    addPrefix : function(prefix,uri){
      const list = context.data[prefix];
      if(list===undefined){
        context.data[prefix] = [{uri:uri,count:0}];
      }else if(list[list.length-1].uri!==uri){
        list.push({uri:uri,count:0});
      }
    },
    hasPrefix : function(prefix){
      return this.data[prefix]!==undefined;
    },
    resolve : function(pname,force){
      const prefix = Object.keys(context.data).find(key=>pname.indexOf(key+":")===0);
      if(prefix!==undefined) {
        const list = context.data[prefix];
        if(list.length===1 && force!==true && isIRI(list[0].uri)) return pname;
        const uri = list[list.length-1].uri;
        return pname.replace(prefix+":",uri);
      }else{
        var base = context.base.length === 0 ? options.baseIRI : context.base[context.base.length-1];
        if(!base || pname.match(/^(http:|https:|urn:|file:)/)) return pname;
        if(pname.indexOf("//")===0 && base) return base.split("//")[0]+pname;
        return new URL(pname,base).toString();
      }
    },
    increment : function(prefix){
      const list = context.data[prefix];
      if(list!==undefined)list[list.length-1].count++;
    },
    decrement : function(prefix){
      const list = context.data[prefix];
      if(list!==undefined)list[list.length-1].count--;
    },
    toJSON : function(){
      const root = {};
      if(context.base.length>0){
        if(root["@context"]===undefined)root["@context"] = {};
        root["@context"]["@base"] = context.base[0];
      }
      Object.keys(context.data).forEach(key=>{
        const head = context.data[key][0];
        if(head.uri==="http://www.w3.org/2001/XMLSchema#" && head.count < 1) return;
        if(!isIRI(head.uri)) return;
        if(root["@context"]===undefined) root["@context"] = {};
        root["@context"][key] = head.uri;
      });
      return root;
    }
  };

  function expandList(container,force){
    if(container["@list"]===undefined) return container;
    if(!force && !container["@list"].find(x=>x["@list"]!==undefined)) return container;

    if(container["@list"].length===0)
      return {"@id" : "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil"};

    var root = {};
    var focus = null;
    container["@list"].forEach(b=>{
      if(focus===null) focus = root;
      else {
        focus["http://www.w3.org/1999/02/22-rdf-syntax-ns#rest"] = {};
        focus = focus["http://www.w3.org/1999/02/22-rdf-syntax-ns#rest"];
      }
      focus["http://www.w3.org/1999/02/22-rdf-syntax-ns#first"] = expandList(b,true);
      focus["http://www.w3.org/1999/02/22-rdf-syntax-ns#rest"] = {
        "@id" : "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil"
      };
    });
    return root;
  }
}

// [1] turtleDoc	::=	statement*
turtleDoc = statements:statement* IGNORE* {
  var jsonld = context.toJSON();
  jsonld["@graph"] = [];
  statements.filter(a=>Array.isArray(a)).forEach(a=>{
    a.forEach(b=>{
      jsonld["@graph"].push(b);
    });
  });

  if(jsonld["@graph"].length===1){
    Object.assign(jsonld,jsonld["@graph"][0]);
    delete jsonld["@graph"];
  }

  return jsonld;
}

// [2] statement	::=	directive | triples '.'
statement = directive / a:triples IGNORE* '.' {return a;}

COMMENT = '#' a:[^\n]* '\n' {return a.join("");}
IGNORE = WS / COMMENT

// [3]	directive	::=	prefixID | base | sparqlPrefix | sparqlBase
directive = prefixID/base/sparqlPrefix/sparqlBase

// [4]	prefixID	::=	'@prefix' PNAME_NS IRIREF '.'
prefixID = IGNORE* '@prefix' IGNORE* a:PNAME_NS_NO_CHECK IGNORE* b:IRIREF IGNORE* '.' {
  context.addPrefix(a==="" ? "0" : a,b);
  return {};
}

// [5]	base		::=	'@base' IRIREF '.'
base = IGNORE* '@base' IGNORE* a:IRIREF IGNORE* '.' {
  context.addBase(a);
  return {};
}

// [5s]	sparqlBase	::=	"BASE" IRIREF
sparqlBase = IGNORE* [Bb][Aa][Ss][Ee] IGNORE* a:IRIREF {
  context.addBase(a);
  return {};
}

// [6s]	sparqlPrefix	::=	"PREFIX" PNAME_NS IRIREF
sparqlPrefix = IGNORE* [Pp][Rr][Ee][Ff][Ii][Xx] IGNORE* a:PNAME_NS_NO_CHECK IGNORE* b:IRIREF {
  context.addPrefix(a==="" ? "0" : a,b);
  return {};
}

// [6]	triples		::=	subject predicateObjectList | blankNodePropertyList predicateObjectList?
triples	=	s:subject p:predicateObjectList {
  var x = {};
  if(typeof s==='string' && s!=='[]') x["@id"] = s;
  else if(typeof s==='object') Object.assign(x,s);
  if(p) Object.assign(x,p);
  return [x];
} /
s:blankNodePropertyList p:predicateObjectList? {
  var x = {};
  if(s) Object.assign(x,s);
  if(p) Object.assign(x,p);
  return [x];
}

// [7]	predicateObjectList	::=	verb objectList (';' (verb objectList)?)*
predicateObjectList = a:verb b:objectList c:(IGNORE* ';' d:(e:verb f:objectList {var x={};x[e]=f;return x;})? {return d;})* {
  var x = {};
  c.unshift(createObject(a,b));
  c.forEach(t=>{
    if(!t) return;
    Object.keys(t).forEach(key=>{
      t[key].forEach(val=>{
        if(key==="@type" && val["@id"]!==undefined) val = val["@id"];
        if(x[key]===undefined) x[key] = val;
        else if(Array.isArray(x[key])) x[key].push(val);
        else x[key] = [x[key],val];
      });
    });
  });
  return x;
}

// [8]	objectList		::=	object (',' object)*
objectList = a:object b:(IGNORE* ',' c:object {return c;})* {
  b.unshift(a);
  return b;
}

// [9]	verb			::=	predicate | 'a'
verb =  a:predicate {return a;} / IGNORE* 'a' {return '@type';}

// [10]	subject			::=	iri | BlankNode | collection
subject = a:collection{return expandList(a,true);} / BlankNode / iri

// [11]	predicate		::=	iri
predicate = IGNORE* a:iri {return a;}

// [12]	object			::=	iri | BlankNode | collection | blankNodePropertyList | literal
object =
  literal /
  a:collection {return expandList(a,false);} /
  a:BlankNode {return a==="[]" ? {} : {"@id":a};} /
  a:blankNodePropertyList {return a;} /
  a:iri {return {"@id":a};}

// [13]	literal			::=	RDFLiteral | NumericLiteral | BooleanLiteral
literal = RDFLiteral / NumericLiteral / BooleanLiteral

// [14]	blankNodePropertyList	::=	'[' predicateObjectList ']'
blankNodePropertyList = IGNORE* '[' a:predicateObjectList IGNORE* ']' {return a;}

// Dobe [15]	collection		::=	'(' object* ')'
collection = IGNORE* '(' a:object* IGNORE* ')' {return {"@list":a};}

// [16]	NumericLiteral		::=	INTEGER | DECIMAL | DOUBLE
NumericLiteral = IGNORE* a:(DOUBLE/DECIMAL/INTEGER) {return a;}

// [128s]	RDFLiteral		::=	String (LANGTAG | '^^' iri)?
RDFLiteral =
  IGNORE* a:String IGNORE* b:LANGTAG {return {"@value":a,"@language":b};} /
  IGNORE* a:String IGNORE* '^^' IGNORE* b:iri {
    if(b==="http://www.w3.org/2001/XMLSchema#boolean" && a==="true") return true;
    if(b==="http://www.w3.org/2001/XMLSchema#boolean" && a==="false") return false;
    if(b==="http://www.w3.org/2001/XMLSchema#integer") return parseInt(a);
    if(b==="http://www.w3.org/2001/XMLSchema#double") return parseFloat(a);

    const uri = context.resolve(b,true);
    if(uri){
      const prefix = b.split(":")[0];
      if(uri==="http://www.w3.org/2001/XMLSchema#boolean" && a==="true"){
        context.decrement(prefix);
        return true;
      }
      if(uri==="http://www.w3.org/2001/XMLSchema#boolean" && a==="false"){
        context.decrement(prefix);
        return false;
      }
      if(uri==="http://www.w3.org/2001/XMLSchema#integer"){
        context.decrement(prefix);
        return parseInt(a);
      }
      if(uri==="http://www.w3.org/2001/XMLSchema#double"){
        context.decrement(prefix);
        return parseFloat(a);
      }
    }
    return {"@value":a,"@type":b};
  } /
  IGNORE* a:String {return a;}

// [133s]	BooleanLiteral		::=	'true' | 'false'
BooleanLiteral = IGNORE* 'true' {return true;} / IGNORE* 'false' {return false;}

// [17]	String			::=	STRING_LITERAL_QUOTE | STRING_LITERAL_SINGLE_QUOTE | STRING_LITERAL_LONG_SINGLE_QUOTE | STRING_LITERAL_LONG_QUOTE
String = IGNORE* a:(STRING_LITERAL_LONG_SINGLE_QUOTE/STRING_LITERAL_LONG_QUOTE/STRING_LITERAL_SINGLE_QUOTE/STRING_LITERAL_QUOTE) {return a;}

// [135s]	iri			::=	IRIREF | PrefixedName
iri = IGNORE* a:IRIREF {return a;} / IGNORE* a:PrefixedName {return a;}

// [136s]	PrefixedName		::=	PNAME_LN | PNAME_NS
PrefixedName = PNAME_LN / a:PNAME_NS {return a+":";}

// [137s]	BlankNode		::=	BLANK_NODE_LABEL | ANON
BlankNode = IGNORE* a:BLANK_NODE_LABEL {return a;} / IGNORE* a:ANON {return a;}

// Productions for terminals

// [18]	IRIREF			::=	'<' ([^#x00-#x20<>"{}|^`\] | UCHAR)* '>' /* #x00=NULL #01-#x1F=control codes #x20=space */
IRIREF = '<' a:([^\u0000-\u0020<>"{}|^`\\]/UCHAR)* '>' {
  const decoded = a.map(s=> {
    if(0x10000 <= s.codePointAt(0) && s.codePointAt(0) <= 0xeffff) return 'a';
    if(s.length===1) return s;
    if(s.length===6) return String.fromCharCode("0x"+s.substring(2));
    if(s.length===10) return String.fromCodePoint("0x"+s.substring(2));
    return s;
  }).join("");
  if(decoded.match(/^[^\u0000-\u0020<>"{}|^`\\]*$/)){
    var join = a.join("");
    try{
      return context.resolve(join);
    }catch(e){
      error("Invalid IRIREF "+join);
    }
  }
  else error("Invalid IRIREF "+a.join("")+" / "+decoded);
}

// [139s]	PNAME_NS		::=	PN_PREFIX? ':'
// 未登録の PREFIX が使用されていたらエラーにする
PNAME_NS = a:PN_PREFIX? ':' {
  a = a || "0";
  if(context.hasPrefix(a)===false)
    error("undefined prefix "+a);
  return a;
}

// PREFIX の検査を行わない
PNAME_NS_NO_CHECK = a:PN_PREFIX? ':' {return (a||"");}

// [140s]	PNAME_LN		::=	PNAME_NS PN_LOCAL
PNAME_LN = a:PNAME_NS b:PN_LOCAL {
  context.increment(a);
  return context.resolve(a+":"+b);
}

// [141s]	BLANK_NODE_LABEL	::=	'_:' (PN_CHARS_U | [0-9]) ((PN_CHARS | '.')* PN_CHARS)?
BLANK_NODE_LABEL = $(
  '_:'
  (PN_CHARS_U/[0-9])
  PN_CHARS*
  ('.'+ PN_CHARS+)*
)

// [144s]	LANGTAG			::=	'@' [a-zA-Z]+ ('-' [a-zA-Z0-9]+)*
LANGTAG = '@' a:[a-zA-Z]+ b:('-' s:[a-zA-Z0-9]+ {return '-'+s.join("");})* {return a.join("")+b.join("");}

// [19]	INTEGER			::=	[+-]? [0-9]+
INTEGER = a:$([+-]? [0-9]+) {
  if(a.match(/^[0+][0-9]+$/))
    return {
      "@value" : a,
      "@type" : "http://www.w3.org/2001/XMLSchema#integer"
    };
  return parseInt(a);
}

// [20]	DECIMAL			::=	[+-]? [0-9]* '.' [0-9]+
DECIMAL = a:$([+-]? [0-9]* '.' [0-9]+) {
  return {
    "@value" : a,
    "@type" : "http://www.w3.org/2001/XMLSchema#decimal"
  }
}

// [21]	DOUBLE			::=	[+-]? ([0-9]+ '.' [0-9]* EXPONENT | '.' [0-9]+ EXPONENT | [0-9]+ EXPONENT)
DOUBLE = a:$([+-]? ([0-9]+'.'[0-9]* EXPONENT / '.'[0-9]+ EXPONENT / [0-9]+ EXPONENT) ) {
  return {
    "@value" : a,
    "@type" : "http://www.w3.org/2001/XMLSchema#double"
  };
}

// [154s]	EXPONENT		::=	[eE] [+-]? [0-9]+
EXPONENT = $([eE] [+-]? [0-9]+)

// [22]	STRING_LITERAL_QUOTE	::=	'"' ([^#x22#x5C#xA#xD] | ECHAR | UCHAR)* '"' /* #x22=" #x5C=\ #xA=new line #xD=carriage return */
STRING_LITERAL_QUOTE	=	'"' a:([^\u0022\u005c\u000a\u000d]/ECHAR/UCHAR)* '"' {return a.join("");}

// [23]	STRING_LITERAL_SINGLE_QUOTE	::= "'" ([^#x27#x5C#xA#xD] | ECHAR | UCHAR)* "'" /* #x27=' #x5C=\ #xA=new line #xD=carriage return */
STRING_LITERAL_SINGLE_QUOTE = "'" a:([^\u0027\u005c\u000a\u000d]/ECHAR/UCHAR)* "'" {return a.join("");}

// [24]	STRING_LITERAL_LONG_SINGLE_QUOTE    ::=	"'''" (("'" | "''")? ([^'\] | ECHAR | UCHAR))* "'''"
STRING_LITERAL_LONG_SINGLE_QUOTE =
  "'''"
  head:([^'\\]/ECHAR/UCHAR)*
  body:(
    ("''" a:([^'\\]/ECHAR/UCHAR)+ {return "''"+a.join("");} ) /
    ("'"  a:([^'\\]/ECHAR/UCHAR)+ {return "'" +a.join("");} )
  )*
  "'''"
  {return head.join("")+body.join("");}

// [25]	STRING_LITERAL_LONG_QUOTE	    ::=	'"""' (('"' | '""')? ([^"\] | ECHAR | UCHAR))* '"""'
STRING_LITERAL_LONG_QUOTE =
  '"""'
  head:([^"\\]/ECHAR/UCHAR)*
  body:(
    ('""' a:([^"\\]/ECHAR/UCHAR)+ {return '""'+a.join("");}) /
    ('"'  a:([^"\\]/ECHAR/UCHAR)+ {return '"' +a.join("");})
  )*
  '"""'
  {return head.join("")+body.join("");}

// [26]	UCHAR				    ::=	'\u' HEX HEX HEX HEX | '\U' HEX HEX HEX HEX HEX HEX HEX HEX
UCHAR =
  '\\U' hex:(HEX HEX HEX HEX HEX HEX HEX HEX) {
    return String.fromCodePoint(parseInt(hex.join(""),16));
  } /
  '\\u' hex:(HEX HEX HEX HEX) {
    return String.fromCharCode(parseInt(hex.join(""),16));
  }


// [159s]	ECHAR				    ::=	'\' [tbnrf"'\]
ECHAR =
  '\\t' {return '\t';} /
  '\\b' {return '\b';} /
  '\\n' {return '\n';} /
  '\\r' {return '\r';} /
  '\\f' {return '\f';} /
  '\\"' {return '"';} /
  "\\'" {return "'";} /
  '\\\\' {return '\\';}

// [161s]	WS				    ::=	#x20 | #x9 | #xD | #xA /* #x20=space #x9=character tabulation #xD=carriage return #xA=new line */
WS = [\u0020\u0009\u000d\u000a]

// [162s]	ANON				    ::=	'[' WS* ']'
ANON = '[' IGNORE* ']' {return "[]";}

// [163s]	PN_CHARS_BASE			    ::=	[A-Z] | [a-z] | [#x00C0-#x00D6] | [#x00D8-#x00F6] | [#x00F8-#x02FF] | [#x0370-#x037D] | [#x037F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
PN_CHARS_BASE	=
  a:[\ud800-\udbff] b:[\udc00-\udfff] {return a+b;} /
  [A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]

// [164s]	PN_CHARS_U			    ::=	PN_CHARS_BASE | '_'
PN_CHARS_U = PN_CHARS_BASE / '_'

// [166s]	PN_CHARS	::=	PN_CHARS_U | '-' | [0-9] | #x00B7 | [#x0300-#x036F] | [#x203F-#x2040]
PN_CHARS = PN_CHARS_U / '-' / [0-9] / '\u00B7' / [\u0300-\u036F] / [\u203F-\u2040]

// [167s]	PN_PREFIX	::=	PN_CHARS_BASE ((PN_CHARS | '.')* PN_CHARS)?
PN_PREFIX = $(
  PN_CHARS_BASE
  PN_CHARS*
  ('.'+ PN_CHARS+)*
)

// [168s]	PN_LOCAL	::=	(PN_CHARS_U | ':' | [0-9] | PLX) ((PN_CHARS | '.' | ':' | PLX)* (PN_CHARS | ':' | PLX))?
PN_LOCAL =
  head:(PN_CHARS_U/':'/[0-9]/PLX)
  body:(PN_CHARS/':'/PLX)*
  tail:(a:'.'+ b:(PN_CHARS/':'/PLX)+ {return a.join("")+b.join("");})*
{return head+body.join("")+tail.join("");}

// [169s]	PLX	::=	PERCENT | PN_LOCAL_ESC
PLX = PERCENT / PN_LOCAL_ESC

// [170s]	PERCENT	::=	'%' HEX HEX
PERCENT = $('%' HEX HEX)

// [171s]	HEX	::=	[0-9] | [A-F] | [a-f]
HEX = [0-9A-Fa-f]

// [172s]	PN_LOCAL_ESC	::=	'\' ('_' | '~' | '.' | '-' | '!' | '$' | '&' | "'" | '(' | ')' | '*' | '+' | ',' | ';' | '=' | '/' | '?' | '#' | '@' | '%')
PN_LOCAL_ESC = '\\' a:[_~.!$&'()*+,;=/?#@%-] {return a;}

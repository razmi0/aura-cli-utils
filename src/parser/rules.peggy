Start
  = _ items:(Item (_ Item)*) _ {
      return [items[0]].concat(items[1].map(i => i[1]));
    }

Item
  = Flag / Param


Flag
  = "--" name:Identifier value:Value? {
      return { type: "flag", name, value: value ?? null };
    }


Param
  = name:Identifier value:Value? {
      return { type: "param", name, value: value ?? null };
    }

Value
  = ":" part:DynamicPart { return part; }

DynamicPart
  = Array / String / Identifier


Array
  = "[" _ first:ArrayItem rest:( _ "," _ ArrayItem)* _ "]" {
      return [first].concat(rest.map(r => r[3]));
    }

ArrayItem
  = String / Identifier


String
  = '"' chars:[^"]* '"' { return chars.join(""); }

Identifier
  = [a-zA-Z0-9_]+ { return text(); }

_ "whitespace"
  = [ \t\r\n]*

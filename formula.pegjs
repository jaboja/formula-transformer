start
	= sp f:(operacja / formula) sp { return f; }

operacja
	= "#" f:[HSCDP]i sp a:nawias { return { t: 'o', f: f.toUpperCase(), a: a }; }

formula
	= quantifier / binary / nonbinary

quantifier
	= q:quantifierSymbol sp v:(
		v:variable sp '.' { return v; } /
		"(" sp v:variable sp ")" { return v; } /
		"[" sp v:variable sp "]" { return v; }
	) sp a:qnonbinary { return { t: q, f: v.a, a: a }; }

quantifierSymbol
	= [A∀] { return 'A'; }
	/ [E∃] { return 'E'; }

nonbinary
	= functor / nawias / unary / constant / variable

qnonbinary
	= quantifier / nonbinary

nawias
	= "(" sp s:formula sp ")" { return s; }
	/ "{" sp s:formula sp "}" { return s; }

functor
	= name:$label sp "(" sp params:params sp ")" { return { f: name, a: params }; }

params
	= a:formula b:(("," sp f:formula { return f; })*) { return [a].concat(b); }

binary
	= chain:binaryChain {
		var op = chain[0]; chain = chain[1];
		var head = chain[0];
		for(var i=1; i<chain.length; ++i)
			head = { f: op, a: [head, chain[i]] };
		return head;
	}
	/ a:qnonbinary sp operator:operator sp b:qnonbinary { return { f: operator, a: [a,b] }; }

binaryChain
	= a:qnonbinary chain:( sp and sp b:qnonbinary { return b; } )+ { return ['and', [a].concat(chain)]; }
	/ a:qnonbinary chain:( sp or  sp b:qnonbinary { return b; } )+ { return ['or', [a].concat(chain)]; }
	/ a:qnonbinary chain:( sp plus sp b:qnonbinary { return b; } )+ { return ['+', [a].concat(chain)]; }
	/ a:qnonbinary chain:( sp mul sp b:qnonbinary { return b; } )+ { return ['*', [a].concat(chain)]; }

operator
	= impl / gte / lte / eq / neq / eqiv / xor / pow / minus / div / [<>]

impl = ("->" / "=>" / "→") { return '->'; }
eqiv = ("<->" / "<=>" / "≡" / "↔") { return '<->'; }
xor = ("≢" / "⊻" / " xor ") { return 'xor'; }
gte = (">=" / "≥") { return '>='; }
lte = ("<=" / "≤") { return '<='; }
eq = ("==" / "=") { return '='; }
neq = ("!=" / "~=" / "<>" / "≠") { return '!='; }
and = ("&&" / "&" / "and " / "∧") { return 'and'; }
or = ("||" / "|" / "or " / "∨") { return 'or'; }
plus = [+﹢＋] { return '+'; }
minus = [-˗−－‐‒–—―➖] { return '-'; }
mul = [×*∙·⋅] { return '*'; }
div = [÷/:∕⁄➗] { return '/'; }
pow = ("^" / "**") { return 'pow'; }

unary
	= operator:unaryoperator sp a:qnonbinary { return { f: operator, a: [a] }; }

unaryoperator
	= ([!¬~] / ('not' &[ ({])) { return '~'; } / [+-]

variable
	= variable:$("#"? label) { return { t: 'v', a: variable }; }

constant
	= constant:(num / str) { return { t: 'c', a: constant }; }

label
	= $([a-z]i [a-z0-9_]*)

num
	= digits:[0-9]+ { return parseInt(digits.join(""), 10); }

str
	= s:('"' $[^"]* '"' / "'" $[^']* "'") { return s[1]; }

sp
	= " "*

start
	= sp f:formula sp { return f; }

operacja
	= "#" f:[HSCDPRJ]i sp a:nawias { return ['#', f.toUpperCase(), a]; }

formula
	= operacja / quantifier / binary / nonbinary

quantifier
	= simpleQuantifier / cmpQuantifier

simpleQuantifier
	= q:quantifierSymbol sp v:(
		v:variable sp '.' { return v; } /
		"(" sp v:variable sp ")" { return v; } /
		"[" sp v:variable sp "]" { return v; }
	) sp a:qnonbinary { return ['q', q, v[1], a]; }

cmpQuantifier
	= q:quantifierSymbol sp v:(
		v:cmpVariable sp '.' { return v; } /
		"(" sp v:cmpVariable sp ")" { return v; } /
		"[" sp v:cmpVariable sp "]" { return v; }
	) sp a:qnonbinary { return ['q', q, v[2][0][1], ['f', (q=='A') ? '->' : 'and', [v, a]]]; }

cmpVariable
	= a:variable sp operator:cmpOperator sp b:nonbinary { return ['f', operator, [a,b]]; }

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
	= name:label sp "(" sp params:params sp ")" { return ['f', name, params]; }

params
	= a:formula b:(("," sp f:formula { return f; })*) { return [a].concat(b); }

binary
	= chain:binaryChain {
		var op = chain[0]; chain = chain[1];
		var head = chain[0];
		for(var i=1; i<chain.length; ++i)
			head = ['f', op, [head, chain[i]]];
		return head;
	}
	/ a:qnonbinary sp operator:operator sp b:qnonbinary { return ['f', operator, [a,b]]; }

binaryChain
	= a:qnonbinary chain:( sp and sp b:qnonbinary { return b; } )+ { return ['and', [a].concat(chain)]; }
	/ a:qnonbinary chain:( sp or  sp b:qnonbinary { return b; } )+ { return ['or', [a].concat(chain)]; }
	/ a:qnonbinary chain:( sp plus sp b:qnonbinary { return b; } )+ { return ['+', [a].concat(chain)]; }
	/ a:qnonbinary chain:( sp mul sp b:qnonbinary { return b; } )+ { return ['*', [a].concat(chain)]; }

operator
	= eqiv / impl / gte / lte / eq / neq / xor / pow / minus / div / [<>]

cmpOperator
	= eq / neq / gte / lte / [<>]

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
	= operator:unaryoperator sp a:qnonbinary { return ['f', operator, [a]]; }

unaryoperator
	= ([!¬~] / ('not' &[ ({])) { return '~'; } / [+-]

variable
	= variable:($"#"? label) { return ['v', variable.join('')]; }

constant
	= constant:(num / str) { return ['f', constant, []]; }

label
	= a:$([a-z]i+ ("_" [a-z]i+)?) b:label_index? { return (b != undefined) ? a+'_'+b : a; }

label_index
	= [_,]? n:(
		"{" sp n:num sp "}" { return n; } /
		"[" sp n:num sp "]" { return n; } /
		n:num { return n; }
	) { return n; }

num
	= digits:[0-9]+ { return parseInt(digits.join(""), 10); }

str
	= s:('"' $[^"]* '"' / "'" $[^']* "'") { return s[1]; }

sp
	= " "*

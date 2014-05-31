function InvalidFormulaException(msg) {
	this.message = "Invalid formula: " + msg;
}

// stała,predykat,funktor,operator	('f', f, [...])
// metaoperator		('#', f, expr)
// zmienna			('v', v)
// kwantyfikator	('q', AE, v, expr)
var Transformations = (function(){

/* function SzudzikPair(x, y) {
    return a >= b ? a * a + a + b : a + b * b;
} */

var hashed_formulas = [];
function Hash(f){
	var f = infix(f);
	var i = hashed_formulas.indexOf(f);
	if(i >= 0) return i;
	return hashed_formulas.push(f) - 1;
}

var Variables = [];
function RenameVariables(f){
	var i;
	console.log('RenameVariables(',f,')');
	switch(f[0]) {
		case 'f':
			for(i=0; i<f[2].length; ++i)
				f[2][i] = RenameVariables(f[2][i]);
			break;
		case 'v':
			i = Variables.indexOf(f[1]);
			if(i < 0)
				i = Variables.push(f[1]) - 1;
			f[1] = 'x_' + i;
			break;
		case 'q':
			var hiddenVariable;
			i = Variables.indexOf(f[2]);
			if(i >= 0) {
				hiddenVariable = Variables[i];
				Variables[i] = undefined;
			}
			var j = Variables.push(f[2]) - 1;
			f[2] = 'x_' + j;
			f[3] = RenameVariables(f[3]);
			if(i >= 0)
				Variables[i] = hiddenVariable;
			Variables[j] = undefined;
			break;
		default:
			break;
	}
	console.log('Renamed:', f);
	return f;
}

function PrenexIter(g, inv){
	if(inv)
		g[1] = (g[1] == 'A') ? 'E' : 'A';
	if(g[3][0] != 'q') return g;
	return PrenexIter(g[3], inv);
}
function PrenexBubble(f, n, inv){
    var h = f[2][n];
	if(h[0] != 'q') return f;
	var g = PrenexIter(h, inv);
	f[2][n] = g[3];
	g[3] = f;
	return h;
}

// stała,predykat,funktor,operator	('f', f, [...])
// metaoperator		('#', f, expr)
// zmienna			('v', v)
// kwantyfikator	('q', AE, v, expr)
function Prenex(f){
    console.log("Prenex(",f,")");
    if(f.length < 2)
        throw new InvalidFormulaException("Node missing arguments.");
    switch(f[0]){
        case '#':
            return f;
        case 'v':
            if(f.length != 2) throw new InvalidFormulaException("Malformed formula tree variable node.");
            return ['v', f[1]];
        case 'q':
            if(f.length != 4) throw new InvalidFormulaException("Malformed formula tree quantifier node.");
            return ['q', f[1], f[2], Prenex(f[3])];
        case 'f':
            if(f.length != 3) throw new InvalidFormulaException("Malformed formula tree functor node.");
	        switch(f[1]) {
		        case '~':
			        if(f[2].length != 1) throw new InvalidFormulaException('Non-unary negtion!');
			        return PrenexBubble(f, 0, true);
		        case '->':
			        if(f[2].length != 2) throw new InvalidFormulaException('Non-binary implication!');
			        f = PrenexBubble(f, 0, true);
			        f = PrenexBubble(f, 1, false);
			        return f;
		        case 'and':
		        case 'or':
			        for(var i=0; i<f[2].length; ++i)
				        f = PrenexBubble(f, i, false);
			        return f;
		        case '<->':
			        return Prenex(['f', 'or', [
				        ['f', 'and', Clone(f[2])],
				        ['f', '~', [
					        ['f', 'or', Clone(f[2])]
				        ]]
			        ]]);
		        case 'xor':
			        return Prenex(['f', '~', [
				        ['f', 'or', [
					        ['f', 'and', Clone(f[2])],
					        ['f', '~', [
						        ['f', 'or', Clone(f[2])]
					        ]]
				        ]]
			        ]]);
			    default:
    			    return f;
	        }
    }
    throw new InvalidFormulaException("Invalid node type \"" + f[0] + "\".");
}

function Clone(obj){
	return JSON.parse(JSON.stringify(obj));
}

function Substitution(f, v, g){
	switch(f[0]){
		case 'f':
			for(var i=0; i<f[2].length; ++i)
				f[2][i] = Substitution(f[2][i], v, g);
			break;
		case 'v':
			if(f[1] == v)
				return Clone(g);
			break;
		case 'q':
			if(f[2] != v)
				f[3] = Substitution(f[3], v, g);
			break;
	}
	return f;
}

function FreeVariables(f) {
	var variables = [];
	console.log(f);
	switch(f[0]){
		case 'f':
			for(var i=0; i<f[2].length; ++i) {
				var vars2 = FreeVariables(f[2][i]);
				for(var j=0; j<vars2.length; ++j)
					if(variables.indexOf(vars2[j]) < 0)
						variables.push(vars2[j]);
			}
			break;
		case 'v':
			return [f[1]];
		case 'q':
			var variables = FreeVariables(f[3]);
			var i = variables.indexOf(f[2]);
			if(i >= 0) variables.splice(i, 1);
			break;
	}
	console.log(f, variables);
	return variables;
}

function HerbrandSkolem(f, q, h){
	if(f[0] != 'q') return f;
	if(f[1] == q) {
		f[3] = HerbrandSkolem(f[3], q, h);
		return f;
	}
	var variables = FreeVariables(f).sort();
	for(var i=0; i<variables.length; ++i)
		variables[i] = ['v', variables[i]];
	return HerbrandSkolem(Substitution(f[3], f[2], ['f', h+'_'+Hash(f), variables]), q, h);
}

return {
	RenameVariables: function(f){
		Variables = [];
		return RenameVariables(Clone(f));
	},
	Prenex: function(f){
		return Prenex(Clone(f));
	},
	Herbrand: function(f){
		console.log('Herbrand(',f,')');
		hashed_formulas = [];
		return HerbrandSkolem(Clone(f), 'E', 'Herbrand');
	},
	Skolem: function(f){
		console.log('Skolem(',f,')');
		hashed_formulas = [];
		return HerbrandSkolem(Clone(f), 'A', 'Skolem');
	},
	CNF: function(f){
		console.log('CNF(',f,')');
		return false;
	},
	DNF: function(f){
		console.log('DNF(',f,')');
		return false;
	},
};

})();

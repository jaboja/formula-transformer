function addToSet(set, elem) {
	return (set.indexOf(elem) >= 0) ? set : set.concat([elem]);
}

function setIntersection() {
	var intersection = arguments[0];
	for(var i=1; i<arguments.length; ++i) {
		for(var j=intersection.length-1; j>=0; --j)
			if(arguments[i].indexOf(intersection[j]) < 0)
				intersection.splice(j, 1);
	}
	return intersection;
}

function findVariables(f) {
	f.d = [];
	for(var i=0; i<f.a.length; ++i) {
		f.a[i] = Transformations.Prenex(f.a[i]);
		for(var j=0; j<f.a[i].d.length; ++j)
			f.d = addToSet(f.d, f.a[i].d[j]);
	}
	return f;
}

function renameVariables(f, vars) {
	/*switch(f.t) {
		case 'c':
		case 'v':
			if(vars.indexOf(v.a) >= 0)
				
	}*/
	return f;
}

var Transformations = {
	Prenex: function(f){
		console.log('Prenex(',f,')');
		switch(f.t) {
			case 'o':
				break;
			case 'c':
			case 'v':
				f.d = [f.a];
				return f;
			case 'A':
			case 'E':
				f.a = Transformations.Prenex(f.a);
				f.d = addToSet(f.a.d, f.f);
				return f;
			default:
				switch(f.f) {
					case '~':
						if(f.a.length == 1) {
							var a = Transformations.Prenex(f.a[0]);
							if((a.t == 'A') || (a.t == 'E')) {
								f = {
									t: (a.t == 'A') ? 'E' : 'A',
									f: a.f,
									a: Transformations.Prenex({ f: '~', a: [a.a] }),
									d: a.d
								};
							} else {
								f.a[0] = a;
								f.d = a.d;
							}
							return f;
						}
						break;
					case 'and':
					case 'or':
					case '->':
						if(f.a.length == 2) {
							f.a[0] = Transformations.Prenex(f.a[0]);
							f.a[1] = Transformations.Prenex(f.a[1]);
							var vars = setInersection(f.a[0].d, f.a[1].d);
							//if(vars.length > 0) f.a[1] = renameVariables(f.a[1], vars);
						}
						break;
					case 'xor':
						break;
					case '<->':
						break;
					default:
						return findVariables(f);
				}
				break;
		}
		throw undefined;
	},
	Herbrand: function(f){
		return false;
	},
	Skolem: function(f){
		return false;
	},
	CNF: function(f){
		return false;
	},
	DNF: function(f){
		return false;
	},
};

var consoleDiv, varCount = 0, errors = [], module = {};
var parse = function(s){
	return module.exports.parse(s.replace(/(\s|;)+/g, ' '));
};
var axioms = {};

/*function loadXML(uri, callback) {
	var xhr = (function(){
		try {
			return new XMLHttpRequest();
		} catch(e) {
			try {
				return new ActiveXObject('Msxml2.XMLHTTP');
			} catch(e) {
				try {
					return new ActiveXObject('Microsoft.XMLHTTP');
				} catch(e) {
					return false;
				}
			}
		}
	})();

	xhr.onreadystatechange = function(){
		if(xhr.readyState != 4) return;
		if(xhr.status  == 200)
			callback(xhr.responseXML);
		else
			console.error("Error while fetching XML file '"+uri+"'.");
	};
	xhr.open("GET", uri, true);
	xhr.send();
}*/

function loadAxioms(node) {
	var nodes = node.getElementsByTagName("li");
	axioms = {};
	for(var i=0; i<nodes.length; ++i) {
		var axiom = processNode(nodes[i]).replace(/(\s|;)+/g, ' ').trim();
		axiom = parse(axiom);
		console.log('AXIOM:', infix(axiom));
		axioms[nodes[i].getAttribute('id').toUpperCase()] = axiom;
	}
}

function getDisplayType (element) {
	var cStyle = element.currentStyle || window.getComputedStyle(element, ""); 
	return cStyle.display;
}

function processNode(cmd) {
	var formula = "";
	for(var node=cmd.firstChild; node; node=node.nextSibling) {
		switch(node.nodeType) {
			case node.TEXT_NODE:
			case node.CDATA_SECTION_NODE:
				formula += node.nodeValue;
				break;
			case node.ELEMENT_NODE:
				switch(node.tagName.toLowerCase()) {
					case 'sub':
						var processedNode = processNode(node);
						if(/[a-z]+|[0-9]+/i.test(processedNode))
							formula += "_" + processedNode;
						else
							formula += "_{" + processedNode + "}";
						break;
					case 'sup':
						formula += "^{" + processNode(node) + "}";
						break;
					case 'br':
					case 'hr':
						formula += "\n";
						break;
					case 'q':
						formula += '"' + (node.textContent ? node.textContent : node.innerText) + '"';
						break;
					case 'i':
						{
							var fn = (node.textContent ? node.textContent : node.innerText).trim();
							var rnode = document.getElementsByClassName(fn)[0];
							var tnode = rnode.getElementsByClassName('transformed');
							console.log(fn);
							if(/^F[0-9]+$/i.test(fn)) {
								formula += "(" + processNode(tnode.length ? tnode[0] : rnode) + ")";
								break;
							}
						}
					default:
						if(['block','table','table-row'].indexOf(getDisplayType(node)) >= 0)
							formula += ";" + processNode(node) + ";";
						else
							formula += processNode(node);
						break;
				}
				break;
		}
	}
	return formula;
}

function htmlEntities(str) {
	var tagsToReplace = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;'
	};
    return str.replace(/[&<>]/g, function(tag) {
		return tagsToReplace[tag] || tag;
	});
}

var infix_operators = {
	'+':'+', '-':'−', '*':'×', '/':'÷', '<':'&lt;', '>':'&gt;', '=':'=',
	'!=': "≠",
	'>=': "≥",
	'<=': "≤",
	'->': "→",
	'<->': "↔",
	'and': "∧",
	'or': "∨",
	'xor': "⊻"
};
function _infix(f) {
	switch(f[0]) {
		case 'q':
			return {
				str: ((
					(f[1] == 'A') ? '∀' : '∃'
				) + safe_infix(['v', f[2]]) + '.' + safe_infix(f[3])),
				safe: false
			};
		case 'v':
			var match = /^([a-z]+)_([a-z0-9_]+)$/i.exec(f[1]);
			return { str: ('<em class="var">' + (
				match ? (match[1] + '<sub>' + match[2].replace('_',',') + '</sub>') : f[1]
			) + '</em>'), safe: true };
		case '#':
			return {
				str: ('#' + f[1] + "(" + infix(f[2]) + ")"),
				safe: true
			};
		case 'f':
			if(f[2].length == 0) // stała
				return {
					str: (typeof f[1] == 'object') ? (
							'<tt>' + htmlEntities(JSON.stringify(f[1])) + '</tt>'
						) : (typeof f[1] == 'number') ? (
							'<em class="num">' + f[1] + '</em>'
						) : (
							'<q>' + htmlEntities(f[1]) + '</q>'
						),
					safe: true
				};
			
			switch(f[1]) {
				case '~':
					if(f[2].length==1)
						return { str: ('¬' + safe_infix(f[2][0])), safe: true };
				case 'pow':
					if(f[2].length==2)
						return { str: (safe_infix(f[2][0]) + "<sup>" + infix(f[2][1]) + "</sup>"), safe: false };
				default:
					if((f[2].length==2) && (f[1] in infix_operators))
						return { str: safe_infix(f[2][0]) + "&#8202;" + infix_operators[f[1]] + "&#8202;" + safe_infix(f[2][1]), safe: false };
			}
			
			var p = infix(f[2][0]);
			for(var i=1; i<f[2].length; ++i)
				p += ", " + infix(f[2][i]);
			return {
				str: (f[1] + "(" + p + ")"),
				safe: true
			};
			
		default:
			throw InvalidFormulaException("Invalid formula tree element.");
	}
}
function safe_infix(f) {
	var ifx = _infix(f);
	return ifx.safe ? ifx.str : ("(" + ifx.str + ")");
}
function infix(f) {
	return _infix(f).str;
}

var vars_transformed = false;
function transform_vars(f) {
	switch(f[0]){
		case 'v':
			if(f[1].substr(0,1)=='#') {
				var name = f[1].substr(1).toUpperCase();
				if(name in axioms) {
					vars_transformed = true;
					return axioms[name];
				} else console.log("NOT AN AXIOM:", name);
			}
			break;
		case 'f':
			for(var i=0; i<f[2].length; ++i)
				f[2][i] = transform_vars(f[2][i]);
			break;
		case 'q':
			f[3] = transform_vars(f[3]);
			break;
		case '#':
			f[2] = transform_vars(f[2]);
			break;
	}
	return f;
}

function transform(f) {
	vars_transformed = false;
	f = transform_vars(f);

	try {
    	while(f[0] == '#') {
		    var g = false;
		    switch(f[1]) {
			    case 'R': // Przemianowanie zmiennych
				    g = Transformations.RenameVariables(f[2]);
				    break;
			    case 'P': // Prenex
				    g = Transformations.Prenex(f[2]);
				    break;
			    case 'H': // Herbrandyzacja
				    g = Transformations.Herbrand(f[2]);
				    break;
			    case 'S': // Skolemizacja
				    g = Transformations.Skolem(f[2]);
				    break;
			    case 'C': // Koniunkcyjna postać normalna
				    g = Transformations.CNF(f[2]);
				    break;
			    case 'D': // Dysjunkcyjna postać normalna
				    g = Transformations.DNF(f[2]);
				    break;
			    case 'J': // JSON
				    g = ['f', f[2], []];
				    break;
		    }
		    if(g == false)
			    return vars_transformed ? f : false;
		    vars_transformed = true;
		    f = g;
		}
	} catch(ex) {
		console.log(ex);
		errors.push(ex.message);
		return false;
	}
	return vars_transformed ? f : false;
}

function processCmd(cmd) {
	var formula = processNode(cmd).replace(/(\s|;)+/g, ' ').trim();
	cmd.innerHTML = "";
	if(formula == "") return;
	
	var parsed = false;
	try {
		console.log('parse:', formula);
		parsed = parse(formula);
		console.log(parsed);
		if(!parsed) cmd.appendChild(document.createTextNode(formula));
	} catch(err) {
		console.error(err);
		
		var msg0 = err.message, msg1 = "";
		var r = /"\\u[0-9a-f]{4}"/gi, last_index = 0;
		while(m = r.exec(msg0)) {
		    var hex = msg0.substr(m.index + 3, 4);
		    msg1 += msg0.substring(last_index, m.index) + '"' +
                 String.fromCharCode(parseInt(hex, 16)) + '" (u' + hex + ')';
		    last_index = m.index + 8;
		}
		msg1 += msg0.substr(last_index);
		
		var m = document.createElement('em');
		m.className = 'error-marker';
		m.appendChild(document.createTextNode(msg1));
		cmd.appendChild(document.createTextNode(formula.substr(0, err.offset)));
        cmd.appendChild(m);
		cmd.appendChild(document.createTextNode(formula.substr(err.offset)));
		
		parsed = false;
	}
	if(parsed) {
		var transformed = transform(parsed);
		cmd.innerHTML = transformed ? (infix(parsed) + " <span class='eq'>=</span> <span class='transformed'>" + infix(transformed) + "</span>") : infix(parsed);
	} else {
		cmd.innerHTML = cmd.innerHTML.replace(/&nbsp;/g, ' ')
						   .replace(/\s*_{\s*([^_{}]+)\s*}/g, "<sub>$1</sub>")
						   .replace(/\s*_([a-z0-9]+)/ig, "<sub>$1</sub>")
						   .replace(/\s*\^{\s*([^\^{}]+)\s*}/g, "<sup>$1</sup>")
						   .replace(/\s*\^([a-z0-9]+)/ig, "<sup>$1</sup>")
						   .replace('-&gt;', '→');
	}
}

function init() {
	var cmd = document.getElementById('cmd');
	consoleDiv = document.getElementById('console');
	cmd.onkeypress = function(event){
		if((event.keyCode != 13) || (event.shiftKey)) return true;
		processCmd(cmd);
		
		var div = document.createElement('div');
		if(cmd.innerHTML == "") {
			div.className = 'p hr';
			div.innerHTML = '— <big>* <big>*</big> *</big> —';
		} else {		
			div.className = 'p cmd';
			
			var btn = document.createElement('button');
			btn.className = 'varName';
			btn.innerHTML = 'F<sub>'+(++varCount)+'</sub>';
			btn.onclick = function(){
				if((cmd.childNodes.length == 1) && (cmd.firstChild.nodeType = cmd.TAG_NODE) && (cmd.firstChild.tagName == 'BR'))
					cmd.removeChild(cmd.firstChild);
				var span = document.createElement('i');
				span.className = 'capsule';
				span.innerHTML = ' ' + this.innerHTML;
				span.contentEditable = false;
				cmd.appendChild(span);
				cmd.appendChild(document.createTextNode(' '));
				cmd.focus();
			};
			div.appendChild(btn);
			div.appendChild(document.createTextNode(' '));
			
			var span = document.createElement('div');
			span.className = 'F' + varCount;
			while(cmd.firstChild)
				span.appendChild(cmd.firstChild);
			div.appendChild(span);
			consoleDiv.appendChild(div);
		}
		consoleDiv.appendChild(div);
		
		while(errors.length > 0) {
			var div = document.createElement('div');
			div.className = 'p error';
			var p = document.createElement('p');
			p.appendChild(document.createTextNode(errors.pop()));
			div.appendChild(p);
			consoleDiv.appendChild(div);
		}
		
		cmd.blur();
		document.body.scrollTop = document.body.scrollHeight;
		cmd.focus();
		return false;
	};
	cmd.focus();
}

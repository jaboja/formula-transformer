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
				console.log("TEXT:", node);
				formula += " " + node.nodeValue + " ";
				break;
			case node.ELEMENT_NODE:
				console.log("TAG:", node);
				switch(node.tagName.toLowerCase()) {
					case 'sub':
						formula += "_{" + processNode(node) + "}";
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
							console.log(fn);
							if(/^F[0-9]+$/i.test(fn)) {
								formula += "(" + processNode(document.getElementsByClassName(fn)[0]) + ")";
								break;
							}
						}
					default:
						if(['block','table','table-row'].indexOf(getDisplayType(node)) >= 0)
							formula += ";" + processNode(node) + ";";
						else
							formula += " " + processNode(node) + " ";
						break;
				}
				break;
		}
	}
	return formula;
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
	switch(f.t) {
		case 'c':
			return {
				str: (typeof f.a == 'number') ? ('<em class="num">' + f.a + '</em>') : ('<q>' + f.a + '</q>'),
				safe: true
			};
		case 'v':
			return { str: ('<em class="var">' + f.a + '</em>'), safe: true };
		case 'A':
			return {
				str: ((
					(f.t=='A') ? '∀' : '∃'
				) + f.f + '.' + safe_infix(f.a)),
				safe: true
			};
		case 'o':
			return {
				str: ('#' + f.f + "(" + infix(f.a) + ")"),
				safe: true
			};
		default:
			switch(f.f) {
				case '~':
					if(f.a.length==1) return { str: ('¬' + safe_infix(f.a[0])), safe: true };
					break;
				case 'pow':
					if(f.a.length==2) return { str: (safe_infix(f.a[0]) + "<sup>" + infix(f.a[1]) + "</sup>"), safe: false };
					break;
				default:
					if((f.a.length==2) && (f.f in infix_operators))
						return { str: safe_infix(f.a[0]) + infix_operators[f.f] + safe_infix(f.a[1]), safe: false };
					break;
			}
			
			var p = infix(f.a[0]);
			for(var i=1; i<f.a.length; ++i)
				p += ", " + infix(f.a[i]);
			return {
				str: (f.f + "(" + p + ")"),
				safe: true
			};
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
	switch(f.t){
		case 'v':
			if(f.a.substr(0,1)=='#') {
				var name = f.a.substr(1).toUpperCase();
				if(name in axioms) {
					vars_transformed = true;
					return axioms[name];
				} else console.log("NOT AN AXIOM:", name);
			}
			break;
		case 'f':
			for(var i=0; i<f.a.length; ++i)
				f.a[i] = transform_vars(f.a[i]);
			break;
		case 'A':
		case 'E':
		case 'o':
			f.a = transform_vars(f.a);
			break;
	}
	return f;
}

function transform(f) {
	vars_transformed = false;
	f = transform_vars(f);

	if(f.t == 'o') try {
		switch(f.f) {
			case 'P': // Prenex
				return Transformations.Prenex(f.a);
			case 'H': // Herbrandyzacja
				return Transformations.Herbrand(f.a);
			case 'S': // Skolemizacja
				return Transformations.Skolem(f.a);
			case 'C': // Koniunkcyjna postać normalna
				return Transformations.CNF(f.a);
			case 'D': // Dysjunkcyjna postać normalna
				return Transformations.DNF(f.a);
		}
	} catch(ex) {}
	return vars_transformed ? f : false;
}

function processCmd(cmd) {
	var formula = processNode(cmd).replace(/(\s|;)+/g, ' ').trim();
	cmd.innerHTML = "";
	if(formula == "") return;
	
	var parsed = false;
	try {
		parsed = parse(formula);
		console.log(parsed);
	} catch(err) {
		console.error(err);
		errors.push(err.message);
	}
	if(parsed) {
		var transformed = transform(parsed);
		cmd.innerHTML = transformed ? (infix(parsed) + " <span class='eq'>=</span> " + infix(transformed)) : infix(parsed);
	} else {
		cmd.appendChild(document.createTextNode(formula));
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
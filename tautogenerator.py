from itertools import product

tauto = lambda f: f(True, True) and f(True, False) and f(False, True) and f(False, False)

op_names = ('or','and','=>','<=','<=>','nor','nand','!=>','<=!','xor')
op = [
	lambda x,y: x or y,
	lambda x,y: x and y,
	lambda x,y: (not x) or y,
	lambda x,y: x or (not y),
	lambda x,y: x == y
]
op += map(lambda f: lambda x,y: not f(x,y), op)

n = range(len(op))
T,F,N = [], [], []
for A, B in product(n, n):
	v = "<tr><td>%s</td><td>%s</td></tr>" % ( op_names[A], op_names[B] )
	if tauto(lambda x,y: not(op[A](x,y)) or op[B](x,y)):
		T.append(v)
	elif tauto(lambda x,y: op[A](x,y) and not(op[B](x,y))):
		F.append(v)
	else:
		N.append(v)

T,F,N = map(lambda X: "<table border=1 cellspacing=0 style='border-collapse:collapse'>%s</table>" % "\n".join(X),
			(T,F,N))
html = "<!doctype html>\n<body style='font-family:monospace'>\n"
html+= "<table border=1 cellspacing=0 style='border-collapse:collapse' cellpadding=8><tr><th>T</th><th>F</th><th>N</th></tr><tr>\n"
html+= "<td valign=top>%s</td>" % T
html+= "<td valign=top>%s</td>" % F
html+= "<td valign=top>%s</td>" % N
html+= "</tr></table>"
open('tautogenerator.html','w').write(html)
#!/usr/bin/env python
from collections import defaultdict
import random
from itertools import product
N = 16

def Op():
	if random.random() < 0.125:
		return ('f', '~', (L(),))
	BiOp = random.choice(('->','and','or','xor','<->','nor','nand'))
	return ('f', BiOp, (L(), L()))

def S():
	global N
	name = chr(random.randint(65, 65+N))
	return ('v', name)

def L():
	if random.random() < 0.5:
		return S()
	return Op()

def EvalForm(f, vars):
	if f[0] == 'v': return vars[ord(f[1])-65]
	if f[0] != 'f': raise BaseException()
	if f[1] == '~': return not EvalForm(f[2][0], vars)
	if f[1] == '->': return (not EvalForm(f[2][0], vars)) or EvalForm(f[2][1], vars)
	if f[1] == 'and': return EvalForm(f[2][0], vars) and EvalForm(f[2][1], vars)
	if f[1] == 'or': return EvalForm(f[2][0], vars) or EvalForm(f[2][1], vars)
	if f[1] == 'xor': return EvalForm(f[2][0], vars) != EvalForm(f[2][1], vars)
	if f[1] == '<->': return EvalForm(f[2][0], vars) == EvalForm(f[2][1], vars)
	if f[1] == 'nor': return not( EvalForm(f[2][0], vars) or EvalForm(f[2][1], vars) )
	if f[1] == 'nand': return not( EvalForm(f[2][0], vars) and EvalForm(f[2][1], vars) )
	raise BaseException(f[1])

def isTautology(f):
	"Tests if an n-argument function `f` is tautology."
	global N
	tauto = True
	kontr = True
	for values in product((True, False), repeat=N):
		if EvalForm(f, values):
			kontr = False
		else:
			tautor = False
		if not ( kontr or tauto ): return None
	return tauto

def formatForm(f):
	if f[0] == 'v': return f[1]
	if f[0] != 'f': raise BaseException()
	if f[1] == '~': return '~' + formatForm(f[2][0])
	return "(%s %s %s)" % (formatForm(f[2][0]), f[1], formatForm(f[2][1]))

v = None
while v == None:
	f = L()
	v = isTautology(f)
if not v:
	f = ('f', '~', f)
print formatForm(f)
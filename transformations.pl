% stała,predykat,funktor,operator	['f', f, [...]]
% metaoperator		['#', f, expr]
% zmienna			['v', v]
% kwantyfikator	['q', AE, v, expr]

ea('A', 'E').
ea('E', 'A').

chainableOperator('and').
chainableOperator('or').

allNorm([norm]) :- !.
allNorm([norm|L]) :- allNorm(L).

operator('~', [inv]).
operator(('->'), [inv, norm]).
operator(O, Chain) :- chainableOperator(O), !, allNorm(Chain).

prenex(
	['f', '~', Expr1],
	['q', EA, VarName, ['f', '~', [Expr]]]
) :- !, Expr1 = [['q', AE, VarName, Expr]], ea(AE, EA).

prenex(
	['f', ('->'), Expr],
	F
) :- !, Expr = [Expr1, Expr2], PrenexInvBubble(Expr, 0, F1), PrenexBubble(F1, 0, F).

% function C(Cn){
	% return (Cn & 1 == 0) ? (Cn >> 1) : (3*Cn+1);
% }

% def c(v):
	% if v[0]==0:
		% return v[1:]
	% w = v

c([0|T], T).
c([1|T], X) :-
	suma([0,1|T], [1|T], N),
	inc(N, X).

inc([1], [0,1]) :- !.
inc([0|T], [1|T]) :- !.
inc([1|T], [0|U]) :- !, inc(T, U).

suma([1], [1], [0,1]) :- !.
suma([0], [1], [1]) :- !.
suma([0|M], [0|N], [0|X]) :- !, suma(M, N, X).
suma([0|M], [1|N], [1|X]) :- !, suma(M, N, X).
suma([1|M], [1|N], [0|X]) :- !, suma(M, N, O), inc(O, X).
suma(A, B, C) :- !, suma(B, A, C).

% Ax.C(x)
ch([1]) :- !.
ch([0|T]) :- !, ch(T).
ch([1|T]) :- !, c([1|T], X), ch(X).

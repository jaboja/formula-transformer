-- stała,predykat,funktor,operator	('f', f, [...])
-- metaoperator		('#', f, expr)
-- zmienna			('v', v)
-- kwantyfikator	('q', AE, v, expr)

-- expr =
--   f str ...
--   # str ...
--   v str
--   q AE str expr
-- ... =
--   [0-9]+ expr expr expr...

parse :: String -> Formula
parse pn = parseWords words pn

parseWords :: [String] -> Formula
parseWords 

( STACK MANIPULATION )

: swap >r >a r> a> ;     ( n1 n0 -- n0 n1 )
: nip >r drop r> ;       ( n1 n0 -- n0 )
: tuck swap over ;       ( n1 n0 -- n0 n1 n0 )
: rot 2>r >a 2r> a> ; ( n2 n1 n0 -- n1 n0 n2 )

: 2drop drop drop ;
: 2dup over over ;
: 2over 2>r 2dup 2>a 2r> 2a> ;
: 2swap 2>r 2>a 2r> 2a> ;
: 2nip 2>r 2drop 2r> ;
: 2tuck 2swap 2over;
: 2rot 2>r 2>r 2>a 2r> 2r> 2a> ;

: 4drop 2drop 2drop ;
: 4dup 2over 2over ;
: 4over 4>r 4dup 4>a 4r> 4a> ;
: 4swap 4>r 4>a 4r> 4a> ;
: 4nip 4>r 4drop 4r> ;
: 4tuck 4swap 4over ;
: 4rot 4>r 4>r 4>a 4r> 4r> 4a> ;

: 8drop 4drop 4drop ;
: 8dup 4over 4over ;
: 8over 8>r 8dup 8>a 8r> 8a> ;
: 8swap 8>r 8>a 8r> 8a> ;
: 8nip 8>r 8drop 8r> ;
: 8tuck 8swap 8over ;
: 8rot 8>r 8>r 8>a 8r> 8r> 8a> ;

: 2>r >r >r ; ( n1 n0 -- )
: 2r> r> r> ; ( -- n1 n0 )
: 2>a >a >a ; ( n1 n0 -- )
: 2a> a> a> ; ( -- n1 n0 )

: 4>r 2>r 2>r ; ( n3-n0 -- )
: 4r> 2r> 2r> ; ( -- n3-n0 )
: 4>a 2>a 2>a ; ( n3-n0 -- )
: 4a> 2a> 2a> ; ( -- n3-n0 )

: 8>r 4>r 4>r ; ( n7-n0 -- )
: 8r> 4r> 4r> ; ( -- n7-n0 )
: 8>a 4>a 4>a ; ( n7-n0 -- )
: 8a> 4a> 4a> ; ( -- n7-n0 )


( UNARY LOGIC )

: not dup nand ; ( a -- ~a )
: and nand not ; ( a b -- a&b )
: or >r not r> not nand ; ( a b -- a|b )
: nor or not ; ( a b -- ~(a|b) )
: xor 2dup nand tuck nand >r nand r> nand ; ( a b -- a^b )
: xnor xor not ;


( BITWISE LOGIC )

: 2not >r not r> not ;
: 4not 2>r 2not 2r> 2not ;
: 8not 4>r 4not 4r> 4not ;

( ARITHMETIC )

: ha 2dup and >r xor r> ; ( a b -- s c )
: fa ha >r ha r> or swap ; ( a b c -- c s )

: 2adc  >r >r  swap  r> r>   fa  >r   fa  r> ; ( a1 a0 b1 b0 c -- c s1 s0 )
: 4adc 2>r >r 2swap 2r> r> 2adc 2>r 2adc 2r> ; ( a3-a0 b3-b0 c -- c s3-s0 )
: 8adc 4>r >r 4swap 4r> r> 4adc 4>r 4adc 4r> ; ( a7-a0 b7-b0 c -- c s7-s0 )

: 8add 0 8adc 8>r drop 8r> ; ( a[8] b[8] -- s[8] )
: 8inc 0x01 8add ; ( a[8] -- a[8]++ )
: 8neg 8not 0x01 8add 8add ; ( a[8] -- -a[8] )
: 8sub 8neg 8add ; ( a[8] b[8] -- d[8] )

( add stack under/overflow measures )

: 0x00 0x 00 ;
: 0x01 0x 01 ;
: 0xff 0x ff ;

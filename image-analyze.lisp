( defconstant IMAGE_PATH ( merge-pathnames "barn.png" ) )

(
	defun get-bytes
	( path )
	(
		with-open-file
		( stream path :element-type 'unsigned-byte )
	    (
			do
			( ( list () ) ( byte ( read-byte stream ) ( read-byte stream nil 'eof ) ) )
	        ( ( eq byte 'eof ) list )
	     	( if ( eq list nil ) ( setq list '( byte ) ) ( push byte ( cdr ( last list ) ) ) )
		)
	)
)

(
	dolist
	( byte ( get-bytes IMAGE_PATH ) )
	( print byte )
)

( exit )

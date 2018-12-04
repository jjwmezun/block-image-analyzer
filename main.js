const BLOCK_SIZE = 16;
const GetPixels = require( 'get-pixels' );
const SavePixels = require( 'save-pixels' );

GetPixels
(
	"barn.png",
	function ( err, pixels )
	{
		if ( err ) { throw err; }
		const [ width, height, channels ] = pixels.shape;
		let data = SimplifyPixels( GetListOfPixels( pixels.data, channels ) );
		data.blocks = GetListOfBlocks( data.pixels, width, height );
		[ data.blocks, data.block_map ] = DeredunduntizeBlocks( data.blocks, width, height );
		pixels2 = PngifyData( data );
		pixels.data = pixels2.data;
		pixels.shape[ 0 ] = pixels2.shape[ 0 ];
		pixels.shape[ 1 ] = pixels2.shape[ 1 ];
		SavePixels( pixels, "png" ).pipe( process.stdout );
	}
);

function GetListOfPixels( data, channels )
{
	let list = [];
	for ( let i = 0; i < data.length; i += channels )
	{
		list.push( data.slice( i, i + channels ) );
	}
	return list;
}

function SimplifyPixels( pixels )
{
	let obj =
	{
		colors: [],
		pixels: []
	};

	obj.colors.push( pixels[ 0 ] );
	obj.pixels.push( 0 );

	for ( let p = 1; p < pixels.length; p++ )
	{
		let = are_equal = true;
		for ( let cp = 0; cp < obj.colors.length; cp++ )
		{
			are_equal = true;
			for ( let i = 0; i < pixels[ p ].length; i++ )
			{
				if ( pixels[ p ][ i ] !== obj.colors[ cp ][ i ] )
				{
					are_equal = false;
					break;
				}
			}

			if ( are_equal )
			{
				obj.pixels.push( cp );
				break;
			}
		}

		if ( !are_equal )
		{
			obj.colors.push( pixels[ p ] );
			obj.pixels.push( obj.colors.length - 1 );
		}
	}
	return obj;
}

function GetListOfBlocks( pixels, width, height )
{
	const NUMBER_OF_BLOCKS_X = width / BLOCK_SIZE;
	const NUMBER_OF_BLOCKS_Y = height / BLOCK_SIZE;
	let blocks = [];
	for ( let y = 0; y < NUMBER_OF_BLOCKS_Y; y++ )
	{
		blocks.push([]);
		for ( let x = 0; x < NUMBER_OF_BLOCKS_X; x++ )
		{
			blocks[ y ].push([]);
		}
	}

	for ( let p = 0; p < pixels.length; p++ )
	{
		let block_x = Math.floor( ( p % width ) / BLOCK_SIZE );
		let block_y = Math.floor( Math.floor( p / width ) / BLOCK_SIZE );
		blocks[ block_y ][ block_x ].push( pixels[ p ] );
	}

	return blocks;
}

function DeredunduntizeBlocks( blocks, width, height )
{
	let new_block_list = [ blocks[ 0 ][ 0 ] ];
	let block_map = [];
	let are_equal = true;
	for ( let y = 0; y < blocks.length; y++ )
	{
		block_map.push([]);
		for ( let x = 0; x < blocks[ y ].length; x++ )
		{
			if ( x === 0 && y === 0 )
			{
				block_map[ y ].push( 0 );
				continue;
			}

			for ( let ni = 0; ni < new_block_list.length; ni++ )
			{
				const nb = new_block_list[ ni ];
				are_equal = true;
				for ( let i = 0; i < nb.length; i++ )
				{
					if ( nb[ i ] !== blocks[ y ][ x ][ i ] )
					{
						are_equal = false;
						break;
					}
				}

				if ( are_equal )
				{
					block_map[ y ].push( ni );
					break;
				}
			}

			if ( !are_equal )
			{
				new_block_list.push( blocks[ y ][ x ] );
				block_map[ y ].push( new_block_list.length - 1 );
			}

		}
	}
	return [ new_block_list, block_map ];
}

function PngifyData( data )
{
	let pixels = [];

	for ( let row = 0; row < Math.ceil( data.blocks.length / 16 ); row++ )
	{
		pixels.push([]);
		for ( let col = 0; col < BLOCK_SIZE; col++ )
		{
			pixels[ row ].push([]);
			for ( let y = 0; y < BLOCK_SIZE; y++ )
			{
				pixels[ row ][ col ].push([]);
				for ( let x = 0; x < BLOCK_SIZE; x++ )
				{
					pixels[ row ][ col ][ y ].push( -1 );
				}
			}
		}
	}

	for ( let bi = 0; bi < data.blocks.length; bi++ )
	{
		for ( let pi = 0; pi < BLOCK_SIZE * BLOCK_SIZE; pi++ )
		{
			const row = Math.floor( bi / 16 );
			const col = bi % 16;
			const y = Math.floor( pi / 16 );
			const x = pi % 16;
			pixels[ row ][ col ][ y ][ x ] = data.blocks[ bi ][ pi ];
		}
	}

	let colored_pixels = [];
	for ( let row = 0; row < Math.ceil( data.blocks.length / 16 ); row++ )
	{
		for ( let y = 0; y < BLOCK_SIZE; y++ )
		{
			for ( let col = 0; col < BLOCK_SIZE; col++ )
			{
				for ( let x = 0; x < BLOCK_SIZE; x++ )
				{
					const cpixel = pixels[ row ][ col ][ y ][ x ];
					const color = ( cpixel > -1 ) ? data.colors[ cpixel ] : [ 0, 0, 0, 0 ];
					for ( const color_element of color )
					{
						colored_pixels.push( color_element );
					}
				}
			}
		}
	}
	return { data: colored_pixels, shape: [ 256, Math.ceil( data.blocks.length / 16 ) * 16, data.colors.length + 1 ] };
}

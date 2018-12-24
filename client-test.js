import LocalImageLoader from './client/local-file-loader';
import Exif from './client/exif';

function dataUriToArrayBuffer( dataURI ) {
	if( typeof dataURI !== 'string' ) throw new Error('Invalid argument: dataURI must be a string');

	var binary = atob( dataURI.split(',')[1] );
	var len = binary.length;
	var buffer = new ArrayBuffer(len);
	var view = new Uint8Array(buffer);

	for( var i = 0; i < len; i++ ){
		view[i] = binary.charCodeAt(i);
	}

	return buffer;
}

export default async function test( file ){
	const image = await new LocalImageLoader( file ).load();
	console.log( "image", image );

	const data = dataUriToArrayBuffer( image.src );
	console.log( "data", data );

	const exif = Exif.read( data, file );
	console.log( "EXIF", exif );
};
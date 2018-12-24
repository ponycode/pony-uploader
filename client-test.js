import LocalImageLoader from './client/LocalImageLoader';
import ImageResize from './client/ImageResize'

export default async function test( file ){
	const image = await new LocalImageLoader( file ).load();
	console.log( "image", image );

	const resizedImage = await ImageResize.resizeLoadedImage( image, { width: 200, height: 200, jpgQuality: 1 } );
	console.log( "resized image", resizedImage );

	return resizedImage;
};
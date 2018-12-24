import LocalImageLoader from './client/LocalImageLoader';


export default async function test( file ){
	const image = await new LocalImageLoader( file ).load();
	console.log( "image", image );
};
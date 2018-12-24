

class LocalImageLoader {

	constructor( file ){
		this.file = file;
		this.reader = null;
		this.image = null;
	}

	async load(){
		const imageData = await this._loadLocalFile( this.file );
		const image = await this._loadImageFromLocalFile( imageData, this.file );
		return image;
	}

	_loadLocalFile( file ){

		if( !file.type.match('image.*') ){
			throw new Error(`The input file is not a supported image: ${file.type}`);
		}

		return new Promise( function( resolve, reject ){
			const reader = new FileReader();
	
			reader.onload = function(){
				resolve( this.result );
			};
	
			reader.onabort = function(){
				reject( new Error(`The file read was aborted: ${file.name}`) );
			};
	
			reader.onerror = function( error ){
				reject( error || new Error(`An error occured while reading the file: ${file.name}`) );
			};
	
			reader.readAsDataURL( file );
		});
	}

	_loadImageFromLocalFile( imageSrc, file ){
		return new Promise( function( resolve, reject ){
			const image = new Image();
	
			image.onload = function(){
				resolve( image );
			};
	
			image.onabort = function(){
				reject( new Error(`Image load was aborted: ${file.name}`) );
			};
	
			image.onerror = function( error ){
				reject( error || new Error(`An error occured while loading image: ${file.name}`) );
			};
	
			image.src = imageSrc;
		});
	}

}

export default LocalImageLoader;

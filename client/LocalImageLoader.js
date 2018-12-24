import ImageExifReader from './ImageExifReader';
import ImageUtils from './ImageUtils';

class LocalImageLoader {

	constructor( file ){
		this.file = file;
		this.reader = null;
		this.image = null;
	}

	async load(){
		const result = {
			name: this.file.name,
			size: this.file.size,
			file: this.file
		};

		if( !ImageUtils.browserCanLoadImages() ) return result;

		const imageData = await this._loadLocalFile( this.file );
		if( !imageData ) return result;

		const image = await this._createImageFromLocalFile( imageData, this.file );
		if( !image ) return result;

		result.image = image;
		result.width = image.width;
		result.height = image.height;

		if( ImageUtils.fileIsJpeg( this.file ) ){
			result.exif = new ImageExifReader( image ).read();
		}

		return result;
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

	_createImageFromLocalFile( imageSrc, file ){
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

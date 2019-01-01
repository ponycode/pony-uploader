import ImageExifReader from './ImageExifReader'
import ImageUtils from './ImageUtils'

class LocalImageLoader {

	constructor( file ){
		this.file = file
		this.reader = null
		this.image = null
		this.exif = null
	}

	async load(){
		const result = {
			name: this.file.name,
			size: this.file.size,
			file: this.file
		}

		if( !ImageUtils.browserCanLoadImages() ) return result

		const imageData = await this._loadLocalFile( this.file )
		if( !imageData ) return result

		this.image = await this._createImageFromLocalFile( imageData, this.file )
		if( !this.image ) return result

		result.image = this.image
		result.width = this.image.width
		result.height = this.image.height

		try{
			result.exif = this.exif = new ImageExifReader( this.image ).read();
		}catch( e ){
			console.error( `Error reading exif: ${e}` )
		}

		result.metadata = this._buildMetadata()
		
		return result
	}

	_buildMetadata( exif ){
		// NOTE: all keys must be lowercase for s3 to work - performed later
		// hyphenated keys work best for consistency
		
		const metadata = {}
		metadata.filename = this.file.name
		metadata.width = this.image.width
		metadata.height = this.image.height

		if( this.exif ){
			metadata['exif-date-taken'] = this.exif.dateTaken
			metadata['exif-camera-make'] = this.exif.cameraMake
			metadata['exif-camera-model'] = this.exif.cameraModel
		}

		return metadata
	}

	_loadLocalFile( file ){
		if( !file.type.match('image.*') ){
			throw new Error(`The input file is not a supported image: ${file.type}`)
		}

		return new Promise( function( resolve, reject ){
			const reader = new FileReader()
	
			reader.onload = function(){
				resolve( this.result )
			}
	
			reader.onabort = function(){
				reject( new Error(`The file read was aborted: ${file.name}`) )
			}
	
			reader.onerror = function( error ){
				reject( error || new Error(`An error occured while reading the file: ${file.name}`) )
			}
	
			reader.readAsDataURL( file )
		})
	}

	_createImageFromLocalFile( imageSrc, file ){
		return new Promise( function( resolve, reject ){
			const image = new Image()
	
			image.onload = function(){
				resolve( image )
			}
	
			image.onabort = function(){
				reject( new Error(`Image load was aborted: ${file.name}`) )
			}
	
			image.onerror = function( error ){
				reject( error || new Error(`An error occured while loading image: ${file.name}`) )
			}
	
			image.src = imageSrc
		})
	}

}

export default LocalImageLoader

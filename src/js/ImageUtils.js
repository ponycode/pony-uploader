/* eslint-disable valid-typeof */
class ImageUtils {
	static browserCanLoadImages(){
		if( typeof atob === undefined || typeof Uint8Array === undefined || typeof Blob === undefined || typeof ArrayBuffer === undefined ){
			return false
		}
		return true
	}

	static fileIsJpeg( file ){
		return file.type === 'image/jpg' || file.type === 'image/jpeg'
	}

	static arrayBufferFromImage( image ){
		return this.dataUriToArrayBuffer( image.src )
	}

	static dataViewFromImage( image ){
		const arrayBuffer = this.dataUriToArrayBuffer( image.src )
		return new DataView( arrayBuffer )
	}

	static dataUriToArrayBuffer( dataURI ){
		if( typeof dataURI !== 'string' ) throw new Error( 'Invalid argument: dataURI must be a string' )

		const binary = atob( dataURI.split( ',' )[1] )
		const len = binary.length
		const buffer = new ArrayBuffer( len )
		const view = new Uint8Array( buffer )

		for( let i = 0; i < len; i++ ){
			view[i] = binary.charCodeAt( i )
		}

		return buffer
	}

	static dataUriToBlob( dataURI, dataType ){
		if( typeof dataURI !== 'string' ) throw new Error( 'Invalid argument: dataURI must be a string' )

		const binary = atob( dataURI.split( ',' )[1] )
		const array = []
		for( let i = 0; i < binary.length; i++ ){
			array.push( binary.charCodeAt( i ) )
		}

		return new Blob( [ new Uint8Array( array ) ], { type: dataType } )
	}

	static dataUrlToImage( dataUrl ){
		const image = new Image()
		image.src = dataUrl
		return image
	}

	static imageToBlob( image, imageType ){
		return this.dataUriToBlob( image.src, imageType )
	}
}

export default ImageUtils
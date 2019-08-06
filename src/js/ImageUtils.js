/* eslint-disable valid-typeof */

import Tiff from 'tiff.js'

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

	static fileIsTiff( file ){
		return file.type === 'image/tiff' || file.type === 'image/tif'
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

	static renameFileToJpeg( filename ) {
		var dotIndex = filename.lastIndexOf( '.' )
		if ( dotIndex > -1 ) {
			return filename.substring( 0, dotIndex ) + '.jpg'
		}
		return filename
	}

	static tiffToJpeg( image, filename ) {
		const _buffer = ImageUtils.dataUriToArrayBuffer( image )
		const tiff = new Tiff( { buffer: _buffer } )

		if ( tiff.width && tiff.height ) {
			const canvas = tiff.toCanvas()
			const jpeg = canvas.toDataURL( 'image/jpeg', 0.8 )
			const renamed = this.renameFileToJpeg( filename )
			return { jpeg: jpeg, filename: renamed }
		}
		return null
	}

	static copyObjectAsMutable( objToClone ) {
		var objCopy = {}

		for ( var propKey in objToClone ) {
			objCopy[propKey] = objToClone[propKey]
		}

		return objCopy
	}
}

export default ImageUtils

import ImageUtils from './ImageUtils'

const tiffTags = {
	0x0112: 'orientation',
	0x0132: 'dateTaken',
	0x010F: 'cameraMake',
	0x0110: 'cameraModel'
}

const JPEG_START_OF_IMAGE_MARKER = 0xFFD8
const EXIF_MARKER = 0xFFE1

class ImageExifReader {
	constructor( image ){
		this.image = image
		this.dataView = ImageUtils.dataViewFromImage( image )
		this.isLittleEndian = true
	}

	isJpeg(){
		return this.dataView.getUint16( 0 ) === JPEG_START_OF_IMAGE_MARKER
	}

	read(){
		if( !this.isJpeg() ) return null

		const startOfExifData = this._findStartOfExifData()
		if( !startOfExifData ) return null
		return this._readEXIFData( startOfExifData )
	}

	_findStartOfExifData(){
		let offset = 2

		while( offset < this.dataView.byteLength ){
			if( this.dataView.getUint16( offset ) !== EXIF_MARKER ){
				// Move to next marker - 2 bytes for marker, unint16 for size of marker data
				offset += 2 + this.dataView.getUint16( offset + 2 )
			}
			return offset + 4
		}

		return null
	}

	// This must be called before doing any reads from the dataView
	_chooseEndianessFromTiffHeader( tiffHeaderOffset ){
		if( this.dataView.getUint16( tiffHeaderOffset ) === 0x4949 ){ // Intel Format
			this.isLittleEndian = true
		}else if( this.dataView.getUint16( tiffHeaderOffset ) === 0x4D4D ){ // Motorola Format
			this.isLittleEndian = false
		}else{
			this.isLittleEndian = void 0 // let browser choose
		}
	}

	_isValidExifStructure( start ){
		if( this._getStringFromBuffer( this.dataView, start, 4 ) !== 'Exif' ) return false
		if( this.dataView.getUint16( start + 8, this.isLittleEndian ) !== 0x002A ) return false // 42 = tiff file marker
		return true
	}

	_readEXIFData( start ){
		const tiffHeaderOffset = start + 6

		this._chooseEndianessFromTiffHeader( tiffHeaderOffset );

		if( !this._isValidExifStructure( start ) ) return null
	
		const firstIFDOffset = this.dataView.getUint32( tiffHeaderOffset + 4, this.isLittleEndian )
		if( firstIFDOffset < 0x00000008 ) return null

		return this._readTags( tiffHeaderOffset, tiffHeaderOffset + firstIFDOffset )
	}

	_readTags( tiffStart, dirStart ){
		const entries = this.dataView.getUint16( dirStart, this.isLittleEndian )
		const tags = {}
		let entryOffset = 0
		let tag = null

		for( var i = 0; i < entries; i++ ){
			entryOffset = dirStart + i * 12 + 2
			tag = tiffTags[ this.dataView.getUint16( entryOffset, this.isLittleEndian ) ]
			if( !tag ) continue
			tags[tag] = this._readTagValue( entryOffset, tiffStart )
		}

		return tags
	}

	_readTagValue( entryOffset, tiffStart ){
		const type = this.dataView.getUint16( entryOffset + 2, this.isLittleEndian )
		const numValues = this.dataView.getUint32( entryOffset + 4, this.isLittleEndian )
		const valueOffset = this.dataView.getUint32( entryOffset + 8, this.isLittleEndian ) + tiffStart
		let offset

		switch( type ){
		case 2: // ascii, 8-bit byte
			offset = numValues > 4 ? valueOffset : ( entryOffset + 8 )
			return this._getStringFromBuffer( this.dataView, offset, numValues - 1 )

		case 3: // short, 16 bit int
			if( numValues === 1 ){
				return this.dataView.getUint16( entryOffset + 8 )
			} else {
				offset = numValues > 2 ? valueOffset : ( entryOffset + 8 )
				var vals = []
				for( var n = 0; n < numValues; n++ ){
					vals[n] = this.dataView.getUint16( offset + 2 * n )
				}
				return vals
			}
		default:
			break
		}
	}

	_getStringFromBuffer( buffer, start, length ){
		let outstr = ''
		for( let n = start; n < start + length; n++ ){
			outstr += String.fromCharCode( buffer.getUint8( n, this.isLittleEndian ) )
		}
		return outstr
	}
}

export default ImageExifReader

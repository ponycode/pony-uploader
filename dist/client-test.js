var test = (function () {
	'use strict';

	class ImageUtils {

		static fileIsJpeg( file ){
			return file.type === 'image/jpg' || file.type === 'image/jpeg';
		}

		static arrayBufferFromImage( image ){
			return this.dataUriToArrayBuffer( image.src );
		}

		static dataViewFromImage( image ){
			const arrayBuffer = this.dataUriToArrayBuffer( image.src );
			return new DataView( arrayBuffer );
		}

		static dataUriToArrayBuffer( dataURI ){
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

		static dataUriToBlob( dataURI, dataType ){
			if( typeof dataURI !== 'string' ) throw new Error('Invalid argument: dataURI must be a string');

			var binary = atob( dataURI.split(',')[1] );
			var array = [];
			for( var i = 0; i < binary.length; i++ ){
				array.push( binary.charCodeAt(i) );
			}

			return new Blob([ new Uint8Array( array ) ], { type: dataType } );
		}

	 }

	const tiffTags = {
		0x0112 : "Orientation",
		0x0132 : "DateTime",
		0x010F : "Make",
		0x0110 : "Model"
	};

	class ImageExifReader {

		constructor( image ){
			this.image = image;
			this.dataView = ImageUtils.dataViewFromImage( image );
		}

		hasExif(){
			// Checks for jpeg image marker
			return this.dataView.getUint8(0) === 0xFF && this.dataView.getUint8(1) === 0xD8;
		}

		read(){
			if( !this.hasExif() ) return null;
			
			let offset = 2;

			while( offset < this.dataView.byteLength ){
				if( this.dataView.getUint8( offset ) !== 0xFF ){
					// not valid jpeg
					return null;
				}

				if( this.dataView.getUint8( offset + 1 ) === 225 ){
					const exif = this._readEXIFData( offset + 4, this.dataView.getUint16( offset + 2 ) - 2 );
					return exif;
				} else {
					offset += 2 + this.dataView.getUint16( offset + 2 );
				}
			}

			return null;
		}

		_readEXIFData( start ){
			if( this._getStringFromBuffer( this.dataView, start, 4) !== 'Exif' ) return null;

			let bigEnd;
			const tiffOffset = start + 6;

			if( this.dataView.getUint16(tiffOffset) == 0x4949 ){
				bigEnd = false;
			}else if( this.dataView.getUint16(tiffOffset) == 0x4D4D ){
				bigEnd = true;
			}else{
				return null;
			}

			if( this.dataView.getUint16( tiffOffset + 2, !bigEnd ) != 0x002A ) return null;

			const firstIFDOffset = this.dataView.getUint32( tiffOffset + 4, !bigEnd );
			if( firstIFDOffset < 0x00000008 ) return null;

			return this._readTags( tiffOffset, tiffOffset + firstIFDOffset, bigEnd );
		}

		_readTags( tiffStart, dirStart, bigEnd ){
			const entries = this.dataView.getUint16(dirStart, !bigEnd);
			const tags = {};
			let entryOffset = 0;
			let tag = null;

			for( var i = 0; i < entries; i++ ){
				entryOffset = dirStart + i * 12 + 2;
				tag = tiffTags[ this.dataView.getUint16( entryOffset, !bigEnd ) ];
				if( !tag ) continue;
				tags[tag] = this._readTagValue( entryOffset, tiffStart, bigEnd );
			}

			return tags;
		}

		_readTagValue( entryOffset, tiffStart, bigEnd ){

			const type = this.dataView.getUint16( entryOffset + 2, !bigEnd );
			const numValues = this.dataView.getUint32( entryOffset + 4, !bigEnd) ;
			const valueOffset = this.dataView.getUint32( entryOffset + 8, !bigEnd ) + tiffStart;
			let offset;

			switch( type ){
				case 2: // ascii, 8-bit byte
					offset = numValues > 4 ? valueOffset : (entryOffset + 8);
					return this._getStringFromBuffer( this.dataView, offset, numValues - 1 );

				case 3: // short, 16 bit int
					if( numValues == 1 ){
						return this.dataView.getUint16(entryOffset + 8, !bigEnd);
					} else {
						offset = numValues > 2 ? valueOffset : (entryOffset + 8);
						var vals = [];
						for( var n = 0; n < numValues; n++ ){
							vals[n] = this.dataView.getUint16( offset + 2 * n, !bigEnd );
						}
						return vals;
					}
				default:
					break;
			}
		}

		_getStringFromBuffer( buffer, start, length ){
			let outstr = '';
			for( let n = start; n < start + length; n++ ){
				outstr += String.fromCharCode( buffer.getUint8( n ) );
			}
			return outstr;
		}
		
	}

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

	async function test( file ){
		const image = await new LocalImageLoader( file ).load();
		console.log( "image", image );
		return image;
	}

	return test;

}());

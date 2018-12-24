var test = (function () {
	'use strict';

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

	const tiffTags = {
		0x0112 : "Orientation",
		0x0132 : "DateTime",
		0x010F : "Make",
		0x0110 : "Model"
	};

	class Exif {


		static read( arrayBuffer, file ){
			const dataView = new DataView( arrayBuffer );

			if( (dataView.getUint8(0) !== 0xFF) || (dataView.getUint8(1) !== 0xD8) ){
				throw new Error(`File is not a JPEG image: ${file.name}`);
			}

			let offset = 2;
			let marker;

			while( offset < arrayBuffer.byteLength ){
				if( dataView.getUint8( offset ) !== 0xFF ){
					throw new Error("Not a valid JPEG");
					return;
				}

				marker = dataView.getUint8( offset + 1 );
				if( marker === 225 ){
					const exif = this._readEXIFData( dataView, offset + 4, dataView.getUint16( offset + 2 ) - 2 );
					return exif;
				} else {
					offset += 2 + dataView.getUint16( offset + 2 );
				}
			}

			throw new Error(`Could not read exif data: ${file.name}`);
		}

		static _readEXIFData( file, start ){
			if( this._getStringFromBuffer( file, start, 4) != 'Exif' ) return null;

			let bigEnd;
			const tiffOffset = start + 6;

			if( file.getUint16(tiffOffset) == 0x4949 ){
				bigEnd = false;
			}else if( file.getUint16(tiffOffset) == 0x4D4D ){
				bigEnd = true;
			}else{
				return null;
			}

			if( file.getUint16( tiffOffset + 2, !bigEnd ) != 0x002A ) return null;

			const firstIFDOffset = file.getUint32( tiffOffset + 4, !bigEnd );
			if( firstIFDOffset < 0x00000008 ) return null;

			return this._readTags( file, tiffOffset, tiffOffset + firstIFDOffset, bigEnd );
		}

		static _readTags( file, tiffStart, dirStart, bigEnd ){
			const entries = file.getUint16(dirStart, !bigEnd);
			const tags = {};
			let entryOffset = 0;
			let tag = null;

			for( var i = 0; i < entries; i++ ){
				entryOffset = dirStart + i * 12 + 2;
				tag = tiffTags[ file.getUint16( entryOffset, !bigEnd ) ];
				if( !tag ) continue;
				tags[tag] = this._readTagValue( file, entryOffset, tiffStart, dirStart, bigEnd );
			}

			return tags;
		}

		static _readTagValue( file, entryOffset, tiffStart, dirStart, bigEnd ){

			const type = file.getUint16( entryOffset + 2, !bigEnd );
			const numValues = file.getUint32( entryOffset + 4, !bigEnd) ;
			const valueOffset = file.getUint32( entryOffset + 8, !bigEnd ) + tiffStart;
			let offset;

			switch( type ){
				case 2: // ascii, 8-bit byte
					offset = numValues > 4 ? valueOffset : (entryOffset + 8);
					return this._getStringFromBuffer( file, offset, numValues - 1 );

				case 3: // short, 16 bit int
					if( numValues == 1 ){
						return file.getUint16(entryOffset + 8, !bigEnd);
					} else {
						offset = numValues > 2 ? valueOffset : (entryOffset + 8);
						var vals = [];
						for( var n = 0; n < numValues; n++ ){
							vals[n] = file.getUint16( offset + 2 * n, !bigEnd );
						}
						return vals;
					}
				default:
					break;
			}
		}

		static _getStringFromBuffer( buffer, start, length ){
			let outstr = '';
			for( var n = start; n < start + length; n++ ){
				outstr += String.fromCharCode( buffer.getUint8( n ) );
			}
			return outstr;
		}
		
	}

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

	async function test( file ){
		const image = await new LocalImageLoader( file ).load();
		console.log( "image", image );

		const data = dataUriToArrayBuffer( image.src );
		console.log( "data", data );

		const exif = Exif.read( data, file );
		console.log( "EXIF", exif );
	}

	return test;

}());

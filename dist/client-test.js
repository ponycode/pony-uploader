var test = (function () {
	'use strict';

	class ImageUtils {

		static browserCanLoadImages(){
			if( typeof atob === undefined || typeof Uint8Array === undefined || typeof Blob === undefined || typeof ArrayBuffer === undefined ){
				return false;
			}
			return true;
		}

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

		static dataUrlToImage( dataUrl ){
			const image = new Image();
			image.src = dataUrl;
			return image;
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

	class ImageResize {

		static async resizeLoadedImage( loadedImage, options ){
			if( !ImageUtils.browserCanLoadImages() ) return null;

			const image = this.scaleAndRotateImage( loadedImage, options );

			return image;
		}

		static scaleAndRotateImage( loadedImage, options = {} ){
			const orientation = ( loadedImage.exif ) ? loadedImage.exif.Orientation : 1;
			const scaledDimensions = this.determineScaledDimensions( loadedImage, options );

			const canvas = this.buildOrientedCanvas( scaledDimensions.width, scaledDimensions.height, orientation );
			const context = canvas.getContext('2d');
			context.drawImage( loadedImage.image, 0, 0, scaledDimensions.width, scaledDimensions.height );

			const dataUrl = canvas.toDataURL( 'image/jpeg', options.jpgQuality || 0.8 );
			document.body.removeChild( canvas );

			const resizedImage = ImageUtils.dataUrlToImage( dataUrl );

			return {
				image: resizedImage,
				width: resizedImage.width,
				height: resizedImage.height,
				file: loadedImage.file,
				exit: loadedImage.exif
			};
		}

		static determineScaledDimensions( image, options ){
			let newWidth = image.width;
			let newHeight = image.height;

			let maxWidth = newWidth;
			let maxHeight = newHeight;

			if( options ){
				maxWidth = options.width;
				maxHeight = options.height;
			}

			if( image.width > maxWidth || image.height > maxHeight ){
				const widthRatio = image.width / maxWidth;
				const heightRatio = image.height / maxHeight;

				if( widthRatio < heightRatio ){
					newWidth = image.width / heightRatio;
					newHeight = maxHeight;
				}else{
					newWidth = maxWidth;
					newHeight = image.height / widthRatio;
				}
			}

			return {
				width: Math.floor( newWidth ),
				height: Math.floor( newHeight )
			};
		}

		static buildOrientedCanvas( width, height, orientation = 1 ){
			if( orientation > 8 ) orientation = 1;

			const canvas = document.createElement('canvas');
			canvas.id = 'hiddenCanvas';
			canvas.width = width;
			canvas.height = height;
			canvas.style.visibility = 'hidden';

			if( orientation > 4 ){
				canvas.width = height;
				canvas.height = width;
			}

			const context = canvas.getContext('2d');
			switch( orientation ){
				case 2:
					// horizontal flip
					context.translate(width, 0);
					context.scale(-1, 1);
					break;
				case 3:
					// 180° rotate left
					context.translate(width, height);
					context.rotate(Math.PI);
					break;
				case 4:
					// vertical flip
					context.translate(0, height);
					context.scale(1, -1);
					break;
				case 5:
					// vertical flip + 90 rotate right
					context.rotate(0.5 * Math.PI);
					context.scale(1, -1);
					break;
				case 6:
					// 90° rotate right
					context.rotate(0.5 * Math.PI);
					context.translate(0, -height);
					break;
				case 7:
					// horizontal flip + 90 rotate right
					context.rotate(0.5 * Math.PI);
					context.translate(width, -height);
					context.scale(-1, 1);
					break;
				case 8:
					// 90° rotate left
					context.rotate(-0.5 * Math.PI);
					context.translate(-width, 0);
					break;
			}
			document.body.appendChild( canvas );
			return canvas;
		}

	}

	async function test( file ){
		const image = await new LocalImageLoader( file ).load();
		console.log( "image", image );

		const resizedImage = await ImageResize.resizeLoadedImage( image, { width: 200, height: 200, jpgQuality: 1 } );
		console.log( "resized image", resizedImage );

		return resizedImage;
	}

	return test;

}());

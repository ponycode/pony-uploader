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
		
			const binary = atob( dataURI.split(',')[1] );
			const len = binary.length;
			const buffer = new ArrayBuffer(len);
			const view = new Uint8Array(buffer);
		
			for( let i = 0; i < len; i++ ){
				view[i] = binary.charCodeAt(i);
			}
		
			return buffer;
		}

		static dataUriToBlob( dataURI, dataType ){
			if( typeof dataURI !== 'string' ) throw new Error('Invalid argument: dataURI must be a string');

			const binary = atob( dataURI.split(',')[1] );
			const array = [];
			for( let i = 0; i < binary.length; i++ ){
				array.push( binary.charCodeAt(i) );
			}

			return new Blob([ new Uint8Array( array ) ], { type: dataType } );
		}

		static dataUrlToImage( dataUrl ){
			const image = new Image();
			image.src = dataUrl;
			return image;
		}

		static imageToBlob( image, imageType ){
			return this.dataUriToBlob( image.src, imageType )
		}

	 }

	const tiffTags = {
		0x0112: 'orientation',
		0x0132: 'dateTaken',
		0x010F: 'cameraMake',
		0x0110: 'cameraModel'
	};

	const JPEG_START_OF_IMAGE_MARKER = 0xFFD8;
	const EXIF_MARKER = 0xFFE1;

	class ImageExifReader {
		constructor( image ){
			this.image = image;
			this.dataView = ImageUtils.dataViewFromImage( image );
			this.isLittleEndian = true;
		}

		isJpeg(){
			return this.dataView.getUint16( 0 ) === JPEG_START_OF_IMAGE_MARKER
		}

		read(){
			if( !this.isJpeg() ) return null

			const startOfExifData = this._findStartOfExifData();
			if( !startOfExifData ) return null
			return this._readEXIFData( startOfExifData )
		}

		_findStartOfExifData(){
			let offset = 2;

			while( offset < this.dataView.byteLength ){
				if( this.dataView.getUint16( offset ) !== EXIF_MARKER ){
					// Move to next marker - 2 bytes for marker, unint16 for size of marker data
					offset += 2 + this.dataView.getUint16( offset + 2 );
				}
				return offset + 4
			}

			return null
		}

		// This must be called before doing any reads from the dataView
		_chooseEndianessFromTiffHeader( tiffHeaderOffset ){
			if( this.dataView.getUint16( tiffHeaderOffset ) === 0x4949 ){ // Intel Format
				this.isLittleEndian = true;
			}else if( this.dataView.getUint16( tiffHeaderOffset ) === 0x4D4D ){ // Motorola Format
				this.isLittleEndian = false;
			}else{
				this.isLittleEndian = void 0; // let browser choose
			}
		}

		_isValidExifStructure( start ){
			if( this._getStringFromBuffer( this.dataView, start, 4 ) !== 'Exif' ) return false
			if( this.dataView.getUint16( start + 8, this.isLittleEndian ) !== 0x002A ) return false // 42 = tiff file marker
			return true
		}

		_readEXIFData( start ){
			const tiffHeaderOffset = start + 6;

			this._chooseEndianessFromTiffHeader( tiffHeaderOffset );

			if( !this._isValidExifStructure( start ) ) return null

			const firstIFDOffset = this.dataView.getUint32( tiffHeaderOffset + 4, this.isLittleEndian );
			if( firstIFDOffset < 0x00000008 ) return null

			return this._readTags( tiffHeaderOffset, tiffHeaderOffset + firstIFDOffset )
		}

		_readTags( tiffStart, dirStart ){
			const numberOfEntries = this.dataView.getUint16( dirStart, this.isLittleEndian );
			const tags = {};

			for( let i = 0; i < numberOfEntries; i++ ){
				const entryOffset = dirStart + i * 12 + 2; // each entry is 12 bytes
				const tag = tiffTags[ this.dataView.getUint16( entryOffset, this.isLittleEndian ) ];
				if( !tag ) continue
				tags[tag] = this._readTagValue( entryOffset, tiffStart );
			}

			return tags
		}

		_readTagValue( entryOffset, tiffStart ){
			const type = this.dataView.getUint16( entryOffset + 2, this.isLittleEndian );
			const numValues = this.dataView.getUint32( entryOffset + 4, this.isLittleEndian );
			const inlineValueOffset = entryOffset + 8;
			const externalValueOffset = tiffStart + this.dataView.getUint32( inlineValueOffset, this.isLittleEndian );

			switch( type ){
			case 2: // ascii, 8-bit byte
				const valueOffset = numValues > 4 ? externalValueOffset : inlineValueOffset;
				return this._getStringFromBuffer( this.dataView, valueOffset, numValues - 1 )

			case 3: // short, 16 bit int
				if( numValues === 1 ){
					return this.dataView.getUint16( inlineValueOffset )
				} else {
					const valuesOffset = numValues > 2 ? externalValueOffset : inlineValueOffset;
					const vals = [];
					for( let n = 0; n < numValues; n++ ){
						const valuesItemOffset = n * 2;
						vals[n] = this.dataView.getUint16( valuesOffset + valuesItemOffset );
					}
					return vals
				}
			default:
				break
			}
		}

		_getStringFromBuffer( buffer, start, length ){
			let outstr = '';
			for( let n = start; n < start + length; n++ ){
				outstr += String.fromCharCode( buffer.getUint8( n, this.isLittleEndian ) );
			}
			return outstr
		}
	}

	class LocalImageLoader {
		constructor( file ){
			this.file = file;
			this.reader = null;
			this.image = null;
			this.exif = null;
		}

		async load(){
			const result = {
				name: this.file.name,
				size: this.file.size,
				file: this.file
			};

			if( !ImageUtils.browserCanLoadImages() ) return result

			const imageData = await this._loadLocalFile( this.file );
			if( !imageData ) return result

			this.image = await this._createImageFromLocalFile( imageData, this.file );
			if( !this.image ) return result

			result.image = this.image;
			result.width = this.image.width;
			result.height = this.image.height;

			try{
				result.exif = this.exif = new ImageExifReader( this.image ).read();
			}catch( e ){
				console.error( `Error reading exif: ${e}` );
			}

			result.metadata = this._buildMetadata();

			return result
		}

		_buildMetadata( exif ){
			// NOTE: all keys must be lowercase for s3 to work - performed later
			// hyphenated keys work best for consistency

			const metadata = {};
			metadata.filename = this.file.name;
			metadata.width = this.image.width;
			metadata.height = this.image.height;

			if( this.exif ){
				metadata['exif-date-taken'] = this.exif.dateTaken;
				metadata['exif-camera-make'] = this.exif.cameraMake;
				metadata['exif-camera-model'] = this.exif.cameraModel;
			}

			return metadata
		}

		_loadLocalFile( file ){
			if( !file.type.match( 'image.*' ) ){
				throw new Error( `The input file is not a supported image: ${file.type}` )
			}

			return new Promise( function( resolve, reject ){
				const reader = new FileReader();

				reader.onload = function(){
					resolve( this.result );
				};

				reader.onabort = function(){
					reject( new Error( `The file read was aborted: ${file.name}` ) );
				};

				reader.onerror = function( error ){
					reject( error || new Error( `An error occured while reading the file: ${file.name}` ) );
				};

				reader.readAsDataURL( file );
			} )
		}

		_createImageFromLocalFile( imageSrc, file ){
			return new Promise( function( resolve, reject ){
				const image = new Image();

				image.onload = function(){
					resolve( image );
				};

				image.onabort = function(){
					reject( new Error( `Image load was aborted: ${file.name}` ) );
				};

				image.onerror = function( error ){
					reject( error || new Error( `An error occured while loading image: ${file.name}` ) );
				};

				image.src = imageSrc;
			} )
		}
	}

	class ImageResize {
		static async resizeLoadedImage( loadedImage, options ){
			if( !ImageUtils.browserCanLoadImages() ) return null

			const image = this.scaleAndRotateImage( loadedImage, options );

			return image
		}

		static scaleAndRotateImage( loadedImage, options = {} ){
			const orientation = ( loadedImage.exif ) ? loadedImage.exif.Orientation : 1;
			const scaledDimensions = this.determineScaledDimensions( loadedImage, options );

			const canvasWidth = options.width || scaledDimensions.width;
			const canvasHeight = options.height || scaledDimensions.height;
			const canvasBackgroundFillStyle = options.backgroundFillStyle || '#FFF';

			const canvas = this.buildOrientedCanvas( canvasWidth, canvasHeight, orientation );
			const context = canvas.getContext( '2d' );

			const destinationX = Math.floor( ( canvasWidth - scaledDimensions.width ) / 2.0 );
			const destinationY = Math.floor( ( canvasHeight - scaledDimensions.height ) / 2.0 );

			context.fillStyle = canvasBackgroundFillStyle;
			context.fillRect( 0, 0, canvasWidth, canvasHeight );

			context.drawImage( loadedImage.image, 0, 0, loadedImage.image.width, loadedImage.image.height, destinationX, destinationY, scaledDimensions.width, scaledDimensions.height );

			const dataUrl = canvas.toDataURL( 'image/jpeg', options.jpgQuality || 0.8 );
			document.body.removeChild( canvas );

			const resizedImage = ImageUtils.dataUrlToImage( dataUrl );

			const metadata = { ...loadedImage.metadata };
			metadata['original-width'] = loadedImage.width;
			metadata['original-height'] = loadedImage.height;
			metadata['width'] = scaledDimensions.width;
			metadata['height'] = scaledDimensions.height;

			return {
				image: resizedImage,
				width: resizedImage.width,
				height: resizedImage.height,
				file: loadedImage.file,
				exif: loadedImage.exif,
				metadata
			}
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
			}
		}

		static buildOrientedCanvas( width, height, orientation = 1 ){
			if( orientation > 8 ) orientation = 1;

			const canvas = document.createElement( 'canvas' );
			canvas.id = 'hiddenCanvas';
			canvas.width = width;
			canvas.height = height;
			canvas.style.visibility = 'hidden';

			if( orientation > 4 ){
				canvas.width = height;
				canvas.height = width;
			}

			const context = canvas.getContext( '2d' );
			switch( orientation ){
			case 2:
				// horizontal flip
				context.translate( width, 0 );
				context.scale( -1, 1 );
				break
			case 3:
				// 180° rotate left
				context.translate( width, height );
				context.rotate( Math.PI );
				break
			case 4:
				// vertical flip
				context.translate( 0, height );
				context.scale( 1, -1 );
				break
			case 5:
				// vertical flip + 90 rotate right
				context.rotate( 0.5 * Math.PI );
				context.scale( 1, -1 );
				break
			case 6:
				// 90° rotate right
				context.rotate( 0.5 * Math.PI );
				context.translate( 0, -height );
				break
			case 7:
				// horizontal flip + 90 rotate right
				context.rotate( 0.5 * Math.PI );
				context.translate( width, -height );
				context.scale( -1, 1 );
				break
			case 8:
				// 90° rotate left
				context.rotate( -0.5 * Math.PI );
				context.translate( -width, 0 );
				break
			default:
				break
			}
			document.body.appendChild( canvas );
			return canvas
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

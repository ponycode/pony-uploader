import LocalImageLoader from './local-file-loader';

class ImageResize {

	static async resizeFile( file, maxWidth, maxHeight, callback ){
		if( typeof atob === undefined || typeof Uint8Array === undefined || typeof Blob === undefined || typeof ArrayBuffer === undefined ){
			callback( new Error('Browser will not support image resizing.'), false );
		}

		const image = await new LocalImageLoader( file ).load();

		if( image.width == 0 || image.height == 0 ){
			throw new Error("The image is empty.");
		}

		this.scaleAndRotateImageToDataBlob( image, file.type, function( error, resizedData ){
			if( error || !resizedData ) return callback( error || "No data url returned", false );

			self.dataUriToBlob( resizedData.dataUrl, "image/jpeg", function( error, blob ){
				if( error ) return callback( error, false );

				callback( false, {
					blob: blob,
					width: resizedData.width,
					height: resizedData.height,
					originalWidth: image.width,
					originalHeight: image.height,
					originalDataType: file.type
				});
			});
		});

	}

	static scaleAndRotateImageToDataBlob( image, fileType, callback ){
		this.getExifData( image, fileType, function( error, exif ){
			var scaledDimensions = self.determineScaledDimensions( image, exif );

			var canvas = self.buildOrientedCanvas( scaledDimensions.width, scaledDimensions.height, exif.Orientation );
			var context = canvas.getContext('2d');
			context.drawImage( imageObj, 0, 0, scaledDimensions.width, scaledDimensions.height );

			var dataUrl = canvas.toDataURL( "image/jpeg", .8 );
			document.body.removeChild( canvas );

			callback( false, {
				dataUrl: dataUrl,
				width: canvas.width,
				height: canvas.height
			});
		});
	}

	static determineScaledDimensions( image, exif ){
		var newWidth = image.width;
		var newHeight = image.height;

		if( image.width > maxWidth || image.height > maxHeight ){
			var widthRatio = image.width / maxWidth;
			var heightRatio = image.height / maxHeight;

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

	static buildOrientedCanvas( width, height, orientation ){
		if( !orientation || orientation > 8 ) orientation = 1;

		var canvas = document.createElement('canvas');
		canvas.id = "hiddenCanvas";
		canvas.width = width;
		canvas.height = height;

		if( orientation > 4 ){
			canvas.width = height;
			canvas.height = width;
		}

		var context = canvas.getContext('2d');
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
		canvas.style.visibility = "hidden";
		document.body.appendChild( canvas );
		return canvas;
	}

	static dataUriToArrayBuffer( dataURI ) {
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

	static dataUriToBlob( dataURI, dataType, callback ){
		if( typeof dataURI !== 'string' ) throw new Error('Invalid argument: dataURI must be a string');

		var binary = atob( dataURI.split(',')[1] );
		var array = [];
		for( var i = 0; i < binary.length; i++ ){
			array.push( binary.charCodeAt(i) );
		}

		callback( false, new Blob([ new Uint8Array( array ) ], { type: dataType } ) );
	}

	static async getExifData( image, dataType, callback ){
		const worstCaseResponse = { Orientation: 1, DateTime: false, Make: false, Model: false };
		if( dataType !== 'image/jpg' && dataType !== 'image/jpeg' ) return worstCaseResponse;

		const buffer = this.dataUriToArrayBuffer( image.src );
		ponyEXIF.getExifFromJPEGArrayBuffer( buffer, function( error, exif ){
			if( !exif ) exif = worstCaseResponse;
			if( error ) console.error( "Error getting exif data: ", error );
			callback( false, exif );
		});
	}

}

export default ImageResize;

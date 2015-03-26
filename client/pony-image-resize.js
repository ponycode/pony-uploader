;var ponyImageResize = ( function( window, document, undefined ){

    function _resizeFile( file, maxWidth, maxHeight, callback ){

        if( typeof atob === undefined || typeof Uint8Array === undefined || typeof Blob === undefined || typeof ArrayBuffer === undefined ){
            callback( new Error('Browser will not support image resizing.'), false );
        }

        var fileLoader = new FileReader();
        var imageObj = new Image();
        var outputDataType = "image/png";

        if( file.type.match('image.*') ){
            fileLoader.readAsDataURL( file );
        } else {
            callback( new Error("The input file is not an image."), false );
        }

        fileLoader.onload = function(){
            imageObj.src = this.result;
        };

        fileLoader.onabort = function(){
            callback( new Error("The file read was aborted."), false );
        };

        fileLoader.onerror = function(){
            callback( new Error("An error occured while reading the file."), false );
        };

        imageObj.onload = function(){
            var image = this;

            if( image.width == 0 || image.height == 0 ){
                callback( new Error("The image is empty."), false );
                return;
            }

            _scaleAndRotateImageToDataBlob( image, file.type, function( error, resizedData ){
                if( error || !resizedData ) return callback( error || "No data url returned", false );

                _dataUriToBlob( resizedData.dataUrl, outputDataType, function( error, blob ){
                    if( error ) return callback( error, false );

                    callback( false, {
                        blob: blob,
                        width: resizedData.width,
                        height: resizedData.height,
                        originalWidth: image.width,
                        originalHeight: image.height,
                        dataType: outputDataType,
                        originalDataType: file.type
                    });
                });
            });
        };

        imageObj.onabort = function() {
            callback( new Error("Image load was aborted."), result );
        };

        imageObj.onerror = function() {
            callback( new Error("An error occured while loading image."), result );
        };

        function _scaleAndRotateImageToDataBlob( image, fileType, callback ){
            _getExifData( image, fileType, function( error, exif ){
                var scaledDimensions = _determineScaledDimensions( image );

                var canvas = _buildOrientedCanvas( scaledDimensions.width, scaledDimensions.height, exif.Orientation );
                var context = canvas.getContext('2d');
                context.drawImage( imageObj, 0, 0, scaledDimensions.width, scaledDimensions.height );

                var dataUrl = canvas.toDataURL( outputDataType );
                document.body.removeChild( canvas );

                callback( false, {
                    dataUrl: dataUrl,
                    width: scaledDimensions.width,
                    height: scaledDimensions.height
                });
            });
        }

        function _determineScaledDimensions( image ){
            var newWidth = image.width;
            var newHeight = image.height;

            if( image.width > maxWidth || image.height > maxHeight ){
                var widthRatio = image.width / maxWidth;
                var heightRatio = image.height / maxHeight;

                if( widthRatio < heightRatio ){
                    newWidth = image.width / heightRatio;
                    newHeight = maxHeight;
                }else{
                    newWidth = maxWidth
                    newHeight = image.height / widthRatio;
                }
            }

            return {
                width: Math.floor( newWidth ),
                height: Math.floor( newHeight )
            };
        }

        function _buildOrientedCanvas( width, height, orientation ){
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

    }

    function _dataUriToArrayBuffer( dataURI ) {
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

    function _dataUriToBlob( dataURI, dataType, callback ){
        if( typeof dataURI !== 'string' ) throw new Error('Invalid argument: dataURI must be a string');

        var binary = atob( dataURI.split(',')[1] );
        var array = [];
        for( var i = 0; i < binary.length; i++ ){
            array.push( binary.charCodeAt(i) );
        }

        callback( false, new Blob([ new Uint8Array( array ) ], { type: dataType } ) );
    }

    function _getExifData( image, dataType, callback ){
        var worstCaseResponse = { Orientation: 1, DateTime: false, Make: false, Model: false };

        if( dataType !== 'image/jpg' && dataType !== 'image/jpeg' ) return callback( false, worstCaseResponse);

        var buffer = _dataUriToArrayBuffer( image.src );
        ponyEXIF.getExifFromJPEGArrayBuffer( buffer, function( error, exif ){
            if( !exif ) exif = worstCaseResponse;
            if( error ) console.error( "Error getting exif data: ", error );
            callback( false, worstCaseResponse );
        });
    }

    return{
        resizeFile: _resizeFile
    };

})( window, document );
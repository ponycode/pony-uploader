;var ponyImageResize = ( function( window, document, undefined ){

    function _resizeFile( file, maxWidth, maxHeight, callback ){
        var fileLoader = new FileReader();
        var canvas = document.createElement('canvas');
        var imageObj = new Image();
        var dataType = "image/png";

        if( file.type.match('image.*') ){
            fileLoader.readAsDataURL( file );
        } else {
            callback( new Error("The input file is not an image."), false );
        }

        fileLoader.onload = function(){
            imageObj.src = this.result; // triggers image load
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
            }else{

                var newWidth = 0;
                var newHeight = 0;

                if( this.width > maxWidth || image.height > maxHeight ){
                    var widthRatio = image.width / maxWidth;
                    var heightRatio = image.height / maxHeight;

                    if( widthRatio < heightRatio ){
                        newWidth = image.width / heightRatio;
                        newHeight = maxHeight;
                    }else{
                        newWidth = maxWidth
                        newHeight = image.height / widthRatio;
                    }
                }else{
                    newWidth = image.width;
                    newHeight = image.height;
                }

                var context = canvas.getContext('2d');
                canvas.id = "hiddenCanvas";
                canvas.width = newWidth;
                canvas.height = newHeight;
                canvas.style.visibility   = "hidden";
                document.body.appendChild( canvas );

                context.clearRect( 0, 0, newWidth, newHeight );
                context.drawImage( imageObj, 0, 0, image.width, image.height, 0, 0, newWidth, newHeight );

                // for debugging
                //var img = document.createElement("img");
                //img.src = canvas.toDataURL();
                //document.body.appendChild( img );

                _dataUriToBlob( canvas.toDataURL( dataType ), dataType, function( error, blob ){

                    document.body.removeChild( canvas );

                    if( error ){
                        callback( error, false );
                        return;
                    }

                    var result = {
                        blob: blob,
                        width: newWidth,
                        height: newHeight,
                        originalWidth: image.width,
                        originalHeight: image.height,
                        dataType: dataType,
                        originalDataType: file.type
                    };

                    callback( false, result );
                });
            }
        };

        imageObj.onabort = function() {
            callback( new Error("Image load was aborted."), result );
        };

        imageObj.onerror = function() {
            callback( new Error("An error occured while loading image."), result );
        };
    }

    function _dataUriToBlob( dataURI, dataType, callback ){
        if( typeof dataURI !== 'string' ){
            throw new Error('Invalid argument: dataURI must be a string');
        }

        if( typeof atob === undefined || typeof Uint8Array === undefined || typeof Blob === undefined ){
            callback( new Error('Browser will not support image resizing.'), false );
        }

        var binary = atob( dataURI.split(',')[1] );
        var array = [];
        for( var i = 0; i < binary.length; i++ ){
            array.push( binary.charCodeAt(i) );
        }

        callback( false, new Blob([ new Uint8Array( array ) ], { type: dataType } ) );
    }

    return{
        resizeFile: _resizeFile
    };

})( window, document );
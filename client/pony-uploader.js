;var ponyUploader = ( function( window, document, undefined ){

    function _completeUpload( completeUrl, callback ){
        var req = {
            url: completeUrl
        };

        _getJSON( req, function( error, jsonResponse ){
            if( error ){
                callback( error, false );
                return;
            }

            callback( false, jsonResponse );
        });
    }

    function _getSignedUpload( signatureUrl, fileData, callback ){
        var req = {
          url: signatureUrl += "?filename=" + fileData.filename + "&filesize=" + fileData.filesize + "&filetype=" + fileData.filetype + "&width=" + fileData.width + "&height=" + fileData.height
        };

        _getJSON( req, function( error, jsonResponse ){
            if( error ){
                callback( error, false );
                return;
            }

            if( jsonResponse && jsonResponse.uploadUrl && jsonResponse.completeUrl ){
                callback( false, jsonResponse );
            }else{
                callback( new Error( "Error signing upload: no data returned" ), false );
            }
        });
    }

    function _uploadToS3( uploadUrl, uploadData, progressCallback, callback ){
        var xhr = _createCORSRequest( 'PUT', uploadUrl );
        if( !xhr ){
            console.error( "CORS is not support." );
            callback( new Error( "File uploads are not supported by this browser." ) );
            return;
        }

        xhr.onload = function(){
            if( xhr.status === 200 ){
                callback( false, true );
            }else{
                callback( new Error( "A file upload error occurred: " + xhr.status ), false );
            }
        };

        xhr.onerror = function(){
            callback( new Error( "A file upload error occurred: " + xhr.status ), false );
        };

        xhr.upload.onprogress = function( e ){
            var percentLoaded = Math.round(( e.loaded / e.total ) * 100 );
            if( progressCallback ) progressCallback( percentLoaded );
        };

        xhr.setRequestHeader( 'Content-Type', uploadData.filetype );
        xhr.setRequestHeader( 'x-amz-acl', 'public-read' );
        return xhr.send( uploadData.blob );
    }

    function _getJSON( request, callback ){
        var xhr = _createCORSRequest( 'GET', request.url );
        if( !xhr ){
            console.error( "XHR is not support." );
            callback( new Error( "File uploads are not supported by this browswer." ) );
            return;
        }

        xhr.onload = function(){
            if( xhr.status === 200 ){
                var json = false;
                try{
                    json = JSON.parse( this.responseText );
                }catch( e ){
                    console.error( "Error parsing json response: ", this.responseText );
                }
                callback( false, json );
            }else{
                callback( new Error( "An HTTP error occurred: " + xhr.status ) );
            }
        };

        xhr.onerror = function(){
            callback( new Error( "An error occurred [" + xhr.status + "]: " + xhr.responseText ) );
        };

        xhr.upload.onprogress = function( e ){
            var percentLoaded = Math.round(( e.loaded / e.total ) * 100 );
            if( request.progressCallback ) request.progressCallback( percentLoaded );
        };

        return xhr.send();
    }

    function _createCORSRequest( method, url ){
        var xhr;
        xhr = new XMLHttpRequest();
        if( xhr.withCredentials != null ){
            xhr.open( method, url, true );
        }else if( typeof XDomainRequest !== "undefined" ){
            xhr = new XDomainRequest();
            xhr.open( method, url );
        } else {
            xhr = null;
        }
        return xhr;
    }

    return{
        getSignedUpload: _getSignedUpload,
        uploadToS3: _uploadToS3,
        completeUpload: _completeUpload
    };

})( window, document );
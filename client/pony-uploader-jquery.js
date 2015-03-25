
;( function( $, window, document, undefined ){

    var allStateClasses = 'dropZoneDefault dropZoneDrop dropZoneUploading dropZoneError dropZoneComplete';

    $.fn.ponyUpload = function(){
        $(this).each( function(){
            var $dropZone = $(this);
            var signatureUrl = $dropZone.attr('data-signUrl');
            var $progress = $dropZone.find('.progress-bar');
            var _state = 'initial';

            function _updateProgress( percent ){
                $progress.attr( 'aria-valuenow', percent).css({width: percent + "%" });
            }

            function _changeUIState( state, error ){
                _state = state;
                $dropZone.removeClass(allStateClasses)

                if( _state === 'initial' ){
                    _updateProgress( 0 );
                    $dropZone.addClass('dropZoneDefault');
                }else if( _state === 'allowDrop' ){
                    $dropZone.addClass('dropZoneDrop');
                }else if( _state === 'uploading' ){
                    $dropZone.addClass('dropZoneUploading');
                }else if( _state === 'error' ){
                    if( error ) $('.errorMessage').text( error.message || error );
                    $dropZone.addClass('dropZoneError');
                }else if( _state === 'complete' ){
                    $dropZone.addClass('dropZoneComplete');
                }
            }

            $dropZone.on( 'dragenter', function( e ){
                e.stopPropagation();
                e.preventDefault();
                if( _state !== 'initial' ) return;
                _changeUIState( 'allowDrop' );
            });

            $dropZone.on( 'dragleave', function( e ){
                e.stopPropagation();
                e.preventDefault();
                if( _state !== 'allowDrop' ) return;
                _changeUIState( 'initial' );
            });

            $dropZone.on( 'dragover', function( e ){
                e.stopPropagation();
                e.preventDefault();
            });

            $dropZone.on( 'drop', function( e ){
                e.stopPropagation();
                e.preventDefault();

                if( !e || !e.originalEvent || !e.originalEvent.dataTransfer || !e.originalEvent.dataTransfer.files ) return;
                if( _state !== 'allowDrop' ) return;

                _changeUIState( 'uploading' );
                var files = e.originalEvent.dataTransfer.files;
                var file = files[0]; //TODO: support multiple

                ponyImageResize.resizeFile( file, 1024, 1024, function( error, resizeResult ){

                    var uploadData = {
                        filename: file.name,
                        filetype: file.type,
                        filesize: resizeResult.blob.size,
                        originalFilesize: file.size,
                        width: resizeResult.width,
                        height: resizeResult.height,
                        blob: resizeResult.blob
                    };

                    ponyUploader.getSignedUpload( signatureUrl, uploadData, function( error, signatureResult ){

                        if( error ){
                            _changeUIState( 'error', error );
                            return;
                        }

                        console.log( "GOT AN S3 SIGNATURE: ", signatureResult );
                        ponyUploader.uploadToS3( signatureResult.uploadUrl, uploadData, _updateProgress, function( error, uploadResult ){
                            if( error ){
                                _changeUIState( 'error', error );
                                return;
                            }

                            console.log( "DONE WITH UPLOAD: ", uploadResult );
                            ponyUploader.completeUpload( signatureResult.completeUrl, function( error, completeResult ){
                                if( error ){
                                    _changeUIState( 'error', error );
                                    return;
                                }

                                console.log( "UPLOAD COMPLETED", completeResult );

                                _changeUIState( 'complete', error );
                                setTimeout( function(){
                                    _changeUIState( 'initial', error );
                                }, 3000 );
                            });
                        });
                    });
                });
            });
        });
    };

})( jQuery, window, document );

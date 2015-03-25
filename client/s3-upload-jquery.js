
;( function( $, window, document, undefined ){

    var allStateClasses = 'dropZoneDefault dropZoneDrop dropZoneUploading dropZoneError dropZoneComplete';

    $.fn.dropZone = function(){
        $(this).each( function(){
            var $dropZone = $(this);
            var signatureUrl = $dropZone.attr('data-signUrl');
            var $progress = $dropZone.find('.progress-bar');
            var _state = 'initial';

            function _updateProgress( percent ){
                $progress.attr( 'aria-valuenow', percent).css({width: percent + "%" });
            }

            function _changeUIState( state ){
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
                console.log( "Dropped: ", files );


                function _complete(){
                    _changeUIState( 'complete' );
                    setTimeout( function(){
                        _changeUIState( 'initial' );
                    }, 3000 );
                }

                var count = 0;
                var interval = setInterval( function(){
                    count++;
                    if( count > 10 ){
                        clearInterval( interval );
                        _complete();
                    }else{
                        _updateProgress( count * 10 );
                    }
                }, 500 );
            });
        });
    };

})( jQuery, window, document );

var S3UPLOAD = (function( app ){
    'use strict';

    app.home = app.home || {};

    app.home.init = function(){
        console.log( "Running home->init" );

        var $gallery = $('#gallery');

        var options = {
            allowedFileTypes: ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'],
            imageUploadComplete: function( result ){
                var $li = $('<li><img src="' + result.url + '"/></li>');
                //var $li = $('<li><img width="' + result.width + '" height="' + result.height + '" src="' + result.url + '"/></li>');
                $gallery.append( $li );
            }
        };

        $('.dropZone').ponyUpload( options );

    };
    
    return app;

})( S3UPLOAD || {} );
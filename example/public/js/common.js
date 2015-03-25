var S3UPLOAD = (function( app ){
    'use strict';

    app.common = app.common || {};

    app.common.init = function(){
        console.log( "Running common->init" );
    };

    return app;

})( S3UPLOAD || {} );
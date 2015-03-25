var S3UPLOAD = (function( app ){
    'use strict';

    app.home = app.home || {};

    app.home.init = function(){
        console.log( "Running home->init" );
    };
    
    return app;

})( S3UPLOAD || {} );
var S3UPLOAD = (function( app ){
    'use strict';

    app.utils = app.utils || {};

    app.utils.init = function(){
        var body = document.body,
            controller = body.getAttribute( "data-controller" ),
            action = body.getAttribute( "data-action" );

        S3UPLOAD.utils.exec( "common" );
        if( controller ) S3UPLOAD.utils.exec( controller, action );
    };
    
    app.utils.exec = function( controller, _action ){
        var action = ( typeof _action === 'undefined' ) ? "init" : _action;
        if( controller !== "" && S3UPLOAD[controller] && typeof S3UPLOAD[controller][action] === "function" ){
            S3UPLOAD[controller][action]();
        }
    };

    return app;
    
})( S3UPLOAD || {} );

$( function(){
    'use strict';
    S3UPLOAD.utils.init();
});

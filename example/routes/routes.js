( function(){
    'use strict';

    var authentication = require('../lib/authentication');
    var protect = authentication.protect;

    module.exports = function( app ){
        app.get( "/", protect, getRoot );
    };

    function getRoot( req, res ){
        res.render('index');
    }
	
})();
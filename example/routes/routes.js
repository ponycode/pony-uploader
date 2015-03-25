( function(){
    'use strict';

    var mongoose = require('mongoose');
    var Hello = mongoose.model('Hello');
    var authentication = require('../lib/authentication');
    var protect = authentication.protect;

    module.exports = function( app ){
        app.get( "/", getRoot );
        app.post( "/testPost", postTestPost );
        app.get( "/protected", protect, getProtected );
    };

    function getRoot( req, res ){
        res.render('index');
    }

    function getProtected( req, res ){
        res.render('protected');
    }

    function postTestPost( req, res ){
        var testInput = req.body.testInput;

        var hello = new Hello();
        hello.message = testInput;
        hello.save( function( error, updatedHello ){
            if( error ){
                req.flash( 'error', 'Oops!' + (error.message || error) );
            }else{
                req.flash( 'success', 'Got Input: ' + testInput );
            }
            res.redirect('/');
        });
    }

})();
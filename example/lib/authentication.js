( function(){
	"use strict";

	var passport = require('passport');
	var LocalStrategy = require('passport-local').Strategy;
	var mongoose = require('mongoose');
	var bcrypt = require('bcrypt');
	var querystring = require("querystring");
	var UserRoles = require('./UserRoles.js');

	var PASSWORD_HASH_ITERATIONS = 10; // Needs to increase as hardware becomes faster

	exports.handleLogin = function( req, res, next ){
		passport.authenticate( 'local', function( error, user, info ){
			if( error ) return next( error );

			if( !user ){
				req.flashError( info.message );
				return res.redirect( '/login' );
			}

			req.login( user, function( error ){
				if( error ) return next( error );

				var continueTo = req.body.continueTo || '/';

				res.redirect( continueTo );
			});

		})( req, res, next );
	};

	exports.init = function( app ){
		var User = mongoose.model('User');

		passport.use( 'local', new LocalStrategy({
				usernameField: 'email',
				passwordField: 'password'
			},
			function( email, password, done ){
				User.findByEmail( email, function( error, user ){
					if( error ) return done( error );
					if( !user ) return done( null, false, { message: 'Incorrect email or password.' } );

					exports.comparePassword( password, user.passwordHash, function( error, passwordIsCorrect ){
						if( error ) return done( error );

						if( passwordIsCorrect ){
							return done( null, user );
						}else{
							return done( null, false, { message: 'Incorrect email or password.' } );
						}
					});
				});
			}
		));

		passport.serializeUser( function( user, done ){
			done( null, user.id );
		});

		passport.deserializeUser( function( id, done ){
			User.findById( id, function( error, user ){
				done( error, user );
			});
		});

		app.use( passport.initialize({ userProperty: 'user' }) );
		app.use( passport.session() );
	};

	exports.hashPassword = function( password, callback ){
		bcrypt.genSalt( PASSWORD_HASH_ITERATIONS, function( error, salt ){
			if( error ) return callback( error, false );
			bcrypt.hash( password, salt, callback );
		});
	};

	exports.comparePassword = function( candidatePassword, passwordHash, callback ){
		bcrypt.compare( candidatePassword, passwordHash, function( error, isMatch ){
			if( error ) return callback( error );
			callback( false, isMatch );
		});
	};

	exports.protect = function( req, res, next ){
		if( !req.isAuthenticated || !req.isAuthenticated() || !req.user ){
			req.flashError( "Please login to continue." );
			return res.redirect( '/login?' + querystring.stringify({ continueTo: req.originalUrl }) );
		}
		next();
	};

	exports.protectAdmin = function( req, res, next ){
		exports.protectAnyOfRoles([ UserRoles.ADMIN ])( req, res, next );
	};

	exports.protectAnyOfRoles = function( roles ){
		return function( req, res, next ){
			if( !req.isAuthenticated || !req.isAuthenticated() || !req.user ){
				req.flashError( "Please login to continue." );
				return res.redirect( '/login?' + querystring.stringify({ continueTo: req.originalUrl }) );
			}

			if( !roles || roles.length === 0 ) return next();

			var user = req.user;
			for( var r = 0; r < roles.length; r++ ){
				if( user.hasRole( roles[r] ) ) return next();
			}

			req.flashError( "You are not authorized to access this page." );
			return res.redirect( '/login?' + querystring.stringify({ continueTo: req.originalUrl }) );
		};
	};

})();
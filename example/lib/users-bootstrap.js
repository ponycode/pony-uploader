( function(){
	'use strict';

	var config = require('pony-config');
	var mongoose = require('mongoose');
	var authentication = require('./authentication');
	var UserRoles = require('../lib/UserRoles.js');

	exports.setupInitialUsers = function( callback ){
		var User = mongoose.model('User');
		var initialAdminUser = config.get('initial_admin_user');
		if( !initialAdminUser ) return callback( false );

		User.findOne( { roles: UserRoles.ADMIN }, function( error, user ){
			if( error ){
				console.error( "Failed to determine is an admin account exists:", error );
				return callback( error );
			}

			if( !user ){
				_insertInitialAdminUserWithData( initialAdminUser, callback );
			} else {
				callback( false );
			}
		});
	};

	function _insertInitialAdminUserWithData( userData, callback ){

		var User = mongoose.model('User');

		User.findByEmail( userData.email, function( error, user ){
			if( error ) return callback( error );
			if( user ) return callback( false );

			authentication.hashPassword( userData.password, function( error, passwordHash ){
				var user = new User();
				user.email = userData.email;
				user.passwordHash = passwordHash;
				user.roles = userData.roles;
				user.isEmailVerified = true;

				user.save( callback );
			});
		});
	}

})();
( function(){
    'use strict';

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var authentication = require('../lib/authentication');
    var moment = require('moment');
    var UserRoles = require('../lib/UserRoles.js');


    var UserSchema = new Schema({
        email: { type: String, lowercase: true, trim: true, required: true, unique: true },
        passwordHash: { type: String, required: true },
        roles:[{ type: String, enum: UserRoles.allRoles() }],
        isEmailVerified: { type: Boolean, required: true, default: false },
        emailVerificationToken: { type: String },
        emailVerificationExpiry: { type: Date },
        passwordRecoveryToken: { type : String },
        passwordRecoveryExpiry: { type: Date }
    });

    UserSchema.methods.hasRole = function( role ){
        if( !this.roles ) return false;
        return this.roles.indexOf( role ) > -1;
    };

    UserSchema.methods.isAdmin = function(){
        return this.hasRole( UserRoles.ADMIN );
    };

	UserSchema.statics.findByEmail = function( email, callback ){
		var User = this;
		User.findOne( { email : email.toLowerCase() } ).exec( callback );
	};
	
	UserSchema.statics.register = function( userData, callback ){
        var User = this;
        var user = new User();
        user.email = userData.email;
        user.emailVerificationToken = _generateToken();
        user.emailVerificationExpiry = moment().add( 10, 'm' ).toDate();

        authentication.hashPassword( userData.password, function( error, hashedPassword ){
            if( error ) return callback( error, false );
            user.passwordHash = hashedPassword;
            user.save( function( error, newUser ){
                if( error ){
                    if( error.code === 11000 ){
                        // user already exists
                        return callback( new Error( "An account is already registered with this email address." ), false );
                    }
                    return callback( error, false );
                }
                callback( false, newUser );
            });
        });
    };

    UserSchema.statics.validateEmail = function( token, callback ){
        var User = this;
        User.findOne( { emailVerificationToken : token } ).exec( function( error, user ){
            if( error ) return callback( new Error( "Database read error" ), false );
            if( !user ) return callback( new Error( "Verification email invalid." ), false );
            if( moment().isAfter( moment( user.emailVerificationExpiry )) ){
                return callback( new Error( "Verification email has expired" ), false );
            }
            user.emailVerificationToken = false;
            user.emailVerificationExpiry = null;
            user.isEmailVerified = true;

            user.save( callback );
        });
    };

    UserSchema.statics.getPasswordRecoveryToken = function( email, callback ){
        var User = this;

        User.findByEmail( email, function( error, user ){
            if( error ) return callback( new Error( "Database read error" ), false );
            if( !user ) return callback( new Error( "Recovery email invalid." ), false );

            user.passwordRecoveryToken = _generateToken();
            user.passwordRecoveryExpiry = moment().add( 10, 'm' ).toDate();

            user.save( callback );
        });
    };

    UserSchema.statics.validatePasswordRecoveryToken = function( token, callback ){
        var User = this;

        User.findOne( { passwordRecoveryToken : token } ).exec( function( error, user ){
            if( error ) return callback( new Error( "Database read error" ), false );
            if( !user ) return callback( new Error( "Recovery token invalid." ), false );
            if( moment().isAfter( moment( user.passwordRecoveryExpiry )) ){
                return callback( new Error( "Password recovery email has expired" ), false );
            }

            callback( false, user );
        });
    };

    UserSchema.statics.resetPasswordWithToken = function( token, password, callback ){
        var User = this;

        User.validatePasswordRecoveryToken( token, function( error, user ){
            if( error ) return callback( new Error( "Database read error" ), false );
            if( !user ) return callback( new Error( "Recovery token invalid." ), false );
            if( moment().isAfter( moment( user.passwordRecoveryExpiry )) ){
                return callback( new Error( "Password recovery email has expired" ), false );
            }

            user.passwordRecoveryToken = false;
            user.passwordRecoveryExpiry = null;

            authentication.hashPassword( password, function( error, hashedPassword ){
                if( error ) return callback( error, false );
                user.passwordHash = hashedPassword;

                user.save( callback );
            });
        });
    };

    UserSchema.set( 'toJSON', {
        transform: function( doc, ret, options ){
            delete ret.passwordHash;
            return ret;
        }
    });

    UserSchema.set( 'toObject', {
        transform: function( doc, ret, options ){
            delete ret.passwordHash;
            return ret;
        }
    });

    function _generateToken(){
        var TOKEN_LENGTH = 40;
        var TOKEN_CHAR_SET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var token = "";
        for( var i=0; i < TOKEN_LENGTH; i++ ){
            token += TOKEN_CHAR_SET.charAt( Math.random() * TOKEN_CHAR_SET.length );
        }
        return token;
    }

    mongoose.model( 'User', UserSchema );
})();

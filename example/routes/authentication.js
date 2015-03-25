( function(){
	'use strict';

	var mongoose = require('mongoose');
	var User = mongoose.model('User');
	var authentication = require('../lib/authentication');
	var emailer = require('../lib/emailer');

	module.exports = function( app ){
		app.get( "/register", getRegister );
		app.post( "/register", postRegister );

		app.get( '/login', getLogin );
		app.post( '/login', postLogin );

		app.get( '/logout', getLogout );

		app.get( '/emailverification/:token', getEmailVerification );

		app.get( '/resendRegistrationValidationEmail/:email', getResendRegistrationValidationEmail );

		app.get( '/recoverpassword', getRecoverPassword );
		app.post( '/recoverpassword', postRecoverPassword );
		app.get( '/resetpassword/:token', getResetPassword );
		app.post( '/resetpassword/:token', postResetPassword );
	};

	function getLogin( req, res ){
		var continueTo = req.query.continueTo || '';
		res.render('authentication/login', {continueTo: continueTo });
	}

	function postLogin( req, res ){
		authentication.handleLogin( req, res );
	}

	function getLogout( req, res ){
		req.logout();
		res.redirect('/');
	}

	function getRegister( req, res ){
		var continueTo = req.query.continueTo || '';
		res.render('authentication/register', {continueTo: continueTo });
	}

	function postRegister( req, res ){
		var continueTo = req.query.continueTo || '';
		var returnURL = '/register?continueTo=' + continueTo;
		var continueURL = '/login?continueTo=' + continueTo;

		//TODO: sanitize sterlize and homongenize
		var email = req.body.email;
		var password = req.body.password;

		if( !email || !password ){
			req.flashError( 'Email and password are required.' );
			return res.redirect( returnURL );
		}

		var userData = {
			email: email,
			password: password
		};

		User.register( userData, function( error, registeredUser ){
			if( error ){
				var message = 'Email validation failed <a href="/resendRegistrationValidationEmail/' + email + '?continueTo=' + continueTo + '">Resend</a>';
				req.flashError( message );
				res.redirect( returnURL );
				return;
			}

			if( !registeredUser ){
				res.redirect( returnURL );
				return;
			}

			var activationURL = req.appUrlWithPathAndQueryParams( 'emailVerification/' + registeredUser.emailVerificationToken, { continueTo: continueTo } );

			emailer.sendEmail( "register", { activationUrl: activationURL }, registeredUser.email, "Please activate your account", function( error, result ){
				if( error ){
					req.flashError( "Error sending activation email. Please try again later. ", error );
				} else {
					console.log( "Sent registration email: ", result );
					req.flashSuccess( 'Check your email. We have sent instructions to verify your account' );
				}
				res.redirect( continueURL );
			});

		});
	}

	function getResendRegistrationValidationEmail( req, res ){
		var continueTo = req.query.continueTo || '';
		var returnURL = '/register?continueTo=' + continueTo;
		var continueURL = '/login?continueTo=' + continueTo;

		var email = req.params.email;

		if( !email ){
			req.flashError( 'Email is required.' );
			return res.redirect( returnURL );
		}

		var userData = {
			email: email
		};

		User.restartEmailVerification( userData, function( error, user ){
			if( error ){
				req.flashError( "Error verifying email", error );
				return res.redirect( returnURL );
			}

			if( user.isEmailVerified ){
				req.flashSuccess( "Your account registration is complete. Please login. ");
			} else {
				var activationURL = req.appUrlWithPathAndQueryParams( 'emailVerification/' + user.emailVerificationToken, { continueTo: continueTo } );

				emailer.sendEmail( "register", { activationUrl: activationURL }, email, "Please activate your account", function( error, result ){
					if( error ){
						req.flashError( "Error sending activation email. Please try again later. ", error );
					} else {
						console.log( "Sent registration email: ", result );
						req.flashSuccess( 'Check your email. We have sent instructions to verify your account' );
					}
					res.redirect( continueURL );
				});
			}
		});
	}

	function getEmailVerification( req, res ){
		var continueTo = req.query.continueTo || '';
		var returnURL = '/login?continueTo=' + continueTo;
		var token = req.params.token;

		if( !token ){
			req.flashError( 'Verification link id invalid' );
			req.redirect( returnURL );
		}

		User.validateEmail( token, function( error, user ){
			if( error ){
				console.error( 'Email validation failed.', error );
				req.flashError( 'Email validation failed.', error );
				if( user ){
					var message = "<a href='/resendRegistrationValidationEmail/" + user.email + "?continueTo=" + continueTo + "'>Resend Verification Email</a>";
					req.flashError( message );
				}
			} else {
				console.log( "Email validation complete for email: ", user.email );
				req.flashSuccess( "Your account registration is now complete. Please login." );
			}

			res.redirect( returnURL );
		});
	}

	function getRecoverPassword( req, res ){
		var continueTo = req.query.continueTo || '';
		res.render('authentication/recoverpassword', {continueTo: continueTo });
	}

	function postRecoverPassword( req, res ){
		var continueTo = req.query.continueTo || '';
		var returnURL = '/login?continueTo=' + continueTo;

		var email = req.body.email;

		if( !email ){
			req.flashError( 'Email is required.' );
			return res.redirect( returnURL );
		}

		User.getPasswordRecoveryToken( email, function( error, user ){

			if( error ){
				console.error( 'Account lookup failed ' + email + ':', error  );
			} else {
				if( !user ){
					console.log( 'Email for password recovery not recognized' );
				} else {
					var recoveryURL = req.appUrlWithPathAndQueryParams( "resetpassword/" + user.passwordRecoveryToken, { continueTo: continueTo });
					emailer.sendEmail( "password-recovery", { recoveryURL: recoveryURL }, email, "Follow this link to reset your password", function( error, result ){
						if( error ){
							req.flashError( "Error sending password recovery email. Please try again later. ", error );
						} else {
							console.log( "Sent recovery email: ", result );
							req.flashSuccess( 'Check your email. We have sent instructions to recover your password' );
						}
						res.redirect( returnURL );
					});
				}
			}
		});
	}

	function getResetPassword( req, res ){
		var continueTo = req.query.continueTo || '';
		var returnURL = '/login?continueTo=' + continueTo;
		var token = req.params.token;

		if( !token ){
			req.flashError( 'Verification link id invalid' );
			req.redirect( returnURL );
		}

		User.validatePasswordRecoveryToken( token, function( error, user ){
			if( error ){
				console.error( 'Password recovery validation failed. ', error );
				req.flashError( 'Password recovery link is invalid. ', error );
				res.redirect( returnURL );
			} else {
				console.log( "Password recovery valid for email", user.email );
				res.render( 'authentication/resetpassword', {continueTo: continueTo });
			}
		});
	}

	function postResetPassword( req, res ){
		var continueTo = req.query.continueTo || '';
		var returnURL = '/login?continueTo=' + continueTo;
		var token = req.params.token;
		var password = req.body.password;

		if( !token ){
			req.flashError( 'Verification link id invalid' );
			req.redirect( returnURL );
		}

		User.resetPasswordWithToken( token, password, function( error, user ){
			if( error ){
				console.error( 'Password reset failed. ', error );
				req.flashError( 'Error resetting your password. Please try again. ', error );
				res.redirect( returnURL );
			} else {
				console.log( 'Password recovery succeeded for user: ', user.email );
				req.flashSuccess( 'Your password has been changed. Please login again.' );
				res.redirect( returnURL );
			}
		});
	}

})();
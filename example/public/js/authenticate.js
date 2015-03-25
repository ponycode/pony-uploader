var S3UPLOAD = (function( app ){
	'use strict';

	app.authenticate = app.authenticate || {};

	app.authenticate.register = function(){
		console.log( "Running authenticate-register" );

		var minimumPasswordStrength = S3UPLOAD.password.minimumPasswordStrength;
		var bestPasswordStrength = S3UPLOAD.password.bestPasswordStrength;

		var $password = $('#password');
		var $passwordStrengthBar = $('#passwordStrength');
		var $registerButton = $('#registerButton');
		var $passwordMessage = $('#passwordMessage');

		$registerButton.attr('disabled', 'disabled');
		$password.keyup( _checkPasswords );

		function _checkPasswords(){
			var password = $password.val();
			var passwordStrength = S3UPLOAD.password.getPasswordStrength( password );
			if( password.length === 0 ){
				$registerButton.attr('disabled', 'disabled');
				$passwordMessage.text('').hide();
			} else {
				_updatePasswordStrengthMeter( passwordStrength );
				_updatePasswordMessageAndSubmitButton( passwordStrength );
			}
		}

		function _updatePasswordMessageAndSubmitButton( passwordStrength ){
			if( passwordStrength < minimumPasswordStrength ){
				$registerButton.attr('disabled', 'disabled');
				$passwordMessage.text('Please make your password more secure.').show();
			}else{
				$registerButton.removeAttr('disabled');
				$passwordMessage.text('').hide();
			}
		}

		function _updatePasswordStrengthMeter( passwordStrength ){
			var strengthColorClass = 'progress-bar-danger';
			if( passwordStrength > bestPasswordStrength ){
				// STRONG
				strengthColorClass = 'progress-bar-success';
			}else if( passwordStrength > minimumPasswordStrength ){
				// EH
				strengthColorClass = 'progress-bar-warning';
			}
			$passwordStrengthBar.css({width: passwordStrength + '%'}).removeClass('progress-bar-danger progress-bar-success progress-bar-warning').addClass(strengthColorClass);
		}

	};

	app.authenticate.recoverpassword = function(){
		console.log( "Running authenticate-register" );
		
	};

	app.authenticate.resetpassword = function(){
		console.log( "Running authenticate-resetpassword" );

		var minimumPasswordStrength = S3UPLOAD.password.minimumPasswordStrength;
		var bestPasswordStrength = S3UPLOAD.password.bestPasswordStrength;
		
		var $password = $('#password');
		var $passwordStrengthBar = $('#passwordStrength');
		var $resetPasswordButton = $('#resetPasswordButton');
		var $passwordMessage = $('#passwordMessage');

		$resetPasswordButton.attr('disabled', 'disabled');
		$password.keyup( _checkPasswords );
		
		function _checkPasswords(){
			var password = $password.val();
			var passwordStrength = S3UPLOAD.password.getPasswordStrength( password );
			if( password.length === 0 ){
				$resetPasswordButton.attr('disabled', 'disabled');
				$passwordMessage.text('').hide();
			} else {
				_updatePasswordStrengthMeter( passwordStrength );
				_updatePasswordMessageAndSubmitButton( passwordStrength );
			}
		}
		
		function _updatePasswordMessageAndSubmitButton( passwordStrength ){
			if( passwordStrength < minimumPasswordStrength ){
				$resetPasswordButton.attr('disabled', 'disabled');
				$passwordMessage.text('Please make your password more secure.').show();
			}else{
				$resetPasswordButton.removeAttr('disabled');
				$passwordMessage.text('').hide();
			}
		}
		
		function _updatePasswordStrengthMeter( passwordStrength ){
			var strengthColorClass = 'progress-bar-danger';
			if( passwordStrength > bestPasswordStrength ){
				// STRONG
				strengthColorClass = 'progress-bar-success';
			}else if( passwordStrength > minimumPasswordStrength ){
				// EH
				strengthColorClass = 'progress-bar-warning';
			}
			$passwordStrengthBar.css({width: passwordStrength + '%'}).removeClass('progress-bar-danger progress-bar-success progress-bar-warning').addClass(strengthColorClass);
		}


	};

	return app;

})( S3UPLOAD || {} );
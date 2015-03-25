( function(){
	'use strict';
	
	var path = require('path');

	module.exports = {
		port: process.env.PORT || 3000,
		mongo: {
			connectionString: (process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://localhost') + '/S3UPLOAD'
		},
		session:{
			secret: "DuckBillDonkey",
			cookieExpirationMs: 30 * 24 * 60 * 60 * 1000
		},
		scriptsToMinify: [
			"public/js/libraries/bootstrap/transition.js",
			"public/js/libraries/bootstrap/alert.js",
			"public/js/libraries/bootstrap/button.js",
			"public/js/libraries/bootstrap/carousel.js",
			"public/js/libraries/bootstrap/collapse.js",
			"public/js/libraries/bootstrap/dropdown.js",
			"public/js/libraries/bootstrap/modal.js",
			"public/js/libraries/bootstrap/tooltip.js",
			"public/js/libraries/bootstrap/popover.js",
			"public/js/libraries/bootstrap/scrollspy.js",
			"public/js/libraries/bootstrap/tab.js",
			"public/js/libraries/bootstrap/affix.js",
			"public/js/shared/password-strength.js",
			"public/js/utils.js",
			"public/js/common.js",
			"public/js/home.js",
			"public/js/authenticate.js"
		],
		email:{
			enabled: false,
            fromEmail: "accounts@s3-file-upload.com",
			templatesPath: path.join( __dirname, '/../views/emails' )
		}
	};

})();
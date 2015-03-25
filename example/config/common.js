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
		},
        s3:{
            accessKey: process.env.AWS_ACCESS_KEY,
            secretKey: process.env.AWS_SECRET_KEY,
            bucket: process.env.AWS_S3_BUCKET
        }
	};

})();
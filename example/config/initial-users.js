( function(){
	'use strict';

	var UserRoles = require('../lib/UserRoles');
	
	module.exports = {
		initial_admin_user: {
				email : "admin@s3-file-upload.com",
				password : "h0l3H7*J",
				roles : [ UserRoles.ADMIN ]
			}
	};

})();
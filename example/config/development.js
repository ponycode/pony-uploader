( function(){

	module.exports = {
		anEnviromentSpecificValue: "Hey there development!",
		useMinifiedJs: false,
        useMinifiedCss: false,
		renderStackTraces: true,
		email:{
			enabled: true,
            debug: true,
            service: "gmail",
			auth:{
				user: process.env.GMAIL_SMTP_EMAIL,
				pass: process.env.GMAIL_SMTP_APP_PASSWORD
			}
		}
	};

})();
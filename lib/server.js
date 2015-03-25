( function(){
	'use strict';

	var _ = require('lodash');
	var fs = require('fs');
	var path = require('path');
	var aws = require('aws-sdk');

	var minifiedClientPath = path.join( __dirname, "/../client/s3-file-upload.min.js" );
	var clientPath = path.join( __dirname, "/../client/s3-file-upload.js" );

	var defaults = {
		
	};
	
	module.exports = function( options ){
		
		var settings = _.extend( options, defaults );
		if( !settings.awsKey ) throw new Error( "awsKey is required" );
		if( !settings.awsSecret ) throw new Error( "awsSecret is required" );
		
		// this is more for demo than production use
		function _setupExpressRoutes( app ){
			if( !app ) throw new Error( ".init( app ) requires the app parameter" );
			
			app.get( "/upload/sign", function( req, res ){
				
			});
			
			app.get( "/upload/complete", function( req, res ){

			});
			
			app.get( "/javascripts/s3-file-upload.js", _serveClientJs );
		}
		
		function _getS3UploadSignature( req, res ){

		}

		function _completeS3Upload( req, res ){

		}

		function _serveClientJs( req, res ){
			// TODO: minify
			_getClientJsPath( function( error, clientJsPath ){
				res.sendFile( clientJsPath );
			});
		}

		function _getClientJsPath( callback ){
			fs.exists( minifiedClientPath, function( exists ){
				if( exists ) return callback( false, minifiedClientPath );
				fs.exists( clientPath, function( exists ){
					if( exists ) return callback( false, clientPath );
					throw new Error( "Could not locate client JS." );
				});
			});
		}
		
		return {
			setupExpressRoutes: _setupExpressRoutes,
			getS3UploadSignature: _getS3UploadSignature,
			completeS3Upload: _completeS3Upload
		};
	};
	
})();
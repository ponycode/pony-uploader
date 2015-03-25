( function(){
	'use strict';

	var _ = require('lodash');
	var fs = require('fs');
	var path = require('path');
    var aws = require('aws-sdk');

	var defaults = {
        allowedFileTypes: ['image/png', 'image/jpg', 'image/jpeg'],
        maxFileSizeBytes: 1024
	};
	
	module.exports = function( options ){
		
		var settings = _.extend( options, defaults );
		if( !settings.s3AccessKeyId ) throw new Error( "s3AccessKeyId is required" );
        if( !settings.s3AccessKeySecret ) throw new Error( "s3AccessKeySecret is required" );
        if( !settings.bucket ) throw new Error( "bucket is required" );

        aws.config.update({ accessKeyId: settings.s3AccessKeyId, secretAccessKey: settings.s3AccessKeySecret });
        var s3 = new aws.S3();

		function _getS3UploadSignature( upload, callback ){

            var error = _isValidUpload( upload );
            if( error ){
                console.error( "Invalid upload: ", upload, error );
                callback( new Error("Invalid upload: " + error ) );
                return;
            }

            var s3Params = {
                Bucket: settings.bucket,
                Key: upload.key,
                Expires: 10,
                ACL: 'public-read',
                ContentType: upload.filetype
            };

            s3.getSignedUrl( 'putObject', s3Params, function( error, uploadUrl ){
                if( error ){
                    console.error( "Error signing S3 upload: ", error );
                    callback( error, false );
                    return;
                }

                callback( false, {
                    uploadUrl: uploadUrl,
                    completeUrl: upload.completeUrl,
                    publicUrl: 'https://' + config.get("s3.resourcesBucket") + '.s3.amazonaws.com/' + upload.key
                });
            });
		}

        function _isValidUpload( upload ){
            if( !upload.key ) return new Error( "config.key is required" );
            if( !upload.filename ) return new Error( "config.filename is required" );
            if( !upload.completeUrl ) return new Error( "config.completeUrl is required" );

            if( !upload.filesize ) return new Error( "config.filesize is required" );
            if( !_isProperFileSize( upload.filesize ) ) return new Error( "Filesize exceeds maximum filesize of " + settings.maxFileSizeBytes + ": " + upload.filesize );

            if( !upload.filetype ) return new Error( "config.filetype is required" );
            if( !_isValidFileType( upload.filetype ) ) return new Error( "Invalid file type: " + upload.filetype );

            return false;
        }

        function  _isProperFileSize( filesize ){
            filesize = parseInt( filesize );
            return ( filesize <= settings.maxFileSizeBytes );
        }

        function _isValidFileType( filetype ){
            filetype = filetype.toLowerCase();
            return _.indexOf( settings.allowedFileTypes, filetype ) !== -1;
        }

		return {
			getS3UploadSignature: _getS3UploadSignature
		};
	};
	
})();
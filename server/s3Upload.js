( function(){
	'use strict';

	const aws = require('aws-sdk')

	const defaults = {
		allowedFileTypes: ['image/png', 'image/jpg', 'image/jpeg'],
		maxFileSizeBytes: 1024*1024*5
	}
	
	async function _getS3UploadSignature( s3, upload ){
		const error = _validateUpload( upload )
		if( error ) throw error

		return await _getSignedUrl( s3, {
			Bucket: settings.bucket,
			Key: upload.key,
			Expires: 3 * 60, // seconds
			ACL: 'public-read',
			ContentType: upload.filetype
		})
	}

	async function _getSignedUpload( s3, s3Params ){
		return new Promise( function( resolve, reject ){
			s3.getSignedUrl( 'putObject', s3Params, function( error, uploadUrl ){
				if( error ) return reject( error )

				resolve({
					uploadUrl,
					completeUrl: upload.completeUrl,
					publicUrl: 'https://' + settings.bucket + '.s3.amazonaws.com/' + upload.key
				})
			})
		})
	}

	function _validateUpload( upload ){
		if( !upload.key ) return new Error( 'upload.key is required' )
		if( !upload.filename ) return new Error( 'upload.filename is required' )
		if( !upload.completeUrl ) return new Error( 'upload.completeUrl is required' )

		if( !upload.filesize ) return new Error( 'upload.filesize is required' )
		if( !_isProperFileSize( upload.filesize ) ) return new Error( 'Filesize exceeds maximum filesize of ' + settings.maxFileSizeBytes + ': ' + upload.filesize )

		if( !upload.filetype ) return new Error( 'upload.filetype is required' )
		if( !_isValidFileType( upload.filetype ) ) return new Error( 'Invalid file type: ' + upload.filetype )

		return false
	}

	function  _isProperFileSize( filesize ){
		filesize = parseInt( filesize, 10 )
		return filesize <= settings.maxFileSizeBytes
	}

	function _isValidFileType( filetype ){
		filetype = filetype.toLowerCase()
		return settings.allowedFileTypes.indexOf( filetype ) !== -1
	}

	module.exports = function( options ){
		const settings = { ...defaults, ...options };

		if( !settings.s3AccessKeyId ) throw new Error( 's3AccessKeyId is required' )
		if( !settings.s3AccessKeySecret ) throw new Error( 's3AccessKeySecret is required' )
		if( !settings.bucket ) throw new Error( 'bucket is required' )

		aws.config.update({ 
			accessKeyId: settings.s3AccessKeyId, 
			secretAccessKey: settings.s3AccessKeySecret
		})

		return {
			getSignedUpload: _getSignedUpload.bind( null, new aws.S3() )
		}
	}
	
})()

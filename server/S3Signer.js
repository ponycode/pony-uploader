const aws = require('aws-sdk')

class S3Signer {

	constructor( options = {} ){
		this.options = { ...{
			allowedFileTypes: ['image/png', 'image/jpg', 'image/jpeg'],
			maxFileSizeBytes: 1024 * 1024 * 5
		}, ...options }

		if( !this.options.s3AccessKeyId ) throw new Error( 'options.s3AccessKeyId is required' )
		if( !this.options.s3AccessKeySecret ) throw new Error( 'options.s3AccessKeySecret is required' )
		if( !this.options.bucket ) throw new Error( 'options.bucket is required' )

		this.s3 = new aws.S3({
			apiVersion: 'latest',
			signatureVersion: 'v4',
			region: 'us-east-1',
			accessKeyId: this.options.s3AccessKeyId, 
			secretAccessKey: this.options.s3AccessKeySecret
		});
	}

	async signUpload( uploadInfo ){
		const error = this._validateUpload( uploadInfo )
		if( error ) throw error

		return await this._getSignedUrl( {
			Bucket: this.options.bucket,
			Key: uploadInfo.key,
			Expires: 60, // 60 seconds
			ACL: 'public-read',
			ContentType: uploadInfo.filetype,
			Metadata: uploadInfo.metadata
		})
	}

	_getSignedUrl( s3Params ){
		return new Promise( ( resolve, reject ) => {
			this.s3.getSignedUrl( 'putObject', s3Params, ( error, uploadUrl ) => {
				if( error ) return reject( error )

				resolve({
					uploadUrl,
					publicUrl: 'https://' + s3Params.Bucket + '.s3.amazonaws.com/' + s3Params.Key
				})
			})
		})
	}

	_validateUpload( upload ){
		if( !upload.key ) return new Error( 'upload.key is required' )

		if( !upload.filesize ) return new Error( 'upload.filesize is required' )
		if( !this._isProperFileSize( upload.filesize ) ) return new Error( 'Filesize exceeds maximum filesize of ' + settings.maxFileSizeBytes + ': ' + upload.filesize )

		if( !upload.filetype ) return new Error( 'upload.filetype is required' )
		if( !this._isValidFileType( upload.filetype ) ) return new Error( 'Invalid file type: ' + upload.filetype )

		return false
	}

	_isProperFileSize( filesize ){
		filesize = parseInt( filesize, 10 )
		return filesize <= this.options.maxFileSizeBytes
	}

	_isValidFileType( filetype ){
		filetype = filetype.toLowerCase()
		return this.options.allowedFileTypes.indexOf( filetype ) !== -1
	}

}

module.exports = S3Signer

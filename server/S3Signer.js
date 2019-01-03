const aws = require('aws-sdk')
const AbstractSigner = require('./AbstractSigner')

class S3Signer extends AbstractSigner{

	constructor( options = {} ){
		super( options )

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

		const metadata = this._sanitizeMetadata( uploadInfo.metadata )

		const uploadUrl = await this._getSignedUrl( {
			Bucket: this.options.bucket,
			Key: uploadInfo.key,
			Expires: 60, // 60 seconds
			ACL: 'public-read',
			ContentType: uploadInfo.filetype,
			Metadata: metadata
		} )

		return {
			service: 's3',
			bucket: this.options.bucket,
			key: uploadInfo.key,
			uploadUrl,
			filetype: uploadInfo.filetype,
			metadata: this._updateMetadataForS3( metadata ),
			publicUrl: `https://${this.options.bucket}.s3.amazonaws.com/${uploadInfo.key}`
		}
	}

	_getSignedUrl( s3Params ){
		return new Promise( ( resolve, reject ) => {
			this.s3.getSignedUrl( 'putObject', s3Params, ( error, uploadUrl ) => {
				if( error ) return reject( error )
				resolve( uploadUrl )
			})
		})
	}

	_sanitizeMetadata( metadata ){
		if( !metadata ) return
		const newMetadata = {}
		for( let key in metadata ){
			newMetadata[`${key.toLowerCase()}`] = String( metadata[key] )
		}
		return newMetadata
	}

	_updateMetadataForS3( metadata ){
		if( !metadata ) return
		const newMetadata = {}
		for( let key in metadata ){
			newMetadata[`x-amz-meta-${key.toLowerCase()}`] = String( metadata[key] )
		}
		return newMetadata
	}

}

module.exports = S3Signer

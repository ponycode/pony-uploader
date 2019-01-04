const { Storage } = require('@google-cloud/storage');
const AbstractSigner = require('./AbstractSigner')

class S3Signer extends AbstractSigner {

	constructor( options = {} ){
		super( options )

		if( !this.options.projectId ) throw new Error( 'options.projectId is required' )
		if( !this.options.credentials ) throw new Error( 'options.credentials is required' )
		if( !this.options.bucket ) throw new Error( 'options.bucket is required' )

		this.storage = new Storage({
			projectId: this.options.projectId,
			credentials: this.options.credentials
		})
	}

	async signUpload( uploadInfo ){
		let metadata = this._sanitizeMetadata( uploadInfo.metadata )
		metadata = this._updateMetadataForCloudStorage( metadata )

		const options = {
			action: 'write',
			expires: Date.now() + 1000 * 60,
			contentType: uploadInfo.filetype,
			extensionHeaders: metadata
		}

		const [uploadUrl] = await this.storage
			.bucket( this.options.bucket )
			.file( uploadInfo.key )
			.getSignedUrl( options )

		return {
			service: 'cloudStorage',
			bucket: this.options.bucket,
			key: uploadInfo.Key,
			uploadUrl,
			filetype: uploadInfo.filetype,
			metadata: metadata,
			publicUrl: `https://console.cloud.google.com/storage/browser/${this.options.bucket}/${uploadInfo.key}`
		}
	}

	_sanitizeMetadata( metadata ){
		if( !metadata ) return
		const newMetadata = {}
		for( let key in metadata ){
			newMetadata[`${key.toLowerCase()}`] = String( metadata[key] )
		}
		return newMetadata
	}

	_updateMetadataForCloudStorage( metadata ){
		if( !metadata ) return
		const newMetadata = {}
		for( let key in metadata ){
			newMetadata[`x-goog-meta-${key.toLowerCase()}`] = String( metadata[key] )
		}
		return newMetadata
	}

}

module.exports = S3Signer
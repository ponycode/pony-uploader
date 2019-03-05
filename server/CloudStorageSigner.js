var _ = require('lodash');
const { Storage } = require('@google-cloud/storage');
const AbstractSigner = require('./AbstractSigner');

class CloudStorageSigner extends AbstractSigner {

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


		// publicUrl references Firebase. Policy on Firebase has been set to
		// service firebase.storage {
		// 	match /b/{bucket}/o {
		// 	  match /{allPaths=**} {
		// 		allow read
		// 		allow write: if request.auth != null;
		// 	  }
		// 	}
		// }

		return {
			service: 'cloudStorage',
			bucket: this.options.bucket,
			key: uploadInfo.key,
			uploadUrl,
			filetype: uploadInfo.filetype,
			metadata: metadata,
			publicUrl: 'https://firebasestorage.googleapis.com/v0/b/' + this.options.bucket + '/o/' + uploadInfo.key + '?alt=media'
		};
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

		// WORKAROUND: Sort metadata before signing with Google. Submitted bug info to Google.
		const sortedMeta = _(metadata).toPairs().sortBy(0).fromPairs().value();
		const newMetadata = {};
		for( let key in sortedMeta ){
			newMetadata[`x-goog-meta-${key.toLowerCase()}`] = String( sortedMeta[key] );
		}

		return newMetadata;
	}

}

module.exports = CloudStorageSigner
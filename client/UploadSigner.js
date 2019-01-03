import Request from './Request'

class UploadSigner {
	constructor( signUploadApiUrl ){
		this.signUploadApiUrl = signUploadApiUrl
	}

	async signUpload( fileInfo ){
		const result = await Request.performJsonRequest( {
			method: 'PUT',
			url: this.signUploadApiUrl,
			json: fileInfo
		} )

		if( result.json && result.json.service && result.json.uploadUrl ){ // sanity checks
			return result.json
		}else{
			throw new Error( `Error signing upload: invalid data returned: ${result.text}` )
		}
	}
}

export default UploadSigner

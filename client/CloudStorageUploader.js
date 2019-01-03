import Request from './Request'

// https://andrewvos.com/uploading-files-directly-to-google-cloud-storage-from-client-side-javascript/
class CloudStorageUploader {
	async upload( signedUploadInfo, blob, onprogress ){
		const request = {
			method: 'PUT',
			url: signedUploadInfo.uploadUrl,
			headers: {
				'Content-Type': signedUploadInfo.filetype
			},
			body: blob,
			onprogress
		}

		if( signedUploadInfo.metadata ){
			request.headers = { ...request.headers, ...signedUploadInfo.metadata }
		}

		const result = await Request.performRequest( request )
		if( result.status !== 200 ) throw new Error( `Error uploading image: ${result.status}, ${result.text}` )

		return {
			bucket: signedUploadInfo.bucket,
			key: signedUploadInfo.key,
			publicUrl: signedUploadInfo.publicUrl
		}
	}
}

export default CloudStorageUploader

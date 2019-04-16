import Request from './Request'

class S3Uploader {
	async upload( signedUploadInfo, blob, onprogress ){
		const request = {
			method: 'PUT',
			url: signedUploadInfo.uploadUrl,
			headers: {
				'Content-Type': signedUploadInfo.filetype,
				'x-amz-acl': 'public-read'
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

export default S3Uploader

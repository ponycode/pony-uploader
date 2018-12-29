
class Uploader {

	constructor( getSignedUploadApiUrl ){
		this.getSignedUploadApiUrl = getSignedUploadApiUrl
	}

	async upload( fileInfo, blob, onprogress ){
		const signedUploadInfo = await this._getSignedUpload( fileInfo )
		await this._uploadToS3( signedUploadInfo, fileInfo, blob, onprogress )
		return {
			publicUrl: signedUploadInfo.publicUrl
		}
	}

	async _uploadToS3( signedUploadResult, fileInfo, blob, progressCallback ){
		const result = await this._performRequest({
			method: 'PUT',
			url: signedUploadResult.uploadUrl,
			headers: {
				'Content-Type': fileInfo.filetype,
				'x-amz-acl': 'public-read'
			},
			body: blob,
			onprogress: progressCallback
		})
		if( result.status !== 200 ) throw new Error( `Error uploading image: ${uploadResult.status}, ${uploadResult.text}`)
	}

	async _getSignedUpload( fileInfo ){
		const result = await this._performJsonRequest({
			method: 'PUT',
			url: this.getSignedUploadApiUrl,
			json: fileInfo
		});

		if( result.json && result.json.uploadUrl ){
			return result.json;
		}else{
			throw new Error( `Error signing upload: no data returned: ${result.text}` )
		}
	}

	async _performJsonRequest( request ){
		request.headers = request.headers || {}
		request.headers['Accept'] = 'application/json'

		const result = await this._performRequest( request )

		try{
			result.json = JSON.parse( result.text )
		}catch( e ){}

		return result
	}

	_performRequest( request ){
		if( !request.method ) throw new Error('method is required')
		if( !request.url ) throw new Error('url is required')

		const xhr = this._createCORSRequest( request.method, request.url )
		if( !xhr ) throw new Error( 'File uploads are not supported by this browser.' );

		return new Promise( function( resolve, reject ){

			for( let header in request.headers ){
				xhr.setRequestHeader( header, request.headers[header] );
			}

			xhr.onload = function(){
				resolve({ status: xhr.status, text: xhr.responseText, xhr })
			}
	
			xhr.onerror = function( error ){
				reject( new Error( `A file upload error occurred: ${xhr.status}` ) )
			}
	
			if( xhr.upload && request.onprogress ){
				xhr.upload.onprogress = function( e ){
					const percent = Math.round(( e.loaded / e.total ) * 100 )
					request.onprogress( percent )
				}
			}

			try{
				if( request.json ){
					xhr.setRequestHeader( 'Content-Type', 'application/json' )
					const content = JSON.stringify( request.json )
					xhr.send( content )
				}else if( request.body ){
					xhr.send( request.body )
				}else{
					xhr.send()
				}
			}catch( e ){
				reject( e )
			}
		});
	}

	_createCORSRequest( method, url ){
		const xhr = new XMLHttpRequest()
		if( xhr.withCredentials !== null ){
			xhr.open( method, url, true )
		}else if( typeof XDomainRequest !== 'undefined' ){
			xhr = new XDomainRequest()
			xhr.open( method, url )
		}
		return xhr
	}

}

export default Uploader;

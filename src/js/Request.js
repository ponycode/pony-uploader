class Request {
	static async performJsonRequest( request ){
		request.headers = request.headers || {}
		request.headers['Accept'] = 'application/json'

		const result = await this.performRequest( request )

		try{
			result.json = JSON.parse( result.text )
		}catch( e ){}

		return result
	}

	static performRequest( request ){
		if( !request.method ) throw new Error( 'method is required' )
		if( !request.url ) throw new Error( 'url is required' )

		const xhr = this._createCORSRequest( request.method, request.url )
		if( !xhr ) throw new Error( 'File uploads are not supported by this browser.' )

		for( let header in request.headers ){
			console.log( `${header} : ${request.headers[header]}` )
			xhr.setRequestHeader( header, request.headers[header] )
		}

		return new Promise( function( resolve, reject ){
			xhr.onload = function(){
				resolve( { status: xhr.status, text: xhr.responseText, xhr } )
			}

			xhr.onerror = function( e ){
				const error = new Error( `A file upload error occurred: ${xhr.status}` )
				error.cause = e
				reject( error )
			}

			if( xhr.upload && request.onprogress ){
				xhr.upload.onprogress = function( e ){
					const percent = Math.round( ( e.loaded / e.total ) * 100 )
					request.onprogress( percent )
				}
			}

			try{
				if( request.json ){
					xhr.setRequestHeader( 'Content-Type', 'application/json' )
					xhr.send( JSON.stringify( request.json ) )
				}else if( request.body ){
					xhr.send( request.body )
				}else{
					xhr.send()
				}
			}catch( e ){
				reject( e )
			}
		} )
	}

	static _createCORSRequest( method, url ){
		let corsRequest = new XMLHttpRequest()
		if( corsRequest.withCredentials !== null ){
			corsRequest.open( method, url, true )
		}else if( typeof XDomainRequest !== 'undefined' ){
			corsRequest = new XDomainRequest()
			corsRequest.open( method, url )
		}
		return corsRequest
	}
}

export default Request

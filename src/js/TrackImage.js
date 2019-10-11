import Request from './Request'

class ImageIndex {
	constructor( imageIndexApiUrl ){
		this.imageIndexApiUrl = imageIndexApiUrl
	}

	async add( fileInfo ){
		const obj = fileInfo

		const result = await Request.performJsonRequest( {
			method: 'POST',
			url: this.imageIndexApiUrl,
			json: obj
		} )

		if( result.json ){
			return result.json
		}else{
			throw new Error( `Error adding image status: ${result.text}` )
		}
	}

	async persist( ref ){
		const result = await Request.performJsonRequest( {
			method: 'PUT',
			url: `${this.imageIndexApiUrl}/${this.bucket}/${ref}`
		} )

		if( result.json ){
			return result.json
		}else{
			throw new Error( `Error persisting image: ${result.text}` )
		}
	}

	async remove( ref ){
		const result = await Request.performJsonRequest( {
			method: 'DELETE',
			url: `${this.imageIndexApiUrl}/${this.bucket}/${ref}`
		} )

		if( result.json ){
			return result.json
		}else{
			throw new Error( `Error desisting image: ${result.text}` )
		}
	}
}

export default ImageIndex

import Request from './Request'

class ImageIndex {
	constructor( imageIndexApiUrl, imageCollection ){
		this.imageIndexApiUrl = imageIndexApiUrl
		this.imageCollection = imageCollection
	}

	async add( fileInfo ){
		const obj = fileInfo
		obj.collection = this.imageCollection

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
		console.info( `image ref => ${ref}` )
		const result = await Request.performJsonRequest( {
			method: 'PUT',
			url: `${this.imageIndexApiUrl}/${ref}`
		} )

		if( result.json ){
			return result.json
		}else{
			throw new Error( `Error persisting image: ${result.text}` )
		}
	}
}

export default ImageIndex

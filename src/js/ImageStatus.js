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
	async persist( fileInfo, key ){
		console.info( `fileInfo => ${JSON.stringify( fileInfo )}` )
		const result = await Request.performJsonRequest( {
			method: 'PUT',
			url: `${this.imageIndexApiUrl}/${key}`,
			json: fileInfo
		} )

		if( result.json ){
			return result.json
		}else{
			throw new Error( `Error adding image status: ${result.text}` )
		}
	}
}

export default ImageIndex

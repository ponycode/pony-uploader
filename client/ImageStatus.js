import Request from './Request'

class ImageStatus {
	constructor( imageStatusApiUrl, imageStatusCollection ){
		this.imageStatusApiUrl = imageStatusApiUrl
		this.imageStatusCollection = imageStatusCollection
	}

	async add( fileInfo ){
		const obj = fileInfo
		obj.collection = this.imageStatusCollection

		const result = await Request.performJsonRequest( {
			method: 'POST',
			url: this.imageStatusApiUrl,
			json: obj
		} )

		if( result.json ){
			return result.json
		}else{
			throw new Error( `Error adding image status: ${result.text}` )
		}
	}
	async update( fileInfo, key ){
		const result = await Request.performJsonRequest( {
			method: 'PUT',
			url: `${this.imageStatusApiUrl}/${key}`,
			json: fileInfo
		} )

		if( result.json ){
			return result.json
		}else{
			throw new Error( `Error adding image status: ${result.text}` )
		}
	}
}

export default ImageStatus

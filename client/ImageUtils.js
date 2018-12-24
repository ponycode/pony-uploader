 class ImageUtils {

	static arrayBufferFromImage( image ){
		return this.dataUriToArrayBuffer( image.src );
	}

	static dataViewFromImage( image ){
		const arrayBuffer = this.dataUriToArrayBuffer( image.src );
		return new DataView( arrayBuffer );
	}

	static dataUriToArrayBuffer( dataURI ){
		if( typeof dataURI !== 'string' ) throw new Error('Invalid argument: dataURI must be a string');
	
		var binary = atob( dataURI.split(',')[1] );
		var len = binary.length;
		var buffer = new ArrayBuffer(len);
		var view = new Uint8Array(buffer);
	
		for( var i = 0; i < len; i++ ){
			view[i] = binary.charCodeAt(i);
		}
	
		return buffer;
	}

 }

 export default ImageUtils;

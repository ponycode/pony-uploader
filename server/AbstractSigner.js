
class AbstractSigner {

	constructor( options = {} ){
		this.options = { ...{
			allowedFileTypes: ['image/png', 'image/jpg', 'image/jpeg'],
			maxFileSizeBytes: 1024 * 1024 * 5
		}, ...options }
	}

	_validateUpload( upload ){
		if( !upload.key ) return new Error( 'upload.key is required' )

		if( !upload.filesize ) return new Error( 'upload.filesize is required' )
		if( !this._isProperFileSize( upload.filesize ) ) return new Error( 'Filesize exceeds maximum filesize of ' + options.maxFileSizeBytes + ': ' + upload.filesize )

		if( !upload.filetype ) return new Error( 'upload.filetype is required' )
		if( !this._isValidFileType( upload.filetype ) ) return new Error( 'Invalid file type: ' + upload.filetype )

		return false
	}

	_isProperFileSize( filesize ){
		filesize = parseInt( filesize, 10 )
		return filesize <= this.options.maxFileSizeBytes
	}

	_isValidFileType( filetype ){
		filetype = filetype.toLowerCase()
		return this.options.allowedFileTypes.indexOf( filetype ) !== -1
	}

}

module.exports = AbstractSigner


const express = require( 'express' )
const app = express()
const bodyParser = require( 'body-parser' )
var cors = require( 'cors' )
const PORT = process.env.PORT || 3000

const dotenv = require( 'dotenv' )
dotenv.config()

const S3Signer = require( './S3Signer' )
const s3Signer = new S3Signer( {
	s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
	s3AccessKeySecret: process.env.S3_ACCESS_KEY_SECRET,
	bucket: process.env.S3_BUCKET
} )

const CloudStorageSigner = require( './CloudStorageSigner' )
const cloudStorageSigner = new CloudStorageSigner( {
	projectId: process.env.CLOUD_STORAGE_PROJECT_ID,
	credentials: require( './creds' ),
	bucket: process.env.CLOUD_STORAGE_BUCKET
} )

function formatKey ( folder, file ) {
	return folder ? `${folder}/${file}` : file
}

app.use( cors() )
app.use( bodyParser.json() )

app.post( '/index', ( req, res ) => {
	// this route should be used for adding metadata about the image to your index
	res.send( 'need to implement your own index for tracking stale images' )
} )

app.put( '/index', ( req, res ) => {
	// this route should be used for telling your index to persist the image
	res.send( 'need to implement your own index for tracking stale images' )
} )

app.put( '/s3/signature', async ( req, res ) => {
	try{
		const upload = await s3Signer.signUpload( {
			key: formatKey( req.body.foldername, req.body.filename ),
			filesize: req.body.filesize,
			filetype: req.body.filetype,
			metadata: req.body.metadata
		} )

		res.send( upload )
	}catch( e ){
		console.error( 'Error signing s3 upload: ', e )
		res.status( 500 ).send( { error: e.message || JSON.stringify( e ) } )
	}
} )

app.put( '/cloudStorage/signature', async ( req, res ) => {
	try{
		const upload = await cloudStorageSigner.signUpload( {
			key: formatKey( req.body.foldername, req.body.filename ),
			filesize: req.body.filesize,
			filetype: req.body.filetype,
			metadata: req.body.metadata
		} )

		res.send( upload )
	}catch( e ){
		console.error( 'Error signing cloudStorage upload: ', e )
		res.status( 500 ).send( { error: e.message || JSON.stringify( e ) } )
	}
} )

app.listen( PORT, () => console.log( `pony-upload server listening on port ${PORT}!` ) )

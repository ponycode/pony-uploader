
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const PORT = process.env.PORT || 3000

const dotenv = require('dotenv');
dotenv.config();

const S3Signer = require('./S3Signer')
const s3Signer = new S3Signer({
	s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
	s3AccessKeySecret: process.env.S3_ACCESS_KEY_SECRET,
	bucket: process.env.S3_BUCKET
})

const CloudStorageSigner = require('./CloudStorageSigner')
const cloudStorageSigner = new CloudStorageSigner({
	projectId: process.env.CLOUD_STORAGE_PROJECT_ID,
	credentials: require('./pony-uploader-232215-8bab2f1d42af.json'), //require( './pony-uploader-824979d2a049' ),
	bucket: process.env.CLOUD_STORAGE_BUCKET
})

app.use( bodyParser.json() )

app.put( '/api/images/uploads/s3/signature', async ( req, res ) => {
	try{
		const upload = await s3Signer.signUpload({
			key: 'test/' +  req.body.filename,
			filesize: req.body.filesize,
			filetype: req.body.filetype,
			metadata: req.body.metadata
		})
	
		// TODO: Store metadata and final S3 location to DB
		// Have a job perform cleanup on stranded images
	
		res.send( upload )
	}catch( e ){
		console.error( 'Error signing s3 upload: ', e )
		res.status(500).send({ error: e.message || JSON.stringify(e) })
	}
})

app.put( '/api/images/uploads/cloudStorage/signature', async ( req, res ) => {
	try{
		const upload = await cloudStorageSigner.signUpload({
			key: 'test/' + req.body.filename,
			filesize: req.body.filesize,
			filetype: req.body.filetype,
			metadata: req.body.metadata
		})
	
		// TODO: Store metadata and final S3 location to DB
		// Have a job perform cleanup on stranded images
	
		res.send( upload )
	}catch( e ){
		console.error( 'Error signing cloudStorage upload: ', e )
		res.status(500).send({ error: e.message || JSON.stringify(e) })
	}
})

app.listen( PORT, () => console.log(`pony-upload server listening on port ${PORT}!`))

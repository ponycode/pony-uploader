
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const PORT = process.env.PORT || 3000

const S3Signer = require('./S3Signer');
const s3Signer = new S3Signer({
	s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
	s3AccessKeySecret: process.env.S3_ACCESS_KEY_SECRET,
	bucket: process.env.S3_BUCKET
});

app.use( bodyParser.json() )

app.put( '/api/images/uploads/signature', async ( req, res ) => {
	const upload = await s3Signer.signUpload({
		key: 'test/' +  req.body.filename,
		filesize: req.body.filesize,
		filetype: req.body.filetype
	})

	// TODO: Store metadata to DB

	res.send( upload )
})

app.listen( PORT, () => console.log(`pony-upload server listening on port ${PORT}!`))

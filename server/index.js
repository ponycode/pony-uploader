
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const PORT = process.env.PORT || 3000

const s3Upload = require('./s3Upload')({
	s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
	s3AccessKeySecret: process.env.S3_ACCESS_KEY_SECRET,
	bucket: process.env.S3_BUCKET
});

app.use( bodyParser.json() )

app.get( '/api/images/uploads/signature', ( req, res ) => {
	const upload = s3Upload.getSignedUpload({
		key: req.body.key,
		filename: req.body.filename,
		filesize: req.body.filesize,
		filetype: req.body.filetype
	})

	// TODO: Store metadata to DB

	res.send( upload )
})

app.listen( PORT, () => console.log(`pony-upload server listening on port ${PORT}`))

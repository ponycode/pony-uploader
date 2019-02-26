# pony-uploader

Pony uploader is a simple drag & drop image uploader which will send image directly to Amazon S3. This project contains a server component which will work well with express, a client side component, and a full example project. Pony-uploader uses several HTML5 features and will probably not work on older browsers.


## Getting Started
Clone the repo [https://github.com/ponycode/pony-uploader.git](https://github.com/ponycode/pony-uploader.git) and run `npm install`.

Next, go into the example folder and run `npm install`. To start the server run `node app/apps.js` and go to http://localhost:3000 in a browser.

```bash
$ git clone https://github.com/ponycode/pony-uploader
$ cd pony-uploader
$ npm install
$ cd example
$ npm install
$ node server.js
```

# Picking the client apart
The client is made of 3 components: an image resizer, an uploader, and a jQuery plugin. If you don't wish to use the HTML & CSS provided
by pony-uploader, you can use the image resizer and uploader independently.

### The uploader

* `getSignedUpload( signatureUrl, fileData, callback )` - This method will call your server to get a signed S3 upload url. The response will contain the upload url, the complete url, and what will be the images public S3 url.
* `uploadToS3( uploadUrl, uploadData, progressCallback, callback )` - This method sends the image's raw data to S3 using the signed S3 upload url.
* `completeUpload( completeUrl, callback )` - This method will call your server to let it know that the upload is complete. This is so that you can keep image references in the database and know which images were uploaded successfully.

### The image resizer

* resizeFile( file, maxWidth, maxHeight, callback ) - This method takes an HTML file object

### The jQuery plugin

* ponyUpload() - This method can be called on your .dropZone element. It will wire the drag & drop events, and expect to handle the state changes as files are uploaded. Your .dropZone element
must have a `data-signUrl` which tells the plugin what URL to call to get a signed upload url. This route will be mostly handled by pony-uploader.

```html
<div class="dropZone dropZoneDefault" data-signUrl="{signatureUrl}">
    <div class="defaultMessage text-center">
        <h3>Drag files here</h3>
    </div>
    <div class="dropMessage text-center">
        <h3>Now drop it</h3>
    </div>
    <div class="uploading text-center">
        <h3>Uploading</h3>
        <div class="progress">
            <div class="progress-bar progress-bar-warning progress-bar-striped" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 0;"></div>
        </div>
    </div>
    <div class="complete text-center">
        <h3>All Done!</h3>
    </div>
    <div class="error text-center">
        <h3>Oops!</h3>
        <p class="errorMessage">Error uploading file</p>
    </div>
</div>
```

# Integrating the server component

You can integrate the server component by requiring pony-uploader:

```javascript

var ponyUploaderOptions = {
    bucket: config.get("s3.bucket"),
    s3AccessKeyId: config.get("s3.accessKey"),
    s3AccessKeySecret: config.get("s3.secretKey")
};

var ponyUploader = require('pony-uploader')( ponyUploaderOptions );

app.get( "/uploads/sign", function( req, res ){

    var filename = req.query['filename'];
    var filetype = req.query['filetype'];
    var filesize = req.query['filesize'];
    var width = req.query['width'] || 0;
    var height = req.query['height'] || 0;

    filename = _sanitizeFilename( filename );

    // This is your chance to load the image data into your database.
    // You'll also need to create an S3 key for your image.
    var image = new Image();
    image.uploadedBy = req.user;
    image.s3Key = (new Date().getTime()/1000) + "-" + filename;
    image.width = width;
    image.height = height;

    var upload = {
        key: image.s3Key,
        filename: filename,
        filetype: filetype,
        filesize: filesize,
        completeUrl: req.protocol + '://' + req.get('host') + "/uploads/" + image.id + "/complete"
    };

    ponyUploader.getS3UploadSignature( upload, function( error, result ){
        if( error ){
            res.status( 500 ).send( "Error signing file for upload" );
            return;
        }

        // This is a good place to save the image because the signature may be rejected it is the wrong filetype or too big
        image.url = result.publicUrl;
        image.save( function( error, image ) {
            if (error) {
                console.error("Error creating image: ", error);
                res.status(500).send("Error creating image");
                return;
            }
            res.send( result );
        });
    });

});
```

## License
Copyright (c) 2015 Joshua Kennedy
Licensed under the MIT license.

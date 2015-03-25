( function(){
    'use strict';

    var authentication = require('../lib/authentication');
    var protect = authentication.protect;
    var path = require('path');
    var mongoose = require('mongoose');
    var Image = mongoose.model('Image');
    var config = require('pony-config');
    var fs = require('fs');

    var s3UploadOptions = {
        bucket: config.get("s3.bucket"),
        s3AccessKeyId: config.get("s3.accessKey"),
        s3AccessKeySecret: config.get("s3.secretKey")
    };

    var s3Upload = require('../../index')( s3UploadOptions );


    module.exports = function( app ){
        app.get( "/", protect, getRoot );

        app.get( "/uploads/sign", function( req, res ){

            var filename = req.query['filename'];
            var filetype = req.query['filetype'];
            var filesize = req.query['filesize'];
            var width = req.query['width'] || 0;
            var height = req.query['height'] || 0;

            filename = _sanitizeFilename( filename );

            var image = new Image();
            image.uploadedBy = req.user;
            image.s3Key = (new Date().getTime()/1000) + "-" + filename;
            image.url =
            image.width = width;
            image.height = height;

            var upload = {
                key: image.s3Key,
                filename: filename,
                filetype: filetype,
                filesize: filesize,
                completeUrl: req.protocol + '://' + req.get('host') + "/uploads/" + image.id + "/complete"
            };

            s3Upload.getS3UploadSignature( upload, function( error, result ){
                if( error ){
                    res.status( 500 ).send( "Error signing file for upload" );
                    return;
                }

                image.url = result.publicUrl;
                image.save( function( error, image ) {
                    if (error) {
                        console.error("Error creating image: ", error);
                        res.status(500).send("Error creating image");
                        return;
                    }

                    res.send(result);
                });
            });

        });

        app.get( "/uploads/:imageId/complete", function( req, res ){
            Image.findById( req.params.imageId, function( error, image ){
                if( error ){
                    res.status( 404).send({ status: "error", "message": "Image not found" });
                    return;
                }

                image.complete = true;
                image.save( function( error, image ){
                    if( error ){
                        res.status( 404).send({ status: "error", "message": "Error saving image" });
                        return;
                    }

                    res.send({
                        status: "success",
                        url: image.url,
                        width: image.width,
                        height: image.height
                    });
                });
            });
        });
    };

    function _sanitizeFilename( filename ){
        filename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        filename = filename.substring( 0, 30 );
        return filename;
    }

    function getRoot( req, res ){
        res.render('index');
    }
	
})();
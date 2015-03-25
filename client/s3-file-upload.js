;var s3FileUpload = ( function( $, window, document, undefined ){

    function _completeUpload( completeUrl, callback ){
        var req = {
            url: completeUrl
        };

        _getJSON( req, function( error, jsonResponse ){
            if( error ){
                callback( error, false );
                return;
            }

            callback( false, jsonResponse );
        });
    }

    function _getSignedUpload( signatureUrl, fileData, callback ){
        var req = {
          url: signatureUrl += "?filename=" + fileData.filename + "&filesize=" + fileData.filesize + "&filetype=" + fileData.filetype + "&width=" + fileData.width + "&height=" + fileData.height
        };

        _getJSON( req, function( error, jsonResponse ){
            if( error ){
                callback( error, false );
                return;
            }

            if( jsonResponse && jsonResponse.uploadUrl && jsonResponse.completeUrl ){
                callback( false, jsonResponse );
            }else{
                callback( new Error( "Error signing upload: no data returned" ), false );
            }
        });
    }

    function _uploadToS3( uploadUrl, uploadData, progressCallback, callback ){
        var xhr = _createCORSRequest( 'PUT', uploadUrl );
        if( !xhr ){
            console.error( "CORS is not support." );
            callback( new Error( "File uploads are not supported by this browser." ) );
            return;
        }

        xhr.onload = function(){
            if( xhr.status === 200 ){
                callback( false, true );
            }else{
                callback( new Error( "A file upload error occurred: " + xhr.status ), false );
            }
        };

        xhr.onerror = function(){
            callback( new Error( "A file upload error occurred: " + xhr.status ), false );
        };

        xhr.upload.onprogress = function( e ){
            var percentLoaded = Math.round(( e.loaded / e.total ) * 100 );
            if( progressCallback ) progressCallback( percentLoaded );
        };

        xhr.setRequestHeader( 'Content-Type', uploadData.filetype );
        xhr.setRequestHeader( 'x-amz-acl', 'public-read' );
        return xhr.send( uploadData.blob );
    }

    function _getJSON( request, callback ){
        var xhr = _createCORSRequest( 'GET', request.url );
        if( !xhr ){
            console.error( "XHR is not support." );
            callback( new Error( "File uploads are not supported by this browswer." ) );
            return;
        }

        xhr.onload = function(){
            if( xhr.status === 200 ){
                var json = false;
                try{
                    json = JSON.parse( this.responseText );
                }catch( e ){
                    console.error( "Error parsing json response: ", this.responseText );
                }
                callback( false, json );
            }else{
                callback( new Error( "An HTTP error occurred: " + xhr.status ) );
            }
        };

        xhr.onerror = function(){
            callback( new Error( "An error occurred [" + xhr.status + "]: " + xhr.responseText ) );
        };

        xhr.upload.onprogress = function( e ){
            var percentLoaded = Math.round(( e.loaded / e.total ) * 100 );
            if( request.progressCallback ) request.progressCallback( percentLoaded );
        };

        return xhr.send();
    }

    function _createCORSRequest( method, url ){
        var xhr;
        xhr = new XMLHttpRequest();
        if( xhr.withCredentials != null ){
            xhr.open( method, url, true );
        }else if( typeof XDomainRequest !== "undefined" ){
            xhr = new XDomainRequest();
            xhr.open( method, url );
        } else {
            xhr = null;
        }
        return xhr;
    }

    return{
        getSignedUpload: _getSignedUpload,
        uploadToS3: _uploadToS3,
        completeUpload: _completeUpload
    };

})( jQuery, window, document );



;var s3FileResize = ( function( $, window, document, undefined ){

    function _resizeFile( file, maxWidth, maxHeight, callback ){
        var fileLoader = new FileReader();
        var canvas = document.createElement('canvas');
        var imageObj = new Image();
        var dataType = "image/png";

        if( file.type.match('image.*') ){
            fileLoader.readAsDataURL( file );
        } else {
            callback( new Error("The input file is not an image."), false );
        }

        fileLoader.onload = function(){
            imageObj.src = this.result; // triggers image load
        };

        fileLoader.onabort = function(){
            callback( new Error("The file read was aborted."), false );
        };

        fileLoader.onerror = function(){
            callback( new Error("An error occured while reading the file."), false );
        };

        imageObj.onload = function(){
            var image = this;
            if( image.width == 0 || image.height == 0 ){
                callback( new Error("The image is empty."), false );
            }else{

                var newWidth = 0;
                var newHeight = 0;

                if( this.width > maxWidth || image.height > maxHeight ){
                    var widthRatio = image.width / maxWidth;
                    var heightRatio = image.height / maxHeight;

                    if( widthRatio < heightRatio ){
                        newWidth = image.width / heightRatio;
                        newHeight = maxHeight;
                    }else{
                        newWidth = maxWidth
                        newHeight = image.height / widthRatio;
                    }
                }else{
                    newWidth = image.width;
                    newHeight = image.height;
                }

                var context = canvas.getContext('2d');
                canvas.id = "hiddenCanvas";
                canvas.width = newWidth;
                canvas.height = newHeight;
                canvas.style.visibility   = "hidden";
                document.body.appendChild( canvas );

                context.clearRect( 0, 0, newWidth, newHeight );
                context.drawImage( imageObj, 0, 0, image.width, image.height, 0, 0, newWidth, newHeight );

                // for debugging
                //var img = document.createElement("img");
                //img.src = canvas.toDataURL();
                //document.body.appendChild( img );

                _dataUriToBlob( canvas.toDataURL( dataType ), dataType, function( error, blob ){

                    document.body.removeChild( canvas );

                    if( error ){
                        callback( error, false );
                        return;
                    }

                    var result = {
                        blob: blob,
                        width: newWidth,
                        height: newHeight,
                        originalWidth: image.width,
                        originalHeight: image.height,
                        dataType: dataType,
                        originalDataType: file.type
                    };

                    callback( false, result );
                });
            }
        };

        imageObj.onabort = function() {
            callback( new Error("Image load was aborted."), result );
        };

        imageObj.onerror = function() {
            callback( new Error("An error occured while loading image."), result );
        };
    }

    function _dataUriToBlob( dataURI, dataType, callback ){
        if( typeof dataURI !== 'string' ){
            throw new Error('Invalid argument: dataURI must be a string');
        }

        if( typeof atob === undefined || typeof Uint8Array === undefined || typeof Blob === undefined ){
            callback( new Error('Browser will not support image resizing.'), false );
        }

        var binary = atob( dataURI.split(',')[1] );
        var array = [];
        for( var i = 0; i < binary.length; i++ ){
            array.push( binary.charCodeAt(i) );
        }

        callback( false, new Blob([ new Uint8Array( array ) ], { type: dataType } ) );
    }

    return{
        resizeFile: _resizeFile
    };

})( jQuery, window, document );





/*


;(function ( $, window, document, undefined ){
	var pluginName = 'curtziImageUploader';

	var defaults = {
		croppedImageWidth: 200,
		croppedImageHeight: 200,
		stretch: 10,
		zoom: 10,
		s3Filename: false,
		mimeType: "image/jpeg",
		signingUrl: false,
		initialCropMaxDimension: 1000,
		prefix: null,
		id: null
	};

	function CurtziUploader( wrapper, options ) {
		this.wrapper = $(wrapper);

		var valuesFromMarkup = this.wrapper.data();

		this.options = $.extend( {}, defaults, valuesFromMarkup, options );

		this._defaults = defaults;
		this._name = pluginName;
		this.$chosenImage = false;
		self.focalPoint = { x: 0, y: 0 };
		self.percent = 0;
		self.minPercent = 0;
		self.cropResults = { cropX: 0, cropY: 0, cropW: 0, cropH: 0, stretch: 0 }
		this.init();
	}

	CurtziUploader.prototype.init = function(){
		var self = this;
		self.wrapper.css({
			width: self.options.croppedImageWidth,
			height: self.options.croppedImageHeight
		});


		self.options.signingUrl = '/aws/s3/applications/' + self.options.id + '/signPut';
		self.options.s3Filename = self.options.prefix + "-" + self.options.id;

		var $dropTarget = self.wrapper.find('.dropTarget');
		var $fileInput = self.wrapper.find('.fileInput');

		$dropTarget.on( 'click', function( event ){
			event.stopPropagation();
			event.preventDefault();
			self.wrapper.find('.fileInput').click();
		});

		$fileInput.on( 'change', function( event ){
			event.stopPropagation();
			event.preventDefault();

			var selectedFiles = false;
			if( event && event.target && event.target.files ){
				selectedFiles = event.target.files;
			}
			if( !selectedFiles || selectedFiles.length === 0 ) return;

			self.beginCropMode( selectedFiles[0] );
		});

		self.wrapper.find('.uploadMessage').click( function(){
			event.stopPropagation();
			event.preventDefault();
			self.wrapper.find('.fileInput').click();
		});

		self.chooseMode();
	};

	CurtziUploader.prototype.chooseMode = function(){
		var self = this;
		var $img = self.wrapper.find('.photoLayer img');
		var url = $img.attr('src');
		if( url && url.length > 0 ){
			self.beginPhotoMode();
		} else {
			self.beginEmptyMode();
		}
	};

	CurtziUploader.prototype.beginEmptyMode = function(){
		var self = this;
		self.wrapper.find('.fileInput').val('');
		self.wrapper.removeClass('curtziUploadMode curtziCropMode curtziPhotoMode').addClass('curtziEmptyMode');
	};

	CurtziUploader.prototype.beginCropMode = function( imageFile ){
		var self = this;

		self.wrapper.find('.cropCancel').click( function(){
			self.chooseMode();
		});

		self.readImageFile( imageFile, $.proxy( self.setupCropper, self ) );

		self.wrapper.removeClass('curtziUploadMode curtziPhotoMode curtziEmptyMode').addClass('curtziCropMode');
	};

	CurtziUploader.prototype.beginUploadMode = function( callback ){
		var self = this;

		$('.uploadStatus').text("Uploading...");
		self.wrapper.removeClass('curtziCropMode curtziEmptyMode curtziPhotoMode').addClass('curtziUploadMode');

		var imageDataURI = self.dataForImageWithCropResults();
		self.uploadToS3( imageDataURI, self.options.s3Filename, function( error, result ){
			console.log( "DONE WITH S3 UPLOAD: ", error, result );
			if( error ){
				var $tryAgain = $('<a href="#">try again</a>' );
				$tryAgain.click( function( e ){
					e.preventDefault();
					self.beginUploadMode();
				});
				$('.uploadStatus').html('Please ').append( $tryAgain );
				return;
			}

			if( result && result.status === "success" ){
				self.wrapper.find('.photoLayer img').attr( "src", result.publicUrl + "?" + new Date().getTime()).show();
				$('.imageUrl').val( result.publicUrl );
				if( self.$chosenImage ) self.$chosenImage.remove();
				self.$chosenImage = false;
				self.beginPhotoMode();

				if( callback ){
					callback();
				}
			}else{
				// TODO: show error in UI
			}
		});
	};

	CurtziUploader.prototype.beginPhotoMode = function(){
		var self = this;
		self.wrapper.find('.fileInput').val('');
		self.wrapper.removeClass('curtziUploadMode curtziCropMode curtziEmptyMode').addClass('curtziPhotoMode');
	};

	CurtziUploader.prototype.setupCropper = function( $croppedImage ){
		var self = this;

		if( self.$chosenImage ) self.$chosenImage.remove();
		self.$chosenImage = $croppedImage;

		self.wrapper.find('.cropLayer').html( self.$chosenImage );
		self.wrapper.find('.photoLayer img').hide();
		self.wrapper.find('.backgroundLayer').hide();
		self.wrapper.find('.cropPlus').click( $.proxy( self.zoomIn, self ) );
		self.wrapper.find('.cropMinus').click( $.proxy( self.zoomOut, self ) );
		self.wrapper.find('.cropCancel').click( $.proxy( self.cancelCrop, self ));
		self.wrapper.find('.cropSave').click( $.proxy( self.performCrop, self ) );

		self.$chosenImage.on( 'mousedown.curtzi', function( event ){
			event.preventDefault();

			$(document).on( 'mousemove.curtzi', {
				mouse: { x: event.pageX, y: event.pageY },
				image: { x: parseInt( self.$chosenImage.css('left'), 10 ), y: parseInt( self.$chosenImage.css('top'), 10 ) }
			}, $.proxy( self.handleDrag, self ) ).on('mouseup.curtzi', function(){
				$(document).off('.curtzi');
			});

		});

		// TODO: no idea what this block is doing ... seems like some kind of compatibility issue ... wierd
		var img = new Image();
		if( img.naturalWidth === undefined ){
			img.src = self.$chosenImage.attr('src'); // should not need to wait image load event as src is loaded
			self.$chosenImage.prop( 'naturalWidth', img.width );
			self.$chosenImage.prop( 'naturalHeight', img.height );
		}

		var width = self.$chosenImage.prop('naturalWidth');
		var height = self.$chosenImage.prop('naturalHeight');

		self.minPercent = Math.max( width ? self.options.croppedImageWidth / width : 1, height ? self.options.croppedImageHeight / height : 1 );

		self.focalPoint = { x: Math.round( width / 2 ), y: Math.round( height / 2 ) };

		self.zoom( self.minPercent );

//        self.$chosenImage.fadeIn('fast');
	};

	CurtziUploader.prototype.handleDrag = function( event ){
		var self = this;
		self.$chosenImage.css({
			left: self.imageFill( event.data.image.x + event.pageX - event.data.mouse.x, self.$chosenImage.width(), self.options.croppedImageWidth ),
			top: self.imageFill( event.data.image.y + event.pageY - event.data.mouse.y, self.$chosenImage.height(), self.options.croppedImageHeight )
		});
		self.updateCrop();
	};

	CurtziUploader.prototype.imageFill = function( value, target, container ){
		if( value + target < container ) value = container - target;
		return value > 0 ? 0 : value;
	}

	CurtziUploader.prototype.zoomIn = function( event ){
		event.preventDefault();
		var self = this;
		return !! self.zoom( self.percent + 1 / ( self.options.zoom - 1 || 1 ) );
	}

	CurtziUploader.prototype.zoomOut = function( event ) {
		event.preventDefault();
		var self = this;
		return !! self.zoom( self.percent - 1 / ( self.options.zoom - 1 || 1 ) );
	}

	CurtziUploader.prototype.zoom = function( percent ){
		var self = this;

		self.percent = Math.max( self.minPercent, Math.min( self.options.stretch, percent ) );
		self.$chosenImage.width( Math.ceil( self.$chosenImage.prop( 'naturalWidth' ) * self.percent ) );
		self.$chosenImage.height( Math.ceil( self.$chosenImage.prop( 'naturalHeight' ) * self.percent ) );
		self.$chosenImage.css({
			left: self.imageFill( - Math.round( self.focalPoint.x * self.percent - self.options.croppedImageWidth / 2 ), self.$chosenImage.width(), self.options.croppedImageWidth ),
			top: self.imageFill( - Math.round( self.focalPoint.y * self.percent - self.options.croppedImageHeight / 2 ), self.$chosenImage.height(), self.options.croppedImageHeight )
		});
		self.updateCrop();
	}

	CurtziUploader.prototype.updateCrop = function(){
		var self = this;

		self.focalPoint = {
			x: Math.round( ( self.options.croppedImageWidth / 2 - parseInt( self.$chosenImage.css( 'left' ), 10 ) ) / self.percent ),
			y: Math.round( ( self.options.croppedImageHeight / 2 - parseInt( self.$chosenImage.css( 'top' ), 10 ) ) / self.percent )
		};

		self.cropResults = {
			cropX: - Math.floor( parseInt( self.$chosenImage.css( 'left' ), 10 ) / self.percent ),
			cropY: - Math.floor( parseInt( self.$chosenImage.css( 'top' ), 10 ) / self.percent ),
			cropW: Math.round( self.options.croppedImageWidth / self.percent ),
			cropH: Math.round( self.options.croppedImageHeight / self.percent ),
			stretch: self.percent > 1
		};
	};

	CurtziUploader.prototype.cancelCrop = function( event ){
		event.preventDefault();
		var self = this;
		self.wrapper.find('.photoLayer img').show();
		self.wrapper.find('.backgroundLayer').show();
		if( self.$chosenImage ) self.$chosenImage.remove();
		self.$chosenImage = false;
		self.chooseMode();
	};

	CurtziUploader.prototype.performCrop = function( event ){
		event.preventDefault();
		var self = this;
		if( !self.$chosenImage ){
			self.chooseMode();
			return;
		}

		if (!self.options.deferUpload) {
			self.beginUploadMode();
		}
	};

	CurtziUploader.prototype.performSave = function( callback ){
		self.beginUploadMode( callback );
	};

	CurtziUploader.prototype.dataForImageWithCropResults = function( mimeType ){
		var self = this;
		var $canvas = $('<canvas/>', { 'Width': self.options.croppedImageWidth, 'Height': self.options.croppedImageHeight });
		var context = $canvas.get(0).getContext('2d');
		context.drawImage( self.$chosenImage.get(0), self.cropResults.cropX, self.cropResults.cropY, self.cropResults.cropW, self.cropResults.cropH, 0, 0, self.options.croppedImageWidth, self.options.croppedImageHeight );
		var data = $canvas.get(0).toDataURL( mimeType );
		$canvas.remove();
		return data;
	};

	CurtziUploader.prototype.readImageFile = function( file, callback ){
		if( !file ) return;
		var self = this;

		var reader = new FileReader();
		reader.onload = function( e ){
			// Load the read image into an <img>, continue once the image is loaded
			var image = new Image();
			image.onload = function(){
				var croppedImg = self.scaleImageAspectFitWidth( this, self.options.initialCropMaxDimension );
				if( callback ) callback( $(croppedImg) );
			};
			image.src = e.target.result;
		};
		reader.readAsDataURL( file );
	};

	CurtziUploader.prototype.scaleImageAspectFitWidth = function( img, cropWidth ){
		var self = this;
		var $canvas = self.createTemporaryCanvasAndDrawImageWithWidth( img, cropWidth );
		var croppedImg = $(['<img src="', $canvas.get(0).toDataURL("image/png") + '"/>'].join('')).get(0);
		$canvas.remove();
		return croppedImg;
	};

	CurtziUploader.prototype.createTemporaryCanvasAndDrawImageWithWidth = function( img, width ){
		var cropHeight = img.height * (width / img.width);
		var $canvas = $( '<canvas/>', { 'Width':width, 'Height':cropHeight } );
		var context = $canvas.get(0).getContext('2d');
		context.drawImage( img, 0, 0, $canvas.attr('Width'), $canvas.attr('Height') );
		return $canvas;
	};


	CurtziUploader.prototype.uploadToS3 = function( imageData, filename, callback ){
		var self = this;
		self.getSignedPutUrl( filename, function( error, result ){
			if( error ) return callback( error, false );
			self.putImageDataToS3( imageData, result.signedUrl, result.publicUrl, callback );
		});
	};

	CurtziUploader.prototype.getSignedPutUrl = function( filename, callback ){
		var self = this;
		var fullUrl = self.options.signingUrl + '?mimeType=' + self.options.mimeType + '&fileName=' + encodeURIComponent( filename );

		$.ajax({
			url: fullUrl,
			timeout: 6000
		}).done( function( data ){
			callback( false, data );
		}).fail( function(){
			callback( "error signing S3 url", false );
		});
	};


	CurtziUploader.prototype.dataURItoBlob = function( dataURI ){
		var binary = atob( dataURI.split(',')[1] );
		var array = [];
		for( var i = 0; i < binary.length; i++ ){
			array.push( binary.charCodeAt(i) );
		}
		return new Blob([new Uint8Array( array )], {type: 'image/jpeg'} );
	};

	CurtziUploader.prototype.putImageDataToS3 = function( imageData, signedUrl, publicUrl, callback ){
		var self = this;
		var blob = self.dataURItoBlob( imageData );

		function _uploadProgress(){
			console.log( "PROGRESS: ", arguments );
		}

		$.ajax({
			url: signedUrl,
			type: "PUT",
			timeout: 12000,
			headers: {
				'Content-Type': self.options.mimeType,
				'x-amz-acl': 'public-read'
			},
			xhrFields: {
				withCredentials: true
			},
			data: blob,
			processData: false,
			xhr: function(){
				// Override to hook upload progress
				var myXhr = $.ajaxSettings.xhr();
				if( myXhr.upload ){
					myXhr.upload.addEventListener( 'progress', _uploadProgress, false );
				}
				return myXhr;
			}
		}).done( function( error, success, xhr ){

			if( error ) return callback( error, { status: "failure", message: error } );

			console.log( "Uploaded that shit", { status: "success", publicUrl: publicUrl } );
			callback( error, { status: "success", publicUrl: publicUrl } );

		}).fail( function(){

			console.log( "error uploading to s3 url", arguments, signedUrl, publicUrl );
			callback( "error uploading to s3 url", { status: "failure", message: "error uploading to s3 url" } );

		});
	};

	$.fn[pluginName] = function( options ){
		return this.each( function(){
			if( !$.data( this, 'plugin_' + pluginName ) ){
				$.data( this, 'plugin_' + pluginName, new CurtziUploader( this, options ) );
			}
		});
	}


})( jQuery, window, document );
 */
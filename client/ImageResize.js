import ImageUtils from './ImageUtils'

class ImageResize {

	static async resizeLoadedImage( loadedImage, options ){
		if( !ImageUtils.browserCanLoadImages() ) return null

		const image = this.scaleAndRotateImage( loadedImage, options )

		return image
	}

	static scaleAndRotateImage( loadedImage, options = {} ){
		const orientation = ( loadedImage.exif ) ? loadedImage.exif.Orientation : 1
		const scaledDimensions = this.determineScaledDimensions( loadedImage, options )

		const canvasWidth = options.width || scaledDimensions.width
		const canvasHeight = options.height || scaledDimensions.height
		const canvasBackgroundFillStyle = options.backgroundFillStyle || '#FFF'

		const canvas = this.buildOrientedCanvas( canvasWidth, canvasHeight, orientation )
		const context = canvas.getContext('2d')

		const destinationX = Math.floor( (canvasWidth - scaledDimensions.width ) / 2.0 )
		const destinationY = Math.floor( (canvasHeight - scaledDimensions.height ) / 2.0 )

		context.fillStyle = canvasBackgroundFillStyle
		context.fillRect( 0, 0, canvasWidth, canvasHeight )

		context.drawImage( loadedImage.image, 0, 0, loadedImage.image.width, loadedImage.image.height, destinationX, destinationY, scaledDimensions.width, scaledDimensions.height )

		const dataUrl = canvas.toDataURL( 'image/jpeg', options.jpgQuality || 0.8 )
		document.body.removeChild( canvas )

		const resizedImage = ImageUtils.dataUrlToImage( dataUrl )

		const metadata = { ...loadedImage.metadata }
		metadata['original-width'] = loadedImage.width
		metadata['original-height'] = loadedImage.height
		metadata['width'] = scaledDimensions.width
		metadata['height'] = scaledDimensions.height

		return {
			image: resizedImage,
			width: resizedImage.width,
			height: resizedImage.height,
			file: loadedImage.file,
			exif: loadedImage.exif,
			metadata
		}
	}

	static determineScaledDimensions( image, options ){
		let newWidth = image.width
		let newHeight = image.height

		let maxWidth = newWidth
		let maxHeight = newHeight

		if( options ){
			maxWidth = options.width
			maxHeight = options.height
		}

		if( image.width > maxWidth || image.height > maxHeight ){
			const widthRatio = image.width / maxWidth
			const heightRatio = image.height / maxHeight

			if( widthRatio < heightRatio ){
				newWidth = image.width / heightRatio
				newHeight = maxHeight
			}else{
				newWidth = maxWidth
				newHeight = image.height / widthRatio
			}
		}

		return {
			width: Math.floor( newWidth ),
			height: Math.floor( newHeight )
		}
	}

	static buildOrientedCanvas( width, height, orientation = 1 ){
		if( orientation > 8 ) orientation = 1

		const canvas = document.createElement('canvas')
		canvas.id = 'hiddenCanvas'
		canvas.width = width
		canvas.height = height
		canvas.style.visibility = 'hidden'

		if( orientation > 4 ){
			canvas.width = height
			canvas.height = width
		}

		const context = canvas.getContext('2d')
		switch( orientation ){
			case 2:
				// horizontal flip
				context.translate(width, 0)
				context.scale(-1, 1)
				break
			case 3:
				// 180° rotate left
				context.translate(width, height)
				context.rotate(Math.PI)
				break
			case 4:
				// vertical flip
				context.translate(0, height)
				context.scale(1, -1)
				break
			case 5:
				// vertical flip + 90 rotate right
				context.rotate(0.5 * Math.PI)
				context.scale(1, -1)
				break
			case 6:
				// 90° rotate right
				context.rotate(0.5 * Math.PI)
				context.translate(0, -height)
				break
			case 7:
				// horizontal flip + 90 rotate right
				context.rotate(0.5 * Math.PI)
				context.translate(width, -height)
				context.scale(-1, 1)
				break
			case 8:
				// 90° rotate left
				context.rotate(-0.5 * Math.PI)
				context.translate(-width, 0)
				break
		}
		document.body.appendChild( canvas )
		return canvas
	}

}

export default ImageResize

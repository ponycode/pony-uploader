<template>
	<div class="ponyImage">
		<div
			class="dropZone"
			:class="dropZoneClass"
			:style="{ width: width + 'px', height: height + 'px' }"
			ref="dropZone"
		>
			<div 
				v-show="state === 'empty'"
				class="panel dropPanel"
				@dragenter.prevent="_dragEnter"
				@dragleave.prevent="_dragLeave"
				@dragover.prevent="_dragOver"
				@drop.prevent="_drop"
				@click="$refs.fileInput.click()"
			>
				<label v-if="!acceptDrop" class="selectFile">
					<input type="file" accept="image/png, image/jpeg, image/jpg" multiple="false" @change="_selectedFile" ref="fileInput" />
					Select Image
					<p class="details">{{imageWidth}} x {{imageHeight}} jpg or png</p>
				</label>
				<h3 v-else>Drop Image</h3>
			</div>
			<div v-show="state !== 'empty'">
				<div class="uploadOverlay" v-show="state !== 'uploading'">
					<p>Uploading</p>
					<div class="progress"><div class="progressPercent"></div></div>
				</div>
				<div class="panel" ref="preview"></div>
			</div>
		</div>
	</div>
</template>

<script>
import LocalImageLoader from './LocalImageLoader.js'
import ImageResize from './ImageResize.js'
import Uploader from './Uploader.js'
import ImageUtils from './ImageUtils.js';

export default {
	name: 'vue-image-upload',
	props: {
		imageUrl: {
			type: String,
			required: false
		},
		signatureUrl: {
			type: String,
			required: true
		},
		width: {
			type: Number,
			required: false,
			default: 200
		},
		height: {
			type: Number,
			required: false,
			default: 200
		},
		imageWidth: {
			type: Number,
			required: false,
			default: 200
		},
		imageHeight: {
			type: Number,
			required: false,
			default: 200
		},
		jpgQuality: {
			type: Number,
			required: false,
			default: 1
		},
		imageBackgroundColor: {
			type: String,
			required: false,
			default: '#9ff'
		}
	},
	data: function(){
		return {
			state: 'empty', // empty, populated, dropping, uploading,
			initialState: 'empty',
			dropZoneClass: 'dropZoneDefault',
			image: null,
			acceptDrop: false,
			uploadedImage: null
		}
	},
	methods: {
		_selectedFile( e ){
			const [file] = event.target.files;
			if( !file ) return
			this._loadFile( file )
		},
		_dragEnter( e ){
			this.acceptDrop = true
		},
		_dragLeave(){
			this.acceptDrop = false
		},
		_dragOver(){}, // required to allow file drop
		async _drop( e ){
			this.acceptDrop = false
			if( !e || !e.dataTransfer || !e.dataTransfer.files ) return

			const [file] = e.dataTransfer.files
			if( !file ) return

			this._loadFile( file )
		},
		async _loadFile( file ){
			if( !this.isAllowedFileType( file ) ){
				this.$emit( 'error', new Error( `Selected file must be a .png or .jpg file.` ) )
				return
			}

			const loadedImage = await new LocalImageLoader( file ).load()
		
			const resizeOptions = {
				width: this.imageWidth,
				height: this.imageHeight,
				jpgQuality: this.jpgQuality
			}
			this.image = await ImageResize.resizeLoadedImage( loadedImage, resizeOptions )
			this.$refs.preview.innerHTML = ''
			this.$refs.preview.appendChild( this.image.image )
			this.upload()
		},
		isAllowedFileType( file ){
			return ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].indexOf( file.type ) !== -1
		},
		async upload(){
			this.state = 'uploading'
				
			const fileInfo = {
				filename: this.image.file.name,
				filesize: this.image.file.size,
				filetype: this.image.file.type,
				metadata: this.image.metadata
			}

			try {
				const blob = ImageUtils.imageToBlob( this.image.image, this.image.file.type )
				const uploader = new Uploader( this.signatureUrl )	
				this.uploadedImage = await uploader.upload( fileInfo, blob, percent => { this.uploadPercent = percent })
				console.log( 'Image uploaded: ', this.uploadedImage );
			} catch( e ) {
				// TODO: handle error
				console.error( 'Error uploading image', e )
			}
		},
		_clearImage(){
			this.image = null
			this.$refs.preview.innerHTML = ''
			this.state = 'empty'
		},
		_uploadImage(){

		}
	},
	mounted (){
		if( this.imageUrl ) this.state = 'populated'
		this.initialState = this.state
	}
}
</script>

<style scoped lang="scss">

.ponyImage{
	display: inline-block;
	position: relative;
	overflow: hidden;

	.details {
		font-size: 12px;
		margin: 0;
	}

	.panel {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		flex-direction: column;
		text-align: center;
	}

	.selectFile {
		cursor: pointer;

		input {
			display: none;
		}
	}

	&:hover {
		.selectFile {
			text-decoration: underline;
		}
	}

	.previewButton {
		position: absolute;
		width: 30px;
		height: 30px;
		transition: transform 0.3s;

		svg {
			width: 100%;
			height: auto;
		}

		&:hover {
			transform: scale3d( 1.1, 1.1, 1 );
		}
	}

	.cancelButton {
		@extend .previewButton;
		bottom: 10px;
		left: 10px;
	}

	.uploadButton{
		@extend .previewButton;
		bottom: 10px;
		right: 10px;
	}
}

.dropPanel {
	* {
		pointer-events: none;
	}
}

.dropZone {
	display: inline-block;
	position: relative;
	overflow: hidden;
	cursor: pointer;

	canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba( 99, 0, 0, 0.2 );
	}

	& /deep/ img {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 100%;
		transform: translateX(-50%) translateY(-50%);
	}
}

.dropZoneDefault {
	border: 3px dashed silver;
}

.dropZoneDrop {
	border: 3px dashed red;
}

.dropZoneUploading {
	border: 3px dashed green;
}

.dropZoneComplete {
	border: 3px dashed blue;
}

h3 {
	margin: 0 0 4px 0;
}

.progress{
	width: 80%;
	height: 6px;
	border: 1px solid silver;
	border-radius: 2px;
	background-color: white;
	margin: 0 auto;
	padding: 0;

	.progressPercent{
		width: 0;
		height: 100%;
		margin: 0;
		padding: 0;
		background-color: red;
	}
}

</style>

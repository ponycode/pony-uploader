<template>
	<div
		class="dropZone"
		:class="dropZoneClass"
		:style="{ width: width + 'px', height: height + 'px' }"
		@dragenter.prevent="_dragEnter"
		@dragleave.prevent="_dragLeave"
		@dragover.prevent="_dragOver"
		@drop.prevent="_drop"
		ref="dropZone"
	>
		<h3>{{label}}</h3>
		<!-- <canvas ref="canvas" :width="width" :height="height"></canvas> -->
	</div>
</template>

<script>
import LocalImageLoader from './LocalImageLoader.js'
import ImageResize from './ImageResize.js'

export default {
	name: 'vue-image-upload',
	props: {
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
		maxImageWidth: {
			type: Number,
			required: false,
			default: 200
		},
		maxImageHeight: {
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
			state: 'intial',
			dropZoneClass: 'dropZoneDefault',
			image: null
		}
	},
	computed: {
		label(){
			if( this.state === 'intial' ){
				return 'drag image here'
			}else if( this.state === 'allowDrop' ){
				return 'drop image'
			}
			return null
		}
	},
	methods: {
		_dragEnter(){
			this.state = 'allowDrop'
		},
		_dragLeave(){
			this.state = 'intial'
		},
		_dragOver(){ /* required to allow drop */ },
		async _drop( e ){
			if( !e || !e.dataTransfer || !e.dataTransfer.files ) return

			const [file] = e.dataTransfer.files
			if( !file ) return

			if( !this.isAllowedFileType( file ) ){
				this.$emit( 'error', new Error( `Selected file must be a .png or .jpg file.` ) )
				return
			}

			const loadedImage = await new LocalImageLoader( file ).load()

			const resizeOptions = {
				width: this.maxImageWidth,
				height: this.maxImageHeight,
				jpgQuality: this.jpgQuality
			}
			this.image = await ImageResize.resizeLoadedImage( loadedImage, resizeOptions )
			this.$refs.dropZone.appendChild( this.image.image )
			this.$emit( 'image-selected', this.image )
		},
		isAllowedFileType( file ){
			return ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].indexOf( file.type ) !== -1
		}
	}
}
</script>

<style scoped lang="scss">

.dropZone {
	display: inline-block;
	position: relative;
	overflow: hidden;

	* {
		pointer-events: none;
	}

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
		top: 0;
		left: 0;
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

</style>

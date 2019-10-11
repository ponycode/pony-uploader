<template>
	<div class="hello">
		<h1>Vue-Image-Upload Demo</h1>
		<vue-image-upload
			v-model="image"
			ref="uploader"
			:base-url="baseUrl"
      :track-image-status="true"
			:width="124"
			:height="124"
			:imageWidth="1200"
			:imageHeight="1200"
			:disabled=false
			@imageAdded="imageAdded"
			@imageDeleted="imageDeleted"
			@imageClicked="openImage">
		</vue-image-upload>
	</div>
</template>

<script>
import VueImageUpload from '../../../../src/pony-uploader'

export default {
	name: 'home',
	components: {
		'vue-image-upload': VueImageUpload
	},
	data () {
		return {
			image: null,
			baseUrl: process.env.VUE_APP_PONY_UPLOADER_HOST
		}
	},
	watch: {
		image( value ) {
			if(value) {
				console.log( 'image added' )
			}
		}
	},
	methods: {
		openImage: function (url) {		
			window.open(url, "_blank");		
    },
		imageAdded( val ) {
      console.log( `image added` )
		},
		imageDeleted( url ) {
			console.log( `image deleted - ${url}` )
		}
	}
}

</script>

<style scoped lang="scss">

</style>

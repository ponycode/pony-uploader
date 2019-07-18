<template>
	<div class="hello">
		<h1>Vue-Image-Upload Demo</h1>
		<!-- public-url="https://s3.amazonaws.com/phin-chemicalimages/lonza/785336405018.jpg" -->
		<vue-image-upload
			v-model="image"
			ref="uploader"
			:base-url="baseUrl"
			:public-url="publicUrl"
			image-collection="dev"
      :track-image-status="false"
			:imageWidth=200
			:imageHeight=200
			@imageAdded="imageAdded"
			@imageDeleted="imageDeleted"
			@imageClicked="openImage">
		</vue-image-upload>
		<div>
			<button v-on:click="persistImage">Persist Image</button>
			<button v-on:click="desistImage">Desist Image</button>
		</div>
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
			publicUrl: "https://storage.googleapis.com/staging.pure-karma-245604.appspot.com/cartoon-brain-61563332520853.png",
			baseUrl: process.env.VUE_APP_PONY_UPLOADER_HOST
		}
	},
	watch: {
		image( value ) {
			console.log( 'image added' )
		}
	},
	methods: {
		openImage: function (url) {		
			window.open(url, "_blank");		
    },
		persistImage: function () {
			console.info( 'persist image called' )
			this.$refs.uploader.persist( this.image )
		},
		desistImage: function () {
			console.info( 'desist image called' )
			this.$refs.uploader.desist( this.image )
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

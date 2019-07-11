<template>
	<div class="hello">
		<h1>Vue-Image-Upload Demo</h1>
		<!-- public-url="https://s3.amazonaws.com/phin-chemicalimages/lonza/785336405018.jpg" -->
		<vue-image-upload
			v-model="image"
			ref="uploader"
			:base-url="baseUrl"
			image-collection="dev"
      :track-image-status="true"
			:imageWidth=200
			:imageHeight=200
			@imageAdded="imageAdded"
			@imageDeleted="imageDeleted">
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
			baseUrl: process.env.VUE_APP_PONY_UPLOADER_HOST
		}
	},
	watch: {
		image( value ) {
			console.log( 'image added' )
		}
	},
	methods: {
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

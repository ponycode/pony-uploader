<template>
	<div class="hello">
		<h1>Vue-Image-Upload Demo</h1>
		<vue-image-upload
			v-model="image"
			ref="uploader"
      placeholder-image-url=""
			base-url="http://localhost:5000"
      gcp-remote-base-url="https://images-staging.phin.co"
			signature-url="/signature"
      index-url="/index"
      :track-image-status="false">
		</vue-image-upload>
		<div>
			<button v-on:click="persistImage">Persist Image</button>
		</div>
	</div>
</template>

<script>
import VueImageUpload from '../../../../src/components/pony-uploader'
export default {
	name: 'home',
	components: {
		VueImageUpload
	},
	data: {
		image: null
	},
	methods: {
		persistImage: function () {
      console.info('persist image called')
    }
	}
}

</script>

<style scoped lang="scss">

</style>

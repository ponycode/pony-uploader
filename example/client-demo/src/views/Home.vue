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
      :track-image-status=true
			:width="200"
			:height="200"
			:imageWidth="400"
			:imageHeight="400">
		</vue-image-upload>
	</div>
</template>

<script>
import VueImageUpload from '../../../../src/components/pony-uploader'

export default {
	name: 'home',
	components: {
		VueImageUpload
	},
	data () {
		return {
			image: null
		}
	}
}

</script>

<style scoped lang="scss">

</style>

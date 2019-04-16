<template>
	<div class="hello">
		<h1>Vue-Image-Upload Demo</h1>
		<vue-image-upload
			v-model="image"
			ref="uploader"
      placeholder-image-url=""
      gcp-signature-url="/api/images/uploads/cloudStorage/signature"
			aws-signature-url="/api/images/uploads/s3/signature"
      base-url="https://image-upload-manager-staging.firebaseapp.com"
			signature-url="/signature"
      image-index-url="/index"
      :track-image-status=true
			:width="200"
			:height="200"
			:imageWidth="400"
			:imageHeight="400">
		</vue-image-upload>
	</div>
</template>

<script>
// TODO: update signature URL as external config
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

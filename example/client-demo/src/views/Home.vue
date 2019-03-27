<template>
	<div class="hello">
		<h1>Vue-Image-Upload Demo</h1>
		<vue-image-upload
			v-model="image"
			ref="uploader"
			w-signature-url="https://image-upload-manager-staging.firebaseapp.com/signature"
			signature-url="http://localhost:5000/signature"
			z-signature-url="https://images.phin.co/signature"
			x-signature-url="/api/images/uploads/cloudStorage/signature"
			y-signature-url="/api/images/uploads/s3/signature"
			placeholder-image-url=""
			track-image-status="true"
			image-status-collection="images"
			image-status-url="http://localhost:5000/index"
			:width="200"
			:height="200"
			:imageWidth="400"
			:imageHeight="400">
		</vue-image-upload>
	</div>
</template>

<script>
// TODO: update signature URL as external config
import VueImageUpload from '../../../../client/vue-image-upload'

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

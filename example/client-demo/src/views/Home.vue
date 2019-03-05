<template>
	<div class="hello">
		<h1>Vue-Image-Upload Demo</h1>
		<vue-image-upload
			v-model="image"
			ref="uploader"
			signature-url="/api/images/uploads/cloudStorage/signature"
			x-signature-url="/api/images/uploads/s3/signature"
			placeholder-image-url=""
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
			// image: {
			// 	publicUrl: 'https://pony-upload-test.s3.amazonaws.com/test/IMG_3410.jpg'
			// }
		}
	}
}

</script>

<style scoped lang="scss">

</style>

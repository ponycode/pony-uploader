<template>
	<div class="hello">
		<h1>Vue-Image-Upload Demo</h1>
		<vue-image-upload
      v-model="image"
      ref="uploader"
      x-signature-url="/api/images/uploads/cloudStorage/signature"
      signature-url="/api/images/uploads/s3/signature"
      placeholder-image-url=""
      :width="200"
      :height="200"
      :imageWidth="400"
      :imageHeight="400">
    </vue-image-upload>
	</div>
</template>

<script>
import VueImageUpload from '../../../client/vue-image-upload'

export default {
	name: 'home',
	components: {
		VueImageUpload
	},
	data () {
		return {
			// image: {
			// 	publicUrl: 'https://pony-upload-test.s3.amazonaws.com/test/IMG_3410.jpg'
			// }
		}
	}
}

</script>

<style scoped lang="scss">

</style>

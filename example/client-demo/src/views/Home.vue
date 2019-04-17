<template>
	<div class="hello">
		<h1>Vue-Image-Upload Demo</h1>
		<vue-image-upload
			v-model="image"
			ref="uploader"
      placeholder-image-url=""
			base-url="http://localhost:5000"
			signature-url="/signature"
      index-url="/index"
      :track-image-status="true">
		</vue-image-upload>
		<div>
			<button v-on:click="persistImage">Persist Image</button>
		</div>
	</div>
</template>

<script>
// import VueImageUpload from '../../../../src/pony-uploader'
import VueImageUpload from 'vue-pony-uploader'

export default {
	name: 'home',
	components: {
		'vue-image-upload': VueImageUpload
	},
	data () {
		return {
			image: null
		}
	},
	methods: {
		persistImage: function () {
			console.info('persist image called')
			this.$refs.uploader.persist(this.image);
    }
	}
}

</script>

<style scoped lang="scss">

</style>

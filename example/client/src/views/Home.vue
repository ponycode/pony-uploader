<template>
	<div class="hello">
		<h1>Vue-Image-Upload Demo</h1>
		<vue-image-upload
			v-model="image"
			ref="uploader"
      placeholder-image-url=""
			base-url="http://localhost:3000"
			signature-url="/s3/signature"
      :track-image-status="false">
		</vue-image-upload>
		<div>
			<button v-on:click="persistImage">Persist Image</button>
			<button v-on:click="desistImage">Desist Image</button>
		</div>
	</div>
</template>

<script>
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
		},
		desistImage: function () {
			console.info('desist image called')
			this.$refs.uploader.desist(this.image);
    }
	}
}

</script>

<style scoped lang="scss">

</style>

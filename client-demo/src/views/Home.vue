<template>
  <div class="hello">
    <h1>Demo</h1>
    <vue-image-upload signature-url="http://www.google.com" width="100" height="100"></vue-image-upload>
    <br/>
    <button @click="upload">Upload</button>
  </div>
</template>

<script>
import VueImageUpload from '../../../client/vue-image-upload'

export default {
	name: 'home',
	components: {
		VueImageUpload
  },
  methods: {
    async upload(){

    }
  }
}

</script>

<style scoped lang="scss">

</style>

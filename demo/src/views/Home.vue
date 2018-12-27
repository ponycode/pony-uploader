<template>
  <div class="hello">
    <h1>Demo</h1>
    <vue-image-upload signature-url="http://www.google.com"></vue-image-upload>
  </div>
</template>

<script>
import VueImageUpload from '../../../client/vue-image-upload'

export default {
	name: 'home',
	components: {
		VueImageUpload
	}
}

</script>

<style scoped lang="scss">

</style>

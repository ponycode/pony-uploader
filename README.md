
# WIP!!! DON'T USE YET - vue-pony-uploader

<p align="left">
    <a href="https://www.npmjs.com/package/vue-pony-uploader"><img src="https://img.shields.io/npm/v/vue-pony-uploader.svg" alt="NPM Version"></a>
    <a href="https://www.npmjs.com/package/vue-pony-uploader"><img src="https://img.shields.io/npm/dm/vue-pony-uploader.svg" alt="NPM Downloads"></a>
    <a href="http://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>

Pony uploader is a simple drag & drop image uploader which will send image directly to Amazon S3 or Google Cloud Storage using a `signed url`, based on your configuration. 

This project contains a server component which will work well with express, a client side component, and a full example project. Pony-uploader uses several HTML5 features and will probably not work on older browsers.

## What is a signed URL?
"A signed URL is a URL that provides limited permission and time to make a request. Signed URLs contain authentication information in their query string, allowing users without credentials to perform specific actions on a resource. When you generate a signed URL, you specify a user or service account which must have sufficient permission to make the request that the signed URL will make. After you generate a signed URL, anyone who possesses it can use the signed URL to perform specified actions, such as reading an object, within a specified period of time." - Google

- <a href="https://cloud.google.com/storage/docs/access-control/signed-urls">Google Cloud Storage</a>
- <a href="https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-signed-urls.html">Amazon S3</a>


## Getting Started
Follow the steps below to quickly have the image loader component running within your Vue application.

### Install
`npm i vue-pony-uploader --save`

### Usage
If you have a staging and production environment for your api endpoints, consider using an environment variable for the `base-url` as shown below.

```html
<!-- component.vue -->
<vue-image-upload
	v-model="image"
	ref="uploader"
	placeholder-image-url=""
	:base-url="`${VUE_APP_PONY_UPLOADER_HOST}`"
></vue-image-upload>
```

```js
// component.js
import VueImageUpload from 'vue-pony-uploader'
Vue.component('vue-image-upload', VueImageUpload)

const vue = new Vue({
  el: '#app',
  components: { App },
  template: '<App/>'
})
export { vue as Vue }
```

### Options
Since the component provides the ability to optionally track image metadata with a backend of your choice, there are many options available.

|          key         |   type  |    default   | required |
|:--------------------:|:-------:|:------------:|:--------:|
|       base-url       |  String |      N/A     |    Yes   |
|    signature-url     |  String |  /signature  |    No    |
|       index-url      |  String |    /index    |    No    |
|   image-collection   |  String |    images    |    No    |
|  track-image-status  | Boolean |     false    |    No    |
|         width        |  Number |      200     |    No    |
|        height        |  Number |      200     |    No    |
|      imageWidth      |  Number |      200     |    No    |
|      imageHeight     |  Number |      200     |    No    |
|      jpgQuality      |  Number |       1      |    No    |
| imageBackgroundColor |  String |     #9ff     |    No    |


## Setup and Run Demo
Follow the steps below to have the example Vue application and example server up and running quickly.

### Setup Amazon S3 or Google Cloud Storage
`NOTE:` The example server is meant to be an example and should not be considered production ready. The `/signature` endpoint will fetch a signed url once you have provided your cloud credentials. However, the `/index` endpoints for optional image tracking is only stubbed out. It is up to you to implement them should you want to track whether the image ends up getting used or will become stale.


### Setup Amazon S3 or Google Cloud Storage

```bash
$ git clone https://github.com/ponycode/pony-uploader
$ cd pony-uploader
$ npm install
$ cd example/server
$ npm install
$ npm start
$ cd .. && cd client-demo
$ npm install
$ npm run serve 
```

`NOTE:` The example server provides the functionality for obtaining a signed url from Amazon S3 or Google  provided only has the index endpoints stubbed out. It is up to you to implement them should you want to track whether the image ends up getting used or will become stale.



## License
Copyright (c) 2015 Joshua Kennedy
Licensed under the MIT license.

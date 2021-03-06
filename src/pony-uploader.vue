<script>
import LocalImageLoader from "./js/LocalImageLoader.js";
import ImageResize from "./js/ImageResize.js";
import ImageUtils from "./js/ImageUtils.js";
import TrackImage from "./js/TrackImage.js";
import UploadSigner from "./js/UploadSigner.js";
import S3Uploader from "./js/S3Uploader.js";
import CloudStorageUploader from "./js/CloudStorageUploader.js";
import UploadIcon from "./components/upload-icon.vue";

let _value = null;

export default {
  name: "pony-uploader",
  components: {
    UploadIcon
  },
  props: {
    value: {
      type: Object,
      required: false,
      default: _value
    },
    publicUrl: {
      type: String,
      required: false
    },
    baseUrl: {
      type: String,
      required: true
    },
    signatureUrl: {
      type: String,
      required: false,
      default: "/signature"
    },
    trackImageStatus: {
      type: Boolean,
      required: false,
      default: false
    },
    folder: {
      type: String,
      required: false
    },
    subfolder: {
      type: String,
      required: false
    },
    indexUrl: {
      type: String,
      required: false,
      default: "/index"
    },
    width: {
      type: Number,
      required: false,
      default: 200
    },
    height: {
      type: Number,
      required: false,
      default: 200
    },
    imageWidth: {
      type: Number,
      required: false
    },
    imageHeight: {
      type: Number,
      required: false
    },
    jpgQuality: {
      type: Number,
      required: false,
      default: 1
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false
    },
    imageBackgroundColor: {
      type: String,
      required: false,
      default: "#9ff"
    }
  },
  data: function() {
    return {
      state: "empty", // empty, populated, uploading,
      initialState: "empty",
      dropZoneClass: "dropZoneDefault",
      acceptDrop: false,
      image: null,
      uploadPercent: 0
    };
  },
  methods: {
    _selectedFile(e) {
      const [file] = event.target.files;
      if (!file) return;
      this._loadFile(file);
    },
    _dragEnter(e) {
      this.acceptDrop = true;
    },
    _dragLeave() {
      this.acceptDrop = false;
    },
    _dragOver() {}, // required to allow file drop
    async _drop(e) {
      this.acceptDrop = false;
      if (!e || !e.dataTransfer || !e.dataTransfer.files) return;

      const [file] = e.dataTransfer.files;
      if (!file) return;

      this._loadFile(file);
    },
    async _loadFile(file) {
      if (!this.isAllowedFileType(file)) {
        this.$emit("error", new Error(`Selected file must be a PNG, TIFF, or JPG file.`));
        return;
      }

      const loadedImage = await new LocalImageLoader(file).load();

      if (this.imageWidth && this.imageHeight) {
        const resizeOptions = {
          width: this.imageWidth,
          height: this.imageHeight,
          jpgQuality: this.jpgQuality
        };

        this.image = await ImageResize.resizeLoadedImage(
          loadedImage,
          resizeOptions
        );
        this.upload(this.image);
      } else {
        this.upload(loadedImage);
      }
    },
    isAllowedFileType(file) {
      return ["image/png", "image/jpg", "image/jpeg", "image/tiff"].indexOf(file.type) !== -1;
    },
    async upload(image) {
      this.state = "uploading";
      this.uploadPercent = 0;

      function replaceSpecialChars(filename) {
        // info on supported chars - https://cloud.google.com/storage/docs/naming
        filename = filename.normalize('NFD').replace(/[\u000A-\u000D]/g, '');
        filename = filename.normalize('NFD').replace(/[\u0020-\u002F]/g, '');
        filename = filename.normalize('NFD').replace(/[\u003A-\u0040]/g, '-');
        filename = filename.normalize('NFD').replace(/[\u005B-\u0060]/g, '');
        filename = filename.normalize("NFD").replace(/[\u0300-\u036f]/g, '');
        return filename;
      }

      function appendDateToFilename(filename) {
        var dotIndex = filename.lastIndexOf(".");
        if (dotIndex === -1) {
          return replaceSpecialChars(filename) + Date.now();
        } else {
          return (
            replaceSpecialChars(filename.substring(0, dotIndex)) +
            Date.now() +
            filename.substring(dotIndex)
          );
        }
      }

      const fileInfo = {
        folder: this.folder,
        subfolder: this.subfolder,
        filename: appendDateToFilename(image.file.name),
        filesize: image.file.size,
        filetype: image.file.type,
        metadata: image.metadata
      };

      try {
        const signUrl = this.baseUrl + this.signatureUrl;
        const uploadSigner = new UploadSigner(signUrl);

        const signedUploadResult = await uploadSigner.signUpload(fileInfo);
        const uploader = this._uploaderForSignedUploadResult(signedUploadResult);
        const blob = ImageUtils.imageToBlob(image.image, image.file.type);

        const result = await uploader.upload(
          signedUploadResult,
          blob,
          percent => {
            this.uploadPercent = percent;
          }
        );

        if (result && this.trackImageStatus) {
          let _statusData = result;
          _statusData.fileInfo = fileInfo;

          const _indexUrl = this.baseUrl + this.indexUrl;
          const _imageStatus = new TrackImage(_indexUrl);
          const _imageStatusResult = await _imageStatus.add(_statusData);

          if (_imageStatusResult.status_code !== 200) {
            errorCode = _imageStatusResult.status_code;
            errorText = _imageStatusResult.status_text;
            this.$emit("error", new Error(`Error indexing image: ${errorCode} ${errorText}`));
          }
        }

        this.$emit("imageAdded", result);
        this.$emit("input", result);
        this.image = null;
      } catch (e) {
        this._clearImage();
        this.$emit("error", new Error(`Error uploading image: ${e}`));
      }
    },
    _uploaderForSignedUploadResult(signedUploadResult) {
      if (signedUploadResult.service === "s3") {
        return new S3Uploader();
      } else if (signedUploadResult.service === "cloudStorage") {
        return new CloudStorageUploader();
      } else {
        this.$emit("error", new Error(`Unknown upload service: ${signedUploadResult.service}`));
      }
    },
    _clearImage() {
      this.$emit("imageDeleted", this.value);

      this.image = null;
      this.state = 'empty';
      this._value = null;
      this.$refs.fileInput.value = null; // hack so user can load same image after delete

      
      this.$emit("input", null);
    },
    _imageClicked() {
      this.$emit("imageClicked", this._value.publicUrl);
    }
  },
  computed: {
    previewSrc() {
      if (this.value && this.value.publicUrl) return this.value.publicUrl;
      if (this.image && this.image.image) return this.image.image.src;
      if (this.publicUrl) return this.publicUrl;
      return null;
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(val) {
        this._value = val;
        if (this._value && this._value.publicUrl) {
          this.state = "populated";
          return;
        }
        this.state = "empty";
      }
    },
    publicUrl: {
      immediate: true,
      handler(val) {
        // assigned computed prop
        if (val && this.state === "empty") {
          this.state = "populated";
          this._value = { publicUrl: val };
          return;
        }
      }
    }
  }
};
</script>

<template>
  <div
    v-show="!(state === 'empty' && disabled) || !disabled"
    class="ponyImage"
    :class="dropZoneClass"
    :style="{ width: width + 'px', height: height + 'px' }"
    ref="dropZone"
  >
    <div
      v-show="state === 'empty' && !disabled"
      class="panel dropPanel"
      @dragenter.prevent="_dragEnter"
      @dragleave.prevent="_dragLeave"
      @dragover.prevent="_dragOver"
      @drop.prevent="_drop"
      @click="$refs.fileInput.click()"
    >
      <input
        type='file'
        accept="image/png, image/jpeg, image/jpg, image/tiff, image/tif"
        multiple="false"
        @change="_selectedFile"
        ref='fileInput'
      />
      <upload-icon class="uploadIcon"></upload-icon>
      <p v-if="!acceptDrop">Select Image</p>
      <p v-else>Drop Image</p>
    </div>
    <div v-show="state !== 'empty'">
      <div class="panel previewPanel" ref="preview">
        <img :src="previewSrc" @click="_imageClicked" />
      </div>

      <div class="panel uploadOverlay" v-show="state === 'uploading'">
        <upload-icon class="uploadIcon uploadIconWhite"></upload-icon>
        <p>Uploading</p>
        <div class="progress">
          <div class="progressPercent" :style="{ width: uploadPercent + '%' }"></div>
        </div>
      </div>

      <a class="clearButton" v-show="state === 'populated' && !disabled" @click="_clearImage">
        <svg
          width="200px"
          height="200px"
          viewBox="0 0 200 200"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <g id="Artboard" fill="#D40000" fill-rule="nonzero">
              <path
                d="M100,200 C44.771525,200 0,155.228475 0,100 C0,44.771525 44.771525,0 100,0 C155.228475,0 200,44.771525 200,100 C200,155.228475 155.228475,200 100,200 Z M100,78.7867966 L64.6446609,43.4314575 C58.7867966,37.5735931 49.2893219,37.5735931 43.4314575,43.4314575 C37.5735931,49.2893219 37.5735931,58.7867966 43.4314575,64.6446609 L78.7867966,100 L43.4314575,135.355339 C37.5735931,141.213203 37.5735931,150.710678 43.4314575,156.568542 C49.2893219,162.426407 58.7867966,162.426407 64.6446609,156.568542 L100,121.213203 L135.355339,156.568542 C141.213203,162.426407 150.710678,162.426407 156.568542,156.568542 C162.426407,150.710678 162.426407,141.213203 156.568542,135.355339 L121.213203,100 L156.568542,64.6446609 C162.426407,58.7867966 162.426407,49.2893219 156.568542,43.4314575 C150.710678,37.5735931 141.213203,37.5735931 135.355339,43.4314575 L100,78.7867966 Z"
                id="cancel-button"
              />
            </g>
          </g>
        </svg>
      </a>
    </div>
  </div>
</template>

<style scoped lang="scss">
$blue: #4a90e2;
$red: red;

.ponyImage {
  display: inline-block;
  position: relative;
  overflow: hidden;
  border: 1px solid silver;

  .dropPanel {
    cursor: pointer;
    color: $blue;

    input[type="file"] {
      display: none;
    }

    p {
      margin: 0;
    }

    & ::v-deep img {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100%;
      transform: translateX(-50%) translateY(-50%);
    }

    &:hover {
      text-decoration: underline;
    }

    * {
      pointer-events: none;
    }
  }

  .uploadIcon {
    max-width: 50px;
    height: auto;
    margin: 0 auto;

    ::v-deep path {
      fill: $blue;
    }
  }

  .uploadIconRed {
    ::v-deep path {
      fill: $red;
    }
  }

  .uploadIconWhite {
    ::v-deep path {
      fill: #fff;
    }
  }

  .details {
    font-size: 12px;
    margin: 0;
  }

  .panel {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    flex-direction: column;
    text-align: center;
  }

  .previewPanel {
    ::v-deep img {
      width: 100%;
      height: 100%;
      height: auto;
    }
  }

  .clearButton {
    position: absolute;
    width: 30px;
    height: 30px;
    left: 10px;
    bottom: 10px;
    transition: transform 0.3s;

    svg {
      width: 100%;
      height: auto;
    }

    &:hover {
      transform: scale3d(1.1, 1.1, 1);
    }
  }

  .uploadOverlay {
    background-color: rgba(0, 0, 0, 0.4);
    color: #fff;

    p {
      margin: 0 auto;
    }

    .progress {
      position: absolute;
      left: 10%;
      right: 10%;
      bottom: 5%;
      height: 4px;
      background-color: rgba(0, 0, 0, 0.8);
      margin: 0 auto;
      padding: 0;

      .progressPercent {
        width: 0;
        height: 100%;
        margin: 0;
        padding: 0;
        background-color: white;
      }
    }
  }
}
</style>

( function(){
    'use strict';

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var ImageSchema = new Schema({
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        url: { type: String },
        s3Key: { type: String },
        complete: { type: Boolean, required: true, default: false },
        dateUploaded: { type: Date, required: true, default: Date.now }
    });

    mongoose.model( 'Image', ImageSchema );
})();

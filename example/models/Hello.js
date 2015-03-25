( function(){
	'use strict';

	var mongoose = require('mongoose');
	var Schema = mongoose.Schema;

	var HelloSchema = new Schema({
		created: { type: Date, },
		message: { type: String, default: '', trim: true, required: 'Message cannot be blank' }
	});

	mongoose.model( 'Hello', HelloSchema );
})();

( function(){
	'use strict';

	var requireMany = require('../lib/requireMany.js');
	var mongoose = require('mongoose');
	var config = require('pony-config');
	var session = require('express-session');

	var MongoStore = false;

	exports.connect = function( callback ){
		MongoStore = require('connect-mongo')( session );

		var connectionString = config.get("mongo.connectionString");

		exports.db = mongoose.connect( connectionString, function( error ){
			if( error ){
				console.error( ('Could not connect to MongoDB! ' + connectionString).red, error );
			} else {
				console.log( "Connected to Mongo".green );
			}

			if( callback ) callback( error );
		});

		requireMany( '../models' );

		return exports.db;
	};

	exports.mongoExpressSession = function(){
		if( !exports.db ) throw new Error( "You must call connect() first to setup the mongo connection." );

		var sessionSettings = {
			saveUninitialized: false,
			resave: false,
			secret: config.get("session.secret"),
			cookie: {
				maxAge: config.get("session.cookieExpirationMs"),
				httpOnly: true
			},
			store: new MongoStore({
				mongooseConnection: mongoose.connection
			})
		};

		return session( sessionSettings );
	};

})();
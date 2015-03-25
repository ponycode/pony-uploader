/*
 * Sample test suite for the sample-s3-file-upload module (sample-s3-file-upload-module.js).
 * Mocha assertions reference: http://visionmedia.github.io/mocha/#assertions
 */
 
var assert = require("assert");

describe( 'aModule', function(){

	describe( 'aFuncton()', function(){

		it( 'should be fabulous', function(){
			var someValue = 'fabulous';
			assert.equal( 'fabulous', someValue );
		});

	});

});
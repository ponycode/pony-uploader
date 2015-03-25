( function(){
	
	'use strict';

	var fs = require('fs');
	var path = require('path');

	module.exports = function( rootPath ){

		var modules = {};
		_scanDirectory( path.join( __dirname, rootPath ), modules );

		var output = {};
		output.modules = modules;

		output.apply = function(){
			var args = [].slice.call( arguments );
			_applyToModules( modules, 'apply', args );
			return output;
		};

		output.execute = function( functionName ){
			var args = [].slice.call( arguments ).slice(1);
			_applyToModules( modules, functionName, args );
			return output;
		};

		return output;
	};

	function _applyToModules( modules, functionName, argumentsArray ){
		for( var propertyName in modules ){
			if( modules.hasOwnProperty( propertyName ) ){
				var module = modules[ propertyName ];
				if( functionName === 'apply' && typeof module === 'function' ){
					module.apply( module, argumentsArray );
				}else if( typeof module[ functionName ] === 'function' ){
					module[ functionName ].apply( module, argumentsArray );
				}else{
					console.warn( 'Module has no \'' + functionName + '\' function: ', propertyName );
				}
			}
		}
	}

	function _requirePath( file, rootPath, output ){
		try{
			_scanDirectory( rootPath + "/" + file, output );
		} catch( error ){
			// expensive to expect exceptions -- shouldn't matter during app load
			output[ file.substr( 0, file.lastIndexOf('.') ) ] = require( rootPath + "/" + file );
		}
	}

	function _scanDirectory( rootPath, output ){
		fs.readdirSync( rootPath ).forEach( function( file ){
			_requirePath( file, rootPath, output );
		});
	}

})();
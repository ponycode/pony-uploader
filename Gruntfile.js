'use strict';

module.exports = function( grunt ){

	require('load-grunt-tasks')( grunt );

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

        less: {
            src: {
                files: {
                    'dist/pony-upload.css': 'example/less/controls/dropZone.less'
                }
            }
        },

		cssmin: {
			options: {
				compatibility: 'ie8',
				keepSpecialComments: '*',
				noAdvanced: true
			},
			src: {
				files: {
					'dist/pony-upload.min.css': 'dist/pony-upload.css'
				}
			}
		},

		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> v<%= pkg.version %>, <%= grunt.template.today("yyyy-mm-dd") %> */\n',
				compress: {
					drop_console: false
				}
			},
			src: {
				files: {
					'dist/pony-upload.min.js': [
                        'client/pony-image-resize.js',
                        'client/pony-uploader.js',
                        'client/pony-uploader-jquery.js'
                    ]
				}
			}
		}

	});

	grunt.registerTask( 'dist', ['less', 'cssmin', 'uglify']);

};
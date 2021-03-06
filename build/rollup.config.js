import vue from 'rollup-plugin-vue'
import buble from 'rollup-plugin-buble'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import minimist from 'minimist'

const argv = minimist( process.argv.slice( 2 ) )

const baseConfig = {
	input: 'src/index.js',
	plugins: [
		babel(),
		commonjs(),
		vue( {
			css: true,
			compileTemplate: true,
			template: {
				isProduction: true
			}
		} ),
		resolve( {
			browser: true,
			preferBuiltins: false
		} ),
		buble( {
			transforms: {
				asyncAwait: false, // buble can't transpile Async/Await yet
				dangerousForOf: true
			},
			objectAssign: 'Object.assign'
		} ),
		replace( {
			'process.env.NODE_ENV': JSON.stringify( 'production' )
		} )
	]
}

// UMD/IIFE shared settings: externals and output.globals
// Refer to https://rollupjs.org/guide/en#output-globals for details
const external = [
	'Vue',
	'tiff.js'
]
const globals = {
	'Vue': 'vue',
	'tiff.js': 'Tiff'
}

// Customize configs for individual targets
const buildFormats = []
if ( !argv.format || argv.format === 'es' ) {
	const esConfig = {
		...baseConfig,
		external,
		output: {
			file: 'dist/pony-uploader.esm.js',
			format: 'esm',
			exports: 'named',
			globals
		},
		plugins: [
			...baseConfig.plugins,
			terser( {
				output: {
					ecma: 6
				}
			} )
		]
	}
	buildFormats.push( esConfig )
}

if ( !argv.format || argv.format === 'umd' ) {
	const umdConfig = {
		...baseConfig,
		external,
		output: {
			compact: true,
			file: 'dist/pony-uploader.umd.js',
			format: 'umd',
			name: 'PonyUploader',
			exports: 'named',
			globals
		},
		plugins: [
			...baseConfig.plugins,
			terser( {
				output: {
					ecma: 6
				}
			} )
		]
	}
	buildFormats.push( umdConfig )
}

if ( !argv.format || argv.format === 'iife' ) {
	const unpkgConfig = {
		...baseConfig,
		external,
		output: {
			compact: true,
			file: 'dist/pony-uploader.min.js',
			format: 'iife',
			name: 'PonyUploader',
			exports: 'named',
			globals
		},
		plugins: [
			...baseConfig.plugins,
			terser( {
				output: {
					ecma: 5
				}
			} )
		]
	}
	buildFormats.push( unpkgConfig )
}

// Export config
export default buildFormats

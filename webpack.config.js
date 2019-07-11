var path = require('path');
// var webpack = require('webpack');

module.exports = {
	// The base directory (absolute path!) for resolving the entry option.
	// If output.pathinfo is set, the included pathinfo is shortened to this directory.
	context: path.resolve('.'),

	module: {
		noParse: /\.min\.js/,
	},

	devtool: 'inline-source-map',

	devServer: {
		stats: {
			assets: 			true,
			children: 		true,
			chunks: 			true,
			hash: 				true,
			modules: 			true,
			maxModules:   Infinity,
			excludeModules: false, // jezus Webpack, 3 settings to finally see hidden modules??
			publicPath: 	true,
			timings: 			true,
			version: 			true,
			warnings: 		true,
			colors: {
				green: '\u001b[32m'
			}
		}
	}
};

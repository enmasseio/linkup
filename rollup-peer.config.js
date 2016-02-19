import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'src/peer/hookup.js',
  dest: 'dist/peer/hookup.js',
  format: 'umd',
  moduleName: 'hookup',
  sourceMap: true,
  plugins: [
    nodeResolve({
      jsnext: true,
      main: true
    }),

    // non-CommonJS modules will be ignored, but you can also
    // specifically include/exclude files
    commonjs({
      include: 'node_modules/**',
      //exclude: [ 'node_modules/foo/**', 'node_modules/bar/**' ],

      // search for files other than .js files (must already
      // be transpiled by a previous plugin!)
      //extensions: [ '.js', '.coffee' ] // defaults to [ '.js' ]
    }),

    babel({
      babelrc: false,
      presets: ['es2015-rollup']
    }),
    //uglify()
  ]
};

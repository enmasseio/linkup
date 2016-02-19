import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';

export default {
  entry: 'src/broker/server.js',
  dest: 'dist/broker/server.js',
  format: 'cjs',
  sourceMap: true,
  plugins: [
    babel({
      babelrc: false,
      presets: ['es2015-rollup']
    }),
    //uglify()
  ]
};

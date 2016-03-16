import { rollup } from 'rollup';
import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

// transpile and bundle the server script
rollup({
  entry: 'src/broker/server.js',
  plugins: [
    babel({
      babelrc: false,
      presets: ['es2015-rollup']
    })
  ]
}).then(bundle => {
  bundle.write({
    dest: 'dist/broker/server.js',
    format: 'cjs',
    sourceMap: true
  });
}).catch(err => console.error(err));


// transpile and bundle the client library
rollup({
  entry: 'src/peer/linkup.js',
  plugins: [
    nodeResolve({
      jsnext: true,
      main: true
    }),

    commonjs({
      include: 'node_modules/**'
    }),

    babel({
      babelrc: false,
      presets: ['es2015-rollup']
    }),
    uglify()
  ]
}).then(bundle => {
  bundle.write({
    dest: 'dist/linkup.js',
    format: 'umd',
    moduleName: 'linkup',
    sourceMap: true
  });
}).catch(err => console.error(err));

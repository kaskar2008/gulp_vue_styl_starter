import gulp                 from 'gulp'
import source               from 'vinyl-source-stream'
import buffer               from 'vinyl-buffer'
import browserify           from 'browserify'
import watchify             from 'watchify'
import babel                from 'babelify'
import vueify               from 'vueify'
import uglify               from 'gulp-uglify'
import connect              from 'gulp-connect'
import open                 from 'gulp-open'
import util                 from 'gulp-util'
import stylus               from 'gulp-stylus'
import rename               from 'gulp-rename'
import cleanCSS             from 'gulp-clean-css'
import autoprefixer_module  from 'gulp-autoprefixer'
import plumber              from 'gulp-plumber'
import notify               from 'gulp-notify'

const autoprefixer = () => autoprefixer_module(require('./autoprefixer.config'))

const notifyes = {
  plumber: {
    error: notify.onError("Error: <%= error.message %>")
  }
}

const paths = {
  styles: {
    src: 'src/styles/main.styl',
    dest: 'dist/css/',
    watch_path: 'src/styles/**/*.styl'
  },
  scripts: {
    src: 'src/app.js',
    dest: 'dist/js/',
    dest_name: 'app.js'
  },
  dist: {
    path: './',
    entry: './index.html'
  }
}

gulp.task('browserify_task', () => {
  util.log('Building...')

  var bundler = browserify(paths.scripts.src, { debug: true, paths: ['./node_modules', './src'] })

  bundler.transform(babel)
  bundler.transform(vueify)

  var result = bundler.bundle()
    .on('error', (err) => { util.log(err); this.emit('end'); })
    .pipe(source(paths.scripts.dest_name))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest(paths.scripts.dest))

  util.log('Building complete')

  return result
})

gulp.task('watchify_task', () => {
  var bundler = watchify(browserify(paths.scripts.src, { debug: true, paths: ['./node_modules', './src'] }))

  bundler.transform(babel)
  bundler.transform(vueify)

  bundler.on('update', rebundle)

  function rebundle() {
    util.log('Rebuilding js...')
    var result = bundler.bundle()
      .on('error', (err) => { util.log(err); this.emit('end'); })
      .pipe(source(paths.scripts.dest_name))
      .pipe(gulp.dest(paths.scripts.dest))
    util.log('Rebuilding js complete')
    return result
  }

  return rebundle()
})

gulp.task('styl_task', () => {
  util.log('Rebuilding css...')

  var result = gulp.src(paths.styles.src)
    .pipe(plumber({ errorHandler: notifyes.plumber.error }))
    .pipe(stylus({ paths: ['src/styles'] }))
    .pipe(autoprefixer())
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .on('error', (err) => { util.log(err); this.emit('end'); })
    .pipe(rename({
      basename: 'styles'
    }))
    .pipe(gulp.dest(paths.styles.dest))

  util.log('Rebuilding css complete')

  return result
})

gulp.task('watch_styl_task', () => {
  return gulp.watch(paths.styles.watch_path, gulp.series('styl_task'))
})

gulp.task('webserver_task', () => {
  var port = 8000
  connect.server({
    root: paths.dist.path,
    port: port,
    fallback: paths.dist.entry
  })
  gulp.src(__filename)
    .pipe(open({uri: 'http://localhost:'+port}))
})

const build = gulp.series('styl_task', 'browserify_task')
const dev = gulp.series('styl_task', 'watchify_task', gulp.parallel('webserver_task', 'watch_styl_task'))

export { build }
export default dev

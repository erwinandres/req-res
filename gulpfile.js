const gulp = require('gulp');

const del = require('del');
const minifyHTML = require('gulp-minify-html');
const minifyJS = require('gulp-terser');
const concat = require('gulp-concat');
const replaceHTML = require('gulp-html-replace');
const imagemin = require('gulp-imagemin');
const zip = require('gulp-zip');
const checkFileSize = require('gulp-check-filesize');
const connect = require('gulp-connect');
const postcss = require('gulp-postcss');
const cssnano = require('cssnano');
const sourcemaps = require('gulp-sourcemaps');

const cssPlugins = [
  cssnano()
];

const paths = {
  src: {
    html: 'src/**.html',
    js: ['src/js/helpers.js', 'src/js/game.js', 'src/js/main.js'],
    images: 'src/img/**',
    css: 'src/css/**.css'
  },
  dist: {
    dir: 'dist',
    js: 'script.min.js',
    images: 'dist',
    css: 'dist'
  }
};

gulp.task('buildHTML', () => {
  return gulp.src(paths.src.html)
    .pipe(replaceHTML({
      js: paths.dist.js
    }))
    .pipe(minifyHTML())
    .pipe(gulp.dest(paths.dist.dir));
});

gulp.task('buildCSS', () => {
  return gulp.src(paths.src.css)
    .pipe(postcss(cssPlugins))
    .pipe(gulp.dest(paths.dist.css));
});

gulp.task('buildJS', () => {
  return gulp.src(paths.src.js)
    .pipe(concat(paths.dist.js))
    .pipe(minifyJS())
    .pipe(gulp.dest(paths.dist.dir));
});

gulp.task('optimizeImages', () => {
  return gulp.src(paths.src.images)
    .pipe(imagemin())
    .pipe(gulp.dest(paths.dist.images));
});

gulp.task('zip', () => {
  const thirteenKb = 13 * 1024;

  del('zip/*');

  return gulp.src(`${paths.dist.dir}/**`)
    .pipe(zip('bundle.zip'))
    .pipe(gulp.dest('zip'))
    .pipe(checkFileSize({ fileSizeLimit: thirteenKb }));
});

gulp.task('clean', () => del('dist/**/*'));

gulp.task('connect', () =>
  connect.server({
    port: 1337,
    root: paths.dist.dir,
    liveReload: true
  })
);

gulp.task('build', gulp.series(
  'clean',
  gulp.parallel('buildHTML', 'buildCSS', 'buildJS', 'optimizeImages'),
  'zip'
));

gulp.task('watch', () => {
  gulp.watch(paths.src.html, gulp.series('buildHTML', 'zip'));
  gulp.watch(paths.src.css, gulp.series('buildCSS', 'zip'));
  gulp.watch(paths.src.js, gulp.series('buildJS', 'zip'));
  gulp.watch(paths.src.images, gulp.series('optimizeImages', 'zip'));
});

gulp.task('default', gulp.series(
  'build',
  gulp.parallel('connect', 'watch')
));

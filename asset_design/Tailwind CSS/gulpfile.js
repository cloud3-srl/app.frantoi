const { src, dest, watch, series, parallel } = require("gulp");
const clean = require("gulp-clean"); 
const options = require("./config"); 
const browserSync = require("browser-sync").create();

const sass = require("gulp-sass")(require("sass")); 
const postcss = require("gulp-postcss"); 
const concat = require("gulp-concat"); 
const includePartials = require("gulp-file-include");

//Load Previews on Browser on dev
function livePreview(done) {
  browserSync.init({
    server: {
      baseDir: './dist/'
    },
  });
  done();
}

// Triggers Browser reload
function previewReload(done) {
  browserSync.reload();
  done();
}

//Development Tasks
function disHTML() {
  return src('./src/html/pages/*.html')
    .pipe(includePartials())
    .pipe(dest('./dist/'));
}

function disStyles() {
  const tailwindcss = require("tailwindcss");
  const autoprefixer = require("autoprefixer");
  return src('./src/assets/scss/**/*.scss')
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss([tailwindcss(options.config.tailwindjs), autoprefixer()]))
    .pipe(concat({ path: "style.css" }))
    .pipe(dest('./dist/assets/css/'));
}

function distCss() {
  return src('./src/assets/css/*.css')
      .pipe(dest('./dist/assets/css/'))
}

function distVendorStyle() {
  return src('./src/assets/css/lib/*.css')
      .pipe(dest('./dist/assets/css/lib/'))
}

function distScript() {
  return src('./src/assets/js/app.js')
    .pipe(dest('./dist/assets/js/'))
}

function distVendorScript() {
  return src('./src/assets/js/lib/*.js*')
    .pipe(dest('./dist/assets/js/lib/'))
}

function prelineJs() {
  return src('./node_modules/flowbite/dist/flowbite.min.js',)
    .pipe(dest('./dist/assets/js/'))
}

function distJs() {
  return src([
      './src/assets/js/*.js',
      '!./src/assets/js/app.js'
  ])
      .pipe(dest('./dist/assets/js/'))
}

function distImages() {
  return src('./src/assets/images/**/*.*')
    .pipe(dest('./dist/assets/images/'))
}

function distFonts() {
  return src('./src/assets/fonts/**/*.*')
      .pipe(dest('./dist/assets/fonts/'))
}

function distFontawesome() {
  return src('./src/assets/webfonts/**/*.*')
      .pipe(dest('./dist/assets/webfonts/'))
}

function watchFiles() {
  watch(
    ['./src/html/**/*.{html,php}'],
    series(disHTML, disStyles, previewReload)
  );
  watch(
    ['./tailwind.config.js', './src/assets/scss/**/*.scss'],
    series(disStyles, previewReload)
  );
  watch('./src/assets/css/lib/*.css', series(distVendorStyle, previewReload));
  watch('./src/assets/css/*.css', series(distCss, previewReload));
  watch('./src/assets/js/app.js', series(distScript, previewReload));
  watch('./src/assets/js/lib/*.js*', series(distVendorScript, previewReload));
  watch('./src/assets/js/*.js', series(distJs, previewReload));
  watch('./src/assets/images/**/*.*', series(distImages, previewReload));
  watch('./src/assets/fonts/**/*.*', series(distFonts, previewReload));
  watch('./src/assets/webfonts/**/*.*', series(distFontawesome, previewReload));
}

function distClean() {
  return src('./dist/', { read: false, allowEmpty: true }).pipe(
    clean()
  );
}

exports.default = series(
  distClean, // Clean Dist Folder
  parallel(disStyles, distVendorStyle, distCss, distScript, distJs, distVendorScript, prelineJs, distImages, distFonts, distFontawesome, disHTML), //Run All tasks in parallel
  livePreview, // Live Preview Build
  watchFiles // Watch for Live Changes
);
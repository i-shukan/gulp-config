const { src, dest, parallel, series, watch } = require('gulp'),
    browserSync = require('browser-sync').create(),
    sass = require('gulp-sass')(require('sass')),
    cleanCSS = require('gulp-clean-css'),
    webpCss = require('gulp-webpcss'),
    ttf2woff2 = require('gulp-ttf2woff2'),
    ttf2woff = require('gulp-ttf2woff'),
    webp = require('imagemin-webp'),
    webpHtml = require('gulp-webp-html');
    fileInclude = require('gulp-file-include');
    imagemin = require('gulp-imagemin'),
    minify = require('gulp-minify'),
    babel = require('gulp-babel'),
    fonts2css = require('gulp-fonts2css'),
    fs = require('fs-extra');

const paths = {
    dist: {
        html: 'dist/',
        css: 'dist/css',
        js: 'dist/js',
        img: 'dist/img',
        fonts: 'dist/fonts'
    },
    src: {
        html: ['src/**/*.html', '!node_modules/**', '!dist/**'],
        scss: ['src/scss/**/*.scss', '!dist/**'],
        js: ['src/js/**/*.js', '!node_modules/**', '!dist/**'],
        img: 'src/img/**',
        fonts: 'src/fonts/**'
    },
    watch: {
        html: ['src/**/*.html', '!dist/**'],
        scss: 'src/scss/**/*.scss',
        js: 'src/js/**/*.js',
        img: 'src/img/**',
        fonts: 'src/fonts/**'
    }
}

/*---Tasks----------------------------------------------------------------------------------------------------*/

async function clean() {
    await fs.emptyDir('dist');
    if (!(await fs.pathExists("src/"))) {
        await fs.ensureFile('src/index.html')
        await fs.emptyDir('src/scss');
        await fs.emptyDir('src/fonts');
        await fs.emptyDir('src/img');
        await fs.emptyDir('src/js');
    }
}

function browsersync() {
    browserSync.init({
        server: { baseDir: 'dist/' },
        notify: false,
        online: true
    })
}

function html() {
    return src(paths.src.html)
        .pipe(fileInclude())
        .pipe(webpHtml())
        .pipe(dest(paths.dist.html))
        .pipe(browserSync.stream())
}

async function css() {
    await fs.emptyDir(paths.dist.css);
    return src(paths.src.scss)
        .pipe(sass().on('error', sass.logError))
        .pipe(webpCss({webpClass: '.webp', noWebpClass: '.no-webp'}))
        .pipe(cleanCSS())
        .pipe(dest(paths.dist.css))
        .pipe(browserSync.stream())
}

async function js() {
    await fs.emptyDir(paths.dist.js);
    return src(paths.src.js)
        .pipe(fileInclude())
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(minify())
        .pipe(dest(paths.dist.js))
        .pipe(browserSync.stream())
}

async function img() {
    await fs.emptyDir(paths.dist.img);
    return src(paths.src.img)
        .pipe(
            imagemin([
                webp({
                    quality: 70
                })
            ])      
        )
        .pipe(dest(paths.dist.img))
        .pipe(src(paths.src.img))
        .pipe(
            imagemin({
                progressive: true,
                svgoPlugins: [{ removeViewBox: false }],
                interplaced: true,
                optimizationLevel: 3
            })
        )
        .pipe(dest(paths.dist.img))
        .pipe(browserSync.stream())
}

async function fonts(params) {
    await fs.emptyDir(paths.dist.fonts);
    src(paths.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(paths.dist.fonts))
    return src(paths.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(paths.dist.fonts))
    .pipe(browserSync.stream())
}

function startWatch() {
    watch(paths.watch.js, js);
    watch(paths.watch.scss, css);
    watch(paths.watch.html, html);
    watch(paths.watch.fonts, fonts);
    watch(paths.watch.img, img);
}

/*---Exporting------------------------------------------------------------------------------------------------*/

exports.browsersync = browsersync;
exports.html = html;
exports.css = css;
exports.js = js;
exports.img = img;
exports.fonts = fonts;
exports.clean = clean;

exports.default = series(clean, parallel(html, css, js, fonts, img), parallel(browsersync, startWatch));

// To start gulp on linux use "npx gulp"
/* eslint "import/no-extraneous-dependencies": ["error", {"devDependencies": true}] */
const fs = require('fs');
const gulp = require('gulp');
const replace = require('gulp-replace-task');
const tar = require('gulp-tar');
const gzip = require('gulp-gzip');
const rename = require('gulp-rename');
const gitRev = require('git-rev-sync');
const exec = require('child_process').exec;
const rimraf = require('rimraf');

const packageInfo = JSON.parse(fs.readFileSync('./package.json'));
const destName = packageInfo.name;

gulp.task('clean', () => {
    rimraf.sync(destName);
});

gulp.task('yarn build', (cb) => {
    exec('yarn run build', cb);
});

const configSrc = [
    'default/**/*.*',
    'metadata/**/*.*',
    'README/**/*.*',
    'static/**/*.*',
    'lookups/**/*.*',
];
gulp.task('process config', ['clean'], () => {
    gulp.src(configSrc, { base: '.' })
        .pipe(replace({
            patterns: [
                { json: packageInfo },
                { json: { buildNumber: parseInt(gitRev.short(), 16) } },
            ],
        }))
        .pipe(gulp.dest(destName));
});

const vizFiles = [
    'visualization.js',
    'visualization.css',
    'formatter.html',
    'preview.png',
];
const staticSrc = [
    `appserver/static/visualizations/timewrap/{${vizFiles.join(',')}}`,
];
gulp.task('process static', ['clean', 'yarn build'], () => {
    gulp.src(staticSrc, { base: '.' })
        .pipe(gulp.dest(destName));
});

gulp.task('default', ['process config', 'process static'], (cb) => {
    // Work-around for a bug where the files from the `process static` task
    // are not in place immediately.
    setTimeout(() => {
        gulp.src(`${destName}/**/*.*`, { base: '.' })
            .pipe(tar(`${destName}.tar`))
            .pipe(gzip())
            .pipe(rename(`${destName}.spl`))
            .pipe(gulp.dest('.'));
        cb();
    }, 100);
});
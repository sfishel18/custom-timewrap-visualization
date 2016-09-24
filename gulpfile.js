/* eslint "import/no-extraneous-dependencies": ["error", {"devDependencies": true}] */
const fs = require('fs');
const gulp = require('gulp');
const replace = require('gulp-replace-task');
const gitRev = require('git-rev-sync');
const exec = require('child_process').exec;
const rimraf = require('rimraf');

gulp.task('clean', () => {
    rimraf.sync('build');
});

gulp.task('npm build', (cb) => {
    exec('npm run build', cb);
});

gulp.task('process config', ['clean'], () => {
    gulp.src(['default/**/*.*', 'metadata/**/*.*', 'README/**/*.*', 'static/**/*.*'], { base: '.' })
        .pipe(replace({
            patterns: [
                { json: JSON.parse(fs.readFileSync('./package.json')) },
                { json: { buildNumber: parseInt(gitRev.short(), 16) } },
            ],
        }))
        .pipe(gulp.dest('build'));
});

gulp.task('process static', ['clean', 'npm build'], () => {
    gulp.src(['appserver/**/*.*', '!**/*.map'], { base: '.' })
        .pipe(gulp.dest('build'));
});

gulp.task('default', ['process config', 'process static']);
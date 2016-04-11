'use strict';

const gulp = require('gulp');
const jshint = require('gulp-jshint');
const clean = require('gulp-clean');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

gulp.task('clean', () => {
  return gulp.src('public/dist')
  .pipe(clean());
});

gulp.task('jshint', () => {
  return gulp.src('public/js/*.js')
  .pipe(jshint())
  .pipe(jshint.reporter('default'));
});

gulp.task('uglify', ['clean'], () => {
  return gulp.src('public/js/*.js')
  .pipe(uglify())
  .pipe(gulp.dest('public/dist/js'));
});

gulp.task('default', ['uglify']);

'use strict';

const gulp = require('gulp');
const clean = require('gulp-clean');
const inlinesource = require('gulp-inline-source');
const babel = require('gulp-babel');
const htmlmin = require('gulp-htmlmin');
const jshint = require('gulp-jshint');
const es2015 = require('babel-preset-es2015');

gulp.task('clean', () => {
  return gulp.src('public/dist')
  .pipe(clean());
});

gulp.task('jshint', () => {
  return gulp.src('public/dist/js/**/*.js')
  .pipe(jshint())
  .pipe(jshint.reporter('default'));
});

gulp.task('inline', ['toes5'], () => {
  return gulp.src('public/dev/**/*.html')
  .pipe(inlinesource())
  .pipe(gulp.dest('public/'));
});

gulp.task('toes5', ['clean'], () => {
  return gulp.src(['public/js/vendors/**/*.js','public/js/*.js'])
  .pipe(babel({presets: [es2015]}))
  .pipe(gulp.dest('public/dist/js'));
});

gulp.task('htmlmin', ['inline'], () => {
  return gulp.src('public/index.html')
  .pipe(htmlmin({collapseWhitespace:true}))
  .pipe(gulp.dest('public/'));
});

gulp.task('default', ['htmlmin', 'jshint']);

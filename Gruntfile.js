/*jshint node: true */

'use strict';

module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    qunit: {
      all: ['test/index.html']
    },
    jshint: {
      files: [
      'Gruntfile.js',
      'jquery.idle.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> v<%= pkg.version %> | <%= pkg.license %> */\n'
      },
      build: {
        files: {
          'build/jquery.idle-<%= pkg.version %>.min.js': 'jquery.idle.js'
        }
      }
    },
    watch: {
      files: [
      'jquery.idle.js',
      'test/tests.js'
      ],
      tasks: 'default'
    },
    compare_size: {
      files: [
      'build/jquery.idle-<%= pkg.version %>.min.js',
      'jquery.idle.js'
      ],
      options: {
        compress: {
          gz: function (fileContents) {
            return require('gzip-js').zip(fileContents, {}).length;
          }
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-compare-size');

  grunt.registerTask('default', ['jshint', 'qunit', 'uglify', 'compare_size']);
  grunt.registerTask('ci', ['jshint', 'qunit']);
};

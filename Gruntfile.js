/*global module, require*/
module.exports = function(grunt){
  'use strict';

  var gruntConfig = {
    pkg: grunt.file.readJSON('package.json')
  };


  // lint
  grunt.loadNpmTasks('grunt-contrib-jshint');
  gruntConfig.jshint = {
    all: [
      'Gruntfile.js',
      'dice-roller.js'
    ]
  };
  grunt.registerTask('lint', 'jshint');


  // test
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  gruntConfig.jasmine = {
    src: {
      src: [
        'dice-roller.js'
      ],
      options: {
        specs: 'tests/*.test.js',
        junit: {
          path: 'output/testresults'
        }
      }
    }
  };
  grunt.registerTask('test', 'jasmine:src');

  // watch
  /*grunt.loadNpmTasks('grunt-contrib-watch');
  gruntConfig.watch = {
    scripts: {
      files: ['dice-roller.js'],
      tasks: ['lint', 'test']
    }
  };*/

  // grunt
  grunt.initConfig(gruntConfig);


  // convenience
  grunt.registerTask('default', ['lint', 'test']);
  grunt.registerTask('all', ['default']);

  // continuous integration
  grunt.registerTask('ci', ['lint', 'test']);
};

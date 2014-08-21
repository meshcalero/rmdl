var Parser = require('jison').Parser;

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/rmdc.js',
        dest: 'lib/rmdc.js'
      }
    },
	gen: {
		parser: {
			src: 'src/grammar.jison',
			dest: 'lib/rmdp.js'
		}
	},
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Default task(s).
  grunt.registerMultiTask('gen', "generate rmdl parser code", function(){
	var files=grunt.task.normalizeMultiTaskFiles(this.data);
	var src = grunt.file.read(files[0].src[0]);
	//grunt.log.write(src);
	try {
		var parser = new Parser(src);
		var out = parser.generate();
		grunt.file.write(files[0].dest, out );
	}
	catch(err){
		grunt.fail.warn("Failed to generate parser code for '"+files[0].src[0]+"':\n\n"+err+"\n");
	}
  });
  
  grunt.registerTask('default', ['newer:gen', 'newer:uglify']);

};
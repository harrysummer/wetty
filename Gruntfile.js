module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-clean');

    var config = {
        pkg: grunt.file.readJSON('package.json'),
        shell: {
            bowerInstall: {
                command: 'bower install',
                options: {
                    execOptions: {
                        cwd: 'client'
                    }
                }
            }
        },
        copy: {
            main: {
                src: 'client/src/index.ejs',
                dest: 'client/dist/views/index.ejs'
            }
        },
        useminPrepare: {
            html: 'client/src/index.ejs',
            options: {
                root: 'client',
                dest: 'client/dist/static'
            }
        },
        filerev: {
            images: {
                src: 'client/assets/*.{jpg,jpeg,gif,png,webp}',
                dest: 'client/dist/static'
            }
        },
        usemin: {
            html: 'client/dist/views/index.ejs',
            options: {
                assetsDirs: ['client/assets']
            }
        },
        clean: {
            build: [ '.tmp' ],
            release: [ 'client/dist' ]
        }
    };

    grunt.initConfig(config);

    grunt.registerTask('init', ['shell:bowerInstall']);
    grunt.registerTask('build', [
        'copy',
        'useminPrepare',
        'concat:generated',
        'cssmin:generated',
        'uglify:generated',
        'filerev',
        'usemin'
    ]);
};

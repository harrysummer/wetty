module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);
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
                src: 'client/src/index.html',
                dest: 'client/dist/index.html'
            }
        },
        useminPrepare: {
            html: 'client/dist/index.html',
            options: {
                root: 'client',
                dest: 'client/dist'
            }
        },
        filerev: {
            images: {
                src: 'client/assets/*.{jpg,jpeg,gif,png,webp}',
                dest: 'client/dist'
            }
        },
        usemin: {
            html: 'client/dist/index.html',
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
        'uglify:generated',
        'filerev',
        'usemin'
    ]);
};

( function(){
    'use strict';
    var authentication = require('../lib/authentication');
    var mongoose = require('mongoose');
    var User = mongoose.model('User');
    var UserRoles = require('../lib/UserRoles.js');
    var _ = require('lodash');
    var config = require('pony-config');
    var fs = require("fs");
    var path = require("path");
    var emailer = require('../lib/emailer');

    module.exports = function( app ){
        app.get( "/admin", authentication.protectAdmin, getAdmin );

        app.get( "/admin/users", authentication.protectAdmin, getUsers );
        app.get( "/admin/users/:userId", authentication.protectAdmin, getUser );
        app.post( "/admin/users/:userId", authentication.protectAdmin, postUser );

        app.get( "/admin/users/:userId/delete/confirm", authentication.protectAdmin, getUserConfirmDelete );
        app.post( "/admin/users/:userId/delete", authentication.protectAdmin, postUserDelete );

        app.get( "/admin/emails", authentication.protectAdmin, getEmails );
        app.get( "/admin/emails/:template", authentication.protectAdmin, getEmail );
    };

    function getAdmin( req, res ){
        res.render('admin/index');
    }

    function getUsers( req, res ){
        User.find( {}, function( error, users ){
            if( error ) req.flashError( 'Error getting users: ', error );
            res.render( 'admin/users', { users: users } );
        });
    }

    function getUser( req, res ){
        User.findById( req.params.userId, function( error, user ){
            if( error ) req.flashError( 'Error getting user: ', error );

            var usersRoles = _.map( UserRoles.allRoles(), function( role ){
                return {
                    role: role,
                    hasRole: user.hasRole( role ),
                    bootstrapLabel: UserRoles.bootstrapLabelForRole( role )
                };
            });

            res.render( 'admin/user', { userToEdit: user, usersRoles: usersRoles } );
        });
    }

    function getUserConfirmDelete( req, res ){
        User.findById( req.params.userId, function( error, user ){
            if( error ) req.flashError( 'Error getting user: ', error );
            res.render( 'admin/confirm-user-delete', { userToDelete: user } );
        });
    }

    function postUserDelete( req, res ){
        User.findById( req.params.userId, function( error, user ){
            if( error ){
                req.flashError( 'Error deleting user: ', error );
                res.redirect( "/admin/users" );
                return;
            }

            user.remove( function( error, result ){
                if( error ){
                    req.flashError( 'Error deleting user: ', error );
                }else{
                    req.flashSuccess( 'Successfully deleted ' + user.email );
                }
                res.redirect( "/admin/users" );
            });
        });
    }

    function postUser( req, res ){
        User.findById( req.params.userId, function( error, user ){
            if( error ){
                req.flashError( 'Error updating user: ', error );
                res.redirect( '/admin/users/' + req.params.userId );
            }

            var roles = req.body["roles[]"];
            user.roles = roles;

            user.save( function( error, user ){
                if( error ){
                    req.flashError( "Error updating " + user.email, error );
                }else{
                    req.flashSuccess( "Successfully updated " + user.email );
                }
                res.redirect( '/admin/users/' + req.params.userId );
            });
        });
    }

    function getEmails( req, res ){
        var templatesPath = config.get("email.templatesPath");
        fs.readdir( templatesPath, function( err, list ){
			if( err ) throw err;
            var templates = [];
            _.each( list, function( filename ){
                var stat = fs.statSync( path.join( templatesPath, filename ) );
                if( stat.isDirectory() ) templates.push( filename );
            });
            res.render( 'admin/emails', {templates: templates });
        });
    }

    function getEmail( req, res ){
        var template = req.params.template;

        var templateData = config.get("email.testData." + template );
        if( !templateData ){
            req.flashError( "No template data found for template named '" + template + "' inside /config/email-test-data.js" );
            return res.redirect( "/admin/emails" );
        }

        emailer.sendEmail( template, templateData, false, false, function( error, result ){
            res.render( "admin/email-results", { result: result, error: error });
        });
    }

})();
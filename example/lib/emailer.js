( function(){
    "use strict";

    var nodemailer = require("nodemailer");
    var smtpPool = require('nodemailer-smtp-pool');
    var config = require('pony-config');
    var loadEmailTemplates = require('email-templates');

    var smtpTransport = nodemailer.createTransport( smtpPool( config.get("email") ) );

    smtpTransport.on( 'log', function( data ){
        if( data && data.type === "error" ){
            console.log( "Email Transport Error: ", data );
        }else{
            console.log( "Email Transport Log: ", data );
        }
    });

    process.on( 'exit', function(){
        if( smtpTransport && smtpTransport.close ){
            console.log( "Closing mail transports", smtpTransport );
            smtpTransport.close();
        }
    });

    var _renderTemplate = function( templateName, templateData, callback ){
        console.error( "Templates not loaded yet" );
        callback( "Templates not loaded yet", false );
    };

    var templatesPath = config.get("email.templatesPath");
    loadEmailTemplates( templatesPath, function( error, templates ){
        if( error ){
            console.error( "Error loading email templates: " + templatesPath, error );
            return;
        }

        _renderTemplate = function( templateName, templateData, callback ){

            // need the templateDir path for all view so includes work
            templateData = templateData || {};
            templateData.templatesPath = templatesPath;

            console.log( "Rendering template", templateName, templateData );

            templates( templateName, templateData, function( error, html, text ){
                if( error ){
                    console.error( "Error rendering email template", error );
                    callback( error, false );
                }else{
                    callback( false, {
                        html: html,
                        text: text
                    });
                }
            });
        };
    });


    function _renderAndSend( info, callback ){
        _renderTemplate( info.templateName, info.templateData, function( error, renderedTemplate ){
            if( error ) return callback( error, false );

            console.log( "Rendered email template: ", renderedTemplate, info );
            _sendMail( info.subject, info.toEmail, renderedTemplate, function( error, result ){
                callback( error, result );
            });
        });
    }

    function _sendMail( subject, to, renderedTemplate, callback ){

        var mailOptions = {
            from: config.get("email.fromEmail"),
            to: to,
            subject: subject,
            text: renderedTemplate.text,
            html: renderedTemplate.html
        };


        // SEND IT!
        if( mailOptions.to && config.get("email.enabled") === true ){
            console.log( "Sending email now: ", mailOptions );
            smtpTransport.sendMail( mailOptions, function( error, info ){
                if( error ) console.error( "Error sending email: ", error );
                console.log( "Sent email: ", info );
                mailOptions.sendInfo = info;
                //smtpTransport.close(); // Trying to see if this eliminates greeting timeout errors
                callback( error, mailOptions );
            });
        }else{
            // used for debugging
            console.log( "Test rendering email now: ", mailOptions );
            callback( false, mailOptions );
        }
    }

    exports.sendEmail = function( templateName, templateData, toEmail, subject, callback ){
        var info = {
            subject: subject,
            toEmail: toEmail,
            templateName: templateName,
            templateData: templateData
        };
        _renderAndSend( info, callback );
    };

})();
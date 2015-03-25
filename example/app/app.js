/*
 * s3-file-upload
 * https://github.com/ponycode/s3-file-upload
 *
 * Copyright (c) 2015 Joshua Kennedy
 * Licensed under the MIT license.
 */

var express = require('express');
var debug = require('debug');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var requireMany = require('../lib/requireMany.js');
var flash = require('connect-flash');
var colors = require('colors');
var app = express();
var lusca = require('lusca');
var config = require('pony-config');
var middleware = require('../lib/app-middleware');
var dust = require('dustjs-linkedin');
require('dustjs-helpers');
var consolidate = require('consolidate');
require('../lib/dust-helpers.js')( dust );
var dbBootstrap = require('../lib/db-bootstrap');
var authentication = require('../lib/authentication');
var usersBootstrap = require('../lib/users-bootstrap');
var s3FileUpload = require('../../index')({ awsKey: "shit", awsSecret: "moreshit" });

// LOAD CONFIGURATION
config
    .setOptions( { debug: true } )
    .findEnvironment({ env: 'ENVIRONMENT', default:'dev' })
    .useObject( require('../config/common') )
    .useObject( require('../config/initial-users') )
    .useObject( require('../config/email-test-data') )
    .when(['dev']).useObject( require('../config/development') )
    .when(['prod', 'production', 'stage']).useObject( require('../config/production') );

config.list();

// Must be after configuration is loaded
dbBootstrap.connect( function( error ){

    // Must be after configuration and database loaded
    usersBootstrap.setupInitialUsers( function( error ){
        if( error ){
            console.error( 'Users Bootstrapping failed. ', error );
        }
    });
});


app.set('views', path.join(__dirname, '../views'));
app.set('showStackError', true);

app.engine('dust', consolidate.dust );
app.set('view engine', 'dust');

app.disable( 'x-powered-by' );
app.use( express.static(path.join(__dirname, '../public')) );
app.use( favicon( path.join(__dirname, '../public/images/favicon.ico')) );
app.use( logger('dev') );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({ extended: false }) );

app.use( cookieParser() );
app.use( dbBootstrap.mongoExpressSession() );
authentication.init( app );

app.use( lusca({
    csrf: true,
    csp: {
        policy: {
            'default-src': '\'self\' *.googleapis.com',
            'img-src': '\'self\'',
            'script-src': '\'self\' \'unsafe-inline\' *.googleapis.com',
            'style-src': '\'self\' \'unsafe-inline\''
        }
    },
    xframe: 'SAMEORIGIN',
    p3p: false,
    hsts: { maxAge: 31536000, includeSubDomains: true },
    xssProtection: true
}));

app.use( flash() );
app.use( middleware.localize );
app.use( middleware.helpers );


// LOAD THANGS FROM THE /routes DIRECTORY
var loadedRoutes = requireMany( '../routes' );
loadedRoutes.apply( app );


s3FileUpload.setupExpressRoutes( app );

app.use( middleware.fourOhFour );       // Needs to be after all routes are loaded
app.use( middleware.unhandledError );   // Needs to be the last middleware on the stack

require('../lib/emailer');

app.set( 'port', config.get("port") );

var server = app.listen( app.get('port'), function(){
    var message = 's3-file-upload server is listening on port ' + server.address().port
    console.log( message.green );
});
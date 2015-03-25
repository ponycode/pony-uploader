( function(){
    'use strict';

    var moment = require('moment');
    var UserRoles = require('./UserRoles');

    module.exports = function( dust ){
        dust.helpers.momentFormat = _momentFormat;
        dust.helpers.momentDurationHumanize = _momentDurationHumanize;
        dust.helpers.script = _script;
        dust.helpers.userRolesLabels = _userRolesLabels;
    };

    function _momentDurationHumanize( chunk, context, bodies, params ){
        var duration = params.duration || 0;
        var units = params.units || 'milliseconds';
        var humanizedDuration = moment.duration( duration, units ).humanize();
        return chunk.write( humanizedDuration );
    }

    function _momentFormat( chunk, context, bodies, params ){
        if( !params.date || !params.format ) return chunk;
        var formattedDate = moment( params.date ).format( params.format );
        return chunk.write( formattedDate );
    }

    function _script( chunk, context, bodies, params ){
        if( !params.filepath ) return chunk;
        var webPath = params.filepath.replace( "public/", "/" );
        var html = '<script type="text/javascript" language="javascript" src="' + webPath + '"></script>';
        return chunk.write( html );
    }

    function _userRolesLabels( chunk, context, bodies, params ){
        if( !params.user ) return chunk;
        var html = '';
        var user = params.user;
        for( var r = 0; r < user.roles.length; r++ ){
            var role = user.roles[r];
            html += UserRoles.bootstrapLabelForRole( role ) + " ";
        }
        return chunk.write( html );
    }

})();
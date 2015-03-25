( function(){
    'use strict';

    exports.ADMIN = 'admin';

    exports.allRoles = function(){
        return [ exports.ADMIN ];
    };

    exports.bootstrapLabelForRole = function( role ){
        var bootstrapColor = 'default';
        if( role === exports.ADMIN ){
            bootstrapColor = 'danger';
        }
        return "<span class='label label-" + bootstrapColor + "'>" + role + "</span>";
    };

})();
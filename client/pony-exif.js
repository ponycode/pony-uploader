;var ponyEXIF = ( function(){
    var debug = true;

    var TiffTags = {
        0x0112 : "Orientation",
        0x0132 : "DateTime",
        0x010F : "Make",
        0x0110 : "Model"
    };

    function _locateStartingPointAndReadExifData( file, callback ){
        var dataView = new DataView( file );

        if( (dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8) ){
            callback( new Error("Not a valid JPEG"), false );
            return;
        }

        var offset = 2;
        var length = file.byteLength;
        var marker;

        while( offset < length ){
            if( dataView.getUint8( offset ) != 0xFF ){
                callback( new Error("Not a valid JPEG"), false );
                return;
            }

            marker = dataView.getUint8( offset + 1 );
            if( marker == 225 ){
                var exif = _readEXIFData( dataView, offset + 4, dataView.getUint16( offset + 2 ) - 2 );
                callback( false, exif );
                return;
            } else {
                offset += 2 + dataView.getUint16( offset + 2 );
            }
        }

        callback( new Error("Not a valid JPEG"), false );
    }

    function _readEXIFData(file, start) {
        if( getStringFromBuffer( file, start, 4) != "Exif" ) return false;

        var bigEnd, tiffOffset = start + 6;

        if( file.getUint16(tiffOffset) == 0x4949 ){
            bigEnd = false;
        }else if( file.getUint16(tiffOffset) == 0x4D4D ){
            bigEnd = true;
        }else{
            return false;
        }

        if( file.getUint16( tiffOffset + 2, !bigEnd ) != 0x002A ) return false;

        var firstIFDOffset = file.getUint32(tiffOffset + 4, !bigEnd);
        if( firstIFDOffset < 0x00000008 ) return false;

        return readTags( file, tiffOffset, tiffOffset + firstIFDOffset, TiffTags, bigEnd );
    }

    function readTags( file, tiffStart, dirStart, strings, bigEnd ){
        var entries = file.getUint16(dirStart, !bigEnd),
            tags = {},
            entryOffset,
            tag;

        for( var i = 0; i < entries; i++ ){
            entryOffset = dirStart + i * 12 + 2;
            tag = strings[ file.getUint16(entryOffset, !bigEnd) ];
            if( !tag ) continue;
            tags[tag] = readTagValue( file, entryOffset, tiffStart, dirStart, bigEnd );
        }

        return tags;
    }

    function readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd ){

        var type = file.getUint16( entryOffset + 2, !bigEnd );
        var numValues = file.getUint32( entryOffset + 4, !bigEnd) ;
        var valueOffset = file.getUint32( entryOffset + 8, !bigEnd ) + tiffStart;
        var offset;

        switch( type ){
            case 2: // ascii, 8-bit byte
                offset = numValues > 4 ? valueOffset : (entryOffset + 8);
                return getStringFromBuffer( file, offset, numValues-1 );

            case 3: // short, 16 bit int
                if( numValues == 1 ){
                    return file.getUint16(entryOffset + 8, !bigEnd);
                } else {
                    offset = numValues > 2 ? valueOffset : (entryOffset + 8);
                    var vals = [];
                    for( var n = 0; n < numValues; n++ ){
                        vals[n] = file.getUint16(offset + 2*n, !bigEnd);
                    }
                    return vals;
                }
            default:
                break;
        }
    }

    function getStringFromBuffer( buffer, start, length ){
        var outstr = "";
        for( var n = start; n < start + length; n++ ){
            outstr += String.fromCharCode( buffer.getUint8( n ) );
        }
        return outstr;
    }

    return {
        getExifFromJPEGArrayBuffer: _locateStartingPointAndReadExifData
    }

})();
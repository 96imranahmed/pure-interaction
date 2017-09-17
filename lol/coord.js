
xLabsCoord = {

    // Variables
    // ----------------------------------------------------------------
    prevMouse : {
        screen : {
            x : null,
            y : null
        },
        client : {
            x : null,
            y : null }
        },

    devicePixelRatio : null,
    lockoutCountDown : 0,
    offsetUpdateCnt : 0,
    failSafeResetCnt : 0,
    
    offset : { 
        x : null,
        y : null
    },

    offsetRange : null,

    mouseScreenX : null,
    mouseScreenY : null,
    
    //onDevicePixelRatioChange : function () {}, // reassign to do somthing


    // Functions
    // ----------------------------------------------------------------
    setup : function( devicePixelRatioWithoutZoom ) {
      if( devicePixelRatioWithoutZoom == 0 ) {
        console.error( "devicePixelRatioWithoutZoom is zero" );
        return;
      }

      xLabsCoord.devicePixelRatioWithoutZoom = devicePixelRatioWithoutZoom;
      //console.log( "default zoom: " + xLabsCoord.devicePixelRatioWithoutZoom );
      offsetRange = xLabsCoord.resetOffsetRange();
      window.addEventListener( "mousemove", xLabsCoord.onMouseMove );
      window.addEventListener( "resize", function() { xLabsCoord.reset(); } );
        
      if( xLabsContent.getConfig( "browser.mouse.absScreenCoordinates" ) == "1" ) {
        xLabsCoord.mouseScreenX = function(mouseEvent) { return mouseEvent.screenX; }
        xLabsCoord.mouseScreenY = function(mouseEvent) { return mouseEvent.screenY; }
      }
      else {
        xLabsCoord.mouseScreenX = function(mouseEvent) { return mouseEvent.screenX + window.screenX; } // This is only needed in chrome because of a bug
        xLabsCoord.mouseScreenY = function(mouseEvent) { return mouseEvent.screenY + window.screenY; }
      }
        
      xLabsCoord.reset();
//         console.log( "xlabscoord Setup done" );
    },
    
    resetOffsetRange : function() {
        return {
            x : {
                min:  Infinity,
                max: -Infinity
            },
            y : {
                min:  Infinity,
                max: -Infinity
            }
        };
    },
    
    devicePixelRatio : function() {
    	if( !xLabsCoord.devicePixelRatioWithoutZoom ) {
    		return null;
    	}
    	return window.devicePixelRatio / xLabsCoord.devicePixelRatioWithoutZoom;
	},
	
    reset : function() {
//     	console.log( "Resetting" );
        xLabsCoord.offsetRange = xLabsCoord.resetOffsetRange();
        xLabsCoord.prevDevicePixelRatio = xLabsCoord.devicePixelRatio();
        //xLabsCoord.onDevicePixelRatioChange();
    },

    updateRange : function( range, x, y ) {
        range.x.min = Math.min( range.x.min, x );
        range.x.max = Math.max( range.x.max, x );
        range.y.min = Math.min( range.y.min, y );
        range.y.max = Math.max( range.y.max, y );
    },


    offsetFromRange : function( range ) {
        return {
            x: Math.round( (range.x.min + range.x.max) / 2 ),
            y: Math.round( (range.y.min + range.y.max) / 2 )
        };
    },

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Coordinate conversion
  // Dave 2 Alan: These are converted from old extension, aren't tested as compatible with the rest
  // of this coord utility...
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  scr2docX: function( screenX ) {
    var ready = xLabsContent.getConfig( "browser.document.offset.ready" );
    if( ready.localeCompare( "1" ) != 0 ) {
      throw "Should not call scr2doc() unless mouse moved, i.e. browser.document.offset.ready == 1";
    }

    var xOffset = xLabsContent.getConfig( "browser.document.offset.x" );
    return screenX - window.screenX - xOffset;
  },

  scr2docY: function( screenY ) {
    var ready = xLabsContent.getConfig( "browser.document.offset.ready" );
    if( ready.localeCompare( "1" ) != 0 ) {
      throw "Should not call scr2doc() unless mouse moved, i.e. browser.document.offset.ready == 1";
    }

    var yOffset = xLabsContent.getConfig( "browser.document.offset.y" );
    return screenY - window.screenY - yOffset;
  },

  scr2doc: function( screenX, screenY ) {
    return {
      x: xLabsCoord.scr2docX( screenX ),
      y: xLabsCoord.scr2docY( screenY )
    }
  },

  doc2scrX: function( documentX ) {
    var ready = xLabsContent.getConfig( "browser.document.offset.ready" );
    if( ready.localeCompare( "1" ) == 0 ) {
      throw "Should not call scr2doc() unless mouse moved, i.e. browser.document.offset.ready == 1";
    }
    var xOffset = xLabsContent.getConfig( "browser.document.offset.x" );
    return documentX + window.screenX + xOffset;
  },

  doc2scrY: function( documentY ) {
    var ready = xLabsContent.getConfig( "browser.document.offset.ready" );
    if( ready.localeCompare( "1" ) == 0 ) {
      throw "Should not call scr2doc() unless mouse moved, i.e. browser.document.offset.ready == 1";
    }
    var yOffset = xLabsContent.getConfig( "browser.document.offset.y" );
    return documentY + window.screenY + yOffset;
  },

  doc2scr: function( documentX, documentY ) {
    return {
      x: xLabsCoord.doc2scrX( documentX ),
      y: xLabsCoord.doc2scrY( documentY )
    }
  },

    onMouseMove : function( e ) {
//     	console.log( "e.screenXY: " + e.screenX + ", " + e.screenY );
//     	console.log( "window.innerWH: " + window.innerWidth + ", " + window.innerHeight );
//     	console.log( "window.devicePixelRatio: " + window.devicePixelRatio );
//     	console.log( "xlabsCoord.devicePixelRatio: " + xLabsCoord.devicePixelRatio() );
    
        // console.log( window.devicePixelRatio );
        if( xLabsCoord.prevDevicePixelRatio != xLabsCoord.devicePixelRatio() ) {
            xLabsCoord.reset();
        }

        // on move, compute the otherwise inaccessible document-offset property
        var mouseScreenX = xLabsCoord.mouseScreenX( e );
        var mouseScreenY = xLabsCoord.mouseScreenY( e );

        // First time
        if( xLabsCoord.prevMouse.screen.x === null ) {
            xLabsCoord.prevMouse.screen.x = mouseScreenX;
            xLabsCoord.prevMouse.screen.y = mouseScreenY;
            xLabsCoord.prevMouse.client.x = e.clientX;
            xLabsCoord.prevMouse.client.y = e.clientY;
        }

        // Didn't move?
        if(    xLabsCoord.prevMouse.screen.x - mouseScreenX == 0
            && xLabsCoord.prevMouse.screen.y - mouseScreenY == 0 ) {
            return;
        }

        // See if what's observed matched with the devicePixelRatio
        var screenDeltaX = ( mouseScreenX - xLabsCoord.prevMouse.screen.x );
        var screenDeltaY = ( mouseScreenY - xLabsCoord.prevMouse.screen.y );
        var clientDeltaX = (    e.clientX - xLabsCoord.prevMouse.client.x );
        var clientDeltaY = (    e.clientY - xLabsCoord.prevMouse.client.y );

        // Save current
        xLabsCoord.prevMouse.screen.x = mouseScreenX;
        xLabsCoord.prevMouse.screen.y = mouseScreenY;
        xLabsCoord.prevMouse.client.x = e.clientX;
        xLabsCoord.prevMouse.client.y = e.clientY;

        if( xLabsCoord.lockoutCountDown > 0 ) {
            xLabsCoord.lockoutCountDown--;
            return;
        }

        var dx = Math.abs( screenDeltaX / xLabsCoord.devicePixelRatio() - clientDeltaX );
        var dy = Math.abs( screenDeltaY / xLabsCoord.devicePixelRatio() - clientDeltaY );

        // console.log( "screenDeltaXY: (" + screenDeltaX + ", " + screenDeltaY + ")" );
        // console.log( "clientDeltaXY: (" + clientDeltaX + ", " + clientDeltaY + ")" );
        // console.log( "dXY: (" + dx + ", " + dy + ")" );
        if( dx > 1 || dy > 1 ) {
            // console.log( "Bad coordinates" );
            xLabsCoord.lockoutCountDown = 5; // lock out the next few
            return;
        }

        // Make sure document offset is up to date
        var newOffsetX = mouseScreenX - window.screenX - e.clientX * xLabsCoord.devicePixelRatio();
        var newOffsetY = mouseScreenY - window.screenY - e.clientY * xLabsCoord.devicePixelRatio();

        xLabsCoord.updateRange( xLabsCoord.offsetRange, newOffsetX, newOffsetY );

        // Fail safe
        var tolerance = 1.1;

        var rangeX = xLabsCoord.offsetRange.x.max - xLabsCoord.offsetRange.x.min;
        var rangeY = xLabsCoord.offsetRange.y.max - xLabsCoord.offsetRange.y.min;
        // console.log( "rangeXY: " + rangeX + ", " + rangeY );
        // console.log( "window.devicePixelRatio: " + window.devicePixelRatio );
        if(    rangeX > xLabsCoord.devicePixelRatio() * tolerance
            || rangeY > xLabsCoord.devicePixelRatio() * tolerance ) { // leave some room for rounding errors
            
            //console.error( "fail safe reset" );
            xLabsCoord.failSafeResetCnt++;
            xLabsCoord.reset();
            return;
        }

        var newOffset = xLabsCoord.offsetFromRange( xLabsCoord.offsetRange );

        // console.log( "old xy="+xLabsCoord.offset.x+","+xLabsCoord.offset.y+" new xy="+newOffset.x+","+newOffset.y );
        if(    xLabsCoord.offset.x != newOffset.x
            || xLabsCoord.offset.y != newOffset.y ) {

            xLabsCoord.offsetUpdateCnt++;
            xLabsCoord.offset = newOffset;
        }

        // console.log( "offset: (" + xLabsCoord.offset.x + ", " + xLabsCoord.offset.y + ")" );
        // console.log( "offsetUpdateCnt: " + xLabsCoord.offsetUpdateCnt );
        // console.log( "failSafeResetCnt: " + xLabsCoord.failSafeResetCnt );
    },
};

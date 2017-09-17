
///////////////////////////////////////////////////////////////////////////////
// Mouse emulation mode. 
//
// Takes control of the mouse using head pose. Note that actual mouse control
// is done by the background script. This page simply shows that it is under
// control by showing actions and highlighting square brackets around the 
// pointer.
//
// UI features:
// - If you hold still, it will eventually click. Show a pie that rotates 
//   after x seconds until click on completion. The actual click is implemented
//   in the background. The pie should be small and centred on the cursor
//
// - When active put small blue square brackets around the cursor to show it's
//   being controlled.
//
// - When a nod to disable or reset the system is registered, there is a delay
//   before it zeroes or disables. Show a semi-circle on left/right sides of
//   screen respectively to indicate this action is happening and allow user
//   to centre their head.
//
///////////////////////////////////////////////////////////////////////////////
var xLabsMouse = {

  TIMEOUT_BACK : 1500,
  TIMEOUT_SCROLL : 500,
  TIMEOUT_CLICK : 2000,
  TIMEOUT_EXTEND : 3000,

  // the painting state
  state : "cursor",
  dwellStartTime : 0,

  roll : 0.0,
  rollLearningRate : 0.04,
  rollThreshold : 0.2,

  // TODO change roll commands to measured time
  commandReset : false, 
  commandSuspend : false,

  canvasXY : { x:0, y:0 },
  documentXY : { x:0, y:0 },

  stateTimer : new xLabsTimer(),

  setState : function( stateString, durationMsec ) {
    if(    stateString != "cursor"
        && stateString != "initialising"
        && stateString != "suspended"
        // && s != stateReady
        ) {
        throw new Error( "Invalid state" );
    }

    xLabsMouse.state = stateString;

    if( typeof durationMsec != 'undefined' ) {
      xLabsMouse.stateTimer.setDuration( durationMsec );
      xLabsMouse.stateTimer.reset();
      console.log( "Timer reset" );
    }
  },

  setConfigInitStatus : function( s ) {
    if(    s != "uninitialised"
        && s != "animating"
        && s != "zeroing"
        && s != "initialised"
        ) {
        throw new Error( "Invalid initStatus" );
    }
    xLabsContent.setConfig( "mouseEmulator.initialisationStatus", s );
  },

  getConfigInitStatus : function() {
    return xLabsContent.getConfig( "mouseEmulator.initialisationStatus" );
  },

  paintInit : function( ctx ) { 
    // paints the initialization cue - a shrinking circle that forces the view to the centre
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.beginPath();    
    ctx.rect( 0,0, ctx.canvas.width, ctx.canvas.height );
    ctx.fill();

    var oldMode = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'destination-out';

    var xy = xLabsContent.getCanvasCoordinates( screen.width/2, screen.height/2 );
    var d = Math.sqrt( screen.width*screen.width + screen.height*screen.height );
    var frac = xLabsMouse.stateTimer.elapsedFrac();

    var radiusMin = screen.height/20;
    var radiusMax = d/2;
    if( frac < 0.6 ) { // shrink
      frac = frac / 0.6; // scale from 0 to 1
      var radius = ( 1 - frac ) * ( radiusMax - radiusMin ) + radiusMin;
    }
    else if( frac < 0.8 ) { // dwell a little bit
      xLabsMouse.setConfigInitStatus( "zeroing" );
      var radius = radiusMin;
    }
    else { // expand
      xLabsMouse.setConfigInitStatus( "initialised" );
      frac = (frac-0.8)/0.2; // scale from 0 to 1
      var radius = frac * ( radiusMax - radiusMin ) + radiusMin;
    }

    console.log( "Timer elapsedFrac(): " + xLabsMouse.stateTimer.elapsedFrac() );

    ctx.fillStyle = "rgba(255, 255, 255, 1.0)";
    ctx.beginPath();
    ctx.arc( xy.x, xy.y, radius, 0, 2 * Math.PI, false);
    ctx.fill();

    ctx.globalCompositeOperation = oldMode;
  },

  truncate : function( value, lo, hi ) {
    return Math.min( Math.max( value, lo ), hi );
  },

  updateCursor : function() {
    var screenX = parseFloat( xLabsContent.getConfig( "mouseEmulator.cursor.x" ) );
    var screenY = parseFloat( xLabsContent.getConfig( "mouseEmulator.cursor.y" ) );
    screenX += screen.width /2;
    screenY += screen.height/2;

    var canvasXY = xLabsContent.getCanvasCoordinates( screenX, screenY );

    xLabsMouse.canvasXY.x = xLabsMouse.truncate( canvasXY.x, 0, xLabsContent.canvas.width -1 );
    xLabsMouse.canvasXY.y = xLabsMouse.truncate( canvasXY.y, 0, xLabsContent.canvas.height-1 );

    xLabsMouse.documentXY.x = xLabsMouse.canvasXY.x / xLabsCoord.devicePixelRatio();
    xLabsMouse.documentXY.y = xLabsMouse.canvasXY.y / xLabsCoord.devicePixelRatio();
  },

  paintCursor : function( ctx ) {
    // console.log( "paintCursor" );


    // Get nearest element
    var el = document.elementFromPoint( xLabsMouse.documentXY.x, xLabsMouse.documentXY.y );
    if( el ) {
      ctx.strokeStyle = "rgba(0, 0, 255, "+0.5+")";
      ctx.lineWidth = 2;

      var bb = el.getBoundingClientRect();

      ctx.beginPath();
      ctx.rect(  bb.left*xLabsCoord.devicePixelRatio(),
                 bb.top *xLabsCoord.devicePixelRatio(),
                (bb.right-bb.left)*xLabsCoord.devicePixelRatio(),
                (bb.bottom-bb.top )*xLabsCoord.devicePixelRatio() );
      ctx.stroke();
    }


    var alpha = parseFloat( xLabsContent.getConfig( "mouseEmulator.adaptive.alpha" ) );

    // convert alpha into size
    var radius = alpha * 35 + 25;
    var opacity = (1 - alpha) * (1 - 0.3) + 0.3;

    var x = xLabsMouse.canvasXY.x;
    var y = xLabsMouse.canvasXY.y;
    var r = 10;

    var paintTimer = false;
    var now = new Date().getTime();
//    if( xLabsMouse.dwellStartTime == 0 ) { // ie moving, not dwelling
    if( alpha > 0 ) { // ie moving, not dwelling
      ctx.fillStyle = "rgba(255, 0, 0, "+opacity+")"; 
    }
    else if( xLabsMouse.dwellStartTime > now ) { // then we just clicked - waiting for load
      ctx.fillStyle = "rgba(0, 150, 0, 0.5 )";
    }
    else { // we are dwelling and waiting.
      ctx.fillStyle = "rgba(255, 0, 0, "+opacity+")"; 
      paintTimer = true;
    }
    ctx.beginPath();
    ctx.arc( x,y, radius, 0, 2 * Math.PI, false );
    ctx.fill();

    // when dwelling pending a click, paint a visual timer:
    if( paintTimer ) {
      var elapsed = ( now - xLabsMouse.dwellStartTime ) / xLabsMouse.TIMEOUT_CLICK;
      var radians = elapsed * Math.PI * 2.0; // now we have the arc in radians
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba( 0, 150, 0, 0.6 )";
      ctx.arc( x,y, radius, 0-(Math.PI*0.5), radians-(Math.PI*0.5), false );
      ctx.stroke();
    }

    // paint a small crosshairs on top
    ctx.beginPath();
    ctx.lineWidth = "1";
    ctx.strokeStyle = "rgba( 0, 0, 0, 1 )";
    ctx.moveTo( x-r, y );
    ctx.lineTo( x+r, y );
    ctx.moveTo( x, y-r );
    ctx.lineTo( x, y+r );
    ctx.stroke();

    //xLabsMouse.dwellHandler( documentX, documentY, canvasXY );
  },

  calculateClientXY: function(element, documentX, documentY) {
    var rect = element.getBoundingClientRect();
    return {
      x: documentX - rect.left,
      x: documentY - rect.top
    };
  },

  click : function( documentX, documentY ) {
    console.log( "xLabs: Mouse click." );

    var el = document.elementFromPoint(documentX, documentY);
    if( !el ) {
      console.log( "xLabs: No element to click." );
    }
    else {
      var rect = el.getBoundingClientRect();      
      var clientXY = xLabsMouse.calculateClientXY( el, documentX, documentY );
      var evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("click", true, true, window,
          1, 0, 0,
          clientXY.x, clientXY.y,
          false, false, false, false, 0, null);

      el.dispatchEvent(evt);
    }
  },

  dwellHandler : function() {// documentX, documentY, canvasXY ) {
    // console.log( xLabsMouse.dwellStartTime );
    var documentX = xLabsMouse.documentXY.x;
    var documentY = xLabsMouse.documentXY.y; 
    var canvasXY = xLabsMouse.canvasXY;

    var alpha = parseFloat( xLabsContent.getConfig( "mouseEmulator.adaptive.alpha" ) );

    if( alpha == 0 || canvasXY.x == 0 || canvasXY.y == 0 || canvasXY.y >= xLabsContent.canvas.height-1 ) {
      var now = new Date().getTime();
      if( xLabsMouse.dwellStartTime == 0 ) {
        console.log( "dwellStartTime set to now" );
        xLabsMouse.dwellStartTime = now;
      }
      else {
        if( documentX == 0 ) { // back button
          xLabsMouse.paintPendingBack();
          if( now - xLabsMouse.dwellStartTime > xLabsMouse.TIMEOUT_BACK ) {
            window.history.back();
            xLabsMouse.dwellStartTime = now;
          }
        }
        else if( canvasXY.y == 0 ) {
          xLabsMouse.paintPendingScrollUp();
          if( now - xLabsMouse.dwellStartTime > xLabsMouse.TIMEOUT_SCROLL ) {
            window.scrollBy(0, -10);
          }
        }
        else if( canvasXY.y >= xLabsContent.canvas.height-1 ) {
          xLabsMouse.paintPendingScrollDown();
          if( now - xLabsMouse.dwellStartTime > xLabsMouse.TIMEOUT_SCROLL ) {
            window.scrollBy(0, 10);
          }
        }
        else { 
          if( now - xLabsMouse.dwellStartTime > xLabsMouse.TIMEOUT_CLICK ) {
            xLabsMouse.click( documentX, documentY );
            xLabsMouse.dwellStartTime = now + xLabsMouse.TIMEOUT_EXTEND; // add some extra to the dwell time [DAVE: WTF?? ah, stop another click while document loads?]
          }
        }
      }
    }
    else {
      xLabsMouse.dwellStartTime = 0;
    }
  },

  paintPendingBack : function() {
    // a red bar at left
    var w = xLabsContent.canvas.height * 0.1;
    var h = xLabsContent.canvas.height;
    xLabsContent.canvasContext.fillStyle = "rgba( 255, 0, 0, 0.3 )";
    xLabsContent.canvasContext.fillRect( 0,0, w, h ); 
  },
  paintPendingScrollUp : function() {
    // a blue bar at top
    var w = xLabsContent.canvas.width;
    var h = xLabsContent.canvas.height * 0.1;
    var y = 0;
    xLabsContent.canvasContext.fillStyle = "rgba( 0, 0, 255, 0.3 )";
    xLabsContent.canvasContext.fillRect( 0,y, w, h ); 
  },
  paintPendingScrollDown : function() {
    // a blue bar at bottom
    var w = xLabsContent.canvas.width;
    var h = xLabsContent.canvas.height * 0.1;
    var y = xLabsContent.canvas.height - h;
    xLabsContent.canvasContext.fillStyle = "rgba( 0, 0, 255, 0.3 )";
    xLabsContent.canvasContext.fillRect( 0,y, w, h ); 
  },
  paintPendingReset : function() {
    // a triangle lower left (dark grey)
    var x1 = 0;
    var y1 = xLabsContent.canvas.height * 0.5;
    var x2 = y1;
    var y2 = xLabsContent.canvas.height;
    var x3 = x1;
    var y3 = y2;

    xLabsContent.canvasContext.strokeStyle = "rgba( 0, 0, 0, 0.3 )";
    xLabsContent.canvasContext.fillStyle = "rgba( 0, 0, 0, 0.3 )";
    xLabsContent.canvasContext.beginPath();
    xLabsContent.canvasContext.moveTo( x1, y1 );
    xLabsContent.canvasContext.lineTo( x2, y2 );
    xLabsContent.canvasContext.lineTo( x3, y3 );
    xLabsContent.canvasContext.lineTo( x1, y1 );
    xLabsContent.canvasContext.closePath();
    xLabsContent.canvasContext.fill();
    xLabsContent.canvasContext.stroke();
  },
  paintPendingSuspend : function() {
    // a triangle lower right (red)
    var x1 = xLabsContent.canvas.width;
    var y1 = xLabsContent.canvas.height * 0.5;
    var x2 = xLabsContent.canvas.width - y1;
    var y2 = xLabsContent.canvas.height;
    var x3 = x1;
    var y3 = y2;

    xLabsContent.canvasContext.strokeStyle = "rgba( 255, 0, 0, 0.3 )";
    xLabsContent.canvasContext.fillStyle = "rgba( 255, 0, 0, 0.3 )";
    xLabsContent.canvasContext.beginPath();
    xLabsContent.canvasContext.moveTo( x1, y1 );
    xLabsContent.canvasContext.lineTo( x2, y2 );
    xLabsContent.canvasContext.lineTo( x3, y3 );
    xLabsContent.canvasContext.lineTo( x1, y1 );
    xLabsContent.canvasContext.closePath();
    xLabsContent.canvasContext.fill();
    xLabsContent.canvasContext.stroke();
  },

  paint : function() {
    xLabsContent.canvasContext.clearRect( 0,0, xLabsContent.canvas.width, xLabsContent.canvas.height );
    // xLabsContent.canvasContext.fillStyle = "rgba(255, 0, 0, 0.5)";
    // xLabsContent.canvasContext.strokeStyle = "rgba(255, 0, 0, 0.5)";
    // xLabsContent.canvasContext.lineWidth = 3;
    // xLabsContent.canvasContext.beginPath();
    // var xyCanvas = xLabsContent.getCanvasCoordinatesMouse(); 
    // var xCanvas = xyCanvas.x; 
    // var yCanvas = xyCanvas.y;
    // xLabsContent.canvasContext.arc( xCanvas, yCanvas, 30, 0, 2 * Math.PI, false);
    // xLabsContent.canvasContext.stroke();

    // Paint depending on current state
    if( xLabsMouse.state == "initialising" )
    {
      xLabsMouse.paintInit( xLabsContent.canvasContext );
    }

    if( xLabsMouse.state == "cursor" )
    {      
      xLabsMouse.updateCursor();
      xLabsMouse.paintCursor( xLabsContent.canvasContext );
      xLabsMouse.dwellHandler();
    }

    if( xLabsMouse.state == "suspended" )
    {      
      // nothing to paint
    }


    // State machine logic
    // -----------------------------------------------------------------------------------

    // See if initilisation sequence is complete
    if( xLabsMouse.state == "initialising" )
    {
      // Move on after delay
      if( xLabsMouse.stateTimer.hasElapsed() ) {        
        // xLabsMouse.setConfigInitStatus( "initialised" ); // this is set inside the animation code
        xLabsMouse.setState( "cursor" );
      }
    }

    // If no other content script has started initialisation sequence, then this script should start it
    if( xLabsMouse.state == "cursor" ) {
      var initStatus = xLabsMouse.getConfigInitStatus();
      if( initStatus == "uninitialised" ) {
        xLabsMouse.setConfigInitStatus( "animating" );
        xLabsMouse.setState( "initialising", 6000 );
      }
    }

    // always check for the head roll reset/suspend commands, whether active or not.
    // see if the user commands a reset or suspend:
    var roll = parseFloat( xLabsContent.getConfig( "state.head.roll" ) );
    var offset = 50.0; // shift to positive range
    xLabsMouse.roll = xLabsUtil.lerp( xLabsMouse.roll+offset, roll+offset, xLabsMouse.rollLearningRate ) -offset;

    if( roll < (-xLabsMouse.rollThreshold) ) {
      xLabsMouse.paintPendingSuspend();
    }
    else if( roll > xLabsMouse.rollThreshold ) {
      xLabsMouse.paintPendingReset();
    }

    //console.log( "state="+xLabsMouse.state + " roll="+ro + " smooth:"+xLabsMouse.roll );   
    if( xLabsMouse.roll < (-xLabsMouse.rollThreshold) ) {
      //console.log( "command suspend??" );   
      if( xLabsMouse.commandSuspend == false ) {
        //console.log( "command suspend" );   
        xLabsMouse.commandSuspend = true;
        xLabsMouse.setState( "suspended" );
      }
    }
    else if( xLabsMouse.roll > xLabsMouse.rollThreshold ) {
      //console.log( "command reset??" );   
      if( xLabsMouse.commandReset == false ) {
        xLabsMouse.commandReset = true; // can't issue command again until you stop doing it
        //console.log( "command reset" );   
        xLabsMouse.setConfigInitStatus( "animating" );
        xLabsMouse.setState( "initialising", 6000 );
      }
    }
    else { // cancel these actions, if pending
      if( xLabsMouse.state != "initialising" ) {
        //console.log( "cancel commands" );   
        xLabsMouse.commandReset = false;
        xLabsMouse.commandSuspend = false;
      }
    }
  },

  setup : function() {
  }

};

xLabsMouse.setup();



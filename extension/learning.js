
///////////////////////////////////////////////////////////////////////////////
// Passive calibration mode: It learns while watching normal web activity.
//
// The realtime code is responsible for administering the mode. this is just 
// a stateless UI.
//
// UI features:
// - On click, show a circle around the mouse (that fades out). 
//    This shows that we're picking up the clicks.
//    If the circle is BLUE we are tracking OK. If the circle is 
//
// - Always:
//     * Show a + representing the head pose. It changes height on pitch. 
//       It changes width on yaw. It rotates on roll. And it translates.
//       This should be blue too.
//
//     * Show a circle representing the gaze. Size depends on accuracy. 
//       Color is red if there are errors, else green.
//
///////////////////////////////////////////////////////////////////////////////
var xLabsLearning = {

  // Gui elements / behaviour
  fontSize : 32,
  clickTimeout : 400,
  clickSize : 50,
  gazeMinSize : 90,//60,
  gazeMaxScreenFrac : 0.5,
  maxConfidence : 8.0, // for simplePoly: 8.0, for compountPoly: 10.0,

  // Head  
  xScale : 250.0,
  yScale : 350.0,
  headLimit : 100.0,
  headLearningRate : 0.5,
  xHeadOrigin : null,
  yHeadOrigin : null,
  xHead : null,
  yHead : null,

  // Gaze
  xSmoothed : 0.0,
  ySmoothed : 0.0,
  cSmoothed : 0.0, 
  
  xyLearningRate : 0.25,
   cLearningRate : 0.05,

  onMouseDown : function() {
    xLabsLearning.headReset();    
  },

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Head tracker
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  headReset : function() {
    xLabsLearning.xHeadOrigin = null;
    xLabsLearning.yHeadOrigin = null;
    xLabsLearning.xHead = null;
    xLabsLearning.yHead = null;
  },

  headUpdate : function() {
    // if not set, then copy:
    var x = parseFloat( xLabsContent.getConfig( "state.head.x" ) );
    var y = parseFloat( xLabsContent.getConfig( "state.head.y" ) );
    //var z = parseFloat( xLabsContent.getConfig( "state.head.z" ) );
    //var ro = parseFloat( xLabsContent.getConfig( "state.head.roll" ) );
    //var pi = parseFloat( xLabsContent.getConfig( "state.head.pitch" ) );
    //var ya = parseFloat( xLabsContent.getConfig( "state.head.yaw" ) );

    if( xLabsLearning.xHeadOrigin == null ) {
      xLabsLearning.xHeadOrigin = x;
      xLabsLearning.yHeadOrigin = y;
      xLabsLearning.xHead       = x;
      xLabsLearning.yHead       = y;
    }

    // Smoothed update
    var offset = 50.0; // shift to positive range
    xLabsLearning.xHead = xLabsUtil.lerp( xLabsLearning.xHead+offset, x+offset, xLabsLearning.headLearningRate ) -offset;
    xLabsLearning.yHead = xLabsUtil.lerp( xLabsLearning.yHead+offset, y+offset, xLabsLearning.headLearningRate ) -offset;
  },

  headGet : function() {
    var dx = - (xLabsLearning.xHead - xLabsLearning.xHeadOrigin) * xLabsLearning.xScale;
    var dy = + (xLabsLearning.yHead - xLabsLearning.yHeadOrigin) * xLabsLearning.yScale; // to pixels

    dx = Math.min( xLabsLearning.headLimit, Math.max( -xLabsLearning.headLimit, dx ) );
    dy = Math.min( xLabsLearning.headLimit, Math.max( -xLabsLearning.headLimit, dy ) );

    var coordinate = { x:dx, y:dy }; 
    return coordinate;
  },

  paintClick : function() {

    var xyCanvas = xLabsContent.getCanvasCoordinatesMouseDown();
    var xCanvas = xyCanvas.x; 
    var yCanvas = xyCanvas.y;

    var trackingSuspended = parseInt( xLabsContent.getConfig( "state.trackingSuspended" ) );
    var calibrationActive = xLabsContent.getConfig( "calibration.active" );

    var timestamp = xLabsUtil.getTimestamp();
    var elapsed = timestamp - xLabsContent.tMouseScreenDown;

    if( elapsed < xLabsLearning.clickTimeout ) { 
      var elapsedFraction = 1.0 - ( elapsed / xLabsLearning.clickTimeout );
      elapsedFraction = Math.max( 0.0, elapsedFraction );

      var width = 8;
      var style = "rgba( 0, 0, 255, " + elapsedFraction +" )";
      if( trackingSuspended == 1 ) {
        style = "rgba( 255, 0, 0, 0.4 )";
      }
      xLabsLearning.paintCircle( xCanvas, yCanvas, xLabsLearning.clickSize, style, width );
    }
    
    // indicate error and calib active
    if( calibrationActive.length > 0 ) {
      var width = 1;
      var style = "rgba( 0, 0, 0, 0.5 )";
      xLabsLearning.paintCircle( xCanvas, yCanvas, xLabsLearning.clickSize * 0.9, style, width );
    }

    // encourage head movement by painting a line from mouse down point to 
    if( xLabsContent.bMouseDown ) {
      var r = 10;
      var offset = xLabsLearning.headGet();
      var xCanvasHead = xCanvas + offset.x;
      var yCanvasHead = yCanvas + offset.y;
      xLabsContent.canvasContext.lineCap = "round";
      xLabsContent.canvasContext.lineWidth = 8;
      xLabsContent.canvasContext.strokeStyle = "rgba( 0, 127, 0, 0.5 )";
      xLabsContent.canvasContext.beginPath();
      xLabsContent.canvasContext.moveTo( xCanvas, yCanvas );
      xLabsContent.canvasContext.lineTo( xCanvas, yCanvasHead );
      xLabsContent.canvasContext.lineTo( xCanvasHead, yCanvasHead );
      xLabsContent.canvasContext.stroke();
      xLabsContent.canvasContext.beginPath();
      xLabsContent.canvasContext.arc( xCanvasHead, yCanvasHead, r, 0, 2 * Math.PI, false);
      xLabsContent.canvasContext.fill();
    }    
  },

  paintCircle : function( x, y, r, style, width ) {
    xLabsContent.canvasContext.beginPath();
    xLabsContent.canvasContext.lineCap = "round";
    xLabsContent.canvasContext.lineWidth = width;
    xLabsContent.canvasContext.strokeStyle = style
    xLabsContent.canvasContext.arc( x, y, r, 0, 2 * Math.PI, false);
    xLabsContent.canvasContext.stroke();
  },

  paintGaze : function() {

    var trackingSuspended = parseInt( xLabsContent.getConfig( "state.trackingSuspended" ) );
    var calibrationStatus = parseInt( xLabsContent.getConfig( "calibration.status" ) );
    var calibrationActive = xLabsContent.getConfig( "calibration.active" );

    if( ( calibrationStatus == 0 ) || ( trackingSuspended == 1 ) ) {
//console.log( "cs: "+calibrationStatus + " ts="+trackingSuspended );
      return;
    }

    var x = parseFloat( xLabsContent.getConfig( "state.gaze.estimate.x" ) ); // screen coords
    var y = parseFloat( xLabsContent.getConfig( "state.gaze.estimate.y" ) ); // screen coords
    var c = xLabsContent.getConfig( "state.calibration.confidence" ); // empty if not available
    if( c ) {
      c = parseFloat( c );
      var validConfidence = c > 0;
    }
    else {
      c = xLabsLearning.maxConfidence;
      var validConfidence = false;
    }

    x = Math.max( 0, Math.min( screen. width-1, x ) );
    y = Math.max( 0, Math.min( screen.height-1, y ) );

    // condition c into a continuous unit value
    if( c > xLabsLearning.maxConfidence ) {
      c = xLabsLearning.maxConfidence;
    }
    if( c < 0 ) c = xLabsLearning.maxConfidence;
    var cUnit = c / xLabsLearning.maxConfidence;

    // smooth these measurements
    xLabsLearning.xSmoothed = xLabsUtil.lerp( xLabsLearning.xSmoothed, x, xLabsLearning.xyLearningRate );
    xLabsLearning.ySmoothed = xLabsUtil.lerp( xLabsLearning.ySmoothed, y, xLabsLearning.xyLearningRate );
    xLabsLearning.cSmoothed = xLabsUtil.lerp( xLabsLearning.cSmoothed, cUnit, xLabsLearning.cLearningRate );

//console.log( "c:"+c+" cu:"+cUnit );
    var gazeMaxSize = screen.height * xLabsLearning.gazeMaxScreenFrac;
    var radiusRange = gazeMaxSize - xLabsLearning.gazeMinSize;
    var radius = ( radiusRange * xLabsLearning.cSmoothed ) + xLabsLearning.gazeMinSize;
    var elapsedFraction = 0.4;

    var xyCanvas = xLabsContent.getCanvasCoordinates( xLabsLearning.xSmoothed, xLabsLearning.ySmoothed );
    var xCanvas = xyCanvas.x; 
    var yCanvas = xyCanvas.y;
    
    var width = 8;
    var style = "rgba( 255, 0, 0, 0.4 )";
    if( !validConfidence ) {
      style = "rgba( 0, 0, 0, 0.4 )";
    }
    xLabsLearning.paintCircle( xCanvas, yCanvas, radius, style, width );
    if( calibrationActive.length > 0 ) {
      width = 1;
      style = "rgba( 0, 0, 0, 0.5 )";
      xLabsLearning.paintCircle( xCanvas, yCanvas, radius * 0.9, style, width );
    }
  },

  paintErrors : function() {
    var trackingSuspended = parseInt( xLabsContent.getConfig( "state.trackingSuspended" ) );
    var calibrationStatus = parseInt( xLabsContent.getConfig( "calibration.status" ) );
    var errors = xLabsContent.getConfig( "validation.errors" );

    //var faceError = true;
    //if( errors.indexOf( 'F' ) === -1 ) {
    //  faceError = false;
    //}
    var errorMessage = "";
    if( errors.indexOf( "F" ) >= 0 ) {
      errorMessage = "Warning: Didn't see a face.";
    }
    else if( calibrationStatus == 0 ) { // have a face, but not tracking
      errorMessage = "Not yet calibrated.";
    }
    else if( trackingSuspended > 0 ) { // have a face, but not tracking
      errorMessage = "Tracking suspended.";
    }
    else { // generic warnings:
      if( errors.length > 0 ) {
        errorMessage = "Notes: " + errors;
      }
    }

    xLabsContent.canvasContext.fillStyle = "rgba( 255, 0, 0, 0.7 )";
    xLabsContent.canvasContext.font = xLabsLearning.fontSize + "px Arial";

    var textMetrics = xLabsContent.canvasContext.measureText( errorMessage );

    var xText = screen.width - textMetrics.width - 20; // centre aligned within rect
    var yText = 0 + xLabsLearning.fontSize;
    var sText = errorMessage;

    xLabsContent.canvasContext.fillText( sText, xText, yText );
  },

  paintLearning : function() {
    var paintLearning = parseInt( xLabsContent.getConfig( "browser.canvas.paintLearning" ) );
    if( paintLearning == 0 ) {
      return false; // has been disabled, e.g. by the page as an app or game has their own UI.
    }
    return true;
  },

  paint : function() {

    xLabsLearning.headUpdate();

    xLabsContent.canvasContext.clearRect( 0,0, xLabsContent.canvas.width, xLabsContent.canvas.height );

    xLabsLearning.paintClick();
    xLabsLearning.paintGaze();
    xLabsLearning.paintErrors();
  },

  setup : function() {
  }

};

xLabsLearning.setup();



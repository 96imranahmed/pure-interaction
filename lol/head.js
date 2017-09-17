
///////////////////////////////////////////////////////////////////////////////
// Head tracking mode. 
//
// Simple way for games to set up for head tracking as an input.
// There is by default no UI, but feedback can be enabled with an additional
// config setting.
//
// UI features:
//    Roll, Pitch, Yaw, x,y,z
//
///////////////////////////////////////////////////////////////////////////////
var xLabsHead = {

  fixedSize : 50,
  mobileSize : 70,

  xScale : 200.0,
  yScale : 200.0,
  zScale : 80.0,
  rollScale : 5.0,
  pitchScale : 600.0,
  yawScale : 800.0,

  zOffset : -1.0,

  xSmoothed : 0.0,
  ySmoothed : 0.0,
  xLearningRate : 0.5,
  yLearningRate : 0.5,

  pitchOffset : 0.65,
  pitchSmoothed : 0.0,
  pitchLearningRate : 0.15,

  rollSmoothed : 0.0,
  rollLearningRate : 0.5,

  yawSmoothed : 0.0,
  yawLearningRate : 0.25,

//  config : null,
  paintHeadPose : function() {
    var paintHeadPose = parseInt( xLabsContent.getConfig( "browser.canvas.paintHeadPose" ) );
    if( paintHeadPose == 0 ) {
      return false; // has been disabled, e.g. by the page as an app or game has their own UI.
    }
    return true;
  },

  paint : function() {

    if( xLabsHead.paintHeadPose() == false ) {
      return; // has been disabled, e.g. by the page as an app or game has their own UI.
    }

    var x = parseFloat( xLabsContent.getConfig( "state.head.x" ) );
    var y = parseFloat( xLabsContent.getConfig( "state.head.y" ) );
    var z = parseFloat( xLabsContent.getConfig( "state.head.z" ) );
    var ro = parseFloat( xLabsContent.getConfig( "state.head.roll" ) );
    var pi = parseFloat( xLabsContent.getConfig( "state.head.pitch" ) );
    var ya = parseFloat( xLabsContent.getConfig( "state.head.yaw" ) );

    var errors = xLabsContent.getConfig( "validation.errors" );

    var faceError = true;
    if( errors.indexOf( 'F' ) === -1 ) {
      faceError = false;
    }

    // clear canvas and apply standard line style:
    xLabsContent.canvasContext.clearRect( 0,0, xLabsContent.canvas.width, xLabsContent.canvas.height );
    xLabsContent.canvasContext.lineCap = "round";
    xLabsContent.canvasContext.lineWidth = 8;

    xLabsContent.canvasContext.fillStyle = "rgba( 255, 0, 0, 0.4)";
    //console.log( "err: "+errors );
    //xLabsContent.canvasContext.fillText( "Errr:"+errors, 500,500 );

    if( faceError ) {
      return;
    }

    // update smoothed variables:
    xLabsHead.xSmoothed = xLabsUtil.lerp( xLabsHead.xSmoothed, x, xLabsHead.xLearningRate );
    xLabsHead.ySmoothed = xLabsUtil.lerp( xLabsHead.ySmoothed, y, xLabsHead.yLearningRate );
    xLabsHead.pitchSmoothed = xLabsUtil.lerp( xLabsHead.pitchSmoothed, pi, xLabsHead.pitchLearningRate );
    xLabsHead.  yawSmoothed = xLabsUtil.lerp( xLabsHead.  yawSmoothed, ya, xLabsHead.  yawLearningRate );
    xLabsHead. rollSmoothed = xLabsUtil.lerp( xLabsHead. rollSmoothed, ro, xLabsHead. rollLearningRate );
    x = xLabsHead.xSmoothed;
    y = xLabsHead.ySmoothed;
    pi = xLabsHead.pitchSmoothed;
    ya = xLabsHead.  yawSmoothed;
    ro = xLabsHead. rollSmoothed;

    xLabsContent.canvasContext.fillStyle = "rgba( 0, 255, 0, 0.4)";
    xLabsContent.canvasContext.strokeStyle = "rgba(0, 255, 0, 0.4)";

    var w = screen.width;
    var h = screen.height;
    var size = xLabsHead.fixedSize + (Math.max(0.0, z+xLabsHead.zOffset) * xLabsHead.zScale);
    
    var xc = w * 0.5;
    var yc = h * 0.5;
    
    var xh = xc - x * xLabsHead.xScale;
    var yh = yc + y * xLabsHead.yScale;

    var t = ro * xLabsHead.rollScale;
    var p  = xLabsUtil.rotate( size, 0, -( t + Math.PI * 0.5 ) );
    var p2 = xLabsUtil.rotate( size, 0, -( t ) );

    var xh2 = xh - ya * xLabsHead.yawScale;
    var yh2 = yh + (pi-xLabsHead.pitchOffset) * xLabsHead.pitchScale;

//console.log( "x,y="+w+" ,"+h );

    xLabsContent.canvasContext.beginPath();

    xLabsContent.canvasContext.moveTo( xh -size, yh );
    xLabsContent.canvasContext.lineTo( xh +size, yh );
    xLabsContent.canvasContext.moveTo( xh, yh -size );
    xLabsContent.canvasContext.lineTo( xh, yh +size );

    xLabsContent.canvasContext.stroke();
    xLabsContent.canvasContext.beginPath();

    xLabsContent.canvasContext.strokeStyle = "rgba(0, 0, 255, 0.4)";
    xLabsContent.canvasContext.fillStyle = "rgba(0, 0, 255, 0.4)";

//    xLabsContent.canvasContext.moveTo( xh, yh );

//    xLabsContent.canvasContext.moveTo( xh2 -size, yh2 );
//    xLabsContent.canvasContext.lineTo( xh2 +size, yh2 );
//    xLabsContent.canvasContext.moveTo( xh2, yh2 -size );
//    xLabsContent.canvasContext.lineTo( xh2, yh2 +size );

    xLabsContent.canvasContext.moveTo( xh2-p.x, yh2-p.y );
    xLabsContent.canvasContext.lineTo( xh2+p.x, yh2+p.y );

    xLabsContent.canvasContext.moveTo( xh2-p2.x, yh2-p2.y );
    xLabsContent.canvasContext.lineTo( xh2+p2.x, yh2+p2.y );

    xLabsContent.canvasContext.stroke();
    xLabsContent.canvasContext.beginPath();

    xLabsContent.canvasContext.arc( xh2+p.x, yh2+p.y, 10, 0, 2 * Math.PI, false );
    xLabsContent.canvasContext.fill();

    //xLabsContent.canvasContext.fillText( "yaw:"+ya, 500,500 );
    //xLabsContent.canvasContext.fillText( "z:"+z, 500,500 );
        
/*    var xOffset = parseInt( xLabsContent.getConfig( "browser.document.offset.x" ) );
    var yOffset = parseInt( xLabsContent.getConfig( "browser.document.offset.y" ) );
    var xWindow = window.screenX;
    var yWindow = window.screenY;
//xLabsContent.xMouseScreen -xOffset -xWindow, xLabsContent.yMouseScreen -yOffset -yWindow
    var xyCanvas = xLabsContent.getCanvasCoordinatesMouse(); 
    var xCanvas = xyCanvas.x; 
    var yCanvas = xyCanvas.y;
    xLabsContent.canvasContext.arc( xCanvas, yCanvas, 30, 0, 2 * Math.PI, false);*/
  },

  setup : function() {
  }

};

xLabsHead.setup();




var xLabsCamera = {

//  active: false,
//  onFrame: null, // set this to a callback
//  frameIdx: 0,
//  frameRate: null, // target frame rate
  frameStream: null, // source of images
//  videoElement: null, // injected into the page that adds the camera

/*  setFrameCallback: function( callback ) {
    xLabsCamera.onFrame = callback;
  },

  setFrameRate: function( frameRate ) {
    xLabsCamera.frameRate = frameRate;
  },

  getFrameSize: function( width, height, comment ) {
    return { width: width, height: height, comment: comment };
  },

  getFrameSizes: function() {
    return [
        getFrameSize( 1280, 720, "16:9" )
      , getFrameSize(  960, 720, " 4:3" )
      , getFrameSize(  640, 360, "16:9" )
      , getFrameSize(  640, 480, " 4:3" )
      , getFrameSize(  320, 240, " 4:3" )
      , getFrameSize(  320, 180, "16:9" )
    ];
  },*/

  onSuccess: function( frameStream ){
    console.log( "xLabs camera: Success, posting new stream object to NaCl..." );
    if( !!xLabsCamera.frameStream ) {
      xLabsCamera.frameStream.getVideoTracks()[0].stop();
    }
    xLabsCamera.frameStream = frameStream;
    //xLabsCamera.videoElement.src = ( window.URL && window.URL.createObjectURL( frameStream ) ) || frameStream; // copied from example
    //xLabsCamera.videoElement.play();
    var payload = {
      type: 'streamStart',
      resource: frameStream.getVideoTracks()[0]
    }

    //var backgroundPage = chrome.extension.getBackgroundPage();
    //backgroundPage.xLabsBackground.postMessage( payload );
    xLabsBackground.postMessage( payload );
  },

  onError: function( error ) {
    if( error.name == "PermissionDeniedError" ) {
      alert( "xLabs: Error, webcam access denied by user setting. Go to chrome://settings to fix." );
    }
    console.log( "xLabs camera: Error " + error.name );
  },

  stopStream : function(stream) {
    // MediaStream.stop() is removed in Chrome 47
    if( typeof stream.stop === "function" ) {
      // For chrome < 47
      stream.stop();
    }
    else {
      // For chrome >= 47
      stream.getVideoTracks().forEach( function(track) {
        track.stop();
      });
    }
  },

  stop: function() {
    console.log( "xLabs camera: Stop:" );
    //xLabsCamera.active = false;

    // this is supposed to actually release the hardware:
    if( !!xLabsCamera.frameStream ) {
      console.log( "xLabs camera: Stopping..." );

      // tell realtime to release the camera stream
      var payload = {
        type: 'streamStop'
      }

      xLabsBackground.postMessage( payload );

      // http://stackoverflow.com/questions/11642926/stop-close-webcam-which-is-opened-by-navigator-getusermedia
      // xLabsCamera.frameStream.getVideoTracks()[0].stop();
      xLabsCamera.stopStream( xLabsCamera.frameStream );
      //xLabsCamera.frameStream.stop();
      xLabsCamera.frameStream = null;
    }

    xLabsCamera.opened = false;
    console.log( "xLabs camera: Stopped." );
  },

  started : function() {
    // if( !!xLabsCamera.frameStream ) {
    //   return true;
    // }
    // return false;
    return xLabsCamera.opened;
  },

  // You can pass null as constraints
  openCamera : function( constraints, onSuccessUser, onErrorUser ) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    if( constraints == null ) {
      constraints = { audio: false, video: true };
    }
    
    if( navigator.getUserMedia ) {
      console.log( "xLabs camera: getUserMedia()" );
      navigator.getUserMedia( constraints, onSuccessUser, onErrorUser );
    }
    else {
      console.log( "xLabs camera: openCamera(): Error with getUserMedia request." );
      onErrorUser( "Error with getUserMedia request." );
    }

  },

  opened : false,

  start : function( onSuccessUser, onErrorUser ) {//, frameRate ) {
    
    console.log( "xLabs camera: Start:" );

    if( xLabsCamera.started() ) {
      console.log( "xLabs camera: Already started." );
      if( onSuccessUser ) {
        onSuccessUser();
      }
      return;
    }

    console.log( "xLabs camera: Starting..." );
    xLabsCamera.opened = true;
    
//    xLabsCamera.frameRate = frameRate;
    // var width  = xLabsBackground.getConfig( "frame.stream.width" );  
    // var height = xLabsBackground.getConfig( "frame.stream.height" );  
    // var format = xLabsBackground.getConfig( "frame.stream.format" );  
    // var rate   = xLabsBackground.getConfig( "frame.stream.rate" );  

    // console.log( "xLabs camera: width="+width+" height=" + height+ " format=" + format+ " rate=" + rate );

    xLabsCamera.openCamera( 
      null, // no constraints
      function( stream ) { // onSuccess
        xLabsCamera.onSuccess( stream );
        if( onSuccessUser ) {
          onSuccessUser( stream );
        }
      },
      function( error ) { // onError
        xLabsCamera.onError( error );
        if( onErrorUser ) {
          xLabsCamera.opened = false;
          onErrorUser( error );
        }
      });
  }

};

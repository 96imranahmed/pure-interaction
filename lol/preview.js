var xLabsPreview = {

  enabled : false,
  videoElementId : "xLabsPreview",
  stream : null,

  setEnabled : function( enabled ) {
    if( xLabsPreview.enabled == enabled ) {
      return;
    }
    // console.log( "preview enabled changed, new="+enabled );

    xLabsPreview.enabled = enabled;

    if( enabled ) {
      xLabsPreview.start();
    }
    else {
      xLabsPreview.stop();
    }
  },

  stop : function() {
    var videoElement = document.getElementById( xLabsPreview.videoElementId );
    if( videoElement && xLabsPreview.stream ) {
      console.log( "xLabs: Closing video stream..." );
      //videoElement.src = null;
      xLabsCamera.stopStream( xLabsPreview.stream );
      xLabsPreview.stream = null;
    }  
  },

  start : function() {
    var videoElement = document.getElementById( xLabsPreview.videoElementId );
    if( !videoElement ) {
      console.log( "xLabs: Video element not found." );
      return;
    }

    var width  = xLabsContent.getConfig( "frame.stream.width"  );
    var height = xLabsContent.getConfig( "frame.stream.height" );

    if( width && height ) {
      var intWidth  = parseInt( width  );
      var intHeight = parseInt( height );
      xLabsPreview.openCamera( intWidth, intHeight );
    }
    else {
      console.log( "xLabs: Video frame size not valid." );
    }
  },

  openCamera : function( width, height ) {

//    console.log( "width, height: " + width + ", " + height );

/*    var constraints = {
      "audio": false,
      "video": {
        "mandatory": {
          "maxWidth":  width,
          "maxHeight": height
        }
      }
    };
    // var constraints = { "audio": false, "video": true };
*/   
    //console.log( "xLabsPreview.openCamera: ");
//    console.log( JSON.stringify( constraints ) );

/*    xLabsCamera.openCamera(
      constraints,
      xLabsPreview.onSuccess,
      function( e ) { 
        console.log( "xLabsPreview.openCamera() error: " + JSON.stringify( e ) );
      } 
    );*/
   
    navigator.getUserMedia = ( 
      navigator.getUserMedia       || 
      navigator.webkitGetUserMedia || 
      navigator.mozGetUserMedia    || 
      navigator.msGetUserMedia );

    if( navigator.getUserMedia ) {
      // Request access to video only
      navigator.getUserMedia(
         { video:true, audio:false }, 
         xLabsPreview.onSuccess,
         xLabsPreview.onError
      );
    }
    else {
      alert( 'xLabs: Sorry, the browser you are using doesn\'t support getUserMedia' );
      return;
    }
    //console.log( "xLabsPreview.openCamera() complete.");
  },

  onError : function( error ) {
    var text = 'xLabs: Camera fault, error code: ' + error.code + '.';
    //alert( text );
    console.log( text );
  },

  onSuccess : function( stream ) {
    //console.log( "xLabsPreview.onSuccess() ");
    xLabsPreview.stream = stream;
    var video = document.getElementById( xLabsPreview.videoElementId );
    video.src = window.webkitURL.createObjectURL( stream );
    video.play();

/*         function( stream) {
            var url = window.URL || window.webkitURL;
            v.src = url ? url.createObjectURL(stream) : stream;
            v.play();
         },*/
  }

}


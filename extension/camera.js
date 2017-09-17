let video;

var counter = 150;


function makeblob (dataURL) {
  var BASE64_MARKER = ';base64,';
  dataURL = String(dataURL);
  if (dataURL.indexOf(BASE64_MARKER) == -1) {
      var parts = dataURL.split(',');
      var contentType = parts[0].split(':')[1];
      var raw = decodeURIComponent(parts[1]);
      return new Blob([raw], { type: contentType });
  }
  var parts = dataURL.split(BASE64_MARKER);
  var contentType = parts[0].split(':')[1];
  var raw = window.atob(parts[1]);
  var rawLength = raw.length;

  var uInt8Array = new Uint8Array(rawLength);

  for (var i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

function takeSnapshot(video) {
  var img = document.querySelector('img') || document.createElement('img');
  var context;
  var width = video.offsetWidth;
  var height = video.offsetHeight;
  canvas = document.querySelector('canvas') || document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;

  context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, 1280, 720);

  img.src = canvas.toDataURL('image/png');
  document.body.appendChild(img);
  return img;
}

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

    

    setInterval(function() {
      subscriptionKey = "8d2c5658b3d3499686c35cf861f4942b"
      const img = takeSnapshot(video);
      var uriBase = "https://westus.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceAttributes=emotion";
      var xhr = new XMLHttpRequest();
      xhr.open('POST', uriBase, true);
      xhr.setRequestHeader("Content-type", "application/octet-stream");
      xhr.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
      blah = makeblob(img.src)
      xhr.send(blah);
      xhr.onreadystatechange = function () {
        var DONE = 4; // readyState 4 means the request is done.
        var OK = 200; // status 200 is a successful return.
        if (xhr.readyState === DONE) {
          if (xhr.status === OK) {
            var data = JSON.parse(xhr.responseText);
            if (data && data[0] && data[0]['faceAttributes'] && data[0]['faceAttributes']['emotion']){
              var emotion = data[0]['faceAttributes']['emotion'];

              var reaction = 'neutral'
              var reaction_score = emotion['neutral']

              for(var emotion_key in emotion) {
                if(emotion_key === 'contempt' || emotion_key === 'contempt') {
                  continue;
                }
                if (dictionary.hasOwnProperty(emotion_key)) {
                  if(dictionary[emotion_key] > reaction_score) {
                    reaction = emotion_key
                    reaction_score = dictionary[emotion_key]
                  }
                }
              }

              document.documentElement.setAttribute('reaction', reaction)
            }
          } else {
            console.log(xhr.responseText);
            console.log('Error: ' + xhr.status); // An error occurred during the request.
          }
        }
      };
    }, 3000)
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
        video = document.createElement('video');
        video.srcObject = stream;
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

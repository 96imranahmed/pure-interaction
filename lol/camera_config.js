
function CameraConfig() {
  this.previewCanvas = void 0;
  this.previewCtx = void 0;
  this.previewImg = void 0;
  this.oldMode = void 0;
  
  window.addEventListener("beforeunload", this.stop.bind(this));
}

CameraConfig.prototype.getConfig = function( path ) {
  var backgroundPage = chrome.extension.getBackgroundPage();
  var value = backgroundPage.xLabsBackground.getConfig( path );
  return value;
};

CameraConfig.prototype.setConfig = function(path, value) {
    var backgroundPage = chrome.extension.getBackgroundPage();
    backgroundPage.xLabsBackground.setConfig( path, value );
};

CameraConfig.prototype.startPreview = function() {
  console.log( "startPreview(): starting camera preview" );
  this.setConfig( "debug.preview.enabled", "1" );
};

CameraConfig.prototype.stopPreview = function() {
  console.log( "stopPreview(): stopping camera preview" );
  this.setConfig( "debug.preview.enabled", "0" );
};


CameraConfig.prototype.onMessage = function( msg ) {
  if (msg.type == "frame") {
    this.onFrameMessage(msg);
  }
};


CameraConfig.prototype.onFrameMessage = function( msg ) {
  var elem = document.getElementById("previewCanvasPlaceholder");
  if (elem) {
    elem.style.display = "none";
  }

  if (!this.previewCanvas) {
    this.previewCanvas = document.getElementById('previewCanvas');
    this.previewCtx = this.previewCanvas.getContext('2d');
    this.previewImg = this.previewCtx.createImageData( msg.width, msg.height );
  }

  if (   this.previewCanvas.width  != msg.width
      || this.previewCanvas.height != msg.height) {
    this.previewCanvas.width  = msg.width;
    this.previewCanvas.height = msg.height;
  }

  var buf = chrome.extension.getBackgroundPage().xLabsBackground.previewImgArrayBuf;

  this.previewImg.data.set( new Uint8ClampedArray( buf ) );
  this.previewCtx.putImageData( this.previewImg, 0, 0 );
};


CameraConfig.prototype.initCameraConfig = function() {
  // // Wait for config to arrive
  // fps = parseInt(xLabsOptions.getConfig( "frame.stream.frameRateThrottler.targetFps" ));
  // if( !fps ) {
  //   setTimeout( xLabsOptions.initCameraConfig, 100 );
  //   return;
  // }
  // Set the frame rate field
  // var rateElement = document.getElementById('rate');
  // var rateElement.value = fps;

  // Get all relevant configs
  var width  = parseInt(this.getConfig( "frame.stream.width" ));
  var height = parseInt(this.getConfig( "frame.stream.height" ));

  // Select the resolution field
  var resolutionElement = document.getElementById( "resolution" );
  
  // Find the matching resolution
  for (i = 0; i < resolutionElement.options.length; ++i) {
    var regex = new RegExp(width+"x"+height, "gi");
    var s = resolutionElement.options[i].value;

    if (s.match(regex)) {
      resolutionElement.selectedIndex = i;
      break;
    }
  }

  //TODO: Select the frame format
};

CameraConfig.prototype.onCameraApply = function() {
  console.log( "Options: Camera apply." );

  // var r = confirm( "Changing camera resolution will reload the extension.\n\n" +
  //                  "Continue?" );
  // if( r != true ) {
  //   return;
  // }

  // var cameraForm = document.getElementById( "camera-form" ); 
  // var format;
  // for (i = 0; i < cameraForm.format.length; i++) {
  //   if (cameraForm.format[ i ].checked) {
  //     format = cameraForm.format[ i ].value; //male or female
  //     break;
  //   }
  // }

  // var rate = document.getElementById( "rate" ).value;
  var selectResolution = document.getElementById( "resolution" );
  var valueResolution  = selectResolution.options[ selectResolution.selectedIndex ].value;

  //console.log( "val res="+valueResolution );

  var startWidth  = 0;    
  var   endWidth  = valueResolution.indexOf( "x" );    
  var startHeight = endWidth +1;    
  var   endHeight = valueResolution.length;    

  //console.log( "startW="+startWidth+" endW="+endWidth+" startH="+startHeight+" endH="+endHeight );

  var valueFrameWidth  = valueResolution.substring( startWidth , endWidth  );
  var valueFrameHeight = valueResolution.substring( startHeight, endHeight );

  var backgroundPage = chrome.extension.getBackgroundPage();
  backgroundPage.xLabsBackground.setCameraSettings( null, null, valueFrameWidth, valueFrameHeight ); // send null to ignore

  // Reload current tab
  setTimeout( function() {
    var url = [location.protocol, '//', location.host, location.pathname].join('');
    window.location.href = url + "#tab3";
    window.location.reload();
  }, 1000 );
};


CameraConfig.prototype.start = function() {
  var self = this;

  this.oldMode = this.getConfig("system.mode");

  var elem = document.getElementById("previewCanvasPlaceholder");
  if (elem) {
    elem.style.display = "block";
  }


  chrome.runtime.onMessage.addListener( this.onMessage.bind(this) );

  if (this.oldMode == "off") {
    this.setConfig("system.mode", "head");
  }
  this.startPreview();

  // add listener to input buttons:
  var cameraApplyButton = document.getElementById("camera-apply");
  cameraApplyButton.onclick = function() {
    self.onCameraApply();
  }
  this.initCameraConfig();

};

CameraConfig.prototype.stop = function() {
  this.stopPreview();
  if (this.oldMode == "off") {
    this.setConfig( "system.mode", "off" );
  }
}

var cameraConfig = new CameraConfig();



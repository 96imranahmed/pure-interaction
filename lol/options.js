
chrome.extension.getBackgroundPage().xLabsBackground.sendAnalyticsTrackPageView( "options" )

var xLabsOptions = {

  previewCanvas : null,
  previewCtx : null,
  previewImg : null,

  configRepaintStarted : false,
  configRepaintPending : false,
  configRepaintIntervalMsec : 100,

  allowCamera : AllowCamera(),

  onModeChanged : function() {
    // get mode
    var modeForm = document.getElementById( "mode-form" ); 
    var mode = null;
    for( i = 0; i < modeForm.mode.length; i++ )
    {
      if( modeForm.mode[ i ].checked ) {
        mode = modeForm.mode[ i ].value; //male or female
        break;
      }
    }

    console.log( "Options: Mode changed to: "+ mode );

//    var backgroundPage = chrome.extension.getBackgroundPage();
//    backgroundPage.xLabsBackground.setMode( mode );
    xLabsOptions.setConfig( "system.mode", mode );
  },

  onPersistentClear : function() {
    var r = confirm( "Delete all user data?" );
    if( r == true ) {
      console.log( "Options: clearing all persistent data." );
      var backgroundPage = chrome.extension.getBackgroundPage();
      backgroundPage.xLabsBackground.clearPersistentFs();
      xLabsOptions.setConfig( "calibration.clear", "1" ); // this also clears the memory buffer
    }
  },

  onCalibrationClear : function() {
    var r = confirm( "Delete calibration data?" );
    if( r == true ) {
      console.log( "Options: Calib clear." );
      xLabsOptions.setConfig( "calibration.clear", "1" );
    }
  },
  // onDebugStart : function() {
  //   console.log( "Options: Debug start." );
  //   //var backgroundPage = chrome.extension.getBackgroundPage();
  //   //backgroundPage.xLabsBackground.setCameraEnabled( true );
  //   xLabsOptions.setConfig( "debug.preview.enabled", "1" );
  // },
  // onDebugStop : function() {
  //   console.log( "Options: Debug stop." );
  //   //var backgroundPage = chrome.extension.getBackgroundPage();
  //   //backgroundPage.xLabsBackground.setCameraEnabled( false );
  //   xLabsOptions.setConfig( "debug.preview.enabled", "0" );
  // },
  onCameraStart : function() {
    console.log( "Options: Camera start." );
    //var backgroundPage = chrome.extension.getBackgroundPage();
    //backgroundPage.xLabsBackground.setCameraEnabled( true );
    xLabsOptions.setConfig( "frame.stream.enabled", "1" );
  },
  onCameraStop : function() {
    console.log( "Options: Camera stop." );
    //var backgroundPage = chrome.extension.getBackgroundPage();
    //backgroundPage.xLabsBackground.setCameraEnabled( false );
    xLabsOptions.setConfig( "frame.stream.enabled", "0" );
  },
  // onCameraApply : function() {
  //   console.log( "Options: Camera apply." );

  //   var r = confirm( "Changing camera resolution will reload the extension.\n\n" +
  //                    "Continue?" );
  //   if( r != true ) {
  //     return;
  //   }


  //   // get device
  //   // get resolution
  //   // get format
  //   // get frame rate

  //   var cameraForm = document.getElementById( "camera-form" ); 
  //   var format = null;
  //   for( i = 0; i < cameraForm.format.length; i++ )
  //   {
  //     if( cameraForm.format[ i ].checked ) {
  //       format = cameraForm.format[ i ].value; //male or female
  //       break;
  //     }
  //   }

  //   var rate = document.getElementById( "rate" ).value;
  //   var selectResolution = document.getElementById( "resolution" );
  //   var valueResolution  = selectResolution.options[ selectResolution.selectedIndex ].value;

  //   //console.log( "val res="+valueResolution );

  //   var startWidth  = 0;    
  //   var   endWidth  = valueResolution.indexOf( "x" );    
  //   var startHeight = endWidth +1;    
  //   var   endHeight = valueResolution.length;    

  //   //console.log( "startW="+startWidth+" endW="+endWidth+" startH="+startHeight+" endH="+endHeight );

  //   var valueFrameWidth  = valueResolution.substring( startWidth , endWidth  );
  //   var valueFrameHeight = valueResolution.substring( startHeight, endHeight );

  //   console.log( "Options: Camera apply: rate: "+rate+" format: "+format+" width: "+valueFrameWidth+" height: "+valueFrameHeight );
  //   var backgroundPage = chrome.extension.getBackgroundPage();
  //   backgroundPage.xLabsBackground.setCameraSettings( rate, format, valueFrameWidth, valueFrameHeight ); // send null to ignore

  //   // Reload current tab
  //   setTimeout( function() {
  //     var url = [location.protocol, '//', location.host, location.pathname].join('');
  //     window.location.href = url + "#tab3";
  //     window.location.reload();
  //   }, 1000 );
  // },

  onModuleLoad : function() {
  },

  onModuleStart : function() {
    console.log( "Options: Module start" );
    var backgroundPage = chrome.extension.getBackgroundPage();
    backgroundPage.xLabsBackground.onModuleStart();
  },

  onModuleStop : function() {
    console.log( "Options: Module stop" );
    var backgroundPage = chrome.extension.getBackgroundPage();
    backgroundPage.xLabsBackground.onModuleStop();
  },

  // onFrameMessage : function( msg ) {
  //   if( !xLabsOptions.previewCanvas ) {
  //     xLabsOptions.previewCanvas = document.getElementById('previewCanvas');
  //     xLabsOptions.previewCtx = xLabsOptions.previewCanvas.getContext('2d');
  //     xLabsOptions.previewImg = xLabsOptions.previewCtx.createImageData( msg.width, msg.height );
  //   }

  //   if(    xLabsOptions.previewCanvas.width  != msg.width
  //       || xLabsOptions.previewCanvas.height != msg.height ) {
  //     xLabsOptions.previewCanvas.width  = msg.width;
  //     xLabsOptions.previewCanvas.height = msg.height;
  //   }

  //   var buf = chrome.extension.getBackgroundPage().xLabsBackground.previewImgArrayBuf;

  //   xLabsOptions.previewImg.data.set( new Uint8ClampedArray( buf ) );
  //   xLabsOptions.previewCtx.putImageData( xLabsOptions.previewImg, 0, 0 );
  // },


  onMessage : function( e ) {
    //console.log( "Options: onMessage: " );//+ JSON.stringify( e ) );
   
    if( e.config != null ) {
      //console.log( "Options onMessage: is config." );
      xLabsOptions.onModuleConfig( e.config );
    }
    // else if( e.type == "frame" ) {
    //   // console.log( "Got frame" );
    //   xLabsOptions.onFrameMessage( e );
    // }


    // can be a frame
    //else {
    //  console.log( "Error: Message doesn't specify config property." );
    //}
  },

  configRepaint : function() {
    if( !xLabsOptions.configRepaintPending ) {
      // If no more pending, then don't schedule any more repaints
      xLabsOptions.configRepaintStarted = false;
      return;
    }

    // Repaint
    var backgroundPage = chrome.extension.getBackgroundPage();
    var html = xLabsUtil.json2html( backgroundPage.xLabsBackground.config );
    var e = document.getElementById( "config" );
    if( e ) {
      e.innerHTML = html; 
    }

    // store the mode and show in UI:
    var mode = xLabsOptions.getConfig( "system.mode" );
    var modeForm = document.getElementById( "mode-form" ); 

    if( modeForm ) {
     for( i = 0; i < modeForm.mode.length; i++ )
     {
      if( modeForm.mode[ i ].value == mode ) {
        modeForm.mode[ i ].checked = 1;
      }
      else {
        modeForm.mode[ i ].checked = 0;
      }
     }
    }

    // Reset and schedule another one
    // TODO: maybe we should do this are the start of function to keep timing accurate
    xLabsOptions.configRepaintPending = false;
    setTimeout( xLabsOptions.configRepaint, xLabsOptions.configRepaintIntervalMsec );
  },

  onModuleConfig : function( configString ) {
    xLabsOptions.configRepaintPending = true;

    if( !xLabsOptions.configRepaintStarted ) {
      xLabsOptions.configRepaintStarted = true;
      xLabsOptions.configRepaint();
    }
  }, 

  toggleAdvanced : function() {
    xLabsOptions.toggleShowDiv( "advanced-toggle", "advanced-show" );
  },

  togglePreview : function() {
    xLabsOptions.toggleShowDiv( "preview-toggle", "preview-show" );
  },

  toggleCamera : function() {
    xLabsOptions.toggleShowDiv( "camera-toggle", "camera-show" );
  },

  //toggleConfig : function() {
  //  xLabsOptions.toggleShowDiv( "config-toggle", "config-show" );
  //},

  toggleShowDiv : function( divId, toggleId ) {
    // cameraConfig.stop();

    var div = document.getElementById( divId );
    var input = document.getElementById( toggleId );

    if( !input ) {
      return;
    }

    if( input.checked ) {
      div.style.display = "block";      
    }
    else {
      div.style.display = "none";      
    }
  },

  getConfig : function( path ) {
    var backgroundPage = chrome.extension.getBackgroundPage();
    var value = backgroundPage.xLabsBackground.getConfig( path );
//console.log( "getConfig: "+value );
    return value;
  },

  setConfigApply : function() {
    var path  = document.getElementById( "config-path" ).value;
    var value = document.getElementById( "config-value" ).value;
    xLabsOptions.setConfig( path, value );
  },

  setConfig : function( path, value ) {
    console.log( "Options: setConfig( "+ path + "=" + value + ")" );
    var backgroundPage = chrome.extension.getBackgroundPage();
    backgroundPage.xLabsBackground.setConfig( path, value );
  },

/*  onCameraSuccess : function( frameStream ) {
  },

  onCameraFailure : function() {
  },*/

  onHasCameraPermissionInBG : function() {
    xLabsOptions.allowCamera.hide();

    var element = document.getElementById('attention');
    if( element ) {
      //console.log( "element:" );
      //console.log( element );
      element.style.background = "#006ebf";
      element.innerHTML = "<a href='http://xlabsgaze.com/showcase/' style='color:white;text-decoration:none' target='new'>Click for demo apps!</a>";
    }
  },

  getCameraPermissionInBG : function() {
    var backgroundPage = chrome.extension.getBackgroundPage();

    // ------------------------------------------------
    // 1st time, in BG page
    // ------------------------------------------------
    backgroundPage.xLabsCamera.openCamera(
      null, // no constraints
      function(stream) { // onSuccessUser
        console.log( "Camera started in BG page." );
        xLabsCamera.stopStream( stream );
        xLabsOptions.onHasCameraPermissionInBG();
      },
      function() { //onErrorUser
        console.log( "Camera didn't start in BG page." );
        console.log( "Trying to start in options page." );

        xLabsOptions.allowCamera.show();
        
        // ------------------------------------------------
        // 2st time, in options page
        // ------------------------------------------------
        xLabsCamera.openCamera(
          null, // no constraints
          function( stream ) { // onSuccessUser
            console.log( "Camera started in options page." );
            console.log( "Closing camera." );
            xLabsCamera.stopStream( stream );
            xLabsOptions.onHasCameraPermissionInBG();
            console.log( "Trying to start in BG page again." );
            // ------------------------------------------------
            // 3rd time, in BG page again
            // ------------------------------------------------
            backgroundPage.xLabsCamera.openCamera(
              null, // no constraints
              function() { // onSuccessUser
                console.log( "Camera started in BG page." );
                xLabsCamera.stopStream( stream );
              },
              function() { //onErrorUser
                console.log( "Camera didn't start in BG page, but it worked in options page." );
              });
          },
          function() { //onErrorUser
            console.log( "Camera didn't start in options page, did you give permissions?." );
          }); // will not start if already started.
      });
  },

  // initCameraConfig : function() {
  //   // Wait for config to arrive
  //   fps = parseInt(xLabsOptions.getConfig( "frame.stream.frameRateThrottler.targetFps" ));
  //   if( !fps ) {
  //     setTimeout( xLabsOptions.initCameraConfig, 100 );
  //     return;
  //   }

  //   // Get all relevant configs
  //   width  = parseInt(xLabsOptions.getConfig( "frame.stream.width" ));
  //   height = parseInt(xLabsOptions.getConfig( "frame.stream.height" ));

  //   // Set the frame rate field
  //   rateElement = document.getElementById('rate');
  //   rateElement.value = fps;

  //   // Select the resolution field
  //   resolutionElement = document.getElementById( "resolution" );
  //   // Find the matching resolution
  //   for( i = 0; i < resolutionElement.options.length; ++i ) {
  //     regex = new RegExp(width+"x"+height, "gi");
  //     var s = resolutionElement.options[i].value;

  //     if( s.match(regex) !== null ) {
  //       resolutionElement.selectedIndex = i;
  //       break;
  //     }
  //   }

  //   //TODO: Select the frame format
  // },

  // Use anchor tags to control which tab is visible.
  showTabByHash : function() {
    var hash = window.location.hash.substring(1);
    if( hash ) {
      // Because this js file is supporting both xlabs and eyesdecide extension
      // we need to allow missing tabs.
      function setChecked(id, checked) {
        elem = document.getElementById(id);
        if( elem ) {
          if( checked ) {
            elem.setAttribute("checked", true);

            // It takes some time for the system to restart properly.
            setTimeout(function() {
              xLabsOptions.onTabChange(elem);
            }, 1000);
          }
          else {
            elem.removeAttribute("checked");
          }
        }
      }
      setChecked("tab1", false);
      setChecked("tab2", false);
      setChecked("tab3", false);
      setChecked("tab4", false);
      setChecked("tab5", false);
      setChecked("tab6", false);
      setChecked(hash, true);
    }
    else {
      document.getElementById("tab1").setAttribute("checked", true);
    }
  },

  startCameraPreview : function() {
    cameraConfig.start();    
  },

  onTabChange : function(tabElem) {
    if (tabElem.id == "tab3" && tabElem.checked) {
      xLabsOptions.startCameraPreview();
    }
    else {
      cameraConfig.stop();
    }
  },

  setup : function() {
    var buttons = document.querySelectorAll( 'button' );
  
    [].forEach.call( buttons, function( button ) {
      button.addEventListener( 'click', function( e ) {
        switch( e.target.id ) {
//          case 'mode-apply'  : xLabsOptions.onModeApply(); break; 
          case 'realtime-start' : xLabsOptions.onModuleStart(); break; 
          case 'realtime-stop'  : xLabsOptions.onModuleStop(); break; 
          case 'camera-start' : xLabsOptions.onCameraStart(); break; 
          case 'camera-stop'  : xLabsOptions.onCameraStop(); break; 
          // case 'debug-start' : xLabsOptions.onDebugStart(); break; 
          // case 'debug-stop'  : xLabsOptions.onDebugStop(); break; 
        }
      } ); // event listener
    } ); // call

    // add version to about tab:
    var versionDiv = document.getElementById( "version" );
    var manifest = chrome.runtime.getManifest();
    versionDiv.innerHTML = "Version " + manifest.version;
  
    // add listener to input buttons:
    // var cameraApplyButton = document.getElementById( "camera-apply" );
    // cameraApplyButton.onclick = function() {
    //   xLabsOptions.onCameraApply();
    // }
    // xLabsOptions.initCameraConfig();

    function addTabChangeListener(tab) {
      var tab = document.getElementById(tab);
      if (tab) {
        tab.addEventListener("change", function() {
          xLabsOptions.onTabChange(this);
        });
      }
    }

    addTabChangeListener("tab1");
    addTabChangeListener("tab2");
    addTabChangeListener("tab3");
    addTabChangeListener("tab4");
    addTabChangeListener("tab5");
    addTabChangeListener("tab6");

    // add listeners to radio buttons:
    if( document.forms[ "mode-form" ] ) {
     var modeRadios = document.forms[ "mode-form" ].elements[ "mode" ];
     for( var i = 0, max = modeRadios.length; i < max; i++ ) {
      modeRadios[ i ].onclick = function() {
        xLabsOptions.onModeChanged();
      }
     }
    }

    // add listener to config set:
    var e1 = document.getElementById( "config-submit" );
    if( e1 ) { e1.onclick = function() { xLabsOptions.setConfigApply(); }; }

    var e2 = document.getElementById( "advanced-show" );
    if( e2 ) { e2.onclick = function() { xLabsOptions.toggleAdvanced(); }; }

    var e3 = document.getElementById( "persistent-clear" );
    if( e3 ) { e3.onclick = function() { xLabsOptions.onPersistentClear(); }; }

    var e4 = document.getElementById( "calibration-clear" );
    if( e4 ) { e4.onclick = function() { xLabsOptions.onCalibrationClear(); }; }

    chrome.runtime.onMessage.addListener( xLabsOptions.onMessage );

    //xLabsCamera.setup();// "xlabs" ); // assumes an xlabs div to work in
    //xLabsCamera.setFrameCallback( myFunc );
    //xLabsCamera.start( 640, 480, 3 );
 
    // align UI features with state:
    xLabsOptions.toggleAdvanced();
//    xLabsOptions.togglePreview();
//    xLabsOptions.toggleCamera();
//    xLabsOptions.toggleConfig();

    // Load current config for controls:
    // mode:
    // [camera] format:
    // [camera] [frame]rate:
    // [camera] resolution:
    //xLabsCamera.setup( "xlabs" );
    
    // check whether the background page was able to access the camera. If not, then request permission for it.
    xLabsOptions.getCameraPermissionInBG();
    // xLabsCamera.start(); // will not start if already started.
    // console.log( "Tried to start camera in options page" );
      //navigator.webkitGetUserMedia( {'video': true}, xLabsOptions.onCameraSuccess, xLabsOptions.onCameraFailure );

    // Refresh the config state on load
    xLabsOptions.onModuleConfig( JSON.stringify( chrome.extension.getBackgroundPage().config ) );
  
    xLabsOptions.showTabByHash();
  }

};

xLabsOptions.setup();



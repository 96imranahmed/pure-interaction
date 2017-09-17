

var xLabsBackground = {

  filesSent : 0,
  filesTotal : 0,
  fileCallbacks : 0,
  config : null,
  realtimeModule : null,
  previewImgArrayBuf : null,
  persistentFs: null,
  extensionLoadTime: new Date(),

  setBrowserConfig : function() {

    // Detect OS and choose document offset mode
    var mouseAbsScreenCoordinates = 1;
    if( window.navigator.platform.search(/linux/i) >= 0 ) {
      var chromeVersion = parseInt( window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10 );

      if (!xLabsBackground.setBrowserConfig.timer) {
        console.log( "Info: Linux OS detected, Chrome v" +chromeVersion );
      }

      if( chromeVersion < 42 ) {
        mouseAbsScreenCoordinates = 0;
      }
    }
    else {
      if (!xLabsBackground.setBrowserConfig.timer) {
        console.log( "Info: Non-Linux OS detected." );
      }
    }

    var dpi = xLabsUtil.getDpi();

    xLabsBackground.setConfig( "browser.mouse.absScreenCoordinates", mouseAbsScreenCoordinates );
    xLabsBackground.setConfig( "browser.screen.width", screen.width );
    xLabsBackground.setConfig( "browser.screen.height", screen.height );
    xLabsBackground.setConfig( "browser.screen.dpi", dpi );
    xLabsBackground.setConfig( "browser.screen.devicePixelRatioWithoutZoom", window.devicePixelRatio );
    if (!xLabsBackground.setBrowserConfig.timer) {
      console.log( "window.devicePixelValue of background page: " +  window.devicePixelRatio );
    }

    // Start the refresh timer.
    // if (!xLabsBackground.setBrowserConfig.timer) {
    //   xLabsBackground.setBrowserConfig.timer = setInterval( function() {
    //     xLabsBackground.setBrowserConfig();
    //   }, 2000);
    // }
  },

  getConfig : function( path ) {
    // returns a string, empty if path not valid
    try {
      var value = xLabsUtil.getObjectProperty( xLabsBackground.config, path );
      return value;
    }
    catch( err ) {
      console.log( "xLabs ContentScript: error accessing config path: "+path );
      return "";
    }
  },

  setConfigImpl : function( pathValue, valueValue, persistent ) {
    // TODO filter, validate?
    if( ( typeof valueValue == 'string' ) || ( valueValue instanceof String ) ) {
    }
    else {
      valueValue = JSON.stringify( valueValue );
    }
    // console.log( "Info: Set config " + pathValue + " = " + valueValue );
    var msg = { type: "config", path: pathValue, value: valueValue };
    if( persistent ) {
      msg.persistent = "1";
    }
    xLabsBackground.postMessage( msg );
  },


  setConfig : function( pathValue, valueValue ) {
    xLabsBackground.setConfigImpl( pathValue, valueValue, false );
  },

  setPersistentConfig : function( pathValue, valueValue ) {
    xLabsBackground.setConfigImpl( pathValue, valueValue, true );
  },

  setCallback : function( value ) {
    console.log( "Info: Set callback: "+ value );
    xLabsBackground.postMessage( { type: "callback", callback: value } );
  },

  sendConfigContentScriptMessage : function( config ) {
    xLabsBackground.sendContentScriptMessage( "config", config );
  },
  sendCsvContentScriptMessage : function( csv ) {
    xLabsBackground.sendContentScriptMessage( "csv", csv );
  },

  sendContentScriptMessage : function( type, content, tabId ) {
    // sends a message to the content script in active current tab only
    var m = { target: 'xLabs', type: type, content: content };
    if( tabId ) {
      chrome.tabs.sendMessage( tabId, m );
    }
    else {
      // NOTE: When you open the html page of the background.js, it becomes the
      // current window and there are no tabs in this window, just the js console.
      // So we need to handle the case where there are no tabs.
      chrome.tabs.query( { active: true, currentWindow: true }, function( tabs ) {
        if( tabs.length > 0 ) {
          chrome.tabs.sendMessage( tabs[ 0 ].id, m );
        }
      });
    }
  },

  postMessage : function( payload ) {
    if( xLabsBackground.realtimeModule != null ) {
      //console.log( "PostMessage: " + JSON.stringify( payload ) );
      xLabsBackground.realtimeModule.postMessage( payload );
    }
    else {
      console.log( "Error: Module is null during postMessage(), pay load:" );
      console.log( payload );
    }
  },
 
  onModuleLoad : function() {
    xLabsBackground.realtimeModule = document.getElementById( "realtime" );

    if( xLabsBackground.realtimeModule == null ) {
        alert( "Error: xLabs Native Code module didn't load." );
    }
    else {
        // alert( "Module loaded.");
    }

    xLabsBackground.realtimeModule.addEventListener( 'message', xLabsBackground.onModuleMessage, false );

    // download all the data files to the nacl binary
    xLabsBackground.filesTotal = 0;
    ++xLabsBackground.filesTotal; xLabsBackground.postDataFile( "/data/default.config.json" );
    ++xLabsBackground.filesTotal; xLabsBackground.postDataFile( "/data/haarcascade_frontalface_alt2.xml" );
    ++xLabsBackground.filesTotal; xLabsBackground.postDataFile( "/data/lbpcascade_frontalface.xml" );
    ++xLabsBackground.filesTotal; xLabsBackground.postDataFile( "/data/training_data.linear_svm_model" );
    ++xLabsBackground.filesTotal; xLabsBackground.postDataFile( "/data/training_data.range" );
    ++xLabsBackground.filesTotal; xLabsBackground.postDataFile( "/data/step_reduce_terms.txt" );

    // set config relating to the page:
    // xLabsBackground.setBrowserConfig(); deferred

    // start the app:
    //xLabsBackground.setConfig( "process.ready", "1" );      
    //xLabsBackground.onModuleStart();  start deferred until process.ready
  },

  onExtensionMessage : function( request, sender, sendResponse ) {
    //  event {
    //    target : "xlabs",
    //    config {
    //      path : "xyz",
    //      value : "bob"
    //    }
    //  }
    //console.log( "Background: Message " + ( sender.tab ? "from a content script:" + sender.tab.url : "from the extension" ) );

    if( request.target == null ) {
      return;
    }

    if( request.target != "xLabs" ) {
      return;
    }

    //console.log( "Background: Message has xLabs target." );
    if( request.config != null ) {
      //console.log( "Background: Message has config." );
      if( ( request.config.path != null ) && ( request.config.value != null ) ) {
        //console.log( "Background: Message set config path-value." );
        xLabsBackground.setConfig( request.config.path, request.config.value );
      }
    }
    else if( request.action ) {
      if( request.action == "request-config-update" ) {
        xLabsBackground.sendConfigContentScriptMessage( xLabsBackground.config );
      }
      else {
        console.error( "onExtensionMessage(): invalid request.action: " + request.action );
      }
    }
  },

  onModuleStop : function() {
    console.log( "Background: stop" );
    // TODO alan
  },

  onModuleStart : function() {
    console.log( "Background: start" );
    xLabsBackground.postMessage( { type: "setup" } );
  },

  onModuleMessage : function( e ) {
    console.log( "Background: Message received from module." );
    console.log( "data: " + e.data );
    if( e.data.config != null ) {
      xLabsBackground.onModuleConfig( e.data.config );
      // don't return, ie DO broadcast.
    }

    if( e.data.callback != null ) {
      xLabsBackground.onModuleCallback( e.data.callback );
      return; // don't broadcast
    }

    if( e.data.type != null ) {
      if( e.data.type == "frame" ) {
        console.log( "Background: bytes="+e.data.imageData.byteLength );
        xLabsBackground.onModuleFrame( e.data );
      }
      else if( e.data.type == "csv" ) {
        xLabsBackground.onModuleCSV( e.data );
      }
      else if( e.data.type == "reloadExtension" ) {
        xLabsBackground.reloadExtension();
      }
//      else if( e.data.type == "stream" ) {
//        xLabsBackground.onModuleStream( e.data );
//      }
    }

    // Relay the message to the rest of the extension (ie the options page if present):   [what about content scripts?]
    chrome.runtime.sendMessage( chrome.runtime.id, e.data );
  },

  onModuleCallback : function( valueString ) {
    console.log( "Background: callback with "+valueString );
    if( valueString == "file" ) {
      // start the app:
      xLabsBackground.fileCallbacks = xLabsBackground.fileCallbacks +1;

      console.log( "Background: have "+xLabsBackground.fileCallbacks+" of "+xLabsBackground.filesTotal+" callbacks" );
      if( xLabsBackground.fileCallbacks == xLabsBackground.filesTotal ) {
        xLabsBackground.onModuleStart();
        xLabsBackground.setCallback( "setup" );
      }
    }
    else if( valueString == "setup" ) {
      xLabsBackground.setBrowserConfig();
    }
  },

  onModuleConfig : function( configString ) {
    // console.log( "onModuleConfig() called" );

    var config = JSON.parse( configString );
   
    xLabsBackground.config = config;
    xLabsBackground.handleConfigChanges();
    //console.log( "config="+xLabsBackground.config);
    xLabsBackground.sendConfigContentScriptMessage( xLabsBackground.config );
  },

  onModuleCSV : function( data ) {
    // http://stackoverflow.com/questions/17103398/convert-javascript-variable-value-to-csv-file
    //console.log( "Background: got CSV from "+data.path+" destined for id="+data.id+" bytes="+data.csv.byteLength );
    //console.log( "Background: got CSV from "+JSON.stringify( data ) );

    var blob = new Blob( [ data.csv ], { type: 'text/csv' } );
    var url = URL.createObjectURL( blob ); // TODO apparently these don't get cleaned up enthusiastically without an explicit release, so TODO delete it
    var csv = {
      url: url,
      path: data.path,
      id: data.id
    };

    xLabsBackground.sendCsvContentScriptMessage( csv );
  },

  onModuleFrame : function( frame ) {
      // Sending events to the options pages seems to remove the object type of
      // frame.imageData, which should be an ArrayBuffer.
      // So the work around for now is to save the buffer as a variable in the background page.
      // This is done first, then an event is sent to the options page.
      xLabsBackground.previewImgArrayBuf = frame.imageData;
  },

  handleConfigChanges : function() {
    // console.log( "handleConfigChanges() called" );

    // detect the camera start and start it:
    var cameraEnabled = xLabsBackground.getConfig( "frame.stream.enabled" );
    var cameraStarted = xLabsCamera.started();

    // console.log( "cameraEnabled: " + cameraEnabled );
    // console.log( "cameraStarted: " + cameraStarted );

    if( cameraEnabled == "1" ) {
      if( cameraStarted == false ) {
        console.log( "cam enabled but not started, turning on.." );
        xLabsCamera.start( function() {  // on camera start success
          chrome.browserAction.setIcon({
            path: {
              19: xLabsVariables.ICON_ON,
              38: xLabsVariables.ICON_ON
            }
          });
        });
      }
      // else: OK
    }
    else { // want it off
      if( cameraStarted == true ) {
        console.log( "cam started but not enabled, turning OFF.." );
        xLabsCamera.stop();
          chrome.browserAction.setIcon({
            path: {
              19: xLabsVariables.ICON_OFF,
              38: xLabsVariables.ICON_OFF
            }
        });
      }
    }
  },

  postDataFile : function( extensionFilePath ) {
    var fileUrl = chrome.extension.getURL( extensionFilePath );
    console.log( "Sending binary file with name: " + extensionFilePath + " URL: " + fileUrl );

    xLabsBackground.loadUrlBinary( 
      fileUrl, 
      function( e ) { // callback on load
        console.log( "Loaded binary file: " + extensionFilePath );
        var payload = {
          type: "fileWrite",
          filePath:  extensionFilePath,
          fileData: this.response
        };

        console.log( "Posting binary file: " + extensionFilePath );
        xLabsBackground.postMessage( payload );
        xLabsBackground.filesSent = xLabsBackground.fileMessages +1;
        xLabsBackground.setCallback( "file" );
      } // callback end
    );
  },

  loadUrlBinary : function( url, onload ) {
    var xhr = new XMLHttpRequest();
    xhr.open( 'GET', url, true );
    xhr.responseType = 'arraybuffer';       
    xhr.onload = onload;
    xhr.send();
  },

  onInstalled : function( details ) {
      console.log( "reason: " + details.reason );
      console.log( "previousVersion: " + details.previousVersion );
      console.log( "id: " + details.id );

      if( details.reason == "install" ) {
        var url = xLabsVariables.URL_POST_INSTALL;
        chrome.tabs.create( { 'url': chrome.extension.getURL( url ) } );
      }
      else if( details.reason == "update" ){
        // Nothing
      }
  },

  setupPersistentFs : function() {
    window.webkitRequestFileSystem( window.PERSISTENT, 0,
      function(fs) {
        console.log( "setupPersistentFs(): success" );
        xLabsBackground.persistentFs = fs;
        console.log( "Reading persistent fs contents:" );
        xLabsBackground.listDir( fs, "" );
      },
      function(e) {
        console.log( "setupPersistentFs(): window.webkitRequestFileSystem error" );
        console.log( e );
      });
  },

  clearPersistentFs : function() {
    function errorHandler(e) {
      console.log( "clearPersistentFs() error: " );
      console.log( e );
    }

    xLabsBackground.persistentFs.root.getDirectory( "", {},
      
      function(dirEntry) {
        
        var dirReader = dirEntry.createReader();

        var handleEntries = function( entries ) {
          for(var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            if( entry.isDirectory ) {
              console.log( 'Removing directory: ' + entry.fullPath );
              entry.removeRecursively( function() { console.log("Removing directory done"); }, errorHandler );
            }
            else if( entry.isFile ){
              console.log( 'Removing file: ' + entry.fullPath );
              entry.remove( function() { console.log("Removing file done"); }, errorHandler );
            }
          }

          if( entries.length > 0 ) {
            dirReader.readEntries( handleEntries, errorHandler ); // read more as readEntries() may not return all files at once
          }
        }

        // start
        dirReader.readEntries( handleEntries, errorHandler );
      });
  },

  listDir : function( filesystem, dir ) {
    function errorHandler(e) {
      console.log( "Error reading directory: " + dir );
      console.log( e );
    }

    filesystem.root.getDirectory( dir, {}, function(dirEntry){
      var dirReader = dirEntry.createReader();
      dirReader.readEntries(function(entries) {
        for(var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          if (entry.isDirectory){
            console.log('Directory: ' + entry.fullPath);
          }
          else if (entry.isFile){
            console.log('File: ' + entry.fullPath);
          }
        }

      }, errorHandler);
    }, errorHandler);
  },

  reloadExtension : function() {
    window.location.reload();
  },

  // Set params to "null" if you want to ignore that parameter.
  setCameraSettings : function( rate, format, valueFrameWidth, valueFrameHeight ) {
    xLabsCamera.stop();

    // Calibration data are bad when you change resolution. So clear them.
    xLabsBackground.setConfig( "calibration.clear", "1" );

    if (format) {
      xLabsBackground.setPersistentConfig( "frame.stream.format", format );
    }
    if (valueFrameWidth) {
      xLabsBackground.setPersistentConfig( "frame.stream.width",  valueFrameWidth  );
      xLabsBackground.setPersistentConfig( "frame.stream.height", valueFrameHeight );
    }
    if (rate) {
      xLabsBackground.setPersistentConfig( "frame.stream.rate", rate ); // not supported in nacl yet
      xLabsBackground.setPersistentConfig( "frame.stream.frameRateThrottler.enabled", 1 ); // so we use the throttler
      xLabsBackground.setPersistentConfig( "frame.stream.frameRateThrottler.targetFps", rate ); // so we use the throttler
    }

    // Request backend to get ready to reload extension. When backend is ready it
    // sends a message and background.js will reload the extension.
    xLabsBackground.postMessage( { type: "reloadExtension" } );

  },

  onModuleCrash : function() {
    crashProp = {
      since_load_msec: new Date().getTime() - xLabsBackground.extensionLoadTime.getTime()
    }
    xLabsCamera.stop(); // Making sure camera is released.

    // Disable all gui functions
    chrome.browserAction.setPopup({popup: ""});
    var message = function() {
      alert(
        "xLabs' chrome extension has encountered a problem.\n\n" +
        "Please restart chrome.\n\n" +
        "If you experience frequent issues please email talk@xlabsgaze.com so we can help fix the problem.");

      // The user saw the alert and closed it. So we know the crash wasn't during
      // shutdown/sleep/hibernate.
    }
    chrome.browserAction.onClicked.addListener(function(){
      message();
    });
    chrome.browserAction.setIcon({
      path: {
        19: xLabsVariables.ICON_FILE_19_ERR,
        38: xLabsVariables.ICON_FILE_38_ERR
      }
    });

    // Send analytices before the user action of clicking the dismiss button.

    // Show the message that user MUST responde to so we know it's an error that
    // only occurs on shutdown or sleep.
    setTimeout( message, 500 ); // So the extension icon can change before modal alert pops up

    // Redirect to the error port page.
    xLabsUtil.getUserInfo( function(userInfo) {
      chrome.tabs.create({
        'url': 'http://xlabsgaze.com/extension-crash/' +
          '?user-id='+userInfo.userId +
          '&background-html-url='+chrome.extension.getURL("background.html")
        });
    });
  },

  onMessageExternal : function( message, sender, sendResponse ) {
    // console.log( "xlabs background onMessageExternal: ");
    // console.log( "message" );
    // console.log( message );
    // console.log( "sender" );
    // console.log( sender );

    if( message.target != "xLabs" ) {
      return;
    }

    // If from an extension, then sender.id is null, so ignore.
    if( message.action == "request-access" ) {
      // Just append to message
      message.extensionId = sender.id;
      xLabsBackground.sendContentScriptMessage( "request-access", message, sender.tab.id );
    }
  },


  setup : function() {
    document.getElementById( 'realtime' ).addEventListener( 'load', xLabsBackground.onModuleLoad, true );  
    document.getElementById( 'realtime' ).addEventListener( 'crash', xLabsBackground.onModuleCrash, true );
    chrome.runtime.onMessage.addListener( xLabsBackground.onExtensionMessage );
    chrome.runtime.onInstalled.addListener( xLabsBackground.onInstalled );
    chrome.runtime.onMessageExternal.addListener( xLabsBackground.onMessageExternal );
    xLabsBackground.setupPersistentFs();
    // Setting the extension icon is persistent. So we need to reset it every time.
    chrome.browserAction.setIcon( {
      path: {
        19: xLabsVariables.ICON_FILE_19_OFF,
        38: xLabsVariables.ICON_FILE_38_OFF
      }
    });
  }
};

xLabsBackground.setup();


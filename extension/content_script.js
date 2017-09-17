
var xLabsContent = {

  // Restrictions, if >= PAGE_STATUS_PENDING, then allow access.
  PAGE_STATUS_NONE    : 0,
  PAGE_STATUS_NG      : 1,
  PAGE_STATUS_PENDING : 2,
  PAGE_STATUS_OK      : 3,
  pageToken : null,
  pageStatus : 0,
  PAGE_CHECK_TIMEOUT : 15000, // Grace period after firs access request. (increased because 2.5% seem to timeout)
  localhostDomains : [ "file", "127.0.0.1", "localhost", "0:0:0:0:0:0:0:1", "0:0:0:0:0:0:0:0", "::1" , "::" ], // http://en.wikipedia.org/wiki/IPv6_address

  // Status
  setupComplete : false,

  // Config
  config : null,
  prevConfig : null,
  lastMode : null,

  // Canvas
  canvasWasHidden : true,
  canvas : null,
  canvasContext : null,

  // Mouse movement logging
  xMouseScreen : 0, 
  yMouseScreen : 0,

  // Mouse press logging
  xMouseScreenDown : 0,
  yMouseScreenDown : 0,
  tMouseScreenDown : 0,
  bMouseDown : false,

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Keyboard Listener functions
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  addKeyboardListener : function() {
    window.addEventListener( "keydown", function(e) {
      xLabsContent.onKeyDown( e );
    }, false );
  }, 

  addMouseListeners : function() {
    window.addEventListener( "mousemove", function( e ) {
      xLabsContent.onMouseMove( e );
    }, false );

    window.addEventListener( "mousedown",function(e) {
      xLabsContent.onMouseDown( e );
    }, false );

    window.addEventListener( "mouseup",function(e) {
      xLabsContent.onMouseUp( e );
    }, false );
  }, 

  getMouseScreenX : function( mouseEvent ) {
      if( xLabsContent.config == null ) {
        return mouseEvent.screenX;
      }

      if( xLabsContent.getConfig( "browser.mouse.absScreenCoordinates" ) == "1" ) {
        return mouseEvent.screenX;
      }
      else {
        return mouseEvent.screenX + window.screenX;
      }
  },

  getMouseScreenY : function( mouseEvent ) {
      if( xLabsContent.config == null ) {
        return mouseEvent.screenY;
      }

      //if( xLabsContent.config.browser.mouse.absScreenCoordinates == 1 ) {
      if( xLabsContent.getConfig( "browser.mouse.absScreenCoordinates" ) == "1" ) {
        return mouseEvent.screenY;
      }
      else {
        return mouseEvent.screenY + window.screenY;
      }
  },

  onKeyDown : function( e ) {
    xLabsContent.sendKeyEventMessage( "down", e ); // not needed
  },

  setDocumentOffsetConfig : function( offsetX, offsetY ) {
    //console.log( "Changed document offset: (xOffset, yOffset): (" + offsetX + ", " + offsetY + ")" );
    xLabsContent.setConfig( "browser.document.offset.ready", "1" ); // TODO can this be done in background?
    xLabsContent.setConfig( "browser.document.offset.x", offsetX ); // TODO can this be done in background?
    xLabsContent.setConfig( "browser.document.offset.y", offsetY ); // TODO can this be done in background?
  },

  onMouseMove : function( e ) {
    // Save the current mouse position
    xLabsContent.xMouseScreen = xLabsContent.getMouseScreenX( e );
    xLabsContent.yMouseScreen = xLabsContent.getMouseScreenY( e );

    if( xLabsCoord.offset.x != null ) { // offset may not always be available

      var ready = xLabsContent.getConfig( "browser.document.offset.ready" );
      if( ready.localeCompare( "1" ) != 0 ) {
        xLabsContent.setDocumentOffsetConfig( xLabsCoord.offset.x, xLabsCoord.offset.y );
      }
      else {
        var x = parseInt( xLabsContent.getConfig( "browser.document.offset.x" ) );
        var y = parseInt( xLabsContent.getConfig( "browser.document.offset.y" ) );
        if(    x != xLabsCoord.offset.x
            || y != xLabsCoord.offset.y ) {
          xLabsContent.setDocumentOffsetConfig( xLabsCoord.offset.x, xLabsCoord.offset.y );
        }
      } 
    }

    // need to log this? Overkill?
    //xLabsContent.sendMouseEventMessage( "move", e );
  },

  onMouseDown : function( e ) {
    xLabsContent.bMouseDown = true;
    //xLabsContent.sendMouseEventMessage( "down", e );

    var xScreen = xLabsContent.getMouseScreenX( e );
    var yScreen = xLabsContent.getMouseScreenY( e );

    xLabsContent.xMouseScreenDown = xScreen;
    xLabsContent.yMouseScreenDown = yScreen;
    xLabsContent.tMouseScreenDown = xLabsUtil.getTimestamp();

    xLabsTruth.onMouseDown();
    xLabsLearning.onMouseDown();
  },

  onMouseUp : function( e ) {
    xLabsContent.bMouseDown = false;
    //xLabsContent.sendMouseEventMessage( "up", e );

    var clickTempEnabled = parseInt( xLabsContent.getConfig( "click.temp.enabled" ) );
    if( clickTempEnabled != 0 ) {
      var x  = xLabsContent.xMouseScreenDown;
      var y  = xLabsContent.yMouseScreenDown;
      var t1 = xLabsContent.tMouseScreenDown;
      var t2 = xLabsUtil.getTimestamp();
      var csv = xLabsTruth.getCsvIntervalScreen( t1, t2, x, y );
      xLabsContent.setConfig( "click.temp.append", csv );
    }

    xLabsTruth.onMouseUp();
    xLabsTraining.onMouseUp();
  },

  onWindowScroll : function( e ) {
    var scrollTempEnabled = parseInt( xLabsContent.getConfig( "scroll.temp.enabled" ) );
    if( scrollTempEnabled != 0 ) {
      var x  = window.pageXOffset;
      var y  = window.pageYOffset;
      var t = xLabsUtil.getTimestamp();
      var csv = t + "," + x + "," + y;
      //console.log( "Scroll: "+csv );
      xLabsContent.setConfig( "scroll.temp.append", csv );
    }
  },

//  sendMouseEventMessage : function( type, e ) {
//     var xScreen = xLabsContent.getMouseScreenX( e );
//     var yScreen = xLabsContent.getMouseScreenY( e );
//     var timestamp = xLabsUtil.getTimestamp()
// //    xLabsContent.setConfig( "browser.mouse.event."+type, { xScreen: xScreen, yScreen: yScreen, t: timestamp } );
//     xLabsContent.setConfig( "browser.mouse.event."+type+".xScreen", xScreen );
//     xLabsContent.setConfig( "browser.mouse.event."+type+".yScreen", yScreen );
//     xLabsContent.setConfig( "browser.mouse.event."+type+".t", timestamp );
//  },

  sendKeyEventMessage : function( type, e ) {
    var keyCode = e.keyCode;
    var timestamp = xLabsUtil.getTimestamp()
//    xLabsContent.setConfig( "browser.keyboard.event."+type, { keyCode: keyCode, t: timestamp } );
    xLabsContent.setConfig( "browser.keyboard.event."+type+".keyCode", keyCode );
    xLabsContent.setConfig( "browser.keyboard.event."+type+".t", timestamp );
  },

  performPageCheck : function( token, thirdPartyExtensionId ) {
    // console.log( "token" )
    // console.log( token )

    // Allow access as long as _one_ of the requests returned OK. Otherwise
    // if you have an extension that's now allowed on a valid domain, access
    // might be revoked.
    if( xLabsContent.pageStatus == xLabsContent.PAGE_STATUS_OK ) {
      return;
    }

    // Prevent user accidentally wanting page check.
    if( xLabsContent.pageToken && xLabsContent.pageToken == token ) {
      return;
    }

    xLabsContent.pageToken = token;

    // If this is the first time user requests permission then give them a grace period.
    // PAGE_STATUS_PENDING allows full access to extension.
    if( xLabsContent.pageStatus == xLabsContent.PAGE_STATUS_NONE ) {
      xLabsContent.pageStatus = xLabsContent.PAGE_STATUS_PENDING;
      
      // Give the grace period a time limit from first access request. If still
      // didn't get a valid response within this period, set it to disallow.
      // However, any valid response arriving after the grace period will immediately
      // reactivate. But there's only one grace period after the first access request.
      setTimeout( function() {
        if( xLabsContent.pageStatus != xLabsContent.PAGE_STATUS_OK ) {
          xLabsContent.pageStatus = xLabsContent.PAGE_STATUS_NG;
          console.error( "Grace period ended, disabling xlabs extension." )
        }
      }, xLabsContent.PAGE_CHECK_TIMEOUT )

    }

    xLabsContent.sendPageCheck( xLabsContent.pageToken, thirdPartyExtensionId );
  },

  checkOtherExtensions : xLabsUtil.callOnce( function() {
    // Check for multiple xlabs extensions.
    var numExtensions = 0;
    numExtensions += !!document.documentElement.getAttribute( 'data-xlabs-extension-version' );
    numExtensions += !!document.documentElement.getAttribute( 'data-eyesdecide-extension-version' );

    if( numExtensions > 1 ) {

      // Make sure only 1 extension shows the message.
      if( chrome.runtime.getManifest().short_name == "EyesDecide" ) {
        alert( "You have both xLabs and EyesDecide extensions installed. Please enable only one and refresh this page.");
      }

      window.removeEventListener( "message", xLabsContent.onPageMessage );

      //console.log( "onPageMessage() removed" )
      return;
    }
  }),

  onPageMessage : function( event ) {
    //  event {
    //    target : "xlabs",
    //    config {
    //      path : "xyz",
    //      value : "bob"
    //    }
    //  }
    //console.log( "xLabs ContentScript: message from page? " );
    if( event.source != window ) { // should come from this page and window
      //console.log( "event.source != window" );
      return;
    }

    // Message from embedding page?
    // AZ, Redundant?
    // if( event.data.target == null ) {
    //   return;
    // }

    if( event.data.target != "xLabs" ) {
      //console.log( 'event.data.target != "xLabs"' );
      return;
    }

    xLabsContent.checkOtherExtensions();

    // console.log( "event" );
    // console.log( event );

    if( event.data.action == "request-access" ) {
      // console.log( "xLabsContent: calling performPageCheck() on page event");
      xLabsContent.performPageCheck( event.data.token );
      return
    }

    if( xLabsContent.pageStatus == xLabsContent.PAGE_STATUS_NG ) {
      // marked as invalid, only recoverable with page reload.
      var xLabsEvent = document.createEvent( "CustomEvent" );
      xLabsEvent.initCustomEvent( "xLabsApiError", true, true, "forbidden" ); 
      document.dispatchEvent( xLabsEvent );

      return;
    }

    // remaining status values: OK, DEV, SENT (ie pending)
    //console.log( "xLabs ContentScript: target is xLabs, command accepted" );
    if( event.data.config != null ) {
      if( ( event.data.config.path != null ) && ( event.data.config.value != null ) ) {
        xLabsContent.setConfig( event.data.config.path, event.data.config.value );
      }
    }
  }, 

  isDeveloperPage : function() {
    // returns true of file:// or localhost
    if( window.location.protocol.indexOf( "file" ) >= 0 ) {
      return true;
    }

    var domain = document.domain;
    if( xLabsContent.checkDomainList( domain, xLabsContent.localhostDomains ) ) {
      return true;
    }

    return false;
  },

  sendPageCheck : function( token, thirdPartyExtensionId ) {
    // console.log( "content_script: sending page check" );
    // console.log( "thirdPartyExtensionId: " + thirdPartyExtensionId );

    // Replace domain with the extension ID if request is from extension.
    var domain = document.domain;
    if( thirdPartyExtensionId ) {
      domain = thirdPartyExtensionId;
    }

    // Settingd dev="1" will skip the domain check, which means if it'll reject
    // an authorised extension from accessing developer domains. Not good. So only
    // set dev="1" if there's an actual token. If no token, we set dev="0", and 
    // the URL filtering will take effect. Since dev URLs are not a part of the
    // white listed domains, they'll fail anyway.
    var dev = "0";
    if( token ) {
      if( xLabsContent.isDeveloperPage() ) {
        dev = "1";
      }
    }
    else {
      token = "null"
    }

    var t = xLabsUtil.getTimestamp();

    var server = "https://registration.xlabsgaze.com";
    //var server = "https://localhost:8443";
    var parameters = "/auth?t="+t+"&dev="+dev+"&token="+token+"&domain="+domain+"&url="+document.URL;
    var url = server + parameters;
    //console.log( "XHR for xLabs compatible page: "+url );

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if( xhr.readyState == 4 ) {       
        if( xhr.status == 200 ) {
          xLabsContent.onPageCheck( xhr.responseText );
        }
        else {
          // How to handle can't communicate with central server ie offline?
          console.log( "xLabs HTTP request error: " + xhr.statusText );  
          xLabsContent.onPageNotAllowed( "Server could not be contacted." );
        }
      }
    };

    xhr.open( "GET", url, true );
    xhr.send();
  },

  // There's no need to set page status to PAGE_STATUS_NG. The grace period timer
  // does that.
  onPageNotAllowed : function( reason ) {
    var errorMessage = "xLabs API not authorised because: " + reason;
    console.error( errorMessage ); // for dev to read
    if( xLabsContent.pageStatus == xLabsContent.PAGE_STATUS_OK ) {
      console.error( "But we got an OK from an earlier request, so still allowing" ); // for dev to read      
    }
    // alert( errorMessage );
  },

  onPageCheck : function( result ) {
    // console.log( "Page check result: " + result );
    var resultObject = JSON.parse( result );
    if( resultObject.status == "ok" ) {
      // Set page status to PAGE_STATUS_OK whenever we get a valid response.
      xLabsContent.pageStatus = xLabsContent.PAGE_STATUS_OK;
    }
    else {
      xLabsContent.onPageNotAllowed( resultObject.reason );
    }

    // check the check isn't a reuse of a very old timestamp, while allowing some 
    if( resultObject.t ) {
      var t2 = xLabsUtil.getTimestamp();
      var t1 = resultObject.t;//new Date( resultObject.t ).getTime();
      var dt = t2 - t1;
      // console.log( "reply: t="+t1+" t2="+t2+" dt="+dt );
      if( dt > (90 * 1000.0) ) {
        xLabsContent.onPageNotAllowed( "Server didn't reply with a recent timestamp." );
      }
    }
    else {
      xLabsContent.onPageNotAllowed( "Server didn't reply with a timestamp." );
    }

    // Relay the challenge to the binary to check authenticity.
    // From server:         String result = time + dev + domain + token + sdk + status;
    var challenge = resultObject.t + resultObject.dev + resultObject.domain + resultObject.token + resultObject.sdk + resultObject.status + ":" + resultObject.challenge;
    xLabsContent.setConfig( "system.challenge", challenge );    
  },

  checkDomainList : function( domain, domainList ) {
    for( var i = 0; i < domainList.length; ++i ) { 
      if( xLabsContent.checkDomain( domain, domainList[ i ] ) ) {      
        //console.log( "Matched, allowing "+domain );
        return true;
      }
      //else {
        //console.log( "Not matched, not allowing "+domain );
      //}
    }

    return false;
  },

  checkDomain : function( domain, allowedDomain ) {
    // Basically I think endsWith will exhibit correct behaviour for all domains, while allowing subdomains correctly.
    // Should also work with localhost aliases.
    // http://stackoverflow.com/questions/280634/endswith-in-javascript
    //console.log( "checkDomain: "+domain+" : "+ allowedDomain );
    var check = ( domain.indexOf( allowedDomain, domain.length - allowedDomain.length ) !== -1 );
    //console.log( "checkDomain: result="+check );
    return check;
  },

  onBackgroundMessage : function( request, sender, sendResponse ) {
    // Not from extension
    if( sender.tab != null ) {
      return
    }

    // id our extension
    if( request.target != "xLabs" ) {
      //console.log( "xLabs ContentScript: message ?from background? doesn't contain xLabs origin." );
      return;
    }

    // what type of message did we send?
    if( request.type == "config" ) {
      //console.log( "xLabs ContentScript: Config message received from background." );
      xLabsContent.onConfig( request.content );
    }
    else if( request.type == "csv" ) {
      //console.log( "xLabs ContentScript: CSV message received from background." );
      xLabsContent.onCsv( request.content );
    }
    else if( request.type == "request-access" ) {
      // console.log( "xLabsContent: calling performPageCheck() on background message");
      xLabsContent.performPageCheck( request.content.token, request.content.extensionId );
    }
  },

  onCsv : function( csv ) {
    //console.log( "CSV : "+JSON.stringify( csv ) );
    //console.log( "Page requested CSV content of "+ csv.path +" into element with ID: "+csv.id );

    // Not authorised
    if( xLabsContent.pageStatus < xLabsContent.PAGE_STATUS_PENDING ) {
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if( xhr.readyState == 4 && xhr.status == 200 ) {
        var element = document.getElementById( csv.id );
        if( !!element ) {
          element.innerHTML = xhr.responseText;

          // relay to the page:
          var xLabsEvent = document.createEvent( "CustomEvent" );
          xLabsEvent.initCustomEvent( "xLabsApiIdPath", true, true, csv ); 
          document.dispatchEvent( xLabsEvent );
        }
        else {
          throw( "Page requested CSV content of "+ csv.file +" into element with ID: "+csv.id+" but that element doesn't exist." );
        }
      }
    };    
    xhr.open( "GET", csv.url, true );
    xhr.send();
  },

  sendConfigMessage : function( path, value ) {
    //  payload {
    //    target : "xlabs",
    //    config {
    //      path : "xyz",
    //      value : "bob"
    //    }
    //  }
    //chrome.runtime.sendMessage( { target: "xLabs", config: { path: path, value: value } }, function( response ) {} );
    var m = { target: "xLabs", config: { path: path, value: value } };
    xLabsContent.postBackgroundMessage( m );
  },

  sendActionMessage : function( action ) {
    //  payload {
    //    target : "xlabs",
    //    action : "some-action"
    //  }
    //chrome.runtime.sendMessage( { target: "xLabs", action: action }, function( response ) {} );
    var m = { target: "xLabs", action: action };
    xLabsContent.postBackgroundMessage( m );
  },

  postBackgroundMessage : function( m ) {
    chrome.runtime.sendMessage( m );
//    xLabsContent.openBackgroundMessage();
//    xLabsContent.port.postMessage( m );
  },

  getConfigImpl : function( config, path ) {
    try {
      //return xLabsContent.config[ path ];
      if( config == null ) { 
        //console.log( "xLabs ContentScript: Config is null." );
        return "";
      }

      var value = xLabsUtil.getObjectProperty( config, path );

      if( typeof value != 'undefined' ) {
        return value;
      }
      console.log( "xLabs ContentScript: undefined config path: "+path );
      return "";
    }
    catch( err ) {
      console.log( "xLabs ContentScript: error accessing config path: "+path );
      return "";
    }
  },

  getConfig : function( path ) {
    return xLabsContent.getConfigImpl( xLabsContent.config, path );
  },

  getPrevConfig : function( path ) {
    return xLabsContent.getConfigImpl( xLabsContent.prevConfig, path );
  },

  requestConfigUpdate : function( path, value ) {
    // set all the paths in this config to the specified values
    //console.log( "xLabs ContentScript: setConfig path: "+ path + " value: " + JSON.stringify( value ) );
    xLabsContent.sendActionMessage( "request-config-update" );
  },

  setConfig : function( path, value ) {
    // set all the paths in this config to the specified values
    //console.log( "xLabs ContentScript: setConfig path: "+ path + " value: " + JSON.stringify( value ) );
    xLabsContent.sendConfigMessage( path, value );        
  },

  onConfig : function( config ) {
    // cache the state for display
    xLabsContent.prevConfig = xLabsContent.config;
    xLabsContent.config = config;

    // check for properties we care about:
    var captureMouse = parseInt( xLabsContent.getConfig( "browser.canvas.captureMouse" ) );
    if( captureMouse != 0 ) {  // which sign is the new value
      xLabsContent.setCanvasCaptureMouse( true );  // only on change
    } 
    else {
      xLabsContent.setCanvasCaptureMouse( false );
    }

    // truth update
    xLabsTruth.onConfig();
    xLabsCalib.onConfig();
    xLabsErrors.update();

    // preview automation
    var previewEnabled = parseInt( xLabsContent.getConfig( "frame.stream.preview" ) );
    xLabsPreview.setEnabled( previewEnabled );

    // hide/show canvas when config changed? (No: done on paint updates)

    // Not authorised
    if( xLabsContent.pageStatus < xLabsContent.PAGE_STATUS_PENDING ) {
      return;
    }

    // relay to the page:
    var xLabsEvent = document.createEvent( "CustomEvent" );
    xLabsEvent.initCustomEvent( "xLabsApiState", true, true, config ); 
    document.dispatchEvent( xLabsEvent );
  },

  configChanged : function( path ) {
    var curr = xLabsContent.getConfig    ( path );
    var prev = xLabsContent.getPrevConfig( path );
    return ( curr != prev );
  },

  addPageMessageListener : function() {
    window.addEventListener( "message", xLabsContent.onPageMessage, false );
  },

  addBackgroundMessageListener : function() {
    chrome.runtime.onMessage.addListener( xLabsContent.onBackgroundMessage );
  },

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // CSS Mouse Helper functions
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  setCanvasCaptureMouse : function( captureMouse ) {
    if( captureMouse ) {
      xLabsContent.addClass( xLabsContent.canvas, 'allow-pointer' );
    }
    else {
      xLabsContent.removeClass( xLabsContent.canvas, 'allow-pointer' );
    }
  },

  hasClass : function( element, elementClass ) {
    return element.className.match(new RegExp('(\\s|^)'+elementClass+'(\\s|$)'));
  },

  addClass : function( element, elementClass ) {
    if( !xLabsContent.hasClass( element, elementClass ) ) {
      element.className += " "+elementClass;
    }
  },

  removeClass : function( element, elementClass ) {
    if( xLabsContent.hasClass( element,elementClass ) ) {
      var reg = new RegExp('(\\s|^)'+elementClass+'(\\s|$)');
      element.className = element.className.replace( reg, ' ' );
    }
  },

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Canvas functions
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  getCanvasCoordinatesMouseDown : function() {
    return xLabsContent.getCanvasCoordinates( xLabsContent.xMouseScreenDown, xLabsContent.yMouseScreenDown );
  },

  getCanvasCoordinatesMouse : function() {
    return xLabsContent.getCanvasCoordinates( xLabsContent.xMouseScreen, xLabsContent.yMouseScreen );
  },

  getCanvasCoordinates : function( xScreen, yScreen ) {

    var xOffset = xLabsCoord.offset.x;
    var yOffset = xLabsCoord.offset.y;

    var xWindow = window.screenX;
    var yWindow = window.screenY;

    var x = xScreen -xOffset -xWindow;
    var y = yScreen -yOffset -yWindow;

    // Error check
    // var xOffset2 = parseInt( xLabsContent.getConfig( "browser.document.offset.x" ) );
    // var yOffset2 = parseInt( xLabsContent.getConfig( "browser.document.offset.y" ) );
    // if(    xOffset2 != xOffset
    //     || yOffset2 != yOffset ) {
    //   console.log( "offset from local:  " + xOffset  + ", " + yOffset  );
    //   console.log( "offset from config: " + xOffset2 + ", " + yOffset2 );
    // }

    return { x: x, y: y };
  },

  resizeCanvas : function() {
      //console.log( "Resizing overlay canvas" );
      //console.log( "xLabsCoord.devicePixelRatio(): " + xLabsCoord.devicePixelRatio() );
      if( !xLabsCoord.devicePixelRatio() ) {
      	//console.error( "xLabsCoord.devicePixelRatio() is not valid yet" );
      	return;
      }
      //console.log( "devicePixelRatio: " + devicePixelRatio );
//       if( !xLabsCoord.devicePixelRatio() ) {
//       	setTimeout( xLabsCoord.resizeCanvas, 100 );
//       	return;
//       }
      xLabsContent.canvas.width  = (window.innerWidth +0) * xLabsCoord.devicePixelRatio();
      xLabsContent.canvas.height = (window.innerHeight+0) * xLabsCoord.devicePixelRatio();
      xLabsContent.canvas.style.width  = window.innerWidth +0 + "px";
      xLabsContent.canvas.style.height = window.innerHeight+0 + "px";
  },

  paintCanvas : function() {
    xLabsContent.setCanvasTimeout(); // schedule next repaint

    if( document.webkitHidden ) {
      xLabsContent.canvasWasHidden = true;
      //console.log( "xLabs ContentScript: not painting as not visible" );
      xLabsContent.hideCanvas();
      return;
    }

    if( xLabsContent.canvasWasHidden ) {
      xLabsContent.canvasWasHidden = false;
      xLabsContent.requestConfigUpdate();
    }

    // console.log( "xLabs ContentScript: repaint canvas" );
    // check the mode
    // delegate painting to relevant mode:
    // off: nothing - set hide canvas to true
    // mouse: nothing - set hide canvas to true
    // learning: show passive UI, show canvas.
    // training: delegate painting to UI.

    var mode = xLabsContent.getConfig( "system.mode" );

    // Clear the canvas since we may show the canvas to capture mouse but without
    // painting on it, in which case the canvas might has left over from previous
    // mode.
    if( xLabsContent.lastMode != mode ) {
      xLabsContent.lastMode = mode;
      xLabsContent.canvasContext.clearRect( 0,0, xLabsContent.canvas.width, xLabsContent.canvas.height );
    }

    if( mode == "off" ) { 
      xLabsContent.hideCanvas();
    } 
    else if( mode == "head" ) {
      if( xLabsHead.paintHeadPose() ) {
        xLabsContent.showCanvas();
        xLabsHead.paint();
      }
      else {
        xLabsContent.hideCanvas();
      }
    }
    else if( mode == "mouse" ) {
      xLabsContent.showCanvas();
      xLabsMouse.paint();
    }
    else if( mode == "learning" ) {
      xLabsContent.showCanvas(); // still need to show the canvas to capture mouse
      if( xLabsLearning.paintLearning() ) {
        xLabsLearning.paint();
      }
    }
    else if( mode == "training" ) {
      //xLabsContent.showCanvas();
      //xLabsTraining.paint();
      xLabsContent.hideCanvas(); // we don't paint anything, so dont show the canvas
    }
  },

  showCanvas : function() {
    if( xLabsContent.canvas.style.display != "block" ) {
      xLabsContent.canvas.style.display = "block";
    }
  },
  hideCanvas : function() {
    if( xLabsContent.canvas.style.display != "none" ) {
      xLabsContent.canvas.style.display = "none";
    }
  },
  addCanvas : function() {
    // canvas element (usually invisible graphical overlay)
    xLabsContent.canvas = document.createElement( 'canvas' );
    xLabsContent.canvas.setAttribute( "id", "xLabsCanvas" );
    xLabsContent.canvas.setAttribute( "width",  screen.width  );//window.innerWidth);
    xLabsContent.canvas.setAttribute( "height", screen.height );//window.innerHeight);
    // xLabsContent.canvas.setAttribute( "style", "background:0" );
    xLabsContent.canvas.setAttribute( "style", "background:0; display:none;" );
    xLabsContent.canvasContext = xLabsContent.canvas.getContext( "2d" );

    // add these UI tools to the document:	
    var style = document.createElement( 'style' ), // style - positions the canvas element and makes it 'click throughable' 
    rules = document.createTextNode('#xLabsCanvas{pointer-events:none;top:0;left:0;position:fixed;z-index:2147483646;}#xLabsCanvas.allow-pointer{pointer-events:auto;}');
    style.type = 'text/css';

    if( style.styleSheet ) {
      style.styleSheet.cssText = rules.nodeValue;
    }
    else {
      style.appendChild( rules );
    }

    var head = document.getElementsByTagName( 'head' )[0];
    head.appendChild( style );
    document.getElementsByTagName('body')[ 0 ].appendChild( xLabsContent.canvas );

    // add a painting callback for the canvas:
    xLabsContent.setCanvasTimeout();

    window.addEventListener('resize', xLabsContent.resizeCanvas );

    xLabsContent.resizeCanvas(); // first time
  },

  setCanvasTimeout : function() {
    var interval = 500; // slow
    if( xLabsContent.config != null ) {
      if( !document.webkitHidden ) {
        //interval = xLabsContent.config.browser.canvas.intervalFocus;
        interval = xLabsContent.getConfig( "browser.canvas.intervalFocus" );
      }
      else {
        //interval = xLabsContent.config.browser.canvas.intervalBlur;
        interval = xLabsContent.getConfig( "browser.canvas.intervalBlur" );
      }    
    }

    //console.log( "xLabs ContentScript: set timeout: "+ interval );
    setTimeout( xLabsContent.paintCanvas, interval );
  },

/*  removePreview : function() {
    var v = document.getElementById( "xLabsPreview" );
    if( v ) {
      v.src = null;
    }  
  },

  addPreview : function() {
    if( document.getElementById( "xLabsPreview" ) ) {
      var width  = xLabsContent.getConfig( "frame.stream.width"  );
      var height = xLabsContent.getConfig( "frame.stream.height" );

      if( width && height ) {
        xLabsPreview.openCamera( parseInt(width), parseInt(height) );
      }
      else {
        console.log( "Invalid video size" );
      }
    }
  },*/

  setupCoords : function() {
    // Wait for the device pixel ratio to be ready, otherwise we can't initialise the canvas properly.
    var ratioWithoutZoom = parseFloat( xLabsContent.getConfig( "browser.screen.devicePixelRatioWithoutZoom" ) );
    if(    !ratioWithoutZoom
        ||  ratioWithoutZoom == 0 ) {
      //console.log( "waiting for browser.screen.devicePixelRatioWithoutZoom" );
      setTimeout( xLabsContent.setupCoords, 100 );
      return;
    }
    xLabsCoord.setup( ratioWithoutZoom );
    xLabsContent.resizeCanvas();
  },
  
  setup : function() {
    // only setup() once
    //console.log( "xLabs ContentScript: setup..." );
    if( xLabsContent.setupComplete == true ) {
      return;
    }
    xLabsContent.setupComplete = true;

    //xLabsContent.addKeyboardListener();    
    xLabsContent.addMouseListeners();    
    xLabsContent.addPageMessageListener();    
    xLabsContent.addBackgroundMessageListener();    
    xLabsContent.addCanvas();    
    xLabsContent.setupCoords();

    // Scroll handler to toggle classes.
    window.addEventListener( "scroll", xLabsContent.onWindowScroll, false );
  }

}

xLabsContent.setup();

// Adds an invisible div that indictates the xlabs extension is ready.
document.documentElement.setAttribute( 'data-xlabs-extension-ready', 1 );

var xLabsEvent = new CustomEvent( "xLabsApiReady" );
document.dispatchEvent( xLabsEvent );



var xLabsPopup = {
  ready : false,


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

    //console.log( "Options: Mode changed to: "+ mode );

    xLabsPopup.setConfig( "system.mode", mode );

    window.close();
  },

  getConfig : function( path ) {
    var backgroundPage = chrome.extension.getBackgroundPage();
    var value = backgroundPage.xLabsBackground.getConfig( path );
    return value;
  },
  setConfig : function( path, value ) {
    //console.log( "Popup: setConfig( "+ path + "=" + value + ")" );
    var backgroundPage = chrome.extension.getBackgroundPage();
    backgroundPage.xLabsBackground.setConfig( path, value );
  },

  onMessage : function( e ) {
    if( e.config != null ) {
      xLabsPopup.setMode();
    }
    else {
      console.log( "Error: Message doesn't specify config property." );
    }
  },

  setMode : function() {
    var mode = xLabsPopup.getConfig( "system.mode" );

    // config is not ready yet, wait for it
    if( !mode ) {
      //console.log( "waiting to receive config" );
      setTimeout( xLabsPopup.setMode, 100 );
      return;
    }

    var modeForm = document.getElementById( "mode-form" ); 
    if( xLabsPopup.ready == false ) {
      document.getElementById( "status" ).style.display = "None"; 
      xLabsPopup.ready = true;
    }

    for( i = 0; i < modeForm.mode.length; i++ )
    {
      if( modeForm.mode[ i ].value == mode ) {
        modeForm.mode[ i ].checked = 1;
      }
      else {
        modeForm.mode[ i ].checked = 0;
      }
    }
  },

  toggleAdvanced : function() {
    xLabsPopup.toggleShowDiv( "advanced-toggle", "advanced-show" );
  },

  toggleShowDiv : function( divId, toggleId ) {
    var div = document.getElementById( divId );
    var input = document.getElementById( toggleId );

    if( input.checked ) {
      div.style.display = "block";      
    }
    else {
      div.style.display = "none";      
    }
  },

  onRemove : function() {
    var extensionName = chrome.runtime.getManifest().short_name;
    var m = "Remove " + extensionName + " extension?";

    var e2 = document.getElementById( "confirm-message" );
    e2.innerHTML = m;

    var e1 = document.getElementById( "confirm" );
    if( e1 ) {
      e1.style.display = "block";
    }
  },

  onOptions : function() {
    chrome.tabs.create({'url': chrome.extension.getURL( xLabsVariables.URL_OPTIONS ) } ); 
  },

  onHelp : function() {
    chrome.tabs.create({ 'url': xLabsVariables.URL_HELP }); 
  },

  onYes : function() {
    var e1 = document.getElementById( "confirm" );
    if( e1 ) {
      e1.style.display = "none";
    }
    chrome.management.uninstallSelf();
  },

  onNo : function() {
    var e1 = document.getElementById( "confirm" );
    if( e1 ) {
      e1.style.display = "none";
    }
  },

  setup : function() {
    var buttons = document.querySelectorAll( 'button' );
  
    [].forEach.call( buttons, function( button ) {
      button.addEventListener( 'click', function( e ) {
        switch( e.target.id ) {
          case 'options' : 
            xLabsPopup.onOptions();
            break; 
          case 'help'  : 
            xLabsPopup.onHelp();
            break;
          case 'remove'  : 
            xLabsPopup.onRemove();
            break;
          case 'confirm-yes'  : 
            xLabsPopup.onYes();
            break;
          case 'confirm-no'  : 
            xLabsPopup.onNo();
            break;
        }


      } ); // event listener
    } ); // call

    // add listeners to checkboxes
    var toggle = document.getElementById( 'advanced-show' );
    if( toggle ) {
      toggle.onclick = function() {
        xLabsPopup.toggleAdvanced();
      };
    }

    // add listeners to radio buttons:
    var modeRadios = document.getElementById('mode-form').getElementsByTagName('input');

    for( var i = 0, max = modeRadios.length; i < max; i++ ) {
      modeRadios[ i ].onclick = function() {
        xLabsPopup.onModeChanged();
      }
    }
    //console.log('mode radios',modeRadios);

    xLabsPopup.setMode();
    chrome.runtime.onMessage.addListener( xLabsPopup.onMessage );
  }

};

xLabsPopup.setup();


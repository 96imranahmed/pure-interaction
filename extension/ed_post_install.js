

// Setup function
(function() {
  function redirectBackToED() {
    //TODO: find the tab with the correct URL and activate it, then close this tab.
    // For now, we just close the current tab
    chrome.tabs.getCurrent( function(tab) {
      chrome.tabs.remove( tab.id, function() {} );
    });
  }

  var allowCamera = AllowCamera();
  allowCamera.messageHtml =
      '<div style="position:absolute; top:40%; width:100%; text-align:center">' +
      '    <h1>Please allow camera access.</h1>' +
      '</div>'

  allowCamera.show();

  xLabsCamera.openCamera(
    null, // no constraints
    function( stream ) { // onSuccessUser
      console.log( "Camera started in options page." );
      console.log( "Closing camera." );
      xLabsCamera.stopStream( stream );
      console.log( "Redirecting back to ED." );
      redirectBackToED();
    },
    function() { //onErrorUser
      alert("There was a problem opening your camera." );
    });

})(); // Execute




var xLabsCalib = {

  // Mouse interval logs, for truth data
  id : 0, // handle to timer
  interval : 10000, // should be configable but this is default
  cancel : false,

  onConfig : function() {

    var calibrationIntervalRequest = parseInt( xLabsContent.getConfig( "calibration.intervalRequest" ) );
    if( calibrationIntervalRequest > 0 ) {
      xLabsCalib.setInterval(); // turn on, if not already
    }
    else {
      xLabsCalib.cancelInterval(); // (schedule to) turn off, if not already
    }
  },

  onInterval : function() {
    //console.log( "calib send request..." );
    xLabsContent.setConfig( "calibration.request", "1" );

    // check whether to cancel having done this last calib:
    if( xLabsCalib.cancel == true ) {
      xLabsCalib.clearInterval();
    }
  },

  setInterval : function() {
    // don't set again, if already set
    if( xLabsCalib.id != 0 ) {
      return;
    }

    //console.log( "set calib interval" );

    // set the interval as defined
    var interval = parseInt( xLabsContent.getConfig( "calibration.interval" ) );
    if( interval > 0 ) {  
      xLabsCalib.interval = interval;
    }
    xLabsCalib.id = setInterval( xLabsCalib.onInterval, xLabsCalib.interval );
    xLabsCalib.cancel = false;

    xLabsCalib.onInterval(); // request 1 now
  },

  cancelInterval : function() {
    xLabsCalib.cancel = true;
  },

  clearInterval : function() {
    if( xLabsCalib.id != 0 ) {
      //console.log( "clear calib interval" );
      clearInterval( xLabsCalib.id ); // stop reminding me
      xLabsCalib.id = 0;
      xLabsCalib.cancel = false;
    }
  }

};




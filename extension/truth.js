
var xLabsTruth = {

  // Mouse interval logs, for truth data
  xScreen : 0,
  yScreen : 0,
  t1 : 0,
  id : 0, // handle to timer
  interval : 50, // should be configable but this is default
 
  getCsvIntervalScreen : function( t1, t2, xs, ys ) {
    // Defines ordering of values
    // t1,t2,xs,ys
    // For truth, also used for clicks
    var csv = t1 + "," + t2 + "," + xs + "," + ys;
    return csv;    
  },

  onMouseDown : function() {
    var truthMouse  = parseInt( xLabsContent.getConfig( "truth.mouse" ) );
    if( truthMouse != 0 ) {
      xLabsTruth.setInterval(); // start recording truth
    }
  },

  onMouseUp : function() {
    var truthMouse  = parseInt( xLabsContent.getConfig( "truth.mouse" ) );
    if( truthMouse != 0 ) {
      xLabsTruth.clearInterval(); // stop recording truth
    }
  },

  onConfig : function() {
    //console.log( "truth on config" );
    //var truthMouse  = parseInt( xLabsContent.getConfig( "truth.mouse" ) );
    //var truthEnable = parseInt( xLabsContent.getConfig( "truth.enabled" ) ); 
    //
    //if( truthMouse > 0 ) {
    //  return; // mouse decides when truth is recording (ie on click
    //}
    //
    // else: 3rd party decides when truth should record
    //if( truthEnable > 0 ) {
    //  //console.log( "truth on config set interval." );
    //  xLabsTruth.setInterval(); // turn on, if not already
    //}
    //else {
    //  xLabsTruth.clearInterval(); // turn off, if not already
    //}
  },

  onInterval : function() {
    //console.log( "on truth interval" );
    // this is called regardless of the origin of the truth data.
    // either mouse, or set as a config property
    //var truthEnable = parseInt( xLabsContent.getConfig( "truth.enabled" ) );
    //if( truthEnable == 0 ) {
    var truthMouse  = parseInt( xLabsContent.getConfig( "truth.mouse" ) );
    if( truthMouse == 0 ) {
      //console.log( "on truth interval but not enabled" );
      return; // not appending
    }

    //console.log( "on truth interval: ENABLED="+truthEnable+" as string:"+xLabsContent.getConfig( "truth.enabled" ) );
    var x  = 0;
    var y  = 0;
    var t1 = xLabsTruth.t1;
    var t2 = xLabsUtil.getTimestamp();

    if( t1 <= 0 ) { // none set
      t1 = t2;
      t2 = t2 +1; // ensure duration at least 1 for alan
    }

    //var truthMouse  = parseInt( xLabsContent.getConfig( "truth.mouse" ) );
    //if( truthMouse != 0 ) {
      x = xLabsContent.xMouseScreen;
      y = xLabsContent.yMouseScreen;
    //}
    //else {
    //  x = parseInt( xLabsContent.getConfig( "truth.x" ) );
    //  y = parseInt( xLabsContent.getConfig( "truth.y" ) );
    //}    

    var csv = xLabsTruth.getCsvIntervalScreen( t1, t2, x, y );
    //console.log( "APPEND truth interval data:"+ csv + "@ time="+ xLabsUtil.getTimestamp() );
    xLabsContent.setConfig( "truth.append", csv );

    xLabsTruth.t1 = t2; // change the timestamp
  },

  setInterval : function() {
    // don't set again, if already set
    if( xLabsTruth.id != 0 ) {
      return;
    }

    //console.log( "set truth interval" );

    // set the interval as defined
    xLabsTruth.onInterval(); // prepare any pending interval

    var interval = parseInt( xLabsContent.getConfig( "truth.interval" ) );
    if( interval > 0 ) {  
      xLabsTruth.interval = interval;
    }
    xLabsTruth.id = setInterval( xLabsTruth.onInterval, xLabsTruth.interval );
  },

  clearInterval : function() {
    if( xLabsTruth.id == 0 ) {
      return;
    }

    // console.log( "clear truth interval" );
    xLabsTruth.onInterval(); // clear any pending interval

    clearInterval( xLabsTruth.id ); // stop reminding me
    xLabsTruth.id = 0;
    xLabsTruth.t1 = 0;
  }

};




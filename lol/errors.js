
///////////////////////////////////////////////////////////////////////////////////////////////////
// Error and warning detection with debouncing and easy handling of multiple error conditions.
///////////////////////////////////////////////////////////////////////////////////////////////////
var xLabsErrors = {

  FREQUENCY_THRESHOLD : 0.15, // this is for UI control but is pretty OK for any machine
  LEARNING_RATE : 0.1, // debouncing of errors

  MESSAGE_FACE   : "Can't see a face.",
  MESSAGE_POSE   : "Bad pose: Centre your face in the camera image.",
  MESSAGE_TRACK  : "Tracking suspended.",
  MESSAGE_SIZE   : "Low resolution / face too small.",
  MESSAGE_DARK   : "Too dark! (reduces accuracy).",
  MESSAGE_BRIGHT : "Too bright! (reduces accuracy).",
  MESSAGE_UNEVEN : "Uneven lighting (reduces accuracy).",

  errorMessage : "",
  warningMessage : "",

  freqErrorTrack : 0.0,
  freqErrorFace : 0.0,
  freqErrorPose : 0.0,

  freqWarningSize : 0.0,
  freqWarningDark : 0.0,
  freqWarningBright : 0.0,
  freqWarningUneven : 0.0,

  hasError : function() {
    if( xLabsErrors.errorMessage.length > 0 ) {
      return true;
    }
    return false;
  },

  hasErrorExcludingPose : function() {
    if( xLabsErrors.errorMessage.length > 0 ) {
      if( xLabsErrors.errorMessage == xLabsErrors.MESSAGE_POSE ) {
        return false;
      }

      return true;
    }
    return false;
  },

  hasWarning : function() {
    if( xLabsErrors.warningMessage.length > 0 ) {
      return true;
    }
    return false;
  },

  hasNoFace : function() {
    if( Errors.freqError( Errors.freqErrorFace ) ) {
      return true;
    }
    return false;
  },

  hasBadPose : function() {
    var x = parseFloat( xLabsContent.getConfig( "state.head.x" ) );
    var y = parseFloat( xLabsContent.getConfig( "state.head.y" ) );
    var t = parseFloat( xLabsContent.getConfig( "algorithm.validation.headCentreDistanceThreshold" ) );
    return xLabsErrors.distanceThreshold( x, y, t );
  },
  hasBadPoseX : function() {
    var x = parseFloat( xLabsContent.getConfig( "state.head.x" ) );
    var t = parseFloat( xLabsContent.getConfig( "algorithm.validation.headCentreDistanceThreshold" ) );
    return xLabsErrors.distanceThreshold( x, 0.0, t );
  },
  hasBadPoseY : function() {
    var y = parseFloat( xLabsContent.getConfig( "state.head.y" ) );
    var t = parseFloat( xLabsContent.getConfig( "algorithm.validation.headCentreDistanceThreshold" ) );
    return xLabsErrors.distanceThreshold( 0.0, y, t );
  },

  freqError : function( frequency ) {
//    var threshold = 0.15; // e.g. 0.15 = 15%
    if( frequency > xLabsErrors.FREQUENCY_THRESHOLD ) {
      return true;
    }
    return false;
  },

  distanceThreshold : function( xh, yh, threshold ) {
    var d = xLabsUtil.distance( 0.0, 0.0, xh, yh );
    if( d > threshold ) {
      return true;
    }
    return false;
  },

  update : function() {
    var trackingSuspended = parseInt( xLabsContent.getConfig( "state.trackingSuspended" ) );
    var calibrationStatus = parseInt( xLabsContent.getConfig( "calibration.status" ) );
    var errors = xLabsContent.getConfig( "validation.errors" );

    // build a prioritized error/warning message string:
    // Face detection
    var error = 0.0;
    if( errors.indexOf( "F" ) >= 0 ) {
      error = 1.0;
    }
    xLabsErrors.freqErrorFace = xLabsUtil.lerp( xLabsErrors.freqErrorFace, error, xLabsErrors.LEARNING_RATE );

    // Tracking
    error = 0.0;
    if( trackingSuspended > 0 ) {
      error = 1.0;
    }
    xLabsErrors.freqErrorTrack = xLabsUtil.lerp( xLabsErrors.freqErrorTrack, error, xLabsErrors.LEARNING_RATE );

    // Pose (centred in camera)
    error = 0.0;
    if( xLabsErrors.hasBadPose() ) {
      error = 1.0;
    }
    xLabsErrors.freqErrorPose = xLabsUtil.lerp( xLabsErrors.freqErrorPose, error, xLabsErrors.LEARNING_RATE );

    // Size/resolution
    error = 0.0;
    if( errors.indexOf( "R" ) >= 0 ) {
      error = 1.0;
    }
    xLabsErrors.freqWarningSize = xLabsUtil.lerp( xLabsErrors.freqWarningSize, error, xLabsErrors.LEARNING_RATE );

    // Uneven lighting
    error = 0.0;
    if( errors.indexOf( "U" ) >= 0 ) {
      error = 1.0;
    }
    xLabsErrors.freqWarningUneven = xLabsUtil.lerp( xLabsErrors.freqWarningUneven, error, xLabsErrors.LEARNING_RATE );

    // Bright
    error = 0.0;
    if( errors.indexOf( "B" ) >= 0 ) {
      error = 1.0;
    }
    xLabsErrors.freqWarningBright = xLabsUtil.lerp( xLabsErrors.freqWarningBright, error, xLabsErrors.LEARNING_RATE );

    // Dark
    error = 0.0;
    if( errors.indexOf( "D" ) >= 0 ) {
      error = 1.0;
    }
    xLabsErrors.freqWarningDark = xLabsUtil.lerp( xLabsErrors.freqWarningDark, error, xLabsErrors.LEARNING_RATE );

    // prioritize errors:
    var errorMessage = "";
    if( xLabsErrors.freqError( xLabsErrors.freqErrorFace ) ) {
      errorMessage = xLabsErrors.MESSAGE_FACE;//"Can't see a face.";
    }
    else if( xLabsErrors.freqError( xLabsErrors.freqErrorPose ) ) { // have a face, but not tracking
      errorMessage = xLabsErrors.MESSAGE_POSE;//"Bad pose: Centre your face in the camera image.";
    }
    //else if( calibrationStatus == 0 ) { // have a face, but not tracking. This doesn't change fast so no smoothing
    //  errorMessage = "Not yet calibrated.";
    //}
    else if( xLabsErrors.freqError( xLabsErrors.freqErrorTrack ) ) { // have a face, but not tracking
      errorMessage = xLabsErrors.MESSAGE_TRACK;//"Tracking suspended.";
    }

    // prioritize warnings:
    var warningMessage = "";

    if( xLabsErrors.freqError( xLabsErrors.freqWarningSize ) ) {
      warningMessage = xLabsErrors.MESSAGE_SIZE;//"Low resolution / face too small.";
    }
    else if( xLabsErrors.freqError( xLabsErrors.freqWarningDark ) ) { // have a face, but not tracking
      warningMessage = xLabsErrors.MESSAGE_DARK;//"Too dark! (reduces accuracy).";
    }
    else if( xLabsErrors.freqError( xLabsErrors.freqWarningBright ) ) { // have a face, but not tracking. This doesn't change fast so no smoothing
      warningMessage = xLabsErrors.MESSAGE_BRIGHT;//"Too bright! (reduces accuracy).";
    }
    else if( xLabsErrors.freqError( xLabsErrors.freqWarningUneven ) ) { // have a face, but not tracking
      warningMessage = xLabsErrors.MESSAGE_UNEVEN;//"Uneven lighting (reduces accuracy).";
    }

    xLabsErrors.errorMessage = errorMessage;
    xLabsErrors.warningMessage = warningMessage;
  }

};




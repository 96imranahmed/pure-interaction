
var xLabsUtil = {

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Painting Methods
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  drawCircle : function( centreX, centreY, radius ) {
    xLabsContent.canvasContext.beginPath();
    xLabsContent.canvasContext.arc( centreX, centreY, radius, 0, 2 * Math.PI, false );
    xLabsContent.canvasContext.stroke();
  },

  fillCircle : function( centreX, centreY, radius ) {
    xLabsContent.canvasContext.beginPath();
    xLabsContent.canvasContext.arc( centreX, centreY, radius, 0, 2 * Math.PI, false );
    xLabsContent.canvasContext.fill();
  },

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Time
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  getTimestamp : function() {
    // unified function to get suitable timestamps
    var dateTime = new Date();
    var timestamp = dateTime.getTime();
    return timestamp;
  },

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Resolution
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  getDpi : function() {
    var dppx = window.devicePixelRatio ||
      (    window.matchMedia 
        && window.matchMedia( "(min-resolution: 2dppx), (-webkit-min-device-pixel-ratio: 1.5),(-moz-min-device-pixel-ratio: 1.5),(min-device-pixel-ratio: 1.5)" ).matches? 2 : 1 )
      || 1;

    var w = ( screen.width  * dppx );
    var h = ( screen.height * dppx );
    return this.calcDpi( w, h, 13.3, 'd' );
  },

  calcDpi : function( w, h, d, opt ) {
    // Calculate PPI/DPI
    // Source: http://dpi.lv/
    w>0 || (w=1);
    h>0 || (h=1);
    opt || (opt='d');
    var dpi = (opt=='d' ? Math.sqrt(w*w + h*h) : opt=='w' ? w : h) / d;
    return dpi>0 ? Math.round(dpi) : 0;
  }, 

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // JSON
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  json2html : function( jsonObject ) {
    var json = JSON.stringify( jsonObject, undefined, 2);
    json = json.replace( /&/g, '&amp;').replace( /</g, '&lt;' ).replace( />/g, '&gt;' );

    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
  },

  getObjectProperty : function( object, path ) {
    if( ( object == undefined ) || ( object == null ) ) {
      //console.log( "Uril errro" );
      return "";
    }
    //console.log( "Uril util"+path );
    var parts = path.split('.'),
        last = parts.pop(),
        l = parts.length,
        i = 1,
        current = parts[ 0 ];

    while( ( object = object[ current ] ) && i < l ) {
      current = parts[ i ];
      //console.log( "Util object: "+JSON.stringify( object ) );
      i++;
    }

    if( object ) {
      //console.log( "Util result: "+object[ last ] );
      return object[ last ];
    }
  },

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Math
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  lerp : function( oldValue, oneValue, learningRate ) {
    var beta = 1.0 - learningRate;
    var newValue = oldValue * beta + oneValue * learningRate;
    return newValue;
  },

  distance : function( x1, y1, x2, y2 ) {
    var dx2 = ( x1 - x2 ) * ( x1 - x2 );    
    var dy2 = ( y1 - y2 ) * ( y1 - y2 );
    var d = Math.sqrt( dx2 + dy2 );
    return d;
  },

  rotate : function( x, y, t ) {
    var cost = Math.cos( t );
    var sint = Math.sin( t );
    return {
        x: cost * ( x ) - sint * ( y ),
        y: sint * ( x ) + cost * ( y )
    };
  },

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Other
  ///////////////////////////////////////////////////////////////////////////////////////////////////

  callOnce : function( call ) {
    var executed = false;
    return function () {
      if (!executed) {
        executed = true;
        return call.apply( this, arguments );
      }
    }
  },

  getRandomToken: function() {
      // E.g. 8 * 32 = 256 bits token
      var randomPool = new Uint8Array(16);
      crypto.getRandomValues(randomPool);
      var hex = '';
      for (var i = 0; i < randomPool.length; ++i) {
          hex += randomPool[i].toString(16);
      }
      // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
      return hex;
  },

  getUserInfo: function( callback ) {
    chrome.storage.sync.get(['userId', 'installDate'], function(items) {
      var userId = items.userId;
      if( userId ) {
          callback(items);
      } else {
          items.userId = xLabsUtil.getRandomToken();
          items.installDate = "" + new Date()
          chrome.storage.sync.set(items, function() {
              callback(items);
          });
      }
    });
  }
};




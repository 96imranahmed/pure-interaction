
function AllowCamera() {
    var overlayId = "cameraPermission"
    var arrowName = "cameraPermissionArrow"
    var DEFAULT_Z_INDEX = 10
    var timer = null

    function createArrow() {
        var arrow = document.createElement('div')
        arrow.setAttribute( "name", arrowName )
        arrow.style.position = "fixed"
        arrow.style.top = "0"
        arrow.style.width = "10%"
        arrow.style.height = "10%"
        arrow.style.opacity = "0.5"
        arrow.innerHTML = self.arrowSvg
        return arrow
    }

    function appendArrow( overlay, left ) {
        var arrow = createArrow()
        arrow.style.left = String(left)
        overlay.appendChild(arrow)
    }

    function appendMessage( overlay, messageHtml ) {
        var div = document.createElement('div')
        div.innerHTML = messageHtml
        overlay.appendChild(div)
    }

    function injectOverlay(zIndex) {
        if( zIndex === undefined ) {
            zIndex = DEFAULT_Z_INDEX
        }
        var overlay = document.createElement('div')
        overlay.id = overlayId
        overlay.style.display = "block"
        overlay.style.position = "fixed"
        overlay.style.top = "0"
        overlay.style.left = "0"
        overlay.style.width = "100%"
        overlay.style.height = "100%"
        overlay.style.pointerEvents = "none"
        overlay.style.backgroundColor = "white"
        overlay.style.zIndex = String(zIndex)

        // Add arrows
        appendArrow( overlay, "10%" )
        appendArrow( overlay, "45%" )
        appendArrow( overlay, "80%" )

        appendMessage( overlay, self.messageHtml )

        document.body.insertBefore( overlay, document.body.childNodes[0] );
    }

    function hide() {
        var overlay = document.getElementById(overlayId)
        if( overlay ) {
            overlay.parentNode.removeChild(overlay)
            console.log( "Allow camera overlay removed")
        }
        if( timer ) {
            clearInterval( timer )
            timer = null
            console.log( "Animating arrows stopped")
        }
    }

    function isCurrenFrameReady(videoElement) {
        return videoElement && videoElement.readyState >= 2
    }

    function show(videoElement, zIndex) {

        // Already showing
        if( document.getElementById(overlayId) ) {
            return
        }

        hide()

        if( isCurrenFrameReady(videoElement) ) {
            return
        }

        injectOverlay(zIndex)

        var opacity = 1
        var last = null
        var speed = 1.2
        var sign = 1
        var arrows = document.querySelectorAll('div[name="'+arrowName+'"]')

        function step() {
            if( isCurrenFrameReady(videoElement) ) {
                hide()
                return
            }

            // Animation
            if( !last ) {
                last = new Date().getTime()
            }
            var now = new Date().getTime()
            var delta = (now - last) / 1000  // in seconds
            last = now
            opacity += delta * speed * sign
            if( opacity > 1 ) {
                opacity = 1
                sign = -sign
            }
            else if( opacity < 0.2 ) {
                opacity = 0.2
                sign = -sign
            }
            for (i = 0; i < arrows.length; ++i) {
                arrows[i].style.opacity = opacity 
            }
        }

        timer = setInterval( step, 40 )
        console.log( "Animating arrows started")
    }

    var self = {
        arrowSvg :
            '<svg width="100%" height="100%" viewBox="0 0 100 100">' +
                '<polygon points="50,0 100,50 75,50 75,100 25,100 25,50 0,50" style="fill:red;stroke:black;stroke-width:1" />' +
            '</svg>',
        show : show,
        hide : hide,
        messageHtml : // Default message
            '<div style="position:absolute; top:40%; width:100%; text-align:center">' +
            '    <h1>Please allow camera access.</h1>' +
            '</div>'
    }

    return self
}


// <div id="cameraPermission" style="display:none; position: absolute; top: 0; left:0; width:100%; height:100%; z-index:10; pointer-events:none; background-color:white" >

//   <!-- Draw the arrows -->
//   <div name="cameraPermissionArrow" style="position:absolute; top:0; left:10%; width:10%; height:10%; opacity:0.5">
//     <svg width="100%" height="100%" viewBox="0 0 100 100">
//       <polygon points="50,0 100,50 75,50 75,100 25,100 25,50 0,50" style="fill:red;stroke:black;stroke-width:1" />
//     </svg>
//   </div>
//   <div name="cameraPermissionArrow" style="position:absolute; top:0; left:45%; width:10%; height:10%; opacity:0.5">
//     <svg width="100%" height="100%" viewBox="0 0 100 100">
//       <polygon points="50,0 100,50 75,50 75,100 25,100 25,50 0,50" style="fill:red;stroke:black;stroke-width:1" />
//     </svg>
//   </div>
//   <div name="cameraPermissionArrow" style="position:absolute; top:0; left:80%; width:10%; height:10%; opacity:0.5">
//     <svg width="100%" height="100%" viewBox="0 0 100 100">
//       <polygon points="50,0 100,50 75,50 75,100 25,100 25,50 0,50" style="fill:red;stroke:black;stroke-width:1" />
//     </svg>
//   </div>
//   <!-- /Draw the arrows -->

//   <!-- Message asking for camera permission -->
//   <div style="position:absolute; top:40%; width:100%; text-align:center">
//     <h1>Please allow camera access.</h1>
//   </div>
//   <!-- /Message asking for camera permission -->

// </div>

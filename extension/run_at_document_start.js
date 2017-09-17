
// Adds an invisible div that indictates the xlabs extension is installed.
(function() {

    // The flag that indicates at least one of the xlabs extensions is installed.
    document.documentElement.setAttribute( 'data-xlabs-extension', 1 );
    document.documentElement.setAttribute( 'data-xlabs-extension-ready', 0 );
    document.documentElement.setAttribute('reaction', 'neutral')

    var manifest = chrome.runtime.getManifest();
    switch( manifest.short_name ) {
        case( "xLabs" ):
            var attr = 'data-xlabs-extension-version';
            break;
        case( "EyesDecide" ):
            var attr = 'data-eyesdecide-extension-version';
            break;
        default:
            throw "Unknown short_name: " + manifest.short_name;
    }

    document.documentElement.setAttribute( attr, manifest.version );

})();


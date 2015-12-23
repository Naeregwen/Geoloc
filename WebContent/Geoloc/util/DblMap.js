    var map_moving = 0;
    var map2_moving = 0;
    var DblMap1;
    var DblMap2;
    var map1type;
    var sat1type;
    var map2type;
    var sat2type;

      function makeLink() {
        var a="http://www.econym.demon.co.uk/googlemaps/examples/compare.htm?ll=";
        a += DblMap1.getCenter().toUrlValue() + "&zoom=" + DblMap1.getZoom();
        a += "&one=" + mapcodes[oneIndex] + "&two=" + mapcodes[twoIndex];
        document.getElementById("link").innerHTML = '<a href="' +a+ '">Link to this page</a>';
      }

      
      function maptype1(opt) {
        var i = opt;
        oneIndex= i;
        if (i<7) {//                      remember to change this line when a new satelite set is released
          DblMap1.satver = maps[i];
          //DblMap1.setMapType(G_NORMAL_MAP);
          DblMap1.setMapType(sat1type);
        } else {
          DblMap1.mapver = maps[i];
          DblMap1.setMapType(map1type);
        }
        makeLink();
      }
      
      function maptype2(opt) {
        var i = opt;
        twoIndex= i;
        if (i<7) {//                      remember to change this line when a new satelite set is released
          DblMap2.satver = maps[i];
          //DblMap1.setMapType(G_NORMAL_MAP);
          DblMap2.setMapType(sat2type);
        } else {
          DblMap2.mapver = maps[i];
          DblMap2.setMapType(map2type);
        }
        makeLink();
      }

      var maps = ["v=3","v=8","v=9","v=10","v=11","v=12","v=13",
                  "v=ap.31",
                  "v=w2.29","v=w2.33"];
                  
      var mapcodes =["s3","s8","s9","s10","s11","s12","s13",
                     "t31",
                     "n29","n33"];
    


      // Set some defaults
      var lat = 57;
      var lng = -3;
      var zoom = 8;
      var oneIndex=1;
      var twoIndex=6;           //                      remember to change this line when a new satelite set is released

      


  function loadDblMap() {
    
    if (GBrowserIsCompatible()) {

       // Get the passed arguments, if any
      var query = location.search.substring(1);
      var pairs = query.split("&");
      for (var i=0; i<pairs.length; i++) {
	var pos = pairs[i].indexOf("=");
	var argname = pairs[i].substring(0,pos).toLowerCase();
	var value = pairs[i].substring(pos+1).toLowerCase();
        if (argname == "lat") {lat = parseFloat(value);}
        if (argname == "lng") {lng = parseFloat(value);}
        if (argname == "ll") {
          var bits = value.split(",");
          lat = parseFloat(bits[0]);
          lng = parseFloat(bits[1]);
        }
        if (argname == "zoom") {zoom = parseInt(value);}
        if (argname == "one") {
          for (var j=0; j<mapcodes.length; j++) {if(value == mapcodes[j]) {oneIndex = j;}}
        }
        if (argname == "two") {
          for (var j=0; j<mapcodes.length; j++) {if(value == mapcodes[j]) {twoIndex = j;}}
        }
      }
       // Set the select boxes
      document.getElementById("mt1").firstChild.selectedIndex = oneIndex;
      document.getElementById("mt2").firstChild.selectedIndex = twoIndex;
      
      Sat1GetTileUrl=function(a,b){
        var c=Math.pow(2,b);
        var d=a.x;
        var e=a.y;
        var f="t";
          for(var g=0;g<b;g++){
            c=c/2;
            if(e<c){
              if(d<c){
                f+="q"
              }
              else{
                f+="r";
                d-=c
              }
            }
          else{
            if(d<c){
              f+="t";
              e-=c
            }
            else{
              f+="s";
              d-=c;
              e-=c
            }
          }
        }
        var server=(a.x+a.y)%4;
        return "http://kh" +server +".google.com/kh?n=404&"+DblMap1.satver+"&t="+f
      }

      Sat2GetTileUrl=function(a,b){
        var c=Math.pow(2,b);
        var d=a.x;
        var e=a.y;
        var f="t";
          for(var g=0;g<b;g++){
            c=c/2;
            if(e<c){
              if(d<c){
                f+="q"
              }
              else{
                f+="r";
                d-=c
              }
            }
          else{
            if(d<c){
              f+="t";
              e-=c
            }
            else{
              f+="s";
              d-=c;
              e-=c
            }
          }
        }
        
        var server=(a.x+a.y)%4;
        return "http://kh" +server +".google.com/kh?n=404&"+DblMap2.satver+"&t="+f
      }


      Map1GetTileUrl=function(a,b){
        b=this.maxResolution()-b;
        var server=(a.x+a.y)%4;
        return "http://mt" +server+ ".google.com/mt?n=404&" +DblMap1.mapver+ "&x="+a.x+"&y="+a.y+"&zoom="+b
      }

      
      Map2GetTileUrl=function(a,b){
        b=this.maxResolution()-b;
        var server=(a.x+a.y)%4;
        return "http://mt" +server+ ".google.com/mt?n=404&" +DblMap2.mapver+ "&x="+a.x+"&y="+a.y+"&zoom="+b
      }

      
      var sat1tilelayers = [new GTileLayer(new GCopyrightCollection(""),0,19)];
      sat1tilelayers[0].getTileUrl = Sat1GetTileUrl;
      sat1tilelayers[0].getCopyright = function(a,b) {
        return G_SATELLITE_MAP.getTileLayers()[0].getCopyright(a,b);
      }
      var q={shortName:"Sat",urlArg:"k",textColor:"white",linkColor:"white",errorMessage:_mSatelliteError};
      sat1type = new GMapType(sat1tilelayers, new GMercatorProjection(20), "Satellite", q);


      var map1tilelayers = [new GTileLayer(new GCopyrightCollection(""),0,17)];
      map1tilelayers[0].getTileUrl = Map1GetTileUrl;
      map1tilelayers[0].getCopyright = function(a,b) {
        return G_NORMAL_MAP.getTileLayers()[0].getCopyright(a,b);
      }
      var q={shortName:"Map",urlArg:"m",textColor:"black",linkColor:"blue",errorMessage:_mMapError};
      map1type = new GMapType(map1tilelayers, new GMercatorProjection(20), "Map", q);




      var sat2tilelayers = [new GTileLayer(new GCopyrightCollection(""),0,19)];
      sat2tilelayers[0].getTileUrl = Sat2GetTileUrl;
      sat2tilelayers[0].getCopyright = function(a,b) {
        return G_SATELLITE_MAP.getTileLayers()[0].getCopyright(a,b);
      }
      var q={shortName:"Sat",urlArg:"k",textColor:"white",linkColor:"white",errorMessage:_mSatelliteError};
      sat2type = new GMapType(sat2tilelayers, new GMercatorProjection(20), "Satellite", q);


      var map2tilelayers = [new GTileLayer(new GCopyrightCollection(""),0,17)];
      map2tilelayers[0].getTileUrl = Map2GetTileUrl;
      map2tilelayers[0].getCopyright = function(a,b) {
        return G_NORMAL_MAP.getTileLayers()[0].getCopyright(a,b);
      }
      var q={shortName:"Map",urlArg:"m",textColor:"black",linkColor:"blue",errorMessage:_mMapError};
      map2type = new GMapType(map2tilelayers, new GMercatorProjection(20), "Map", q);



      DblMap1 = new GMap2(document.getElementById("DblMap1"), {draggableCursor:"pointer",draggingCursor:"crosshair"});
      DblMap2 = new GMap2(document.getElementById("DblMap2"), {draggableCursor:"pointer",draggingCursor:"crosshair"});
      
      DblMap1.satver="v=7";
      DblMap2.satver="v=5";
      
      DblMap1.addMapType(sat1type);
      DblMap1.addMapType(map1type);
      DblMap2.addMapType(sat2type);
      DblMap2.addMapType(map2type);
      
      
      DblMap1.addControl(new GLargeMapControl());
      DblMap2.addControl(new GLargeMapControl());

      DblMap1.setCenter(new GLatLng(lat,lng), zoom);
      DblMap2.setCenter(new GLatLng(lat,lng), zoom);
      maptype1(oneIndex);
      maptype2(twoIndex);
      DblMap1.setCenter(new GLatLng(lat,lng), zoom);
      DblMap2.setCenter(new GLatLng(lat,lng), zoom);
      makeLink();

      // This function handles what happens when the first map moves
      function Move(){
        map2_moving = true;
	if (map_moving == false) {
	  DblMap2.setCenter(DblMap1.getCenter());
          if (DblMap1.getZoom() != DblMap2.getZoom()) {
            DblMap2.setZoom(DblMap1.getZoom());
          }
	}
	map2_moving = false;
        makeLink();
      }
      // This function handles what happens when the mini map moves
      // If we arent moving it (i.e. if the user is moving it) move the main map to match
      // and reposition the crosshair back to the centre
      function MMove(){
        map_moving = true;
	if (map2_moving == false) {
	  DblMap1.setCenter(DblMap2.getCenter());
          if (DblMap1.getZoom() != DblMap2.getZoom()) {
            DblMap1.setZoom(DblMap2.getZoom());
          }
	}
	map_moving = false;
        makeLink();
      }
      
      // Listen for when the user moves either map
      GEvent.addListener(DblMap1, 'moveend', Move);
      GEvent.addListener(DblMap2, 'moveend', MMove);
      
    }      
    
    // display a warning if the browser was not compatible
    else {
      alert("Sorry, the Google Maps API is not compatible with this browser");
    }
  }

    // This Javascript is based on code provided by the
    // Blackpool Community Church Javascript Team
    // http://www.commchurch.freeserve.co.uk/   
    // http://www.econym.demon.co.uk/googlemaps/

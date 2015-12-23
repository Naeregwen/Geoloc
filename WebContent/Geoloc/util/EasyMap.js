/*
	Copyright (c) 2004-2006, The Dojo Foundation
	All Rights Reserved.

	Licensed under the Academic Free License version 2.1 or above OR the
	modified BSD license. For more information on Dojo licensing, see:

		http://dojotoolkit.org/community/licensing.shtml
*/

/*
 * Naeregwen
 * D�cembre 2006
 *
 * Reprise compl�te du composant (widget)
 * Au premier chargement, Il faut :
 * - la librairie dojo, optimis�e
 * - la carte google et sa cl�
 * - les marqueurs de l'application et du cache
 */

dojo.provide("dojo.widget.EasyMap");
dojo.require("dojo.math");
dojo.require("dojo.uri.Uri");
dojo.require("dojo.widget.HtmlWidget");
//dojo.require("dojo.storage.*");

(function(){
	var gkey = djConfig.gMapKey||djConfig.googleMapKey;

	//	the Google API key mechanism sucks.  We're hardcoding here for love and affection but I don't like it.
	var uri=new dojo.uri.Uri(window.location.href);
	if(uri.host=="localhost"){
		// Cle de test locale : http://localhost:8080/Ajax/Geoloc/
		gkey="ABQIAAAA3FH-BKg2mGcp5YztCmcy-hTGaR88YyAmduRJbbrvXBsMjJfIURSUBVt02n3icrE6I8bKt_4mrikRUg";
	} else if (uri.host=="file") {
		// Cle de test locale : http://localhost:8080/Ajax/Geoloc/
		gkey="ABQIAAAA3FH-BKg2mGcp5YztCmcy-hTGaR88YyAmduRJbbrvXBsMjJfIURSUBVt02n3icrE6I8bKt_4mrikRUg";
	}

	if(!dojo.hostenv.post_load_){
		if(!gkey || gkey===""){
			dojo.raise("dojo.widget.EasyMap: The Google Map widget requires a proper API key in order to be used.");
		}
		var tag = "<scr"+"ipt src='http://maps.google.com/maps?file=api&amp;v=2&amp;key="+gkey+"'></scri"+"pt>";
		if(!dj_global.GMap2){
			document.write(tag);
		}
	}else{
		dojo.debug("Cannot initialize Google Map system after the page has been loaded! Please either manually include the script block provided by Google in your page or require() the GoogleMap widget before onload has fired.");
	}
})();

	/**********************************
	 *                                *
	 * Construction et initialisation *
	 *                                *
	 **********************************/

dojo.widget.defineWidget(
	"dojo.widget.EasyMap",
	dojo.widget.HtmlWidget,
	function(){
		// summary: A widget that wraps the Google Map API.
		// description:
		//		Implements and wraps the Google Map API so that you can easily create
		//		and include Google Maps in your Dojo application.  Will parse an included
		//		table for point information, but also exposes the underlying map via the
		//		map property.
		// map: GMap2
		//		The actual Google Map object.
		// geocoder: GClientGeocoder
		//		A reference to the Google Geocoder object, for getting points for addresses.
		// markers: Object[]
		//		Array of generated points plotted on the map
		this.map = null;
		this.minimap = null;
		this.geocoder = null;
		this.geocache = null;
		// Les marqueurs
		this.markers = [];         // Tableau des marqueurs
		this.currentMarker = null; // Marqueur courant
		this.cluster = null;
		// Les icones
		this.icons = [];
		this.iconType = 'base';
		// div des tooltips
      	this.tooltip = document.createElement("div");
      	// div des suggestions
      	this.suggest = null;
		// Les controles de la carte
		this.CtrlZoom = null;      // Controles predefinis de google
		this.CtrlType = null; 
		this.CtrlMini = null;      
		this.CtrlCtrl = null;      // Controles personnalis�s
		this.CtrlEdit = null; 
		this.CtrlDblClick = null;
		this.GZoom = null;  
		this.Keyboard = null;
		this.miniMapCount = 0;

		this.accuracyLevel = [
			'aucune (Lieu inconnu 0/8)',           // Unknown location. (Since 2.59)
			'au niveau pays (1/8)',                // Country level accuracy. (Since 2.59)
			'au niveau r�gion (2/8)',              // Region (state, province, prefecture, etc.) level accuracy. (Since 2.59)
			'au niveau d�partemenal (3/8)',        // Sub-region (county, municipality, etc.) level accuracy. (Since 2.59)
			'au niveau ville (4/8)',               // Town (city, village) level accuracy. (Since 2.59)
			'au niveau code postal (5/8)',         // Post code (zip code) level accuracy. (Since 2.59)
			'au niveau rue (6/8)',                 // Street level accuracy. (Since 2.59)
			'au niveau intersection de rue (7/8)', // Intersection level accuracy. (Since 2.59)
			'au niveau adresse (8/8)'              // Address level accuracy. (Since 2.59)
		];
		this.geocoderStatus = [
			{ code : 200, msg : 'Succ%E8s' },
			{ code : 500, msg : 'Erreur du serveur g%E9ographique. Veuillez r%E9essayer plus tard.' },
			{ code : 601, msg : 'Adresse manquante' },
			{ code : 602, msg : 'Adresse inconnue' },
			{ code : 603, msg : 'Adresse non disponible' },
			{ code : 610, msg : 'Cl%E9 googlemaps non valide'}
		];

		this.userMessages = [];
		this.userMessages.BONJOUR = 'Bonjour';
		this.userMessages.NEW_MARKER = 'Nouveau marqueur';
		this.userMessages.GIVE_DETAILS = unescape('Essayer de modifier l\'adresse en donnant plus ou moins d\'informations.\n(a%E9roport orly, France ou Paris, texas).');
		this.userMessages.CONFIRM_MOVE1 = 'Ce marqueur comporte une adresse :';
		this.userMessages.CONFIRM_MOVE2 = 'Voulez vous le supprimer ?';
		this.userMessages.CONFIRM_CACHE_RESET = unescape('Voulez vous vider le cache du g%E9ocodeur ?');
		this.userMessages.INVALID_ADDRESS = 'l\'adresse n\'est pas valide';
		this.userMessages.ADDRESS_ISEMPTY = '\'adresse est vide';
		this.userMessages.ADDRESS_NOT_FOUND = 'adresse introuvable';
		this.userMessages.ADDRESS_ALREADY_EXISTS = unescape('Impossible de modifier l\'adresse du marqueur marqueur.\nIl existe un autre marqueur avec la m%EAme adresse');
		this.userMessages.MARKER_ALREADY_EXISTS = unescape('Impossible de d%E9placer le marqueur, il existe un autre marqueur avec la m%EAme position');
		this.userMessages.ERR_CREATE_GEOCODER = unescape('Un probl%E8me est survenu lors de la cr%E9ation du g%E9ocodeur.\nLa recherche d\'adresse ne sera pas possible durant cette session.\nSinon, veuillez r%E9essayer plus tard.');		
		this.userMessages.ERR_CREATE_CACHE = unescape('Un probl%E8me est survenu lors de la cr%E9ation du cache du g%E9ocodeur.\nLa recherche d\'adresse sera moins rapide durant cette session.\nSinon, veuillez r%E9essayer plus tard.');
		this.userMessages.ERR_CREATE_CLUSTER = unescape('Un probl%E8me est survenu lors de la cr%E9ation du gestionnaire de grappes de marqueurs du g%E9ocodeur.\nL\'affichage sera moins rapide durant cette session.\nSinon, veuillez r%E9essayer plus tard.');
		
		// Options de l'application
		
		// Options modifiables par l'utilisateur
		this.ctrlmap = true;       // Determine si les controles de la carte sont affiches ou masques
		this.editmap = false;      // Determine le mode d'interaction avec la carte
		this.zoommap = false;      // Determine si les double clic provoque des zooms (double clic gauche : zoom avant, double clic droit : zoom arriere) 
		this.infomap = false;      // Determine si une bulle d'informations est en cours d'affichage sur un marqueur 
		this.zoomLevel = 13;
		this.bStickyZoom = false;       // Determine si le mode zoom est temporaire (false) ou persistant (true)
				
		// Options internes de l'application
		this.markersSortOrder = true;   // Ordre de tri de la liste des marqueurs : true = ascendant, false = descendant
		this.countriesSortOrder = true; // Ordre de tri de la liste des pays : true = ascendant, false = descendant
		this.indxtab = 0;          // Index de l'onglet selectionne dans la fenetre info 
		this.fullmap = false;      // Determine si la carte est affichee sur toute la largeur de l'ecran ou non 

	},
{
	templatePath: null,
	templateCssPath: null,
	isContainer: false,

	_defaultPoint: {lat:48.836055, lng: 2.291815},

	setControls: function() {
		//	summary
		//	Set any controls on the map in question.
	    this.map.addControl(this.CtrlZoom = new GLargeMapControl());
	    this.map.addControl(this.CtrlType = new GMapTypeControl());
	    this.map.addControl(this.CtrlMini = new GOverviewMapControl());
	    this.map.addControl(this.CtrlCtrl = new MapCtrlControl(this.map));
	    this.map.addControl(this.CtrlEdit = new MapEditControl(this.map));
	    this.map.addControl(this.CtrlDblClick = new MapDblClickControl(this.map));    
	    this.map.addControl(this.GZoom = new GZoomControl({sColor:'#000',nOpacity:0.3,sBorder:'1px solid yellow'}), new GControlPosition(G_ANCHOR_TOP_LEFT,new GSize(47,7)));
	    this.map.enableContinuousZoom();
	},
	
	initialize: function (/* object */args, /* object */frag) {
		//	summary
		//	initializes the widget
		// Create a base icon for all of our markers that specifies the
		// shadow, icon dimensions, etc.
		this.icons = {
			base : new GIcon(),
			loc  : new GIcon(),
			gLoc : new GIcon()
		};
		this.icons.base.image = "icons/Goutte.png";
		this.icons.base.shadow = "icons/OmbreGoutte.png";
		this.icons.base.iconSize = new GSize(40, 40);
		//this.icons.base.iconSize = new GSize(22, 34);
		//this.icons.base.shadowSize = new GSize(34, 22);
		this.icons.base.shadowSize = new GSize(40, 40);
		//this.icons.base.iconAnchor = new GPoint(9, 34);
		this.icons.base.iconAnchor = new GPoint(15, 40);
		this.icons.base.infoWindowAnchor = new GPoint(9, 2);
		this.icons.base.infoShadowAnchor = new GPoint(18, 25);			

		this.icons.loc.image = "icons/Maison.png";
		this.icons.loc.shadow = "";
		this.icons.loc.iconSize = new GSize(40, 40);
		//this.icons.loc.shadowSize = new GSize(34, 22);
		this.icons.loc.iconAnchor = new GPoint(9, 34);
		this.icons.loc.infoWindowAnchor = new GPoint(9, 2);
		this.icons.loc.infoShadowAnchor = new GPoint(18, 25);			

		this.icons.gLoc.image = "icons/GroupeMaison.png";
		this.icons.gLoc.shadow = "";
		this.icons.gLoc.iconSize = new GSize(40, 40);
		//this.icons.gLoc.shadowSize = new GSize(34, 22);
		this.icons.gLoc.iconAnchor = new GPoint(9, 34);
		this.icons.gLoc.infoWindowAnchor = new GPoint(9, 2);
		this.icons.gLoc.infoShadowAnchor = new GPoint(18, 25);		
		
	},
	
	postCreate: function() {
		//	summary
		//	Sets up and renders the widget.

		//	clean the domNode before creating the map.
		while (this.domNode.childNodes.length>0) { this.domNode.removeChild(this.domNode.childNodes[0]); }
		if (this.domNode.style.position != "absolute") { this.domNode.style.position = "relative"; }
		// Cr�er les objets n�cessaires � l'application
		try {
			this.map = new GMap2(this.domNode);
			this.map.setCenter(new GLatLng(this._defaultPoint.lat, this._defaultPoint.lng), 4);
			this.Keyboard = new GKeyboardHandler(this.map);
			try { 
				this.geocoder = new GClientGeocoder(); 
				try { 
					this.geocoder.setCache(this.geocache = new MapCache()); 
					try {
						this.cluster = new Clusterer( this.map );
						//this.cluster.SetMaxVisibleMarkers(5); //lets you change the threshold marker count where clustering kicks in. The default is 150 markers.
						this.cluster.SetMinMarkersPerCluster(2);
					} catch (ex) { 
						alert (this.userMessages.ERR_CREATE_CLUSTER + '\n\n' + ex); 
					}
				} catch (ex) {
					alert (this.userMessages.ERR_CREATE_CACHE + '\n\n' + ex); 
				}
			} catch (ex) { 
				alert (this.userMessages.ERR_CREATE_GEOCODER + '\n\n' + ex); 
			}
		} catch (ex) {}
		
		this.setControls();
		
		this.populate();
		//this._printProviderMetadata();
		// Attacher les �v�nements � la carte elle m�me  
		var self = this;
	    GEvent.addListener(this.map, "click", function(marker, point) {
	    	self.suggest.popup.hide();
	  		if (self.editmap && !marker) { self.currentMarker = self.plot(self.createMarker(point, null, null, "onMap", null, true), self.userMessages.NEW_MARKER); }
			else if (!marker && self.infomap) { self.infomap = false; }
	    });

		// Attacher le selecteur de precision des coordonn�es		
		GEvent.addListener(this.map, "mousemove", function(point){
			var latLng = "";
			for (var precision = 6; precision > 1; precision --) {
				latLng = point.lat().toFixed(precision) + ' (lat), (lng) ' + point.lng().toFixed(precision);
				//FF et IE			
				document.getElementById("PrecisionSelector").options[6-precision].text = latLng;
				document.getElementById("PrecisionSelector").options[6-precision].value = latLng;
			}
		});

	    // singlerightclick  
		GEvent.addDomListener(this.map, "contextmenu", function(point) {
			dojo.debug("Context");
		});  
	    // Gestion du zoom par roulette de la souris
	    this.connectWheel();
		// Attacher les �v�nements � la bulle d'informations  
	    GEvent.addListener(this.map.getInfoWindow(), "maximizeend", function() {
			//document.getElementById('modifiableAddress').value = self.markers[self.getMarkerTabIndex(self.currentMarker)].address;    		
		});		
      // Cr�ation du div des tooltips
      this.map.getPane(G_MAP_FLOAT_PANE).appendChild(this.tooltip);
      this.tooltip.style.visibility="hidden";
      // Cr�ation de l'objet de suggestion
      this.suggest = new LocalSuggest("adresseDemandee", dojo.widget.byId('EasyMap').getCities);      
	},
	
	populate: function() {
		var self = this;		
		try { 
		// Chargement des marqueurs au format json 
		// (7% plus rapide que xml : http://www.econym.demon.co.uk/googlemaps/basic12.htm)		
		// Ca se justifie dans le sens o� json est natif � javascript,
		// mais � condition que le navigateur impl�mente ce format de mani�re efficace
	  		dummy = new GDownloadUrl("datas/marqueurs.json", function (data, code) {
		  		var jsonData = eval ('(' + data + ')');
		        // Cr�er les marqueurs
		        for (var i = 0; i < jsonData.markers.length; i++) {
					self.createMarker(
			            new GLatLng(
			            jsonData.markers[i].Placemark[0].Point.coordinates[1], 
			            jsonData.markers[i].Placemark[0].Point.coordinates[0]), 
						jsonData.markers[i].Placemark[0].address, jsonData.markers[i].Placemark[0].type, 
						jsonData.markers[i].store, jsonData.markers[i], false);	
		        }		        
				// Si la liste des marqueurs est vide, 
				if (self.markers.length === 0) { 
					// Alors la masquer			
					self.toggleMarkersList(true); 
				} else { 
					// Effacer tous les elements superpos�s � la carte (marqueurs et autres)
					self.map.clearOverlays();
					// Afficher les marqueurs sur la carte
					self.render('all');
					// Trier la liste des marqueurs
					sortSelectList('markersList', self.markersSortOrder, null); 
				}
			});
		} catch (e) { }		
	},
	
	/**************
	 *            *
	 * Affichage  *
	 *            *
	 **************/

	render: function(markerType) {
		//	summary
		//	Plots all actual points in the current markers array.
		if (this.markers.length === 0) {
			this.map.setCenter(new GLatLng(this._defaultPoint.lat, this._defaultPoint.lng), 4);
			return;
		}
		//  Add all overlays
		for (i in this.markers) {
			if (markerType == 'all' || markerType == this.markers[i].type) {
				this.plot(this.markers[i].marker, this.markers[i].address);
			}
		}
	},
	
	plot: function(marker, address) {
		//this.map.addOverlay(marker);
		this.cluster.AddMarker( marker, address );
		return marker;
	},

	/** This is high-level function.
	 * It must react to delta being more/less than zero.
	 */
	handle: function (delta) {		
		if (delta < 0)
			{ this.map.setZoom(this.map.getZoom() - 1); }
		else
			{ this.map.setZoom(this.map.getZoom() + 1); }
	},

	/** This is high-level function.
	 * It must react to delta being more/less than zero.
	 */
	handleMiniMap: function (delta) {		
		if (delta < 0)
			{ this.minimap.setZoom(this.minimap.getZoom() - 1); }
		else
			{ this.minimap.setZoom(this.minimap.getZoom() + 1); }
	},

	/** Event handler for mouse wheel event.
	 */
	wheel: function (event){
	var self = dojo.widget.byId('EasyMap');
        var delta = 0;
        if (!event) /* For IE. */ { event = window.event; }
        if (event.wheelDelta) { /* IE/Opera. */
            delta = event.wheelDelta/120;
            /** In Opera 9, delta differs in sign as compared to IE.
             */
            if (window.opera) { delta = -delta; }
        } else if (event.detail) { /** Mozilla case. */
            /** In Mozilla, sign of delta is different than in IE.
             * Also, delta is multiple of 3.
             */
            delta = -event.detail/3;
        }
        /** If delta is nonzero, handle it.
         * Basically, delta is now positive if wheel was scrolled up,
         * and negative, if wheel was scrolled down.
         */
        if (delta) { self.handle(delta); }
        /** Prevent default actions caused by mouse wheel.
         * That might be ugly, but we handle scrolls somehow
         * anyway, so don't bother here..
         */
        if (event.preventDefault) { event.preventDefault(); }
		event.returnValue = false;
	},

	wheelOnMiniMap: function (event){
	var self = dojo.widget.byId('EasyMap');
        var delta = 0;
        if (!event) /* For IE. */ { event = window.event; }
        if (event.wheelDelta) { /* IE/Opera. */
            delta = event.wheelDelta/120;
            /** In Opera 9, delta differs in sign as compared to IE.
             */
            if (window.opera) { delta = -delta; }
        } else if (event.detail) { /** Mozilla case. */
            /** In Mozilla, sign of delta is different than in IE.
             * Also, delta is multiple of 3.
             */
            delta = -event.detail/3;
        }
        /** If delta is nonzero, handle it.
         * Basically, delta is now positive if wheel was scrolled up,
         * and negative, if wheel was scrolled down.
         */
        if (delta) { self.handleMiniMap(delta); }
        /** Prevent default actions caused by mouse wheel.
         * That might be ugly, but we handle scrolls somehow
         * anyway, so don't bother here..
         */
        if (event.preventDefault) { event.preventDefault(); }
		event.returnValue = false;
	},

	/** Initialization code. 
	 * If you use your own event management code, change it as required.
	 */
	connectWheel: function () {
		if (document.getElementById('EasyMap').addEventListener) {
			/** DOMMouseScroll is for mozilla. */
			document.getElementById('EasyMap').addEventListener('DOMMouseScroll', this.wheel, false);
		} else {
			/** IE/Opera. */
			document.getElementById('EasyMap').onmousewheel = this.wheel;
		}
	},

	connectWheelonMiniMap: function (map) {
		if (document.getElementById('EasyMap').addEventListener) {
			// DOMMouseScroll is for mozilla.
			map.addEventListener('DOMMouseScroll', this.wheel, false);
		} else {
			// IE/Opera. 
			map.onmousewheel = this.wheel;
		}
	},

	setStickyZoom: function(mode) { 
		if ( (this.bStickyZoom = mode) ) {
			document.getElementById('TimeGZoomLblP').blur();
			document.getElementById('PersistantZoom').checked = true;
		} else {
			document.getElementById('TimeGZoomLblT').blur();
			document.getElementById('TemporaryZoom').checked = true;
		}
		this.GZoom.setStickyMode(this.bStickyZoom);		
	},
	
	
	/****************
	 *              *
	 * Utilitaires  *
	 *              *
	 ****************/

	findCenter:function(/* GLatLngBounds */bounds){
		//	summary
		//	Returns the center point given the Bounds object.
		if (this.markers.length === 1) {
			return (new GLatLng(
				this.markers[0].marker.getPoint().lat(), 
				this.markers[0].marker.getPoint().lng()));
		} 
		return (new GLatLng(
			(bounds.getNorthEast().lat() + bounds.getSouthWest().lat()) / 2,
			(bounds.getNorthEast().lng() + bounds.getSouthWest().lng()) / 2));		
	},
	
	/*************************
	 *                       *
	 * Gestion des marqueurs *
	 *                       *
	 *************************/

	createMarker: function(point, address, type, store, reply, withSort) {
		//	summary
		//	Creer un marqueur sur la carte et un objet associe dans la liste des marqueurs
		//  Lui associer ses gestionnaires d'�v�nements
		var stored = store.toLowerCase();
       	if ( stored === 'onmap' || stored === 'both') {
			var center = point || this.map.getCenter();
			var icon;
			switch (type) {
			case 'base': case 'loc' : 
			case 'gLoc': icon = this.icons[type]; break;
			default:     icon = this.iconType ? this.icons[type = this.iconType] : this.icons[type = 'base']; break;
			}
			var marker = new GMarker(center, {draggable: true, icon: icon});
			var markersList = document.getElementById("markersList");
			var option = document.createElement('option');
			option.alt = option.title = option.text = address || this.userMessages.NEW_MARKER;
			marker.tooltip = '<div class="tooltip">' + option.text + '</div>';			
			option.value = center.lat() + "@" + center.lng(); 
			// Ajout en fin de liste
			if ( !type || type === null ) { type = 'base'; }
			try { // W3C
				markersList.add(option, null); 
			} catch (e) { // IE
				markersList.add(option, markersList.length);
			} finally {
				this.markers [ this.markers.length ] = { marker : marker, address : option.text, type : type, value : option.value };
				markersList.selectedIndex = markersList.length - 1;
				// Attacher les �v�nements au nouveau marqueur			
				var self = this;
				// Click principal
				GEvent.addListener(marker, "click", function() {
					self.tooltip.style.visibility = "hidden";
					if (self.editmap)
						{ self.deleteMarker(marker); }
					else { 
						self.select(marker);
						self.openInfos(self.currentMarker = marker); 
					}
				});
				// Drag'n'drop
				GEvent.addListener(marker, "dragstart", function() {
					self.tooltip.style.visibility = "hidden";
					self.currentMarker = marker;
					if ( self.infomap ) {
						self.indxtab = self.map.getInfoWindow().getSelectedTab();
						self.map.closeInfoWindow();
					}
				});		    
				GEvent.addListener(marker, "dragend", function() {
					self.showTooltip(marker);
					if ( self.currentMarker && self.infomap ) { self.openInfos(marker); }
				});
				// Zoom par double click
				GEvent.addListener(marker, "dblclick", function() {
					self.zoomOnMarker();					
				});
				
				// Tooltip
		        GEvent.addListener(marker,"mouseover", function() {
		        	self.showTooltip(marker);
		        });
		                
		        GEvent.addListener(marker,"mouseout", function() {
					self.tooltip.style.visibility = "hidden";
		        });        
			}
		}
		// Mise en cache du marqueur
		if (reply && (stored === 'incache' || stored === 'both')) {
			this.geocache.put(reply.Placemark[0].name, reply);
		}		
		// Tri de la liste des marqueurs		
		if (withSort) { sortSelectList('markersList', this.markersSortOrder, null); }
		// Si la liste etait vide avant la cr�ation de ce marqueur, alors l'afficher
		if (this.markers.length === 1) { this.toggleMarkersList(false); }
		// Le nouveau marqueur devient le marqueur courant
		this.currentMarker = marker;
		return marker;
	},
	
	deleteMarker: function (marker) {

		if (!marker) { marker = this.currentMarker; }
		var i = this.getMarkerTabIndex(marker);
		if ( i != -1 && this.markers[i].address.toLowerCase().search(/nouveau marqueur/) == -1 )
			{ if (!confirm(this.userMessages.CONFIRM_MOVE1 + "\n" + this.markers[i].address + "\n\n" + this.userMessages.CONFIRM_MOVE2) ) { return; } }
		for (i in this.markers) { if (this.markers[i].marker == marker) { break; } }
		if ( i >= this.markers.length ) { return; }
		var selectInvalid = false;
		var markersList = document.getElementById("markersList");
		for (j = 0; j < markersList.length; j++)  {
			if ( markersList.options[j].value == this.markers[i].value && markersList.options[j].innerHTML == this.markers[i].address) { 
				this.map.closeInfoWindow();
				//this.map.removeOverlay(marker);
				this.cluster.RemoveMarker( marker );
				if ( j == markersList.selectedIndex ) { selectInvalid = true; }
				markersList.options[j] = null;
				if ( selectInvalid && markersList.length ) { markersList.selectedIndex = markersList.length - 1; }
				this.markers.splice(i,1);
				delete marker;
				this.currentMarker = this.markers.length === 0 ? null : this.getSelectedMarker(); 				
			    break;
			}
		}
		// Si la liste est vide, la masquer
		if (this.markers.length === 0) { this.toggleMarkersList(true); }
	},
	
	isValidAddress: function (address) {
		// Verifier qu'un marqueur ne porte pas d�j� la m�me adresse
		formatedAddress = address.toLowerCase().trim();
		if (formatedAddress.length === 0) {
			alert(this.userMessages.ADDRESS_ISEMPTY);
			return false;
		}
		for (i in this.markers) { 
			if ( this.markers[i].marker != this.currentMarker && this.markers[i].address.toLowerCase().trim() == formatedAddress ) {
				alert(this.userMessages.ADDRESS_ALREADY_EXISTS);
				return false;
			}
		}
		return true;
	},
		
	modifyMarker: function () {
		var address = document.getElementById('adresse').value.trim();
		// Auto fermeture : une fonction de rappel (callback) externe � l'objet
		var self = dojo.widget.byId('EasyMap');
		// Modifier l'adresse du marqueur et la propager � ses �lements associ�s
		for (i in self.markers) { 
			if ( self.markers[i].marker == self.currentMarker) { 
				self.markers[i].address = address;
				self.markers[i].marker.tooltip = '<div class="tooltip">' + address + '</div>';
				var markersList = document.getElementById("markersList");
				for (j = 0; j < markersList.options.length; j++) {
					if ( markersList.options[j].value == self.markers[i].value ) {
						markersList.options[j].text = self.markers[i].address;
						break;
					}
				}
				break; 
			} 
		}
	},
			 
	// todo
	changeMarkerType: function (newType, button) {
		var marker = this.currentMarker;
		for (i in this.markers) { if (this.markers[i].marker == marker) { break; } }
		if ( i >= this.markers.length ) { return; }
		/*
		this.markers[i].type = newType;
		var selectInvalid = false;
		var markersList = document.getElementById("markersList");
		for (j = 0; j < markersList.length; j++)  {
			if ( markersList.options[j].value == this.markers[i].value ) { 
				this.map.closeInfoWindow();
				this.map.removeOverlay(marker);
				if ( j == markersList.selectedIndex ) { selectInvalid = true; }
				markersList.options[j] = null;
				if ( selectInvalid && markersList.length ) { markersList.selectedIndex = markersList.length - 1; }
				this.markers.splice(i,1);
				delete marker;
			    break;
			}
		}		
		*/
		if (button) { button.blur(); }
	},
	
	getMarkerTabIndex: function (marker) {
		for (i in this.markers) { if (this.markers[i].marker == marker) { return i; } }
		return -1;
	},  
	
	markerExistInTab:function (marker,  point) {
		for (i in this.markers) { 
			if (this.markers[i].marker && this.markers[i].marker != marker && 
				this.markers[i].marker.getPoint().equals(point)) { return true; }
		}
		return false;
	},    

	zoomOnMarker: function () {
		this.map.setZoom(this.zoomLevel);
		this.gotoSelectedMarker();		
	},

	repositionMarker: function (address) {
		if (address.toLowerCase().search(this.userMessages.NEW_MARKER.toLowerCase()) != -1 || address.toLowerCase().search("marqueur") != -1) 
			{ alert (this.userMessages.INVALID_ADDRESS); }
		else
			{ this.moveMarkerToAddress(address); }
	},

	moveMarkerToAddress: function (address) {
		var self = this;
		var point = this.geocoder.getLatLng(
		  	address, 
		  	function(point) {
				if (!point) {
			        alert(address + "\n" + self.userMessages.ADDRESS_NOT_FOUND);
				} else {
					if ( self.markerExistInTab(self.currentMarker, point) ) 
		  				{ alert(self.userMessages.MARKER_ALREADY_EXISTS); }
					else {
						self.map.setCenter(point, self.map.getZoom());
						self.currentMarker.setPoint(point);
						self.modifyMarker(address);
						self.infomap = true;
						self.openInfos(self.currentMarker);
					}
				}
			}
		);
	},
	
	openInfos: function(marker) {
	  if ( !marker ) { return; }
	  var point = marker.getPoint();
	  for (i in this.markers) { 
		  if (this.markers[i].marker == marker) {

		      var miniMapHTML = '<p style="text-align: left">';
		      var whichmini = "minimap" + this.miniMapCount;
		      miniMapHTML += '<div id="';
		      miniMapHTML += whichmini + '" style="width: 450px; height: 200px" align="center"></div>' + 
		      '<div align="center"><button type="button" onClick="dojo.widget.byId(\'EasyMap\').minimap.centerAndZoom(new GPoint('+ point.lng() + ',' + point.lat() + '), dojo.widget.byId(\'EasyMap\').minimap.getZoom())">Centrer</button></div>';    

			  var infoTabs = [
			    new GInfoWindowTab("Adresse", '<br/>'+
			    (this.markers[i].type ?
			    	'<img id="iconAddress" src="'+ this.icons[this.markers[i].type].image  +'"/>':
			    	'') + 
			    	
			    '<input type="text" id="adresse" size="60" value="' + this.markers[i].address + '"><br/><br/>'+
			    '<div align="center">'+
			    'Latitude = ' + point.lat() + ' , Longitude = ' + point.lng() + '<br/><br/>' +
				'<input type="button" onclick="dojo.widget.byId(\'EasyMap\').repositionMarker(document.getElementById(\'adresse\').value)" value="Repositionner le marqueur"/>&nbsp;' +
				/*
				'<button type="button" onClick="dojo.widget.byId(\'EasyMap\').changeMarkerType(\'base\', this)" alt="Transformer en marqueur simple" title="Transformer en marqueur simple" ><img src="icons/Goutte.png" style="width:16px; height:16px"/></button>' + 
				'<button type="button" onClick="dojo.widget.byId(\'EasyMap\').changeMarkerType(\'loc\',  this)" alt=\"Transformer en marqueur de lieu" title="Transformer en marqueur de lieu" ><img src="icons/Maison.png" style="width:16px; height:16px"/></button>' + 
				'<button type="button" onClick="dojo.widget.byId(\'EasyMap\').changeMarkerType(\'gLoc\', this)" alt=\"Transformer en marqueur de groupe" title="Transformer en marqueur de groupe" ><img src="icons/GroupeMaison.png" style="width:16px; height:16px"/></button>' + 
				*/
			    '<input type="button" onclick="dojo.widget.byId(\'EasyMap\').deleteMarker(null)" value="Supprimer le marqueur"/>'+
			    '</div>'),
			    new GInfoWindowTab("Mini carte", miniMapHTML)
			    ];
				marker.openInfoWindowTabsHtml(infoTabs, { selectedTab : this.indxtab == -1 ? this.indxtab = 0 : this.indxtab, maxUrl:'htm/infos.htm' });
	
			    this.minimap = new GMap(document.getElementById(whichmini));
			    this.minimap.centerAndZoom(this.markers[i].marker.getPoint(),1);
			   	this.minimap.addOverlay(new GMarker(this.markers[i].marker.getPoint()));
			    this.minimap.addControl(new GSmallMapControl());
			    this.minimap.addControl(new GMapTypeControl());
			    this.miniMapCount++;
			    // Gestion du zoom par roulette de la souris
			    //dojo.debugShallow(this.whichmini);
			    //dojo.debugShallow(this.minimap.kb[3]);
			    //this.connectWheelonMiniMap(this.whichmini);
	
				var div = document.getElementById('adresse');
			    var eip = new EditInPlace( div, 1, this.modifyMarker );
				this.infomap = true; 
			  break;
		  } 
	  }
	},		
	
    showTooltip: function (marker) {
      	this.tooltip.innerHTML = marker.tooltip;
		var point = this.map.getCurrentMapType().getProjection().fromLatLngToPixel(this.map.fromDivPixelToLatLng(new GPoint(0,0),true), this.map.getZoom());
		var offset = this.map.getCurrentMapType().getProjection().fromLatLngToPixel(marker.getPoint(),this.map.getZoom());
		var anchor = marker.getIcon().iconAnchor;
		var width = marker.getIcon().iconSize.width;
		var height = this.tooltip.clientHeight;
		var pos = new GControlPosition(G_ANCHOR_TOP_LEFT, new GSize(offset.x - point.x - anchor.x + width, offset.y - point.y -anchor.y -height)); 
		pos.apply(this.tooltip);
		this.tooltip.style.visibility="visible";
    },

	/*************************************
	 *                                   *
	 * Gestion de la liste des marqueurs *
	 *                                   *
	 *************************************/
	 
	toggleMarkersList: function (isEmpty) {
		// Masquer ou pas la liste
		document.getElementById('ZoneDesMarqueurs').style.display = isEmpty ? 'none' : 'block';
		// Afficher ou pas le message � la place
		document.getElementById('MessageListeMarqueurs').style.display = isEmpty ? 'block' : 'none';
		// Activer ou pas le bouton de commande d'affichage du mini clavier
		
		// Si la liste est vide, 
		if (isEmpty) { 
			toggleIndex(null); // Masquer le mini clavier 
			// Desactiver le bouton de commande d'affichage du mini clavier
			document.getElementById('cmdIndex').setAttribute('disabled', '');
		} else {
			document.getElementById('cmdIndex').removeAttribute('disabled');
		}
	},
	
	select: function (marker) {
		for (i in this.markers) { if (this.markers[i].marker == marker) { break; } }
		var markersList = document.getElementById('markersList');
		for (j = 0; j < markersList.length; j++)  {
			if ( markersList.options[j].value == this.markers[i].value && 
					markersList.options[j].innerHTML == this.markers[i].address) { 
				markersList.selectedIndex = j;
				this.currentMarker = marker;
				break;
			}
		}	
	},
	
	getSelectedMarker: function() {
		markersList = document.getElementById('markersList');
		for ( i in this.markers )  {
			if ( this.markers[i].value == markersList.options[markersList.selectedIndex].value ) {
				return this.markers[i].marker;
			}
		}
		return null;
	},
	
	gotoSelectedMarker: function () {
		var markersList = document.getElementById("markersList");
		if ( !markersList || !markersList.length || markersList.selectedIndex == -1 ) { return; }
		for (i in this.markers) { 
			if (this.markers[i].value == markersList.options[markersList.selectedIndex].value) { 
				break; 
			} 
		}
		if ( i >= this.markers.length ) { return; }
		this.currentMarker = this.markers[i].marker;
		this.map.closeInfoWindow(); 
		this.map.panTo(this.currentMarker.getPoint());
		this.openInfos(this.currentMarker);
		this.infomap = true;
	},
	
	gotoLetter: function (sel) {
		var letter = sel.value.toLowerCase();
		var markersList = document.getElementById('markersList');
		var suivant = -1;
		// Parcourir la liste du milieu � la fin
		for (i = markersList.selectedIndex + 1; i < markersList.length && suivant == -1; i++) { 
			if (markersList[i].innerHTML.charAt(0).toLowerCase() == letter) { 
				suivant = markersList.selectedIndex = i;
				break; 
			} 
		}
		// Parcourir la liste du d�but � la fin
		if ( suivant == -1 ) {
			for (i = 0; i < markersList.selectedIndex; i++) { 
				if (markersList[i].innerHTML.charAt(0).toLowerCase() == letter) { 
					suivant = markersList.selectedIndex = i;
					break;
				} 
			}
		}
		if ( suivant != -1 ) { this.gotoSelectedMarker(); }
	},

	getMarkerListIndexByCoordinates: function (point) {
		var markersList = document.getElementById("markersList");
		for (i = 0; i < markersList.length; i++)  {
			var coordinates = markersList[i].value.split('@');
			if ( (coordinates[0] == point.lat() && coordinates[1] == point.lng()) ) { return i; }
		}
		return -1;
	}, 

	getCities: function(debut, maxLinesNumber) {
	    var i, nom;
	    var result = [];
	    var markers = dojo.widget.byId('EasyMap').markers;
	    var lengthMax = markers.length;
	    if (maxLinesNumber) {
			lengthMax = Math.min(lengthMax, maxLinesNumber);
	    }
	    // Si on a du contenu, pas que du blanc
	    if (!debut.match(/^ *$/)) {
	      for (i = 0 ; i < markers.length && result.length < lengthMax ; i++) {
	        nom = markers[i].address.toLowerCase();
	        if (nom.indexOf(debut.toLowerCase()) === 0) {
	          result.push(markers[i].address);
	        }
	      }
	    }
	    return result;
	},
	  
	/***********************
	 *                     *
	 * Navigation par pays *
	 *                     *
	 ***********************/
	 
	loadCountries: function() {
	    // Chargement des caract�ristiques des pays (coordonn�es globales et nom)
		//	clean the domNode before creating the map.
		var self = this;
		try {		
	  		dummy = new GDownloadUrl("datas/countries.xml", function (data, code) {
		        var xml = GXml.parse(data);
		        var countries = xml.documentElement.getElementsByTagName("country");
		        var countriesList = document.getElementById('countriesList');
				while (countriesList.childNodes.length>0) { countriesList.removeChild(countriesList.childNodes[0]); }
		        for (var i = 0; i < countries.length; i++) {
		        	// Chargement des pays dans la zone de selection
		        	option = document.createElement('option');
		        	option.text = countries[i].getAttribute("name");
					option.value = countries[i].getAttribute("lng") + ', ' + countries[i].getAttribute("lat") + ', ' + countries[i].getAttribute("zoom"); 
					// Ajout en fin de liste
					try { // W3C
						countriesList.add(option, null); 
					} catch (e) { // IE
						countriesList.add(option, countriesList.length);
					} 	
								
		        	// Conversion du xml en json pour insertion dans le g�ocache
		        	var country = 	{ 
						name:option.text, 
						store:"inCache",
						Status: {
							code: 200,
							request: "load"
						},
						Placemark: [{
							type: "countryTag",  
							fixed: "false",
							address: option.text,
							AddressDetails: {
								Accuracy: 8
							},
							Point: {
								coordinates: [countries[i].getAttribute("lng"), countries[i].getAttribute("lat"), 0]
							}
						}]
				  	};	
					// Mise en cache
					self.geocache.put(country.name, country);
			     }
				 // Si la liste etait vide avant, alors l'afficher
			     if (countriesList.length) { 
			     	countriesList.selectedIndex = 0;
					// Tri de la liste des marqueurs		
			     	sortSelectList('countriesList', self.countriesSortOrder, null);
			     	// Affichage de la liste 
			     	self.toggleCountriesList(false);
			     } else {
			     	self.toggleCountriesList(true);
			     }				 
			});
		} catch (e) { /* ne rien faire*/ }	
		document.getElementById('cmdLoadCountries').blur();
	},

    clearCountries: function () {
        var countriesList = document.getElementById('countriesList');
		while (countriesList.childNodes.length>0) { countriesList.removeChild(countriesList.childNodes[0]); }
		document.getElementById('cmdClearCountries').blur();
		this.toggleCountriesList(true);
    },
    
    toggleCountriesList: function(isEmpty) {
		// Masquer ou pas la liste
		document.getElementById('countriesList').style.display = isEmpty ? 'none' : 'block';
		// Afficher ou pas le message � la place
		document.getElementById('MessageListePays').style.display = isEmpty ? 'block' : 'none';
		// Si la liste est vide, 
		if (isEmpty) { 
			document.getElementById('cmdAscSortCountries').setAttribute('disabled', '');
			document.getElementById('cmdDescSortCountries').setAttribute('disabled', '');
			document.getElementById('cmdLoadCountries').removeAttribute('disabled');
			document.getElementById('cmdClearCountries').setAttribute('disabled', '');
		} else {
			document.getElementById('cmdAscSortCountries').removeAttribute('disabled');
			document.getElementById('cmdDescSortCountries').removeAttribute('disabled');
			document.getElementById('cmdLoadCountries').setAttribute('disabled', '');
			document.getElementById('cmdClearCountries').removeAttribute('disabled');
		}
    },
    
	gotoCountry: function() {
        var countriesList = document.getElementById('countriesList');
        lng = parseFloat(countriesList.value.split(",")[0]);
		lat = parseFloat(countriesList.value.split(",")[1]);
		scale = parseInt(countriesList.value.split(",")[2], 10);
		this.map.setCenter(new GLatLng(lat,lng),scale);
	},
	
	/*************
	 *           *
	 * G�ocodage *
	 *           *
	 *************/

	showResults: function (response) {
		var i, j;
		var complement = '';
		var map = dojo.widget.byId('EasyMap');
		if (!response || response.Status.code != 200 || response.Placemark.length === 0 ) {
			// Chercher la traduction du message d'erreur
		    for (i in map.geocoderStatus) { if (response.Status.code == map.geocoderStatus[i].code) { break; } }		    
			// Chercher le compl�ment du message d'erreur, si n�cessaire
			if ( i < map.geocoderStatus.length && ( map.geocoderStatus[i].code === 602 || map.geocoderStatus[i].code === 603 ) ) {
			    complement = map.userMessages.GIVE_DETAILS;
			}
		    alert("Adresse introuvable. (" + response.Status.code + 
			    (i < map.geocoderStatus.length ? ' : ' + unescape(map.geocoderStatus[i].msg): '') + ')' + 
			    	(complement !== '' ? '\n' + unescape(complement) : '') );
		} else {
			if (response.Placemark.length == 1) {
				// S'il n'existe aucun marqueur avec les m�mes coordonn�es, cr�er un nouveau marqueur
				var index ;
				if ( (index = map.getMarkerListIndexByCoordinates(new GLatLng(response.Placemark[0].Point.coordinates[1], response.Placemark[0].Point.coordinates[0]))) != -1 ) {
					document.getElementById('markersList').selectedIndex = index;
				} else {
					map.plot(map.createMarker(new GLatLng(response.Placemark[0].Point.coordinates[1], response.Placemark[0].Point.coordinates[0]), response.Placemark[0].address, null, "both", response, true), response.Placemark[0].address);									}
				// D�placer la carte vers ce marqueur
				map.gotoSelectedMarker();
			} else {
				var AddressesList = document.getElementById("AddressesList");
				// Suppression des �ventuelles options de choix pr�c�dentes
				while ( AddressesList.firstChild ) { AddressesList.removeChild(AddressesList.firstChild); } 
				// Ajout des nouvelles options de choix
				for (i = 0; i < response.Placemark.length; i++ ) {
					var option = document.createElement("option");
					var comments = 'Exactitude ' + map.accuracyLevel[response.Placemark[i].AddressDetails.Accuracy] +
						', latitude : ' + response.Placemark[i].Point.coordinates[1] +
						', longitude : ' + response.Placemark[i].Point.coordinates[0];
					option.setAttribute('value', response.Placemark[i].Point.coordinates[1] + '@' + response.Placemark[i].Point.coordinates[0]);	
					option.setAttribute('alt', comments);	
					option.setAttribute('title', comments);	
					option.innerHTML = response.Placemark[i].address;			
					AddressesList.appendChild(option);
				}
				AdressesTrouvees.show();				
			}
		}	
	},
	
	gotoSelectedNewAddress: function () {
		var AddressesList = document.forms.FormDlgAdresses.AddressesList;
		for (i = AddressesList.firstChild; i; i = i.nextSibling ) {
			if ( i.selected ) {
				var address = i.innerHTML;
				var coordinates = i.value.split('@');
				var index ;
				if ( (index = this.getMarkerListIndexByCoordinates(new GLatLng(coordinates[0], coordinates[1])))!= -1 ) {
					document.getElementById('markersList').selectedIndex = index;
				} else {
					this.plot(this.createMarker(new GLatLng(coordinates[0], coordinates[1]), address, null, "onMap", null, true), address);
				}
				this.gotoSelectedMarker();
				break;
			}
		}
		
	},
	
	getLocationsList: function (address) {
		this.geocoder.getLocations(address, this.showResults);
	},

	/*********************************
	 *                               *
	 * Gestion du cache du g�ocodeur *
	 *                               *
	 *********************************/

	resetCache: function () {
		if (confirm(this.userMessages.CONFIRM_CACHE_RESET)) { 
			this.startWork();
			this.geocache.reset(); 
			this.stopWork();
		}
	},
	
	initCache: function() {
		this.startWork();
		this.geocache.reset();
		try { 
			// Chargement des marqueurs au format json 
			var self = this;		
	  		dummy = new GDownloadUrl("datas/marqueurs.json", function (data, code) {
		  		var jsonData = eval ('(' + data + ')');
		        // peupler le cache
		        for (var i = 0; i < jsonData.markers.length; i++) {
					var stored = jsonData.markers[i].store.toLowerCase();
		        	if (stored == 'inCache' || stored == 'both') {
						self.geocache.put(jsonData.markers[i].Placemark[0].address, jsonData.markers[i]);		        	
		        	}
		        }
			});
		} catch (e) { 
		} finally {
			this.stopWork();
		}		
	},
	
	/**********************
	 *                    *
	 * Gestion des icones *
	 *                    *
	 **********************/
	 
	 toggleIconType: function(type, source) {
	 	
		 if (this.iconType == type && this.editmap) {
		 	// Mode insertion annul�
			dojo.widget.byId('EasyMap').CtrlEdit.cancelEdit();
			if (source) { 
				source.style.backgroundColor = '';
				source.blur(); 
			}
		 } else {
		     // Mode insertion forc�
			 switch (type) {
			 case 'base' : this.iconType = 'base'; break;
			 case 'loc'  : this.iconType = 'loc';  break;
			 case 'gLoc' : this.iconType = 'gLoc'; break;
			 default     : this.iconType = 'base'; break;					 
			 }
			 dojo.widget.byId('EasyMap').CtrlEdit.forceEdit();
			 if (source) { 
			 	this.clearEditButton();
			 	source.style.backgroundColor = 'red';
			 	source.blur(); 
			 }
			 // Annuler le mode zoom
			 dojo.widget.byId('EasyMap').CtrlDblClick.cancelDblClick();
	  		 dojo.widget.byId('optDblClick').setValue(false);
			 this.zoommap = false;
		 }
	 },
	 
	 clearEditButton: function() {
	 	for ( var element = document.getElementById('toolbar').firstChild; element; element = element.nextSibling ) {
	 		if (element.nodeName.toLowerCase() == 'button') {
	 			element.style.backgroundColor='';
	 		}
	 	}
	 },
	 
	 toggleEditButton: function() {
	 	for ( var element = document.getElementById('toolbar').firstChild; element; element = element.nextSibling ) {
	 		if (element.nodeName.toLowerCase() == 'button') {
	 			if ( (this.iconType == 'base' && element.id == "baseButton") ||
	 			(this.iconType == 'loc' && element.id == "locButton") ||
	 			(this.iconType == 'gLoc' && element.id == "gLocButton")) {
		 			element.style.backgroundColor='red';
	 			}
	 		}
	 	}
	 },
	 
	/*********************************
	 *                               *
	 * Gestion de la barre de statut *
	 *                               *
	 *********************************/
	 
	printStatus: function (text) {
		document.getElementById('BarreDeStatut').innerHTML = text;
	},
	
	clearStatus: function () {
		document.getElementById('BarreDeStatut').innerHTML = '';
	},
	
	showStatus: function(inWork) {
		document.getElementById('statusIcon').src = inWork ? "icons/wait16trans.gif.gif" : "icons/Planete.jpg";
	},
	
	startWork:function() {
		this.showStatus(true);
		dojo.widget.byId('progressBar').startAnimation();	
	},
	
	stopWork:function() {
		this.showStatus(false);
		dojo.widget.byId('progressBar').stopAnimation();	
	},
	
	/*************************
	 *                       *
	 * Chargement/Sauvegarde *
	 *                       *
	 *************************/
	 
	_printProviderMetadata: function(){
		var isSupported = dojo.storage.isAvailable();
		var maximumSize = dojo.storage.getMaximumSize();
		var permanent = dojo.storage.isPermanent();
		var uiConfig = dojo.storage.hasSettingsUI();
		var moreInfo = "";
		if (dojo.storage.getType() == "dojo.storage.FlashStorageProvider") {
			moreInfo = "Flash Comm Version " + dojo.flash.info.commVersion;
		}
		
		dojo.byId("isSupported").innerHTML = isSupported;
		dojo.byId("isPersistent").innerHTML = permanent;
		dojo.byId("hasUIConfig").innerHTML = uiConfig;
		dojo.byId("maximumSize").innerHTML = maximumSize;
		if (moreInfo !== "") { dojo.byId("moreInfo").innerHTML = moreInfo; }
	},
	
	initializeKeys: function () {
		// Afficher la liste des cl�s d�j� sauv�es
		dojo.debug('cool');
		this.printAvailableKeys();
	},
	
	printAvailableKeys: function(){
		var Cles = dojo.byId("savedKeys");
		
		// clear out any old keys
		Cles.innerHTML = "";
		
		// add a blank selection
		var optionNode = document.createElement("option");
		optionNode.appendChild(document.createTextNode(""));
		optionNode.value = "";
		Cles.appendChild(optionNode);
		
		// add new ones
		var availableKeys = dojo.storage.getKeys();
		for (var i = 0; i < availableKeys.length; i++) {
			optionNode = document.createElement("option");
			optionNode.appendChild(document.createTextNode(availableKeys[i]));
			optionNode.value = availableKeys[i];
			Cles.appendChild(optionNode);
		}
	},
	
	save: function(button) {
	/*
		if (button) { button.blur(); }
		key = dojo.byId('storageKey').value.trim();
		if ( key === null || typeof key == "undefined" || key === "" ) {
			alert('Veuillez d\'abord saisir un nom de fichier');
			return;
		}
	*/
		key = 'FichierDeTest';
		value = 'Valeur de test';
		
		//value = 'coucou';
		this.printStatus("Sauvegarde de " + key + "...");
		var self = this;
		var saveHandler = function(status, keyName) {
			if (status == dojo.storage.PENDING) {
				return;
			}
			
			if (status == dojo.storage.FAILED) {
				alert("You do not have permission to store data for this web site. " +
			        "Press the Configure button to grant permission.");
			} else if (status == dojo.storage.SUCCESS) {
				self.printStatus('Ok ' + keyName + ' est sauvegard&eacute;');
			}
			
		};
		
		try {
			dojo.storage.put(key, value, saveHandler);
		} catch(exp) {
			alert(exp);
		}
	},
	
	load: function (button) {
		if (button) { button.blur(); }
		key = dojo.byId('savedKeys').value.trim();
		if ( key === null || typeof key == "undefined" || key === "" ) {
			alert('Veuillez d\'abord choisir un nom de fichier');
			return;
		}
		
		this.printStatus("Chargement...");
		
		// get the value
		var results = dojo.storage.get(key);
		alert ('resultat : ' + results);	
		// print out that we are done
		this.printStatus("Charg&eacute;");	
	},
	
	export_markers: function(button) {
		if (button) { button.blur(); }
		var results = '<?xml version="1.0"?>\n<page>\n';
		for ( i in this.markers ) {
			var point = this.markers[i].marker.getPoint();
			var lat = point.lat();
			var lng = point.lng();
			var address = this.markers[i].address;
			var type = this.markers[i].type;
			results += "<marker lat=\"" + lat + "\" lng=\"" + lng + "\" address=\"" + address + "\" type=\"" + type + "\" />\n";
		}
		results += '</page>\n';
		dojo.byId('exportedData').value = results;
		dojo.widget.byId('DialogueExport').show();
	}
	
});

/********************************
 *                              *
 * Utilitaires de la page/carte *
 *                              *
 ********************************/

// Cacher ou pas le panneau des marqueurs
function togglePanes (button, paneId) {
	var spc = dojo.widget.byId('MapSplitter');
	var pane = dojo.widget.byId(paneId);
	if(pane.isShowing()) { 
	    if (paneId == 'EasyMap') { 
	    	pane.sizeMin = 0; 
	    	document.getElementById('toggleMarkersPane').setAttribute('disabled', '');
	    } else {
	    	document.getElementById('toggleMapPane').setAttribute('disabled', '');
	    }          
		spc._saveState();
		pane.sizeShare = 0;
		pane.hide();
		spc.sizerWidth = 0;
		spc._layoutPanels();
		button.alt = button.title = 'Afficher la liste des marqueurs';
	} else {
	    if (paneId == 'EasyMap') { 
	    	pane.sizeMin = 500; 
	    	document.getElementById('toggleMarkersPane').removeAttribute('disabled');
	    } else {
	    	document.getElementById('toggleMapPane').removeAttribute('disabled');
	    }
		pane.show();
		spc.sizerWidth = 5;
		spc._restoreState();
		spc._layoutPanels();
		button.alt = button.title = 'Masquer la liste des marqueurs';
	}   
	button.blur();
}

/***************************************
 *                                     *
 * Controles personnalises de la carte *
 *                                     *
 ***************************************/
 
// Definition du style par defaut des controles personnalises
function setCtrlStyle(button) {
	button.style.color = "black";
	button.style.backgroundColor = "white";
	button.style.font = "small Arial";
	button.style.fontSize = "11px";
	button.style.border = "1px solid black";
	button.style.padding = "1px";
	button.style.marginBottom = "3px";
	button.style.textAlign = "center";
	button.style.width = "1.15em";
	button.style.cursor = "pointer";
}

/******************************************************************************************
 * Controle CtrlCtrl : Controle l'affichage/le masquage des autres controles sur la carte *
 ******************************************************************************************/
 
var titleCtrlActive = "Masquer les controles";
var titleCtrlInative = "Afficher les controles";
function CtrlClick () {
	var self = dojo.widget.byId("EasyMap");
  	if ( (self.ctrlmap = !self.ctrlmap) ) {	  	
      self.map.showControls();
	  this.alt = this.title = titleCtrlActive;
  	} else {
      self.map.hideControls();
      self.map.addControl(self.CtrlCtrl);
	  this.alt = this.title = titleCtrlInative; 
  	}
  	dojo.widget.byId('optMapTools').setValue(!self.ctrlmap);
}

function MapCtrlControl() {}
MapCtrlControl.prototype = new GControl();
MapCtrlControl.prototype.initialize = function(map) {

	var container = document.createElement("div");
	this.button = document.createElement("div");
	this.setButtonStyle_(this.button);
	this.button.alt = this.button.title = titleCtrlActive;
	container.appendChild(this.button);
	this.button.appendChild(document.createTextNode("*"));
	GEvent.addDomListener(this.button, "click", CtrlClick);	
	map.getContainer().appendChild(container);
	return container;
};

// Position par defaut du controle
MapCtrlControl.prototype.getDefaultPosition = function() {
	return new GControlPosition(G_ANCHOR_TOP_LEFT, new GSize(7, 7));
};
// Style par defaut du controle
MapCtrlControl.prototype.setButtonStyle_ = function(button) {
	setCtrlStyle(button);
};

/********************************************************************
 * Controle CtrlEdit : Controle le mode d'interaction avec la carte *
 ********************************************************************/
 
var titleEditActive = "Desactiver l'insertion de marqueur par clic sur la carte";
var titleEditInactive = "Activer l'insertion de marqueur par simple clic sur la carte";
function EditClick() {
	var self = dojo.widget.byId("EasyMap");
  	if ( (self.editmap = !self.editmap) ) {
  		self.CtrlDblClick.cancelDblClick();
	  	self.CtrlEdit.forceEdit();
	  	self.toggleEditButton();	  	
  	} else {
	  	self.CtrlEdit.cancelEdit();
	  	self.clearEditButton();
  	}
  	dojo.widget.byId('optDblClick').setValue(!self.editmap);
}
function MapEditControl() {}
MapEditControl.prototype = new GControl();
MapEditControl.prototype.cancelEdit = function() {
	this.button.innerHTML = "?";
	this.button.style.backgroundColor = "white";
	this.button.alt = this.button.title = titleEditInactive; 
	dojo.widget.byId('EasyMap').editmap = false;
};
MapEditControl.prototype.forceEdit = function() {
	this.button.innerHTML = "!";
	this.button.style.backgroundColor = "red";
	this.button.alt = this.button.title = titleEditActive; 
	dojo.widget.byId('EasyMap').editmap = true;
};
MapEditControl.prototype.initialize = function(map) {
	var container = document.createElement("div");
	this.button = document.createElement("div");
	this.setButtonStyle_(this.button);
	this.button.alt = this.button.title = titleEditInactive;
	container.appendChild(this.button);
	this.button.appendChild(document.createTextNode("?"));
	GEvent.addDomListener(this.button, "click", EditClick);
	map.getContainer().appendChild(container);
	return container;
};

// Position par defaut du controle
MapEditControl.prototype.getDefaultPosition = function() {
	return new GControlPosition(G_ANCHOR_TOP_LEFT, new GSize(7, 46));
};
// Style par defaut du controle
MapEditControl.prototype.setButtonStyle_ = function(button) {
	setCtrlStyle(button);
};
 
/******************************************************************************** 
 * Controle DblClickZoom : Controle le comportement du double clic sur la carte *
 ********************************************************************************/
 
var titleDblClickActive = "Desactiver les zooms avant et arriere par double clic";
var titleDblClickInactive = "Activer les zooms avant et arrieres par double clic";
function DblClick() {
	var self = dojo.widget.byId("EasyMap");
  	if ( (self.zoommap = !self.zoommap) ) {
  		self.CtrlDblClick.forceDblClick();
		self.CtrlEdit.cancelEdit();
		self.clearEditButton();
  	} else {
  		self.CtrlDblClick.cancelDblClick();
  	}
  	dojo.widget.byId('optDblClick').setValue(self.zoommap);
}
function MapDblClickControl() {}
MapDblClickControl.prototype = new GControl();
MapDblClickControl.prototype.cancelDblClick = function() {
	this.button.innerHTML = "1";
	this.button.style.backgroundColor = "white";
	this.button.alt = this.button.title = titleDblClickInactive; 
	dojo.widget.byId("EasyMap").map.disableDoubleClickZoom();	
};
MapDblClickControl.prototype.forceDblClick = function() {
	this.button.innerHTML = "2";
	this.button.style.backgroundColor = "blue";
	this.button.alt = this.button.title = titleDblClickActive;
	dojo.widget.byId("EasyMap").map.enableDoubleClickZoom();
};
MapDblClickControl.prototype.initialize = function(map) {
	var container = document.createElement("div");
	this.button = document.createElement("div");
	this.setButtonStyle_(this.button);
	this.button.appendChild(document.createTextNode("1"));
	this.button.alt = this.button.title = titleDblClickInactive;
	container.appendChild(this.button);
	GEvent.addDomListener(this.button, "click", DblClick);
	map.getContainer().appendChild(container);
	return container;
};

// Position par defaut du controle
MapDblClickControl.prototype.getDefaultPosition = function() {
	return new GControlPosition(G_ANCHOR_TOP_LEFT, new GSize(47, 46));
};
// Style par defaut du controle
MapDblClickControl.prototype.setButtonStyle_ = function(button) {
	setCtrlStyle(button);
};
 
/*********************************************** 
 * Controle GZoom : Gestion d'un zoom séléctif *
 ***********************************************/


 
/************************************
 *                                  *
 * Gestion de la liste de marqueurs *
 *                                  *
 ************************************/
 
function toggleIndex(source) {
	if (source) {
		// Source est non vide, l'appel provient du bouton lui même
		var markersIndex = document.getElementById('markersIndex');
		markersIndex.style.display = (markersIndex.style.display == 'none') ? 'block' : 'none';
		source.blur();
	} else {
		// Source est vide, l'appel provient de l'application
		document.getElementById('markersIndex').style.display = 'none';
	}
}

// fonction de tri - ascendant (insensible à la casse)
function sortFuncAsc(record1, record2) {
	var value1 = record1.optText.toLowerCase();
	var value2 = record2.optText.toLowerCase();
	if (value1 > value2) { return(1); }
	if (value1 < value2) { return(-1); }
	return(0);
}

// fonction de tri - descendant (insensible à la casse)
function sortFuncDesc(record1, record2) {
	var value1 = record1.optText.toLowerCase();
	var value2 = record2.optText.toLowerCase();
	if (value1 > value2) { return(-1); }
	if (value1 < value2) { return(1); }
	return(0);
}

function sortSelect(selectToSort, ascendingOrder) {

  if (arguments.length == 1) { ascendingOrder = true; }   // par defaut tri ascendant
  
  // Copier les options du select dans un tableau
  var Options = [];
  for (var i = 0; i < selectToSort.options.length; i++) 
    { Options[i] = { optText:selectToSort.options[i].text, optValue:selectToSort.options[i].value }; }

  // Trier le tableau
  Options.sort(ascendingOrder ? sortFuncAsc : sortFuncDesc);

  // Replacer les options triees dans le select
  selectToSort.options.length = 0;
  for (var j = 0; j < Options.length; j++) {
    var option = document.createElement('option');
    option.text = Options[j].optText;
    option.value = Options[j].optValue;
    selectToSort.options.add(option);
  }
}

function sortSelectList(idSelect, ascendingOrder, source) {

	// Retablir le dessin du bouton source, si c'est un appel externe
	if (source) { source.blur(); }
	// Verifier qu'il y a quelqueschose à trier
	var selectList = document.getElementById(idSelect); 
	if (!selectList.length || selectList.length < 2 ) { return; }
	
	if (selectList.length > 100) { startProgress(); }
	// Memoriser l'option selectionnée avant le tri	
	var txt = '', val = '';
	var selected = selectList.selectedIndex;
	if (selected != -1) {
		txt = selectList.options[selected].innerHTML;
		val = selectList.options[selected].value;		
	}	
	// Trier la liste de marqueurs  
	sortSelect(selectList, ascendingOrder);
	// Replacer la selection sur l'option selectionnée avant le tri	
	if ( selected != -1 ) {
		for ( i = 0; i < selectList.options.length; i++ ) {
			if ( selectList.options[i].innerHTML == txt && selectList.options[i].value == val ){
				selectList.selectedIndex = i;				
				break;
			}
		}	
	}
	if (selectList.length > 100) { stopProgress(); }
}
 
/******************************
 *                            *
 * Validation des formulaires *
 *                            *
 ******************************/

// Utilitaires généraux
String.prototype.trim = function() { return this.replace(/(^\s*)|(\s*$)/g, ""); };

function gotoAddress(button) {
	var address = document.getElementById('adresseDemandee').value.trim();
	if (button) { button.blur(); }
	if (!address.length) { 
		alert('Indiquez une adresse svp'); document.getElementById('adresseDemandee').focus(); 
		return; 
	}
	// Chercher d'abord le nom dans la liste des marqueurs
	var markersList = document.getElementById('markersList');
	for (i = 0; i < markersList.length; i++) { 
		if (markersList[i].text.toLowerCase() == address) { 
			markersList.selectedIndex = i;
			dojo.widget.byId('EasyMap').gotoSelectedMarker();
			return;
		} 
	}
	// Chercher ensuite dans la base google
	dojo.widget.byId('EasyMap').getLocationsList(address);
}

function openHelp(button) {
	dojo.widget.byId('optionsTabContainer').selectChild('Aide');
	button.blur();
}

function isValidAddressChoice() {
	var AddressesList = document.forms.FormDlgAdresses.AddressesList;
	for (i = 0; i < AddressesList.length; i++ ) {
		if ( AddressesList[i].selected ) {
			break;
		}
	}
	if ( i == AddressesList.length ) { alert('Vous n\'avez choisi aucune adresse'); return false; }
	return true;
}

/************************
 *                      *
 * Barre de progression *
 *                      *
 ************************/

function startProgress() {
	dojo.widget.byId("progessDialog").show();
	dojo.widget.byId("progressBar").startAnimation();
}

function stopProgress() {
	dojo.widget.byId("progressBar").stopAnimation();
	dojo.widget.byId("progessDialog").hide();
} 
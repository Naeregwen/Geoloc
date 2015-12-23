// Configuration d'affichage
var addressInputSize = 100; // Longueur des zones des saisies pour les adresses de marqueurs

// Initialisation des dialogues
var AdressesTrouvees;
function chooseAddress() { dojo.widget.byId('EasyMap').gotoSelectedNewAddress(); }

// Initialisation de la page
function createButton (text) {
    var button = document.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("value", text);
    button.onclick = function (evt) { dojo.widget.byId('EasyMap').gotoLetter(this); };
    button.innerHTML = text;    
    document.getElementById('markersIndex').appendChild(button);
}

function init(e) {
	AdressesTrouvees = dojo.widget.byId("DialogueAdresses");
	AdressesTrouvees.setCloseControl(document.getElementById("ChooseAddress"));
	AdressesTrouvees.setCloseControl(document.getElementById("CancelAddress"));
	dojo.event.connect(document.getElementById("ChooseAddress"), "onclick", "chooseAddress");
	dojo.widget.byId("DialogueExport").setCloseControl(document.getElementById("ExportOk"));
	dojo.widget.byId('EasyMap').toggleMarkersList((document.getElementById("markersList").length === 0));
	dojo.widget.byId('EasyMap').toggleCountriesList((document.getElementById("countriesList").length === 0));
	// Construire le mini clavier
    for ( i = 0; i < 10; i ++ ) { createButton (i); }
    var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for ( i = 0; i < letters.length; i ++ ) { createButton (letters.charAt(i)); }
	// Signaler le recadrage à la carte en fin de chargement du document
    dojo.widget.byId('EasyMap').map.checkResize();
}

dojo.addOnLoad(init);

// Ne doit pas être utilisé avec des objets dojo
// Utiliser plutôt dojo.addOnLoad
window.onload = function() {};


// wait until the storage system is finished loading
//dojo.debug(dojo.widget.byId('EasyMap'));
/*
if(dojo.storage.manager.isInitialized() === false) { // storage might already be loaded when we get here
	dojo.event.connect(dojo.storage.manager, "loaded", dojo.widget.byId('EasyMap'), dojo.widget.byId('EasyMap').initializeKeys);
}else{
	dojo.event.connect(dojo, "loaded", dojo.widget.byId('EasyMap'), dojo.widget.byId('EasyMap').initializeKeys);
}
*/

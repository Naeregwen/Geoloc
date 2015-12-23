/** Requiert util.js */

/** @class
 * Creer une suggestion de saisie pour un champ textuel.
 * Type abstrait. Utiliser un des types dérivés.
 * <br/>Requiert util.js.
 */
function Suggest() {
  /** Le champ de saisie @type HTMLInputElement */
  this.source = null;
  /** Nombre maximum de valeurs suggerées @type int */
  this.maxSuggestNumber = 0;
  /** La zone de suggestion @type PopupList */
  this.popup = null;
  /** Valeur saisie par l'utilisateur @type String */
  this.inputValue = "";
}

Suggest.prototype = {
  /** Initialisation, utilisable dans les types descendants
   * @param idField : id du champ de saisie
   * @param maxSuggestNumber (optionnel) : nombre maximal de 
   * resultats a afficher (defaut : 10) */
  init: function(idField, maxSuggestNumber) {
    /** Le champ de saisie @type HTMLInputElement */
    this.source = document.getElementById(idField);
    /** Nombre maximum de valeurs suggerées @type int */
    this.maxSuggestNumber = (maxSuggestNumber) ? maxSuggestNumber : 10;
    // Verifier la validité des paramètres
    this.check(idField);
    /** La zone de suggestion @type PopupList */
    this.popup = new PopupList(this.source);
    /** Valeur saisie par l'utilisateur @type String */
    this.inputValue = "";
    this.setBehaviour();
  },
  
  /** Vérifier que les paramètres sont valides */
  check: function(idField) {
    // Verifier qu'il y a bien une saisie a suggerer
    if (this.source === null) {
      Log.error("Element with id '" + idField + "' not found");
    }
    if ( isNaN(parseInt(this.maxSuggestNumber)) || parseInt(this.maxSuggestNumber) <= 0 ) {
      Log.error("Max suggest number for '" + idField + 
        "' not positive (" + this.maxSuggestNumber + ")");
    }
  },

  /** Définir les réactions du champ de saisie */
  setBehaviour: function() {
    // Desactiver la completion automatique du navigateur
    this.source.setAttribute("autocomplete", "off");
    // Stocker l'objet courant ...
    var suggest = this;
    // ... car dans la fonction ci-dessous, this est 
    // le champ de saisie (this.source) qui a genere l'evenement
    this.source.onkeyup = function(aEvent) {
      suggest.onkeyup(aEvent);
    };
    // Gerer l'evenement keydown qui est lance AVANT keyup,
    // or si on fait ENTER, par defaut le formulaire est soumis :
    // on ne peut pas bloquer cela dans onkeyup
    this.source.onkeydown = function(aEvent) {
      suggest.onkeydown(aEvent);
    };
    this.source.onblur = function() {
      // Masquer la popup seulement si la souris n'y est pas
      // Comme le mouseout est declenche avant le clic ou le tab
      // qui fait perdre le focus, il n'y a plus de div selectionne
      if (suggest.popup.index == -1) {
        suggest.popup.hide();
      }
    };
  },

  /** Réaction à keydown */
  onkeydown: function(aEvent) {
    var event = Event.event(aEvent);
    switch (event.keyCode) {
      case Keys.ESCAPE:
        this.popup.hide();
        break;
      // S'il y a une suggestion, l'efface
      // s'il n'y en a pas (ou plus), soumet le formulaire
      case Keys.ENTER:
        if (this.popup.isVisible()) {
          Event.preventDefault(event);
          this.popup.clear();
        }
        break;
      case Keys.TAB:
        this.popup.clear();
        break;
      case Keys.DOWN:
        this.goAndGet(this.popup.index + 1);
        break;
      case Keys.UP:
        this.goAndGet(this.popup.index - 1);
        break;
      case Keys.PAGE_UP:
        this.goAndGet((this.popup.getLength() > 0) ? 0 : -1);
        break;
      case Keys.PAGE_DOWN:
        this.goAndGet(this.popup.getLength() - 1);
        break;
      default:
        break;
    }
  },

  /** Réaction à la saisie (onkeyup) dans le champ */
  onkeyup: function(aEvent) {
    // L'evenement selon W3 ou IE
    switch (Event.event(aEvent).keyCode) {
      // Ne rien faire pour les touches de navigation
      // qui sont prises en compte par keydown
      case Keys.DOWN: case Keys.UP: case Keys.PAGE_UP: 
      case Keys.HOME: case Keys.PAGE_DOWN: case Keys.END:
      case Keys.ENTER: case Keys.ESCAPE:
        break;
      default:
        if (this.source.value != this.inputValue) {
          // Memoriser la saisie
          this.inputValue = this.source.value;
          // Mettre a jour la liste
          this.setOptions(this.source.value, this.maxSuggestNumber);
        }
    }
  },

  /** Récuperer les options et les faire afficher 
    * (méthode abstraite) */
  setOptions: function() {
    Log.error("setOptions is abstract, must be implemented");
  },
  
  /** Aller à la suggestion d'indice index
   * et mettre sa valeur dans le champ de saisie */
  goAndGet: function(index) {
    this.popup.go(index);
    if (-1 < this.popup.index) {
      this.source.value = this.popup.getValue();
    }
    else {
      this.source.value = this.inputValue;
    }
  }
};

Suggest.prototype.constructor = Suggest;



/*-------------------------------------------------------*/
/**
 * @class
 * Suggestion de saisie en local : les valeurs suggérées sont
 * obtenues par l'appel d'une fonction à deux paramètres :
 * début de l'expression à suggérer, et nombre de résultats
 * à renvoyer.
 *
 * @constructor
 * @param (Function) getValuesFunction : fonction des parametres 
 * (unTexte, nbResultats) qui renvoie un tableau JavaScript 
 * des valeurs correspondant a la saisie unTexte, ce tableau
 * etant limite aux nbResultats premieres valeurs
 */
function LocalSuggest(idField, getValuesFunction, maxSuggestNumber) {
  /** La fonction récuperant les valeurs @type Function*/
  this.getValues = getValuesFunction;
  Suggest.prototype.init.call(this, idField, maxSuggestNumber);
  return this;
}

LocalSuggest.prototype = new Suggest();

/** Récuperer les options et les faire afficher 
  * (redéfinie) */
LocalSuggest.prototype.setOptions = function() {
  var values = this.getValues(this.source.value, 
    this.maxSuggestNumber);
  this.popup.setOptions(values);
};

/** Vérifier que les paramètres sont valides
  * (redéfinie) */
LocalSuggest.prototype.check = function(idField) {
  // Appeler check du parent
  Suggest.prototype.check.call(this, idField);
  // Code propre a l'objet
  if (typeof(this.getValues) != "function") {
    Log.error("Suggestion function for '" + 
      idField + "' not found");
  }
};

LocalSuggest.prototype.constructor = LocalSuggest;



/*-------------------------------------------------------*/

/** @class
 * Suggestion de saisie en Ajax : les valeurs suggérées sont
 * récupérées par une requête XMLHttpRequest.<br/>
 * Celle-ci attend deux paramètres :
 * <code>search</code>, début de l'expression à suggérer, 
 * et <code>size</code>, nombre de résultats à renvoyer.
 * <p> Par exemple,
 * <code>new HttpSuggest("ville", "get-ville.php", 10)</code>
 * cherche ses suggestions en appelant l'url 
 * <code>get-ville.php</code> et en limite le nombre à 10.
 * @param (String) idField id du champ de saisie
 * @param (String) getValuesUrl url de parametres 
 * (unTexte, nbResultats) qui renvoie un tableau JavaScript 
 * des valeurs correspondant a la saisie unTexte, ce tableau
 * etant limite aux nbResultats premieres valeurs
 * @param (int) maxSuggestNumber (optionnel) nombre maximal de 
 * resultats a afficher (defaut : 10)
 */
function HttpSuggest(idField, getValuesUrl, maxSuggestNumber) {
  /** L'url récuperant les valeurs @type String*/
  this.url = getValuesUrl;
  // Preparer l'url pour recevoir les parametres
  if (this.url.indexOf("?") == -1) {
    this.url += "?";
  }
  else {
    this.url += "&";
  }
  /** Requete HTTP @type XMLHttpRequest */
  this.request = new XMLHttpRequest();
  Suggest.prototype.init.call(this, idField, maxSuggestNumber);
}

HttpSuggest.prototype = new Suggest();

/** Recuperer les suggestions (redéfinie) */
HttpSuggest.prototype.setOptions = function() {
  try {
    // Annuler la requete qui ne sert plus a rien
    this.request.abort();
  }
  catch (exc) {}
  try {
    var url = this.url + "search=" + 
      encodeURIComponent(this.source.value) + 
      "&size=" + this.maxSuggestNumber;
    // Creer une nouvelle requete car la reutiliser provoque
    // un bug dans Mozilla
    this.request = new XMLHttpRequest();
    this.request.open("GET", url , true);
    // Garder l'objet courant pour le onreadystatechange
    var suggest = this;
    this.request.onreadystatechange = function() {
      try {
        if (suggest.request.readyState == 4 &&
            suggest.request.status == 200) {
          var values = (suggest.request.responseText) ?
            suggest.request.responseText.split("\n") : [];
          suggest.popup.setOptions(values);
        }
      }
      catch (exc) {
        Log.debug("exception onreadystatechange");
      }
    };
    this.request.send(null);
  }
  catch (exc) {
    Log.debug(exc);
  }
};

HttpSuggest.prototype.constructor = HttpSuggest;